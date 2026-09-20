// Originally ported from Yoga's tests/generated/YGBorderTest.cpp
// (upstream fixture: gentest/fixtures/YGBorderTest.html).

import { expect, test } from "vitest";
import { Align, Config, Direction, Edge, Justify, Node, PositionType } from "../../src/index.ts";

test("border_no_size", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setBorder(Edge.All, 10);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(20);
  expect(root.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(20);
  expect(root.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("border_container_match_child", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setBorder(Edge.All, 10);

  const root_child0 = new Node(config);
  root_child0.setWidth(10);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(30);
  expect(root.getComputedHeight()).toBe(30);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(30);
  expect(root.getComputedHeight()).toBe(30);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("border_flex_child", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setBorder(Edge.All, 10);

  const root_child0 = new Node(config);
  root_child0.setWidth(10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.freeRecursive();

  config.free();
});

test("border_stretch_child", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setBorder(Edge.All, 10);

  const root_child0 = new Node(config);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("border_center_child", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setBorder(Edge.Start, 10);
  root.setBorder(Edge.End, 20);
  root.setBorder(Edge.Bottom, 20);
  root.setAlignItems(Align.Center);
  root.setJustifyContent(Justify.Center);

  const root_child0 = new Node(config);
  root_child0.setHeight(10);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(40);
  expect(root_child0.getComputedTop()).toBe(35);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(35);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});
