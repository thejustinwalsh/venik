// Registers one bench per engine for a scenario. Each bench loads only its own
// engine: labs re-imports this file in a fresh process per bench and block.
import { bench } from "@pmndrs/labs";
import { BENCH_ENGINES, loadEngine } from "../engines.mjs";

export type Api = Awaited<ReturnType<typeof loadEngine>>;

declare const gc: () => void;

// labs calls a bench at most 3 times before sampling and gives each process
// half a second, so a fast frame would be timed before V8 optimizes it (a
// 15µs frame ran ~80 times, mostly in the interpreter). Each frame is run
// here, untimed, until the JIT has settled.
const WARMUP_MS = 300;
const WARMUP_FRAMES = 2000;

function warm(frame: () => void): void {
  const until = performance.now() + WARMUP_MS;
  for (let i = 0; i < WARMUP_FRAMES && (i < 20 || performance.now() < until); i++) frame();
}

/**
 * `setup` runs untimed and returns the frame to time, which is warmed up
 * first. Nothing is returned from the frame or the bench: labs would store it
 * as a snapshot, and engines (or a change in rounding) that lay out slightly
 * differently would then skip the speed verdict. Layouts are checked by
 * `npm run readme` instead.
 *
 * `cold` forces a full collection before every iteration (untimed). Without a
 * live tree that is what a scene change costs: V8 collects the hidden classes
 * the engine's nodes went through and the optimized code built on them.
 */
export function engines(setup: (api: Api) => () => void, { cold = false } = {}): void {
  for (const engine of BENCH_ENGINES) {
    bench(engine, async function* () {
      const frame = setup(await loadEngine(engine));
      warm(frame);
      yield cold
        ? { [0]: () => gc(), bench: () => frame() }
        : () => {
            frame();
          };
    });
  }
}
