import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "neutral",
  target: "es2023",
  // Members tagged `@internal` are shared between modules but are not API.
  dts: { generator: "oxc", oxc: { stripInternal: true } },
  sourcemap: true,
  minify: true,
  clean: true,
  // Strips the event system from the bundle; see src/globals.d.ts.
  define: { __EVENTS__: "false" },
});
