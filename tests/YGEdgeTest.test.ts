// Port of yoga-cpp/tests/YGEdgeTest.cpp

import { expect, test } from "vitest";
import { Direction, Edge, FlexDirection, Node } from "../src/index.ts";

test("start_overrides", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Start, 10);
  root_child0.setMargin(Edge.Left, 20);
  root_child0.setMargin(Edge.Right, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedRight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);
  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedRight()).toBe(10);

  root.freeRecursive();
});

test("end_overrides", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.End, 10);
  root_child0.setMargin(Edge.Left, 20);
  root_child0.setMargin(Edge.Right, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedRight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);
  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedRight()).toBe(20);

  root.freeRecursive();
});

test("horizontal_overridden", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Horizontal, 10);
  root_child0.setMargin(Edge.Left, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedRight()).toBe(10);

  root.freeRecursive();
});

test("vertical_overridden", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Vertical, 10);
  root_child0.setMargin(Edge.Top, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedBottom()).toBe(10);

  root.freeRecursive();
});

test("horizontal_overrides_all", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Horizontal, 10);
  root_child0.setMargin(Edge.All, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedRight()).toBe(10);
  expect(root_child0.getComputedBottom()).toBe(20);

  root.freeRecursive();
});

test("vertical_overrides_all", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Vertical, 10);
  root_child0.setMargin(Edge.All, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedRight()).toBe(20);
  expect(root_child0.getComputedBottom()).toBe(10);

  root.freeRecursive();
});

test("all_overridden", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexGrow(1);
  root_child0.setMargin(Edge.Left, 10);
  root_child0.setMargin(Edge.Top, 10);
  root_child0.setMargin(Edge.Right, 10);
  root_child0.setMargin(Edge.Bottom, 10);
  root_child0.setMargin(Edge.All, 20);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedRight()).toBe(10);
  expect(root_child0.getComputedBottom()).toBe(10);

  root.freeRecursive();
});
