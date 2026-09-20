// Port of yoga-cpp/tests/FlexGapTest.cpp

import { expect, test } from "vitest";
import { Config, Direction, FlexDirection, Gutter, Node } from "../src/index.ts";

// TODO: move this to a fixture based test once it supports parsing negative
// values
test("gap_negative_value", () => {
  const config = new Config();

  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setGap(Gutter.All, -20);
  root.setHeight(200);

  const root_child0 = new Node(config);
  root_child0.setWidth(20);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setWidth(20);
  root.insertChild(root_child1, 1);

  const root_child2 = new Node(config);
  root_child2.setWidth(20);
  root.insertChild(root_child2, 2);

  const root_child3 = new Node(config);
  root_child3.setWidth(20);
  root.insertChild(root_child3, 3);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(80);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(20);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(20);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(20);
  expect(root_child1.getComputedHeight()).toBe(200);

  expect(root_child2.getComputedLeft()).toBe(40);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(20);
  expect(root_child2.getComputedHeight()).toBe(200);

  expect(root_child3.getComputedLeft()).toBe(60);
  expect(root_child3.getComputedTop()).toBe(0);
  expect(root_child3.getComputedWidth()).toBe(20);
  expect(root_child3.getComputedHeight()).toBe(200);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(80);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(60);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(20);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(40);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(20);
  expect(root_child1.getComputedHeight()).toBe(200);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(20);
  expect(root_child2.getComputedHeight()).toBe(200);

  expect(root_child3.getComputedLeft()).toBe(0);
  expect(root_child3.getComputedTop()).toBe(0);
  expect(root_child3.getComputedWidth()).toBe(20);
  expect(root_child3.getComputedHeight()).toBe(200);

  root.freeRecursive();

  config.free();
});
