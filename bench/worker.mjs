// node worker.mjs <engine> <time|garbage|board|check>  -> one JSON line on stdout.
// Each engine runs in its own process so JIT state and heap do not leak between them.
import { getHeapStatistics } from "node:v8";
import { loadEngine, buildTree, scenarios, snapshot } from "./engines.mjs";
import { boardScenarios, boardSnapshot } from "./board.mjs";
import { stressSnapshot } from "./stress.mjs";

const [which, task] = process.argv.slice(2);
const api = await loadEngine(which);
const layout = api.layout;
const out = {};

const WARMUP = 2000;
const ROUNDS = 40;
const framesFor = (name) => (name === "One leaf changes" ? 400 : 100);
const lowerQuartile = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 4)];

if (task === "time") {
  for (const [name, mutate] of Object.entries(scenarios)) {
    const t = buildTree(api);
    const frames = framesFor(name);
    let f = 0;
    for (let i = 0; i < WARMUP; i++, f++) { mutate(t, f); layout(t.root); }
    const times = [];
    for (let r = 0; r < ROUNDS; r++) {
      const t0 = performance.now();
      for (let i = 0; i < frames; i++, f++) { mutate(t, f); layout(t.root); }
      times.push(((performance.now() - t0) / frames) * 1000);
    }
    out[name] = lowerQuartile(times);
  }
  const times = [];
  for (let r = 0; r < ROUNDS; r++) {
    const t0 = performance.now();
    const t = buildTree(api);
    layout(t.root);
    times.push((performance.now() - t0) * 1000);
  }
  out["Build the tree and lay it out once"] = lowerQuartile(times);
}

if (task === "garbage") {
  for (const [name, mutate] of Object.entries(scenarios)) {
    const t = buildTree(api);
    const frames = framesFor(name);
    let f = 0;
    // Same number of frames as the timing task, so the JIT has settled and
    // nothing is left of the unoptimized tiers' boxing.
    for (let i = 0; i < WARMUP + ROUNDS * frames; i++, f++) { mutate(t, f); layout(t.root); }
    const h0 = getHeapStatistics().total_allocated_bytes;
    for (let i = 0; i < frames; i++, f++) { mutate(t, f); layout(t.root); }
    out[name] = Math.max(0, getHeapStatistics().total_allocated_bytes - h0) / frames / 1024;
  }
  // Retained: heap growth per laid-out tree, divided by its node count.
  const TREES = 20;
  const keep = [];
  global.gc();
  const h0 = process.memoryUsage().heapUsed;
  for (let i = 0; i < TREES; i++) { const t = buildTree(api); layout(t.root); keep.push(t); }
  global.gc();
  out["Retained per node after layout"] = (process.memoryUsage().heapUsed - h0) / TREES / keep[0].nodeCount / 1024;
}

if (task === "board") {
  for (const [name, { setup, op, iters }] of Object.entries(boardScenarios(api))) {
    const s = setup();
    for (let i = 0; i < WARMUP; i++) op(s);
    const times = [];
    for (let r = 0; r < ROUNDS; r++) {
      const t0 = performance.now();
      for (let i = 0; i < iters; i++) op(s);
      times.push(((performance.now() - t0) / iters) * 1000);
    }
    out[name] = lowerQuartile(times);
  }
}

if (task === "check") {
  const t = buildTree(api);
  layout(t.root);
  out.layout = snapshot(t).flat();
  out.board = boardSnapshot(api);
  out.stress = stressSnapshot(api);
}

process.stdout.write(JSON.stringify(out) + "\n");
