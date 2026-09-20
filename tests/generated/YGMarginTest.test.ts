import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Align, Config, Direction, Edge, FlexDirection, Justify, PositionType } from "../../src/index.ts";

test("margin_start", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root_child0.setMargin(Edge.Start, 10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(10);
  root_child0.setMargin(Edge.Top, 10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("margin_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);
  root.setJustifyContent(Justify.FlexEnd);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(10);
  root_child0.setMargin(Edge.End, 10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setJustifyContent(Justify.FlexEnd);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(10);
  root_child0.setMargin(Edge.Bottom, 10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(80);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(80);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("margin_and_flex_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.Start, 10);
  root_child0.setMargin(Edge.End, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_and_flex_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.Top, 10);
  root_child0.setMargin(Edge.Bottom, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.freeRecursive();

  config.free();
});

test("margin_and_stretch_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.Top, 10);
  root_child0.setMargin(Edge.Bottom, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.freeRecursive();

  config.free();
});

test("margin_and_stretch_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.Start, 10);
  root_child0.setMargin(Edge.End, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_with_sibling_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.End, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(45);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(55);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(45);
  expect(root_child1.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(55);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(45);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(45);
  expect(root_child1.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_with_sibling_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setMargin(Edge.Bottom, 10);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(45);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(55);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(45);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(45);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(55);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(45);

  root.freeRecursive();

  config.free();
});

test("margin_auto_bottom", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Bottom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Top);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(100);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_bottom_and_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Top);
  root_child0.setMarginAuto(Edge.Bottom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_bottom_and_top_justify_center", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Top);
  root_child0.setMarginAuto(Edge.Bottom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_multiple_children_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Top);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root_child1.setMarginAuto(Edge.Top);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(50);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(25);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(75);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(25);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(75);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_multiple_children_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root_child1.setMarginAuto(Edge.Right);
  root.insertChild(root_child1, 1);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(50);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(150);
  expect(root_child2.getComputedTop()).toBe(75);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(125);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(75);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_and_right_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_and_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_start_and_end_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Start);
  root_child0.setMarginAuto(Edge.End);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_start_and_end", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Start);
  root_child0.setMarginAuto(Edge.End);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_and_right_column_and_center", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Left);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_and_right_stretch", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_top_and_bottom_stretch", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setMarginAuto(Edge.Top);
  root_child0.setMarginAuto(Edge.Bottom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(50);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(150);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_should_not_be_part_of_max_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(250);
  root.setHeight(250);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(100);
  root_child0.setHeight(100);
  root_child0.setMaxHeight(100);
  root_child0.setMargin(Edge.Top, 20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(250);
  expect(root.getComputedHeight()).toBe(250);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(250);
  expect(root.getComputedHeight()).toBe(250);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_should_not_be_part_of_max_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(250);
  root.setHeight(250);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(100);
  root_child0.setHeight(100);
  root_child0.setMaxWidth(100);
  root_child0.setMargin(Edge.Left, 20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(250);
  expect(root.getComputedHeight()).toBe(250);

  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(250);
  expect(root.getComputedHeight()).toBe(250);

  expect(root_child0.getComputedLeft()).toBe(150);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_right_child_bigger_than_parent", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(52);
  root.setWidth(52);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(72);
  root_child0.setHeight(72);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(-20);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_child_bigger_than_parent", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(52);
  root.setWidth(52);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(72);
  root_child0.setHeight(72);
  root_child0.setMarginAuto(Edge.Left);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(-20);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.freeRecursive();

  config.free();
});

test("margin_fix_left_auto_right_child_bigger_than_parent", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(52);
  root.setWidth(52);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(72);
  root_child0.setHeight(72);
  root_child0.setMargin(Edge.Left, 10);
  root_child0.setMarginAuto(Edge.Right);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(-20);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_fix_right_child_bigger_than_parent", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(52);
  root.setWidth(52);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(72);
  root_child0.setHeight(72);
  root_child0.setMarginAuto(Edge.Left);
  root_child0.setMargin(Edge.Right, 10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(52);
  expect(root.getComputedHeight()).toBe(52);

  expect(root_child0.getComputedLeft()).toBe(-30);
  expect(root_child0.getComputedTop()).toBe(-10);
  expect(root_child0.getComputedWidth()).toBe(72);
  expect(root_child0.getComputedHeight()).toBe(72);

  root.freeRecursive();

  config.free();
});

test("margin_auto_top_stretching_child", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexShrink(1);
  root_child0.setFlexBasisPercent(0);
  root_child0.setMarginAuto(Edge.Top);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(100);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_left_stretching_child", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexShrink(1);
  root_child0.setFlexBasisPercent(0);
  root_child0.setMarginAuto(Edge.Left);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(200);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(200);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("margin_auto_overflowing_container", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setAlignItems(Align.Center);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(150);
  root_child0.setMarginAuto(Edge.Bottom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(150);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(150);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(150);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.freeRecursive();

  config.free();
});
