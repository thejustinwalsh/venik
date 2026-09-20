// Port of yoga-cpp/tests/YGTreeMutationTest.cpp

import { expect, test } from "vitest";
import { Node } from "../src/index.ts";

function getChildren(node: Node): (Node | null)[] {
  const count = node.getChildCount();
  const children: (Node | null)[] = [];
  for (let i = 0; i < count; i++) {
    children.push(node.getChild(i));
  }
  return children;
}

// ASSERT_EQ on std::vector<YGNodeRef> compares the pointers, i.e. node identity.
function expectSameNodes(actual: readonly (Node | null)[], expected: readonly (Node | null)[]): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i]).toBe(expected[i]);
  }
}

test("set_children_adds_children_to_parent", () => {
  const root = new Node();
  const root_child0 = new Node();
  const root_child1 = new Node();

  const children = [root_child0, root_child1];
  root.setChildren(children);

  const expectedChildren: (Node | null)[] = [root_child0, root_child1];
  expectSameNodes(getChildren(root), expectedChildren);

  const owners = [root_child0.getOwner(), root_child1.getOwner()];
  const expectedOwners: (Node | null)[] = [root, root];
  expectSameNodes(owners, expectedOwners);

  root.freeRecursive();
});

test("set_children_to_empty_removes_old_children", () => {
  const root = new Node();
  const root_child0 = new Node();
  const root_child1 = new Node();

  const children = [root_child0, root_child1];
  root.setChildren(children);
  root.setChildren([]);

  const expectedChildren: (Node | null)[] = [];
  expectSameNodes(getChildren(root), expectedChildren);

  const owners = [root_child0.getOwner(), root_child1.getOwner()];
  const expectedOwners: (Node | null)[] = [null, null];
  expectSameNodes(owners, expectedOwners);

  root.freeRecursive();
});

test("set_children_replaces_non_common_children", () => {
  const root = new Node();
  const root_child0 = new Node();
  const root_child1 = new Node();

  const children1 = [root_child0, root_child1];
  root.setChildren(children1);

  const root_child2 = new Node();
  const root_child3 = new Node();

  const children2 = [root_child2, root_child3];
  root.setChildren(children2);

  const expectedChildren: (Node | null)[] = [root_child2, root_child3];
  expectSameNodes(getChildren(root), expectedChildren);

  const owners = [root_child0.getOwner(), root_child1.getOwner()];
  const expectedOwners: (Node | null)[] = [null, null];
  expectSameNodes(owners, expectedOwners);

  root.freeRecursive();
  root_child0.free();
  root_child1.free();
});

test("set_children_keeps_and_reorders_common_children", () => {
  const root = new Node();
  const root_child0 = new Node();
  const root_child1 = new Node();
  const root_child2 = new Node();

  const children1 = [root_child0, root_child1, root_child2];
  root.setChildren(children1);

  const root_child3 = new Node();

  const children2 = [root_child2, root_child1, root_child3];
  root.setChildren(children2);

  const expectedChildren: (Node | null)[] = [root_child2, root_child1, root_child3];
  expectSameNodes(getChildren(root), expectedChildren);

  const owners = [
    root_child0.getOwner(),
    root_child1.getOwner(),
    root_child2.getOwner(),
    root_child3.getOwner(),
  ];
  const expectedOwners: (Node | null)[] = [null, root, root, root];
  expectSameNodes(owners, expectedOwners);

  root.freeRecursive();
  root_child0.free();
});
