import { defineConfig } from "vitest/config";

export default defineConfig({
  // The event system only exists for tests; see src/globals.d.ts.
  define: { __EVENTS__: "true" },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
