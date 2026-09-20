// Port of yoga-cpp/tests/YGRelayoutTest.cpp

import { expect, test } from "vitest";
import { Config, Direction, Edge, Node, PositionType } from "../src/index.ts";

test("dont_cache_computed_flex_basis_between_layouts", () => {
  const config = new Config();

  const root = new Node(config);
  root.setHeightPercent(100);
  root.setWidthPercent(100);

  const root_child0 = new Node(config);
  root_child0.setFlexBasisPercent(100);
  root.insertChild(root_child0, 0);

  root.calculateLayout(100, undefined, Direction.LTR);
  root.calculateLayout(100, 100, Direction.LTR);

  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("recalculate_resolvedDimonsion_onchange", () => {
  const root = new Node();

  const root_child0 = new Node();
  root_child0.setMinHeight(10);
  root_child0.setMaxHeight(10);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedHeight()).toBe(10);

  root_child0.setMinHeight(undefined);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedHeight()).toBe(0);

  root.freeRecursive();
});

test("relayout_containing_block_size_changes", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);

  const root_child0 = new Node(config);
  root_child0.setPositionType(PositionType.Relative);
  root_child0.setMargin(Edge.Left, 4);
  root_child0.setMargin(Edge.Top, 5);
  root_child0.setMargin(Edge.Right, 9);
  root_child0.setMargin(Edge.Bottom, 1);
  root_child0.setPadding(Edge.Left, 2);
  root_child0.setPadding(Edge.Top, 9);
  root_child0.setPadding(Edge.Right, 11);
  root_child0.setPadding(Edge.Bottom, 13);
  root_child0.setBorder(Edge.Left, 5);
  root_child0.setBorder(Edge.Top, 6);
  root_child0.setBorder(Edge.Right, 7);
  root_child0.setBorder(Edge.Bottom, 8);
  root_child0.setWidth(500);
  root_child0.setHeight(500);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setPositionType(PositionType.Static);
  root_child0_child0.setMargin(Edge.Left, 8);
  root_child0_child0.setMargin(Edge.Top, 6);
  root_child0_child0.setMargin(Edge.Right, 3);
  root_child0_child0.setMargin(Edge.Bottom, 9);
  root_child0_child0.setPadding(Edge.Left, 1);
  root_child0_child0.setPadding(Edge.Top, 7);
  root_child0_child0.setPadding(Edge.Right, 9);
  root_child0_child0.setPadding(Edge.Bottom, 4);
  root_child0_child0.setBorder(Edge.Left, 8);
  root_child0_child0.setBorder(Edge.Top, 10);
  root_child0_child0.setBorder(Edge.Right, 2);
  root_child0_child0.setBorder(Edge.Bottom, 1);
  root_child0_child0.setWidth(200);
  root_child0_child0.setHeight(200);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = new Node(config);
  root_child0_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0_child0.setPosition(Edge.Left, 2);
  root_child0_child0_child0.setPosition(Edge.Right, 12);
  root_child0_child0_child0.setMargin(Edge.Left, 9);
  root_child0_child0_child0.setMargin(Edge.Top, 12);
  root_child0_child0_child0.setMargin(Edge.Right, 4);
  root_child0_child0_child0.setMargin(Edge.Bottom, 7);
  root_child0_child0_child0.setPadding(Edge.Left, 5);
  root_child0_child0_child0.setPadding(Edge.Top, 3);
  root_child0_child0_child0.setPadding(Edge.Right, 8);
  root_child0_child0_child0.setPadding(Edge.Bottom, 10);
  root_child0_child0_child0.setBorder(Edge.Left, 2);
  root_child0_child0_child0.setBorder(Edge.Top, 1);
  root_child0_child0_child0.setBorder(Edge.Right, 5);
  root_child0_child0_child0.setBorder(Edge.Bottom, 9);
  root_child0_child0_child0.setWidthPercent(41);
  root_child0_child0_child0.setHeightPercent(63);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(513);
  expect(root.getComputedHeight()).toBe(506);

  expect(root_child0.getComputedLeft()).toBe(4);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(15);
  expect(root_child0_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(1);
  expect(root_child0_child0_child0.getComputedTop()).toBe(29);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(306);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(513);
  expect(root.getComputedHeight()).toBe(506);

  expect(root_child0.getComputedLeft()).toBe(4);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(279);
  expect(root_child0_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(-2);
  expect(root_child0_child0_child0.getComputedTop()).toBe(29);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(306);

  // Relayout starts here
  root_child0.setWidth(456);
  root_child0.setHeight(432);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(469);
  expect(root.getComputedHeight()).toBe(438);

  expect(root_child0.getComputedLeft()).toBe(4);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(456);
  expect(root_child0.getComputedHeight()).toBe(432);

  expect(root_child0_child0.getComputedLeft()).toBe(15);
  expect(root_child0_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(1);
  expect(root_child0_child0_child0.getComputedTop()).toBe(29);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(182);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(263);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(469);
  expect(root.getComputedHeight()).toBe(438);

  expect(root_child0.getComputedLeft()).toBe(4);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(456);
  expect(root_child0.getComputedHeight()).toBe(432);

  expect(root_child0_child0.getComputedLeft()).toBe(235);
  expect(root_child0_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(16);
  expect(root_child0_child0_child0.getComputedTop()).toBe(29);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(182);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(263);

  root.freeRecursive();

  config.free();
});

test("has_new_layout_flag_set_static", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Static);
  root_child0.setWidth(10);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);

  const root_child0_child1 = new Node();
  root_child0_child1.setPositionType(PositionType.Absolute);
  root_child0_child1.setWidth(5);
  root_child0_child1.setHeight(5);
  root_child0.insertChild(root_child0_child1, 0);

  const root_child0_child0 = new Node();
  root_child0_child0.setPositionType(PositionType.Static);
  root_child0_child0.setWidth(5);
  root_child0_child0.setHeight(5);
  root_child0.insertChild(root_child0_child0, 1);

  const root_child0_child0_child0 = new Node();
  root_child0_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0_child0.setWidthPercent(1);
  root_child0_child0_child0.setHeight(1);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  root.setHasNewLayout(false);
  root_child0.setHasNewLayout(false);
  root_child0_child0.setHasNewLayout(false);
  root_child0_child0_child0.setHasNewLayout(false);

  root.setWidth(110);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.hasNewLayout()).toBe(true);
  expect(root_child0.hasNewLayout()).toBe(true);
  expect(root_child0_child0.hasNewLayout()).toBe(true);
  expect(root_child0_child0_child0.hasNewLayout()).toBe(true);

  root.freeRecursive();
});
