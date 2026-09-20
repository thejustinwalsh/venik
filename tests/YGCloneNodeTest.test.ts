import { expect, test } from "vitest";
import { Direction, Display, Node, PositionType } from "../src/index.ts";

function recursivelyAssertProperNodeOwnership(node: Node): void {
  for (let i = 0; i < node.getChildCount(); ++i) {
    const child = node.getChild(i)!;
    expect(child.getOwner()).toBe(node);
    recursivelyAssertProperNodeOwnership(child);
  }
}

test("absolute_node_cloned_with_static_parent", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Static);
  root_child0.setWidth(10);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node();
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setWidthPercent(1);
  root_child0_child0.setHeight(1);
  root_child0.insertChild(root_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const clonedRoot = root.clone();
  clonedRoot.setWidth(110);
  clonedRoot.calculateLayout(undefined, undefined, Direction.LTR);

  recursivelyAssertProperNodeOwnership(clonedRoot);

  root.freeRecursive();
  clonedRoot.freeRecursive();
});

test("absolute_node_cloned_through_nested_display_contents", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const wrapper = new Node();
  wrapper.setPositionType(PositionType.Static);
  wrapper.setWidth(50);
  wrapper.setHeight(50);
  root.insertChild(wrapper, 0);

  const static1 = new Node();
  static1.setPositionType(PositionType.Static);
  static1.setFlexGrow(1);
  wrapper.insertChild(static1, 0);

  const contents1 = new Node();
  contents1.setDisplay(Display.Contents);
  static1.insertChild(contents1, 0);

  const contents2 = new Node();
  contents2.setDisplay(Display.Contents);
  contents1.insertChild(contents2, 0);

  const absolute = new Node();
  absolute.setPositionType(PositionType.Absolute);
  absolute.setWidthPercent(50);
  absolute.setHeight(1);
  contents2.insertChild(absolute, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const clonedRoot = root.clone();
  clonedRoot.setWidth(200);
  clonedRoot.calculateLayout(undefined, undefined, Direction.LTR);

  recursivelyAssertProperNodeOwnership(clonedRoot);

  root.freeRecursive();
  clonedRoot.freeRecursive();
});

test("absolute_node_cloned_with_static_ancestors", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Static);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node();
  root_child0_child0.setPositionType(PositionType.Static);
  root_child0_child0.setWidth(40);
  root_child0_child0.setHeight(40);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = new Node();
  root_child0_child0_child0.setPositionType(PositionType.Static);
  root_child0_child0_child0.setWidth(30);
  root_child0_child0_child0.setHeight(30);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);

  const root_child0_child0_child0_child0 = new Node();
  root_child0_child0_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0_child0_child0.setWidthPercent(1);
  root_child0_child0_child0_child0.setHeight(1);
  root_child0_child0_child0.insertChild(root_child0_child0_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const clonedRoot = root.clone();
  clonedRoot.setWidth(110);
  clonedRoot.calculateLayout(undefined, undefined, Direction.LTR);

  recursivelyAssertProperNodeOwnership(clonedRoot);

  root.freeRecursive();
  clonedRoot.freeRecursive();
});
