// The README's HUD: ~900 nodes, root wraps 10 panels of 10 rows of 8 cells.
import { group } from "@pmndrs/labs";
import { buildTree, scenarios } from "../engines.mjs";
import { type Api, engines } from "./run.ts";

for (const [name, mutate] of Object.entries(scenarios)) {
  group(`hud: ${name}`, () => {
    engines((api) => {
      const t = buildTree(api);
      let f = 0;
      return () => {
        mutate(t, f++);
        api.layout(t.root);
      };
    });
  });
}

// labs collects garbage before every sample. A tree kept alive keeps the
// engine's hidden classes alive, so these rows measure a warm build.
const warmBuild = (api: Api) => {
  const live = buildTree(api);
  api.layout(live.root);
  return () => {
    api.layout(buildTree(api).root);
    live.root.getComputedWidth();
  };
};

group("hud: build the tree and lay it out once", () => engines(warmBuild));

// The same once no tree of the engine is left alive, as after a scene change.
group("hud: build after every tree was collected", () =>
  engines((api) => () => api.layout(buildTree(api).root), { cold: true }),
);
