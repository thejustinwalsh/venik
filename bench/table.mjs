// Markdown tables from saved labs runs, and the regression gate labs lacks
// (`labs compare` exits 0 on a significant slowdown).
//
//   node table.mjs [run]            tables for a run (default: the newest)
//   node table.mjs [run] --gate     also compare "venik" against the baseline
//                                   run and exit 1 on a significant slowdown
//
// A bench's time is the median of its per-process block medians; heap is
// labs' per-iteration p50. The gate uses the same test as `labs compare`:
// an exact two-sided Mann-Whitney U over block medians at alpha 0.05, and a
// Hodges-Lehmann slowdown of at least 5%.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const results = join(dirname(fileURLToPath(import.meta.url)), ".labs");
const ALPHA = 0.05;
const MIN_DELTA = 0.05;

const args = process.argv.slice(2);
const gate = args.includes("--gate");
const name = args.find((a) => !a.startsWith("--")) ?? newest();
const run = load(name);

function newest() {
  const files = readdirSync(join(results, "results")).filter((f) => f.endsWith(".json"));
  files.sort((a, b) => statSync(join(results, "results", b)).mtimeMs - statSync(join(results, "results", a)).mtimeMs);
  if (!files.length) throw new Error("no saved labs runs; run `npm run bench` first");
  return files[0].slice(0, -5);
}

// { "<file> / <group>": { <engine>: { median, heap, medians } } }
function load(runName) {
  const json = JSON.parse(readFileSync(join(results, "results", `${runName}.json`), "utf8"));
  const out = {};
  for (const file of json.files) {
    for (const b of file.benchmarks) {
      const stats = b.runs[0]?.stats;
      if (!stats?.blocks) continue;
      const key = b.groupName;
      (out[key] ??= {})[b.alias] = {
        median: median(stats.blocks.medians),
        heap: stats.heap?.p50,
        medians: stats.blocks.medians,
      };
    }
  }
  return { name: runName, git: json.git, groups: out };
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const fmtTime = (ns) => (ns < 1e5 ? `${(ns / 1e3).toFixed(1)}µs` : `${Math.round(ns / 1e3)}µs`);
const fmtHeap = (b) => (b === undefined ? "–" : b < 1024 ? `${Math.round(b)} B` : `${(b / 1024).toFixed(1)} KB`);

function table(title, fmt, pick) {
  const engines = [...new Set(Object.values(run.groups).flatMap((g) => Object.keys(g)))];
  const lines = [`| ${title} | ${engines.join(" | ")} |`, `|${"---|".repeat(engines.length + 1)}`];
  for (const [group, byEngine] of Object.entries(run.groups)) {
    const values = engines.map((e) => (byEngine[e] ? pick(byEngine[e]) : undefined));
    const best = Math.min(...values.filter((v) => v !== undefined));
    const cells = values.map((v) => (v === undefined ? "–" : v === best ? `**${fmt(v)}**` : fmt(v)));
    lines.push(`| ${group} | ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

console.log(`Run \`${run.name}\` (${run.git?.branch}@${run.git?.commit?.slice(0, 7)}${run.git?.dirty ? "*" : ""})\n`);
console.log(table("Time per iteration", fmtTime, (s) => s.median));
console.log();
console.log(table("Allocated per iteration", fmtHeap, (s) => s.heap));

if (gate) {
  const baseName = existsSync(join(results, "baseline")) ? readFileSync(join(results, "baseline"), "utf8").trim() : null;
  if (!baseName || baseName === run.name) {
    console.error("\nno baseline to gate against; save one with `npm run bench:baseline`");
    process.exit(1);
  }
  const base = load(baseName);
  const lines = [`| venik: ${base.name} → ${run.name} | before | after | change | p |`, "|---|---|---|---|---|"];
  let failed = 0;
  for (const [group, byEngine] of Object.entries(run.groups)) {
    const a = base.groups[group]?.venik;
    const b = byEngine.venik;
    if (!a || !b) continue;
    const p = mannWhitneyP(a.medians, b.medians);
    const shift = hodgesLehmannRatio(a.medians, b.medians);
    const verdict = p <= ALPHA && Math.abs(shift - 1) >= MIN_DELTA ? (shift > 1 ? "▼ slower" : "▲ faster") : "~";
    if (verdict === "▼ slower") failed++;
    const pct = `${shift >= 1 ? "+" : ""}${((shift - 1) * 100).toFixed(1)}% ${verdict}`;
    lines.push(`| ${group} | ${fmtTime(a.median)} | ${fmtTime(b.median)} | ${pct} | ${p.toFixed(3)} |`);
  }
  console.log();
  console.log(lines.join("\n"));
  if (failed) {
    console.error(`\n${failed} significant regression(s)`);
    process.exit(1);
  }
}

// Median of all after/before ratios: the Hodges-Lehmann estimate of the change.
function hodgesLehmannRatio(before, after) {
  const r = [];
  for (const x of before) for (const y of after) r.push(y / x);
  return median(r);
}

// Exact two-sided p-value of the Mann-Whitney U statistic (ties count half).
function mannWhitneyP(xs, ys) {
  const n = xs.length;
  const m = ys.length;
  let u = 0;
  for (const x of xs) for (const y of ys) u += x < y ? 1 : x === y ? 0.5 : 0;
  // freq(i, j)[k]: orderings of i + j samples whose U is k.
  const memo = new Map();
  const freq = (i, j) => {
    const key = `${i},${j}`;
    let c = memo.get(key);
    if (c) return c;
    c = new Array(i * j + 1).fill(0);
    if (i === 0 || j === 0) c[0] = 1;
    else {
      freq(i - 1, j).forEach((v, k) => (c[k + j] += v));
      freq(i, j - 1).forEach((v, k) => (c[k] += v));
    }
    memo.set(key, c);
    return c;
  };
  const counts = freq(n, m);
  const total = counts.reduce((s, c) => s + c, 0);
  const mean = (n * m) / 2;
  const d = Math.abs(u - mean);
  let tail = 0;
  counts.forEach((c, k) => {
    if (Math.abs(k - mean) >= d - 1e-9) tail += c;
  });
  return Math.min(1, tail / total);
}
