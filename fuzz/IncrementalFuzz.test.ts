import { expect, test } from "vitest";
import { describeMismatch, fuzzIncremental } from "./incremental.ts";

declare const process: { env: Record<string, string | undefined> };

// Seeds that once exposed a cache bug stay here as regression guards.
const REGRESSION_SEEDS = [1, 4, 5, 9, 16, 22, 23, 28, 30, 45, 48, 62, 111, 128, 154, 169, 256, 298, 779];

// npm run fuzz -- widen or move the sweep with
//   FUZZ_SEEDS=<count> FUZZ_START=<first seed> FUZZ_STEPS=<passes per seed>
const count = Number(process.env.FUZZ_SEEDS ?? 100);
const start = Number(process.env.FUZZ_START ?? 0);
const steps = Number(process.env.FUZZ_STEPS ?? 1500);

const seeds = [...new Set([...REGRESSION_SEEDS, ...Array.from({ length: count }, (_, i) => start + i)])];

for (const contents of [false, true]) {
  for (const seed of seeds) {
    test(`incremental layout equals from-scratch layout, seed ${seed}${contents ? ", display: contents" : ""}`, () => {
      const result = fuzzIncremental(seed, { steps, contents });
      expect(result.badSteps, result.first ? describeMismatch(result, contents) : "").toBe(0);
    });
  }
}
