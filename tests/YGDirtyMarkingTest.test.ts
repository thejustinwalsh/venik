import { expect, test } from "vitest";
import { Align, Config, Direction, Display, FlexDirection, Node } from "../src/index.ts";

test("dirty_propagation", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(50);
  root_child1.setHeight(20);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  root_child0.setWidth(20);

  expect(root_child0.isDirty()).toBe(true);
  expect(root_child1.isDirty()).toBe(false);
  expect(root.isDirty()).toBe(true);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root.isDirty()).toBe(false);

  root.freeRecursive();
});

test("dirty_propagation_only_if_prop_changed", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(50);
  root_child1.setHeight(20);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  root_child0.setWidth(50);

  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root.isDirty()).toBe(false);

  root.freeRecursive();
});

test("dirty_propagation_changing_layout_config", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(50);
  root_child1.setHeight(20);
  root.insertChild(root_child1, 1);

  const root_child0_child0 = new Node();
  root_child0_child0.setWidth(25);
  root_child0_child0.setHeight(20);
  root.insertChild(root_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.isDirty()).toBe(false);
  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root_child0_child0.isDirty()).toBe(false);

  const newConfig = new Config();
  newConfig.setPointScaleFactor(2);
  root_child0.setConfig(newConfig);

  expect(root.isDirty()).toBe(true);
  expect(root_child0.isDirty()).toBe(true);
  expect(root_child1.isDirty()).toBe(false);
  expect(root_child0_child0.isDirty()).toBe(false);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.isDirty()).toBe(false);
  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root_child0_child0.isDirty()).toBe(false);

  newConfig.free();
  root.freeRecursive();
});

test("dirty_propagation_changing_benign_config", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(50);
  root_child1.setHeight(20);
  root.insertChild(root_child1, 1);

  const root_child0_child0 = new Node();
  root_child0_child0.setWidth(25);
  root_child0_child0.setHeight(20);
  root.insertChild(root_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.isDirty()).toBe(false);
  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root_child0_child0.isDirty()).toBe(false);

  const newConfig = new Config();
  newConfig.setLogger((_config, _node, _level, _message) => {});
  root_child0.setConfig(newConfig);

  expect(root.isDirty()).toBe(false);
  expect(root_child0.isDirty()).toBe(false);
  expect(root_child1.isDirty()).toBe(false);
  expect(root_child0_child0.isDirty()).toBe(false);

  newConfig.free();
  root.freeRecursive();
});

test("dirty_mark_all_children_as_dirty_when_display_changes", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setHeight(100);

  const child0 = new Node();
  child0.setFlexGrow(1);
  const child1 = new Node();
  child1.setFlexGrow(1);

  const child1_child0 = new Node();
  const child1_child0_child0 = new Node();
  child1_child0_child0.setWidth(8);
  child1_child0_child0.setHeight(16);

  child1_child0.insertChild(child1_child0_child0, 0);

  child1.insertChild(child1_child0, 0);
  root.insertChild(child0, 0);
  root.insertChild(child1, 0);

  child0.setDisplay(Display.Flex);
  child1.setDisplay(Display.None);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(child1_child0_child0.getComputedWidth()).toBe(0);
  expect(child1_child0_child0.getComputedHeight()).toBe(0);

  child0.setDisplay(Display.None);
  child1.setDisplay(Display.Flex);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(child1_child0_child0.getComputedWidth()).toBe(8);
  expect(child1_child0_child0.getComputedHeight()).toBe(16);

  child0.setDisplay(Display.Flex);
  child1.setDisplay(Display.None);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(child1_child0_child0.getComputedWidth()).toBe(0);
  expect(child1_child0_child0.getComputedHeight()).toBe(0);

  child0.setDisplay(Display.None);
  child1.setDisplay(Display.Flex);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(child1_child0_child0.getComputedWidth()).toBe(8);
  expect(child1_child0_child0.getComputedHeight()).toBe(16);

  root.freeRecursive();
});

test("dirty_node_only_if_children_are_actually_removed", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(50);
  root.setHeight(50);

  const child0 = new Node();
  child0.setWidth(50);
  child0.setHeight(25);
  root.insertChild(child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const child1 = new Node();
  root.removeChild(child1);
  expect(root.isDirty()).toBe(false);
  child1.free();

  root.removeChild(child0);
  expect(root.isDirty()).toBe(true);
  child0.free();

  root.freeRecursive();
});

test("dirty_node_only_if_undefined_values_gets_set_to_undefined", () => {
  const root = new Node();
  root.setWidth(50);
  root.setHeight(50);
  root.setMinWidth(undefined);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root.isDirty()).toBe(false);

  root.setMinWidth(undefined);

  expect(root.isDirty()).toBe(false);

  root.freeRecursive();
});

test("dirty_removed_child_node", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const child = new Node();
  child.setWidth(50);
  child.setHeight(50);
  root.insertChild(child, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child.isDirty()).toBe(false);

  root.removeChild(child);

  // Child should be marked dirty after removal so layout is recalculated
  // when the child is reused (e.g., in a recycling view system)
  expect(child.isDirty()).toBe(true);

  child.free();
  root.freeRecursive();
});

test("dirty_removed_child_nodes_when_removing_all", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const child0 = new Node();
  child0.setWidth(50);
  child0.setHeight(25);
  root.insertChild(child0, 0);

  const child1 = new Node();
  child1.setWidth(50);
  child1.setHeight(25);
  root.insertChild(child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child0.isDirty()).toBe(false);
  expect(child1.isDirty()).toBe(false);

  root.removeAllChildren();

  // All children should be marked dirty after removal
  expect(child0.isDirty()).toBe(true);
  expect(child1.isDirty()).toBe(true);

  child0.free();
  child1.free();
  root.freeRecursive();
});

test("dirty_parent_when_child_freed", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const child = new Node();
  child.setWidth(50);
  child.setHeight(50);
  root.insertChild(child, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root.isDirty()).toBe(false);

  child.free();

  expect(root.isDirty()).toBe(true);
  root.free();
});

test("dirty_parent_when_subtree_freed_recursive", () => {
  const root = new Node();
  const child = new Node();
  const grandchild = new Node();
  root.insertChild(child, 0);
  child.insertChild(grandchild, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root.isDirty()).toBe(false);

  child.freeRecursive();

  expect(root.isDirty()).toBe(true);
  root.free();
});
