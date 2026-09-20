// Originally ported from Yoga's tests/generated/YGAutoTest.cpp
// (upstream fixture: gentest/fixtures/YGAutoTest.html).

import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Config, Direction, Edge, FlexDirection, PositionType } from "../../src/index.ts";

test("auto_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidthAuto();
  root.setHeight(50);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(50);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(150);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(100);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(150);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("auto_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(50);
  root.setHeightAuto();

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(50);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(150);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(150);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("auto_flex_basis", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(50);
  root.setFlexBasisAuto();

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(50);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(150);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(150);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("auto_position", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(25);
  root_child0.setHeight(25);
  root_child0.setPositionAuto(Edge.Right);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(25);
  expect(root_child0.getComputedHeight()).toBe(25);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(25);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(25);
  expect(root_child0.getComputedHeight()).toBe(25);

  root.freeRecursive();

  config.free();
});

test("auto_margin", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(25);
  root_child0.setHeight(25);
  root_child0.setMarginAuto(Edge.Left);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(25);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(25);
  expect(root_child0.getComputedHeight()).toBe(25);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(25);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(25);
  expect(root_child0.getComputedHeight()).toBe(25);

  root.freeRecursive();

  config.free();
});
