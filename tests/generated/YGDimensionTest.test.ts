// Originally ported from Yoga's tests/generated/YGDimensionTest.cpp
// (upstream fixture: gentest/fixtures/YGDimensionTest.html).

import { expect, test } from "vitest";
import { Config, Direction, Node, PositionType } from "../../src/index.ts";

test("wrap_child", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);

  const root_child0 = new Node(config);
  root_child0.setWidth(100);
  root_child0.setHeight(100);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("wrap_grandchild", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);

  const root_child0 = new Node(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setWidth(100);
  root_child0_child0.setHeight(100);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(100);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(100);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});
