import { expect, test } from "vitest";
import { Config, Direction } from "../src/index.ts";
import { newFixtureNode, TestUtil } from "./util/testUtil.ts";

test("cloning_shared_root", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasis(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(75);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(25);

  const root2 = root.clone();
  root2.setWidth(100);

  expect(root2.getChildCount()).toBe(2);
  // The children should have referential equality at this point.
  expect(root2.getChild(0)).toBe(root_child0);
  expect(root2.getChild(1)).toBe(root_child1);

  root2.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root2.getChildCount()).toBe(2);
  // Relayout with no changed input should result in referential equality.
  expect(root2.getChild(0)).toBe(root_child0);
  expect(root2.getChild(1)).toBe(root_child1);

  root2.setWidth(150);
  root2.setHeight(200);
  root2.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root2.getChildCount()).toBe(2);
  // Relayout with changed input should result in cloned children.
  const root2_child0 = root2.getChild(0)!;
  const root2_child1 = root2.getChild(1)!;
  expect(root2_child0).not.toBe(root_child0);
  expect(root2_child1).not.toBe(root_child1);

  // Everything in the root should remain unchanged.
  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(75);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(25);

  // The new root now has new layout.
  expect(root2.getComputedLeft()).toBe(0);
  expect(root2.getComputedTop()).toBe(0);
  expect(root2.getComputedWidth()).toBe(150);
  expect(root2.getComputedHeight()).toBe(200);

  expect(root2_child0.getComputedLeft()).toBe(0);
  expect(root2_child0.getComputedTop()).toBe(0);
  expect(root2_child0.getComputedWidth()).toBe(150);
  expect(root2_child0.getComputedHeight()).toBe(125);

  expect(root2_child1.getComputedLeft()).toBe(0);
  expect(root2_child1.getComputedTop()).toBe(125);
  expect(root2_child1.getComputedWidth()).toBe(150);
  expect(root2_child1.getComputedHeight()).toBe(75);

  root2.freeRecursive();

  root.freeRecursive();

  config.free();
});

test("mutating_children_of_a_clone_clones_only_after_layout", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  expect(root.getChildCount()).toBe(0);

  const root2 = root.clone();
  expect(root2.getChildCount()).toBe(0);

  const root2_child0 = newFixtureNode(config);
  root2.insertChild(root2_child0, 0);

  expect(root.getChildCount()).toBe(0);
  expect(root2.getChildCount()).toBe(1);

  const root3 = root2.clone();
  expect(root2.getChildCount()).toBe(1);
  expect(root3.getChildCount()).toBe(1);
  expect(root3.getChild(0)).toBe(root2.getChild(0));

  const root3_child1 = newFixtureNode(config);
  root3.insertChild(root3_child1, 1);
  expect(root2.getChildCount()).toBe(1);
  expect(root3.getChildCount()).toBe(2);
  expect(root3.getChild(1)).toBe(root3_child1);
  expect(root3.getChild(0)).toBe(root2.getChild(0));

  const root4 = root3.clone();
  expect(root4.getChild(1)).toBe(root3_child1);

  root4.removeChild(root3_child1);
  expect(root3.getChildCount()).toBe(2);
  expect(root4.getChildCount()).toBe(1);
  expect(root4.getChild(0)).toBe(root3.getChild(0));

  root4.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root4.getChild(0)).not.toBe(root3.getChild(0));
  root3.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root3.getChild(0)).not.toBe(root2.getChild(0));

  root4.freeRecursive();
  root3.freeRecursive();
  root2.freeRecursive();
  root.freeRecursive();

  config.free();
});

test("cloning_two_levels", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasis(15);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);

  const root_child1_0 = newFixtureNode(config);
  root_child1_0.setFlexBasis(10);
  root_child1_0.setFlexGrow(1);
  root_child1.insertChild(root_child1_0, 0);

  const root_child1_1 = newFixtureNode(config);
  root_child1_1.setFlexBasis(25);
  root_child1.insertChild(root_child1_1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedHeight()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(60);
  expect(root_child1_0.getComputedHeight()).toBe(35);
  expect(root_child1_1.getComputedHeight()).toBe(25);

  const root2_child0 = root_child0.clone();
  const root2_child1 = root_child1.clone();
  const root2 = root.clone();

  root2_child0.setFlexGrow(0);
  root2_child0.setFlexBasis(40);

  root2.removeAllChildren();
  root2.insertChild(root2_child0, 0);
  root2.insertChild(root2_child1, 1);
  expect(root2.getChildCount()).toBe(2);

  root2.calculateLayout(undefined, undefined, Direction.LTR);

  // Original root is unchanged
  expect(root_child0.getComputedHeight()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(60);
  expect(root_child1_0.getComputedHeight()).toBe(35);
  expect(root_child1_1.getComputedHeight()).toBe(25);

  // New root has new layout at the top
  expect(root2_child0.getComputedHeight()).toBe(40);
  expect(root2_child1.getComputedHeight()).toBe(60);

  // The deeper children are untouched.
  expect(root2_child1.getChild(0)).toBe(root_child1_0);
  expect(root2_child1.getChild(1)).toBe(root_child1_1);

  root2.freeRecursive();
  root.freeRecursive();

  config.free();
});

test("cloning_and_freeing", () => {
  TestUtil.startCountingNodes();

  const config = new Config();

  const root = newFixtureNode(config);
  root.setWidth(100);
  root.setHeight(100);
  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);
  const root_child1 = newFixtureNode(config);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const root2 = root.clone();

  // Freeing the original root should be safe as long as we don't free its
  // children.
  root.free();

  root2.calculateLayout(undefined, undefined, Direction.LTR);

  root2.freeRecursive();

  root_child0.free();
  root_child1.free();

  config.free();

  expect(TestUtil.stopCountingNodes()).toBe(0);
});

test("mixed_shared_and_owned_children", () => {
  // Don't try this at home!

  const root0 = newFixtureNode();
  const root1 = newFixtureNode();

  const root0_child0 = newFixtureNode();
  const root0_child0_0 = newFixtureNode();
  root0.insertChild(root0_child0, 0);
  root0_child0.insertChild(root0_child0_0, 0);

  const root1_child0 = newFixtureNode();
  const root1_child2 = newFixtureNode();
  root1.insertChild(root1_child0, 0);
  root1.insertChild(root1_child2, 1);

  const children = [...root1.getChildren()];
  children.splice(1, 0, root0_child0);
  root1.setChildrenRaw(children);

  let secondChild = root1.getChild(1)!;
  expect(secondChild).toBe(root0.getChild(0));
  expect(secondChild.getChild(0)).toBe(root0_child0.getChild(0));

  root1.calculateLayout(undefined, undefined, Direction.LTR);
  secondChild = root1.getChild(1)!;
  expect(secondChild).not.toBe(root0.getChild(0));
  expect(secondChild.owner).toBe(root1);
  expect(secondChild.getChild(0)).not.toBe(root0_child0.getChild(0));
  expect(secondChild.getChild(0)!.owner).toBe(secondChild);
});
