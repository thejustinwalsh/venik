// flexily's own benchmark (a TUI kanban board and a 50-level deep tree), see ../board.mjs.
import { group } from "@pmndrs/labs";
import { boardScenarios, buildBoard } from "../board.mjs";
import { engines } from "./run.ts";

const names = Object.keys(boardScenarios(null));
for (const name of names) {
  group(`board: ${name}`, () => {
    engines((api) => {
      const { setup, op } = boardScenarios(api)[name];
      const s = setup();
      // Keeps the engine's hidden classes alive for "build and lay out", whose
      // setup keeps no tree (see hud.bench.ts).
      const live = buildBoard(api, 5, 20);
      return () => {
        op(s);
        live.getChildCount();
      };
    });
  });
}
