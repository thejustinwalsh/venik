// Port of yoga-cpp/tests/YGContentsNodeHasNewLayoutTest.cpp

import { expect, test } from "vitest";
import { Direction, Display, Edge, FlexDirection, Node, Overflow, PositionType } from "../src/index.ts";

// Regression test for `cleanupContentsNodesRecursively` stamping
// `hasNewLayout=true` on a display:contents child during a measurement-only
// visit.
//
// Setup: Root (overflow=visible, flex column) -> Parent (flex-grow=1)
//        -> Contents (display:contents) -> Leaf.
// Flipping root's overflow between the two passes invalidates Parent's
// measurement cache (computeFlexBasisForChild's `applyHeightFitContent`
// branch flips) but leaves Parent's layout cache intact (its allotment is
// unchanged). So in pass 2, Parent's calculateLayoutImpl runs only with
// performLayout=false - the layout-phase visit is served from cache and
// `cleanupContentsNodesRecursively` never runs at performLayout=true.
test("contents_child_hasNewLayout_not_stamped_on_measure_only_visit", () => {
  const leaf = new Node();
  leaf.setWidth(20);
  leaf.setHeight(20);

  const contents = new Node();
  contents.setDisplay(Display.Contents);
  contents.insertChild(leaf, 0);

  const parent = new Node();
  parent.setFlexGrow(1);
  parent.insertChild(contents, 0);

  const root = new Node();
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(200);
  root.setHeight(200);
  root.setOverflow(Overflow.Visible);
  root.insertChild(parent, 0);

  root.calculateLayout(200, 200, Direction.LTR);

  // Simulate a consumer (e.g. React Native's layout pass) reading and
  // clearing the hasNewLayout flags.
  root.setHasNewLayout(false);
  parent.setHasNewLayout(false);
  contents.setHasNewLayout(false);
  leaf.setHasNewLayout(false);

  root.setOverflow(Overflow.Scroll);
  root.calculateLayout(200, 200, Direction.LTR);

  expect(
    contents.hasNewLayout(),
    "contents.hasNewLayout was stamped during a measure-only visit " +
      "(cleanupContentsNodesRecursively ran with performLayout=false " +
      "but no matching performLayout=true visit occurred this pass)",
  ).toBe(false);

  root.freeRecursive();
});

// Regression test for `cleanupContentsNodesRecursively` invoked from
// `layoutAbsoluteDescendants`: it must stamp `hasNewLayout=true` on
// display:contents children on the path to an absolute descendant whose
// position changed this pass. Otherwise consumers traversing the tree via
// hasNewLayout would skip the contents subtree and miss the update.
//
// Setup: root (containing block) -> staticChild (fixed 50x50)
//        -> contents (display:contents) -> absoluteChild (right/bottom-
//        anchored so its position depends on the containing block).
// Growing root in pass 2 dirties only root. staticChild's fixed dimensions
// make its layout cache hit, so its main-path cleanup never runs.
// absoluteChild depends on the containing block and is repositioned by
// `layoutAbsoluteDescendants`, which is the only path that can stamp
// contents along the way.
test("absolute_descendant_through_contents_is_reachable_via_hasNewLayout", () => {
  const absoluteChild = new Node();
  absoluteChild.setPositionType(PositionType.Absolute);
  absoluteChild.setPosition(Edge.Right, 0);
  absoluteChild.setPosition(Edge.Bottom, 0);
  absoluteChild.setWidth(10);
  absoluteChild.setHeight(10);

  const contents = new Node();
  contents.setDisplay(Display.Contents);
  contents.insertChild(absoluteChild, 0);

  const staticChild = new Node();
  staticChild.setPositionType(PositionType.Static);
  staticChild.setWidth(50);
  staticChild.setHeight(50);
  staticChild.insertChild(contents, 0);

  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);
  root.insertChild(staticChild, 0);

  root.calculateLayout(100, 100, Direction.LTR);

  // Simulate a consumer (e.g. React Native's layout pass) reading and
  // clearing the hasNewLayout flags.
  root.setHasNewLayout(false);
  staticChild.setHasNewLayout(false);
  contents.setHasNewLayout(false);
  absoluteChild.setHasNewLayout(false);

  root.setWidth(150);
  root.calculateLayout(150, 100, Direction.LTR);

  expect(absoluteChild.hasNewLayout()).toBe(true);
  expect(staticChild.hasNewLayout()).toBe(true);
  expect(
    contents.hasNewLayout(),
    "contents node on the path to a freshly-positioned absolute " +
      "descendant must have hasNewLayout=true so consumers can traverse " +
      "to it",
  ).toBe(true);

  root.freeRecursive();
});

// Regression test for `cleanupContentsNodesRecursively` invoked from
// `layoutAbsoluteDescendants`: it must not stamp `hasNewLayout=true` on
// display:contents children when no new layout was produced for their
// parent this pass. Otherwise the stale flag survives across passes and
// can be observed by a later cache-hit on the parent.
//
// Setup: root -> a (fixed 50x50) -> b (fixed 30x30)
//        -> contents (display:contents) -> leaf.
// Flipping root's overflow in pass 2 dirties only root. a and b have fixed
// sizes so their layout caches hit; a.calculateLayoutImpl is skipped, so
// b.calculateLayoutInternal is never invoked. `layoutAbsoluteDescendants`
// still walks down through a and b looking for absolute descendants, but
// there are none beneath b - so b.hasNewLayout stays false and the
// cleanup along that walk must leave contents unflagged.
test("absolute_phase_cleanup_does_not_stamp_when_parent_layout_skipped", () => {
  const leaf = new Node();
  leaf.setWidth(10);
  leaf.setHeight(10);

  const contents = new Node();
  contents.setDisplay(Display.Contents);
  contents.insertChild(leaf, 0);

  const b = new Node();
  b.setPositionType(PositionType.Static);
  b.setWidth(30);
  b.setHeight(30);
  b.insertChild(contents, 0);

  const a = new Node();
  a.setPositionType(PositionType.Static);
  a.setWidth(50);
  a.setHeight(50);
  a.insertChild(b, 0);

  const root = new Node();
  root.setWidth(200);
  root.setHeight(200);
  root.setOverflow(Overflow.Visible);
  root.insertChild(a, 0);

  root.calculateLayout(200, 200, Direction.LTR);

  // Simulate a consumer (e.g. React Native's layout pass) reading and
  // clearing the hasNewLayout flags.
  root.setHasNewLayout(false);
  a.setHasNewLayout(false);
  b.setHasNewLayout(false);
  contents.setHasNewLayout(false);
  leaf.setHasNewLayout(false);

  root.setOverflow(Overflow.Scroll);
  root.calculateLayout(200, 200, Direction.LTR);

  expect(b.hasNewLayout()).toBe(false);
  expect(
    contents.hasNewLayout(),
    "contents.hasNewLayout was stamped during a walk where its " +
      "parent's hasNewLayout remained false this pass",
  ).toBe(false);

  root.freeRecursive();
});
