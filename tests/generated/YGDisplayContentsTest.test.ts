// Originally ported from Yoga's tests/generated/YGDisplayContentsTest.cpp
// (upstream fixture: gentest/fixtures/YGDisplayContentsTest.html).

import { expect, test } from "vitest";
import { Config, Direction, Display, FlexDirection, Node, PositionType } from "../../src/index.ts";

test("test1", () => {
  const config = new Config();

  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node(config);
  root_child0.setDisplay(Display.Contents);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setFlexGrow(1);
  root_child0_child0.setFlexShrink(1);
  root_child0_child0.setFlexBasisPercent(0);
  root_child0_child0.setHeight(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = new Node(config);
  root_child0_child1.setFlexGrow(1);
  root_child0_child1.setFlexShrink(1);
  root_child0_child1.setFlexBasisPercent(0);
  root_child0_child1.setHeight(20);
  root_child0.insertChild(root_child0_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(50);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child1.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0.getComputedLeft()).toBe(50);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child1.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});
