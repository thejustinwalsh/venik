import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "neutral",
  target: "es2023",
  dts: true,
  sourcemap: true,
  clean: true,
  // Strips the event system from the bundle; see src/globals.d.ts.
  define: { __EVENTS__: "false" },
  // index.ts has both named exports and a yoga-layout style default export.
  outputOptions: { exports: "named" },
});
