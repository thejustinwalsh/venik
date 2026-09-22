// Prints the README tables. Run from this directory after `npm install`
// here and `npm run build` in the repository root:
//
//   npm run bench
//
// Timings are µs per frame, lower quartile of 40 rounds after warm-up, best
// of three runs where the engines take turns. Garbage is what a frame
// allocates on the JS heap. Bundle sizes come from a tree-shaken, minified
// rolldown build of a small program that touches the same API the tree uses.
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { rolldown } from "rolldown";
import { ENGINES } from "./engines.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const RUNS = 3;

function worker(engine, task, flags = []) {
  const json = execFileSync(process.execPath, [...flags, join(here, "worker.mjs"), engine, task], {
    cwd: here,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(json);
}

// Every engine must produce the same HUD layout, or the timings compare
// different work. flexily rounds a few text widths on the board tree
// differently from Yoga; that is reported, not fatal.
function checkLayouts() {
  const snaps = ENGINES.map((e) => worker(e, "check"));
  const differing = (key) =>
    ENGINES.filter((_, e) => snaps[e][key].some((v, i) => Math.abs(v - snaps[0][key][i]) > 1e-4));
  const hud = differing("layout");
  if (hud.length) throw new Error(`${hud.join(", ")} lay out the HUD tree differently from ${ENGINES[0]}`);
  const board = differing("board");
  if (board.length) console.error(`note: ${board.join(", ")} lay out the board tree slightly differently from ${ENGINES[0]}`);
}

function timeTable(task) {
  const best = {};
  for (let run = 0; run < RUNS; run++) {
    for (const engine of ENGINES) {
      const r = worker(engine, task);
      best[engine] ??= {};
      for (const [row, us] of Object.entries(r)) best[engine][row] = Math.min(best[engine][row] ?? Infinity, us);
    }
  }
  return best;
}

function garbageTable() {
  const out = {};
  for (const engine of ENGINES) out[engine] = worker(engine, "garbage", ["--expose-gc"]);
  return out;
}

async function bundleSizes() {
  const out = {};
  for (const engine of ENGINES) {
    const bundle = await rolldown({ input: join(here, "size", `${engine}.mjs`), platform: "browser", logLevel: "silent" });
    const { output } = await bundle.generate({ format: "esm", minify: true, codeSplitting: false });
    await bundle.close();
    const code = output.find((c) => c.type === "chunk").code;
    out[engine] = { Minified: code.length / 1024, "Minified + gzip": gzipSync(Buffer.from(code), { level: 9 }).length / 1024 };
  }
  return out;
}

const fmtUs = (us) => `${us < 100 ? Math.round(us) : Math.round(us / 10) * 10}µs`;
const fmtKb = (kb) => `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;

// Markdown table; the best cell of each row is bold, ties included.
function table(title, rows, data, fmt, { suffix = {}, unranked = [] } = {}) {
  const lines = [`| ${title} | ${ENGINES.join(" | ")} |`, `|${"---|".repeat(ENGINES.length + 1)}`];
  for (const row of rows) {
    const texts = ENGINES.map((e) => fmt(data[e][row]));
    const best = unranked.includes(row) ? null : fmt(Math.min(...ENGINES.map((e) => data[e][row])));
    const cells = ENGINES.map((e, i) => {
      const text = texts[i] + (suffix[e]?.[row] ?? "");
      return texts[i] === best ? `**${text}**` : text;
    });
    lines.push(`| ${row} | ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}

checkLayouts();
const time = timeTable("time");
const garbage = garbageTable();
const size = await bundleSizes();
const board = timeTable("board");

console.log(table("Time per frame", Object.keys(time[ENGINES[0]]), time, fmtUs));
console.log();
// Yoga keeps its nodes in WASM memory, outside the JS heap this measures, so
// that row is not ranked.
const retained = "Retained per node after layout";
console.log(table("Garbage per frame (JS heap)", Object.keys(garbage[ENGINES[0]]), garbage, fmtKb, {
  suffix: { "yoga-layout": { [retained]: " + WASM" } }, unranked: [retained],
}));
console.log();
console.log(table("Bundle size", ["Minified", "Minified + gzip"], size, fmtKb));
console.log();
console.log(table("flexily's board", Object.keys(board[ENGINES[0]]), board, fmtUs));
