import { expect, test } from "vitest";
import { Align, Direction, Node } from "../src/index.ts";

// C++ stores an `int*` in the node context; here the context is a counter object.
type DirtiedCounter = { dirtiedCount: number };

function _dirtied(node: Node): void {
  const counter = node.context as DirtiedCounter;
  counter.dirtiedCount++;
}

test("dirtied", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  const counter: DirtiedCounter = { dirtiedCount: 0 };
  root.context = counter;
  root.setDirtiedFunc(_dirtied);

  expect(counter.dirtiedCount).toBe(0);

  // `_dirtied` MUST be called in case of explicit dirtying.
  root.setDirty(true);
  expect(counter.dirtiedCount).toBe(1);

  // `_dirtied` MUST be called ONCE.
  root.setDirty(true);
  expect(counter.dirtiedCount).toBe(1);
});

test("dirtied_propagation", () => {
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

  const counter: DirtiedCounter = { dirtiedCount: 0 };
  root.context = counter;
  root.setDirtiedFunc(_dirtied);

  expect(counter.dirtiedCount).toBe(0);

  // `_dirtied` MUST be called for the first time.
  root_child0.markDirtyAndPropagate();
  expect(counter.dirtiedCount).toBe(1);

  // `_dirtied` must NOT be called for the second time.
  root_child0.markDirtyAndPropagate();
  expect(counter.dirtiedCount).toBe(1);
});

test("dirtied_hierarchy", () => {
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

  const counter: DirtiedCounter = { dirtiedCount: 0 };
  root_child0.context = counter;
  root_child0.setDirtiedFunc(_dirtied);

  expect(counter.dirtiedCount).toBe(0);

  // `_dirtied` must NOT be called for descendants.
  root.markDirtyAndPropagate();
  expect(counter.dirtiedCount).toBe(0);

  // `_dirtied` must NOT be called for the sibling node.
  root_child1.markDirtyAndPropagate();
  expect(counter.dirtiedCount).toBe(0);

  // `_dirtied` MUST be called in case of explicit dirtying.
  root_child0.markDirtyAndPropagate();
  expect(counter.dirtiedCount).toBe(1);
});
