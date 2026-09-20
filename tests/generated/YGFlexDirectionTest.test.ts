import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Config, Direction, Edge, FlexDirection, PositionType } from "../../src/index.ts";

test("flex_direction_column_no_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setHeight(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setHeight(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(30);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(10);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(20);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(30);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(10);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(20);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_no_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(30);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(30);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setHeight(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setHeight(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(10);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(20);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(10);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(20);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setHeight(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setHeight(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(90);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(80);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(70);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(90);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(80);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(10);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(70);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_margin_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setMargin(Edge.Left, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(100);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(100);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_margin_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setMargin(Edge.Start, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(100);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_margin_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setMargin(Edge.Right, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_margin_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setMargin(Edge.End, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(100);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_margin_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setMargin(Edge.Top, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(100);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(100);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_margin_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setMargin(Edge.Bottom, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_padding_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setPadding(Edge.Left, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(110);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(120);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_padding_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setPadding(Edge.Start, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_padding_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setPadding(Edge.Right, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(-20);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(-30);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_padding_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setPadding(Edge.End, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(-20);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(-30);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(110);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(120);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_padding_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setPadding(Edge.Top, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_padding_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setPadding(Edge.Bottom, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_border_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setBorder(Edge.Left, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(110);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(120);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_border_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setBorder(Edge.Start, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(80);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(70);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_border_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setBorder(Edge.Right, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(-20);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(-30);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(10);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(20);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_border_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.RowReverse);
  root.setBorder(Edge.End, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(-20);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(-30);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(110);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(120);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_border_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setBorder(Edge.Top, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(100);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_border_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);
  root.setFlexDirection(FlexDirection.ColumnReverse);
  root.setBorder(Edge.Bottom, 100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(10);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(10);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(90);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(90);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(10);
  expect(root_child1.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(90);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(10);
  expect(root_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_pos_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root_child0.setPosition(Edge.Left, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(80);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(70);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(10);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(20);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_pos_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root_child0.setPosition(Edge.Start, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(80);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(70);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(10);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(20);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_pos_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root_child0.setPosition(Edge.Right, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(80);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(70);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(10);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(20);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_pos_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root_child0.setPosition(Edge.End, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(-100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(80);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(70);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child1.getComputedLeft()).toBe(10);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(20);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_pos_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root_child0.setPosition(Edge.Top, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(100);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(100);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_column_reverse_pos_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root_child0.setPosition(Edge.Bottom, 100);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(-100);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(100);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(-100);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(100);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_pos_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPosition(Edge.Left, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(10);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(10);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_pos_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPosition(Edge.Right, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(80);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(80);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_pos_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPosition(Edge.Top, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(10);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(10);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_pos_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPosition(Edge.Bottom, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(80);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(80);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_margin_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.Left, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(10);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_margin_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.Right, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(80);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_margin_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.Top, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_margin_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.Bottom, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(80);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(80);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_marign_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.Start, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_margin_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setMargin(Edge.End, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(80);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(10);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_border_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.Left, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_border_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.Right, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_border_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.Top, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_border_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.Bottom, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_border_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.Start, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_border_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setBorder(Edge.End, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_padding_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.Left, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_padding_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.Right, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_padding_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.Top, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_col_reverse_inner_padding_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.ColumnReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.Bottom, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
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
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(90);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(100);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child2.getComputedLeft()).toBe(90);
  expect(root_child0_child2.getComputedTop()).toBe(100);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_padding_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.Start, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_row_reverse_inner_padding_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root_child0.setWidth(100);
  root_child0.setFlexDirection(FlexDirection.RowReverse);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0_child0.setPositionType(PositionType.Absolute);
  root_child0_child0.setPadding(Edge.End, 10);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidth(10);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = newFixtureNode(config);
  root_child0_child2.setWidth(10);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(90);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(80);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

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
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(10);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(10);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(10);
  expect(root_child0_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("flex_direction_alternating_with_percent", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(300);
  root.setWidth(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeightPercent(50);
  root_child0.setWidthPercent(50);
  root_child0.setPositionPercent(Edge.Left, 10);
  root_child0.setPositionPercent(Edge.Top, 10);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(30);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(150);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(120);
  expect(root_child0.getComputedTop()).toBe(30);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(150);

  root.freeRecursive();

  config.free();
});
