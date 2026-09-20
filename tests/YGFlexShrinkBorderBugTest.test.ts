import { expect, test } from "vitest";
import { Config, Direction, Edge, FlexDirection, Node } from "../src/index.ts";

// Regression test for https://github.com/facebook/yoga/issues/1665
// flexBasis:0 + flexShrink:1 + borderWidth + minWidth produces an
// astronomically large width (~1.65e11) instead of being clamped to minWidth.

test("flex_basis_0_border_minwidth_row", () => {
  const config = new Config();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(393);
  root.setHeight(100);

  // Four row children: flexBasis:0, flexGrow:1, flexShrink:1, minWidth:160
  // First child has borderWidth:0.594443, rest 0.594442.
  // Bug: first child (and all others) get width ~1.65e11 instead of 160.
  const borders = [0.594443, 0.594442, 0.594442, 0.594442];
  for (let i = 0; i < 4; i++) {
    const child = new Node(config);
    child.setFlexBasis(0);
    child.setFlexGrow(1);
    child.setFlexShrink(1);
    child.setMinWidth(160);
    child.setBorder(Edge.All, borders[i]!);
    root.insertChild(child, i);
  }

  root.calculateLayout(393, 100, Direction.LTR);

  for (let i = 0; i < 4; i++) {
    const child = root.getChild(i)!;
    expect(child.getComputedWidth(), `child[${i}] width below minWidth`).toBeGreaterThanOrEqual(
      160,
    );
    expect(child.getComputedWidth(), `child[${i}] width is astronomically large (bug)`).toBeLessThanOrEqual(
      200,
    );
  }

  root.freeRecursive();
  config.free();
});
