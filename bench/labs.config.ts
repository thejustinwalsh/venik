import { defineConfig } from "@pmndrs/labs";

// `npm run bench` from this directory, after `npm run build` in the root.
// Every engine × scenario is its own bench, run in fresh processes (blocks),
// so engines never share a JIT or a heap.
export default defineConfig({
  benchDir: "suites",
  resultsDir: ".labs",
  blocks: 8,
});
