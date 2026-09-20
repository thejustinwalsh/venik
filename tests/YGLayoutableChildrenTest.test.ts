// Port of yoga-cpp/tests/YGLayoutableChildrenTest.cpp

import { expect, test } from "vitest";
import { Display, Node } from "../src/index.ts";

test("layoutable_children_single_contents_node", () => {
  const root = new Node();

  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  const root_grandchild0 = new Node();
  const root_grandchild1 = new Node();

  root.insertChild(root_child0, 0);
  root.insertChild(root_child1, 1);
  root.insertChild(root_child2, 2);

  root_child1.insertChild(root_grandchild0, 0);
  root_child1.insertChild(root_grandchild1, 1);

  root_child1.setDisplay(Display.Contents);

  const order: Node[] = [
    root_child0,
    root_grandchild0,
    root_grandchild1,
    root_child2,
  ];
  let correctOrderIt = 0;

  for (const node of root.getLayoutChildren()) {
    expect(node).toBe(order[correctOrderIt]);
    correctOrderIt++;
  }

  root.freeRecursive();
});

test("layoutable_children_multiple_contents_nodes", () => {
  const root = new Node();

  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  const root_grandchild0 = new Node();
  const root_grandchild1 = new Node();
  const root_grandchild2 = new Node();
  const root_grandchild3 = new Node();
  const root_grandchild4 = new Node();
  const root_grandchild5 = new Node();

  root.insertChild(root_child0, 0);
  root.insertChild(root_child1, 1);
  root.insertChild(root_child2, 2);

  root_child0.insertChild(root_grandchild0, 0);
  root_child0.insertChild(root_grandchild1, 1);
  root_child1.insertChild(root_grandchild2, 0);
  root_child1.insertChild(root_grandchild3, 1);
  root_child2.insertChild(root_grandchild4, 0);
  root_child2.insertChild(root_grandchild5, 1);

  root_child0.setDisplay(Display.Contents);
  root_child1.setDisplay(Display.Contents);
  root_child2.setDisplay(Display.Contents);

  const order: Node[] = [
    root_grandchild0,
    root_grandchild1,
    root_grandchild2,
    root_grandchild3,
    root_grandchild4,
    root_grandchild5,
  ];
  let correctOrderIt = 0;

  for (const node of root.getLayoutChildren()) {
    expect(node).toBe(order[correctOrderIt]);
    correctOrderIt++;
  }

  root.freeRecursive();
});

test("layoutable_children_nested_contents_nodes", () => {
  const root = new Node();

  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  const root_grandchild0 = new Node();
  const root_grandchild1 = new Node();

  const root_great_grandchild0 = new Node();
  const root_great_grandchild1 = new Node();

  root.insertChild(root_child0, 0);
  root.insertChild(root_child1, 1);
  root.insertChild(root_child2, 2);

  root_child1.insertChild(root_grandchild0, 0);
  root_child1.insertChild(root_grandchild1, 1);

  root_grandchild1.insertChild(root_great_grandchild0, 0);
  root_grandchild1.insertChild(root_great_grandchild1, 1);

  root_child1.setDisplay(Display.Contents);
  root_grandchild1.setDisplay(Display.Contents);

  const order: Node[] = [
    root_child0,
    root_grandchild0,
    root_great_grandchild0,
    root_great_grandchild1,
    root_child2,
  ];
  let correctOrderIt = 0;

  for (const node of root.getLayoutChildren()) {
    expect(node).toBe(order[correctOrderIt]);
    correctOrderIt++;
  }

  root.freeRecursive();
});

test("layoutable_children_contents_leaf_node", () => {
  const root = new Node();

  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  root.insertChild(root_child0, 0);
  root.insertChild(root_child1, 1);
  root.insertChild(root_child2, 2);

  root_child1.setDisplay(Display.Contents);

  const order: Node[] = [
    root_child0,
    root_child2,
  ];
  let correctOrderIt = 0;

  for (const node of root.getLayoutChildren()) {
    expect(node).toBe(order[correctOrderIt]);
    correctOrderIt++;
  }

  root.freeRecursive();
});

test("layoutable_children_contents_root_node", () => {
  const root = new Node();

  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  root.insertChild(root_child0, 0);
  root.insertChild(root_child1, 1);
  root.insertChild(root_child2, 2);

  root.setDisplay(Display.Contents);

  const order: Node[] = [
    root_child0,
    root_child1,
    root_child2,
  ];
  let correctOrderIt = 0;

  for (const node of root.getLayoutChildren()) {
    expect(node).toBe(order[correctOrderIt]);
    correctOrderIt++;
  }

  root.freeRecursive();
});
