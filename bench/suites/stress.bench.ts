// Fractional resizes, very wide containers and text-heavy trees: see ../stress.mjs.
import { group } from "@pmndrs/labs";
import { stressScenarios } from "../stress.mjs";
import { engines } from "./run.ts";

for (const [name, frame] of Object.entries(stressScenarios)) {
  group(name, () => engines(frame));
}
