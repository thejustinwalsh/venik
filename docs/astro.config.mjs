import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  site: "https://koteelok.github.io",
  base: "/venik",
  integrations: [mdx()],
  vite: {
    resolve: {
      // The playground runs the engine straight from the source tree, so it
      // never needs `npm run build` in the root and always reflects `src/`.
      alias: { "venik": fileURLToPath(new URL("../src/index.ts", import.meta.url)) },
    },
    // The event system is test-only; see ../src/globals.d.ts.
    define: { __EVENTS__: "false" },
    server: { fs: { allow: [repoRoot] } },
  },
});
