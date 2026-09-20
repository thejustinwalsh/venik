// Port of yoga-cpp/tests/YGNodeChildTest.cpp

import { expect, test } from "vitest";
import { Direction, Node } from "../src/index.ts";

test("reset_layout_when_child_removed", () => {
  const root = new Node();

  const root_child0 = new Node();
  root_child0.setWidth(100);
  root_child0.setHeight(100);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.removeChild(root_child0);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBeNaN();
  expect(root_child0.getComputedHeight()).toBeNaN();

  root.freeRecursive();
  root_child0.freeRecursive();
});

test("removed_child_can_be_reused_with_valid_layout", () => {
  const root = new Node();
  root.setWidth(200);
  root.setHeight(200);

  const child = new Node();
  child.setWidth(100);
  child.setHeight(100);
  root.insertChild(child, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child.getComputedWidth()).toBe(100);
  expect(child.getComputedHeight()).toBe(100);

  // Remove child - layout should be cleared and child marked dirty
  root.removeChild(child);

  expect(child.getComputedWidth()).toBeNaN();
  expect(child.getComputedHeight()).toBeNaN();
  expect(child.isDirty()).toBe(true);

  // Reinsert the child and recalculate - layout should be valid again
  root.insertChild(child, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child.getComputedWidth()).toBe(100);
  expect(child.getComputedHeight()).toBe(100);
  expect(child.isDirty()).toBe(false);

  root.freeRecursive();
});
