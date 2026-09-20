import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  platform: "neutral",
  target: "es2023",
  dts: true,
  sourcemap: true,
  clean: true,
  // index.ts has both named exports and a yoga-layout style default export.
  outputOptions: { exports: "named" },
});
