import { expect, test } from "vitest";
import { Direction, Node } from "../src/index.ts";

// Nothing is ever freed by hand: a subtree has to become collectable as soon
// as it is detached and the caller drops its own references.

// `gc` comes from `--expose-gc` in vitest.config.ts.
declare const gc: () => void;
declare function setTimeout(callback: () => void, ms: number): unknown;

async function collectGarbage(): Promise<void> {
  // WeakRef targets are kept alive until the end of the current job.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  gc();
}

/** Builds root > child > grandchild, lays it out, and only hands out weak references to the subtree. */
function buildTree(): { root: Node; child: WeakRef<Node>; grandchild: WeakRef<Node> } {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const child = new Node();
  child.setFlexGrow(1);
  root.insertChild(child, 0);

  const grandchild = new Node();
  grandchild.setMeasureFunc(() => ({ width: 10, height: 10 }));
  child.insertChild(grandchild, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  return { root, child: new WeakRef(child), grandchild: new WeakRef(grandchild) };
}

test("detached_subtree_is_collected", async () => {
  const { root, child, grandchild } = buildTree();

  await collectGarbage();
  expect(child.deref()).toBeDefined();
  expect(grandchild.deref()).toBeDefined();

  child.deref()!.detach();
  root.calculateLayout(undefined, undefined, Direction.LTR);

  await collectGarbage();
  expect(child.deref()).toBeUndefined();
  expect(grandchild.deref()).toBeUndefined();
  expect(root.getChildCount()).toBe(0);
});

test("removed_children_are_collected", async () => {
  const { root, child, grandchild } = buildTree();

  root.removeAllChildren();

  await collectGarbage();
  expect(child.deref()).toBeUndefined();
  expect(grandchild.deref()).toBeUndefined();
});

test("dropped_tree_is_collected", async () => {
  let tree: ReturnType<typeof buildTree> | null = buildTree();
  const root = new WeakRef(tree.root);
  const grandchild = tree.grandchild;
  tree = null;

  await collectGarbage();
  expect(root.deref()).toBeUndefined();
  expect(grandchild.deref()).toBeUndefined();
});
