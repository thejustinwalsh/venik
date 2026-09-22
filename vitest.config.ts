import { defineConfig } from "vitest/config";

export default defineConfig({
  // The event system only exists for tests; see src/globals.d.ts.
  define: { __EVENTS__: "true" },
  test: {
    // `npm test` runs tests/, `npm run fuzz` runs fuzz/ (see fuzz/IncrementalFuzz.test.ts).
    include: ["tests/**/*.test.ts", "fuzz/**/*.test.ts"],
    // tests/GarbageCollectionTest.test.ts forces collections through `gc()`.
    execArgv: ["--expose-gc"],
  },
});
