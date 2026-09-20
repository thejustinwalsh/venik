// Originally ported from Yoga's tests/generated/YGAspectRatioTest.cpp
// (upstream fixture: gentest/fixtures/YGAspectRatioTest.html).

import { expect, test } from "vitest";
import { Config, Direction, Node, PositionType } from "../../src/index.ts";

test("zero_aspect_ratio_behaves_like_auto", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(300);
  root.setHeight(300);

  const root_child0 = new Node(config);
  root_child0.setAspectRatio(0);
  root_child0.setWidth(50);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(300);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(300);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(250);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});
