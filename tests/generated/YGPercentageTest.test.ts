import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Align, Config, Direction, Edge, FlexDirection, Justify, PositionType } from "../../src/index.ts";

test("percentage_width_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(30);
  root_child0.setHeightPercent(30);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(60);
  expect(root_child0.getComputedHeight()).toBe(60);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(140);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(60);
  expect(root_child0.getComputedHeight()).toBe(60);

  root.freeRecursive();

  config.free();
});

test("percentage_position_left_top", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(400);
  root.setHeight(400);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(45);
  root_child0.setHeightPercent(55);
  root_child0.setPositionPercent(Edge.Left, 10);
  root_child0.setPositionPercent(Edge.Top, 20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(400);
  expect(root.getComputedHeight()).toBe(400);

  expect(root_child0.getComputedLeft()).toBe(40);
  expect(root_child0.getComputedTop()).toBe(80);
  expect(root_child0.getComputedWidth()).toBe(180);
  expect(root_child0.getComputedHeight()).toBe(220);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(400);
  expect(root.getComputedHeight()).toBe(400);

  expect(root_child0.getComputedLeft()).toBe(260);
  expect(root_child0.getComputedTop()).toBe(80);
  expect(root_child0.getComputedWidth()).toBe(180);
  expect(root_child0.getComputedHeight()).toBe(220);

  root.freeRecursive();

  config.free();
});

test("percentage_position_bottom_right", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(500);
  root.setHeight(500);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(55);
  root_child0.setHeightPercent(15);
  root_child0.setPositionPercent(Edge.Bottom, 10);
  root_child0.setPositionPercent(Edge.Right, 20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(-100);
  expect(root_child0.getComputedTop()).toBe(-50);
  expect(root_child0.getComputedWidth()).toBe(275);
  expect(root_child0.getComputedHeight()).toBe(75);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(125);
  expect(root_child0.getComputedTop()).toBe(-50);
  expect(root_child0.getComputedWidth()).toBe(275);
  expect(root_child0.getComputedHeight()).toBe(75);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root_child1.setFlexBasisPercent(25);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(125);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(125);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(75);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(75);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(125);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(75);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_cross", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root_child1.setFlexBasisPercent(25);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(125);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(125);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(75);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(125);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(125);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(75);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_main_max_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(10);
  root_child0.setMaxHeightPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(10);
  root_child1.setMaxHeightPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(52);
  expect(root_child0.getComputedHeight()).toBe(120);

  expect(root_child1.getComputedLeft()).toBe(52);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(148);
  expect(root_child1.getComputedHeight()).toBe(40);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(148);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(52);
  expect(root_child0.getComputedHeight()).toBe(120);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(148);
  expect(root_child1.getComputedHeight()).toBe(40);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_cross_max_height", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(10);
  root_child0.setMaxHeightPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(10);
  root_child1.setMaxHeightPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(120);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(120);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(40);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(120);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(120);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(40);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_main_max_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(15);
  root_child0.setMaxWidthPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(10);
  root_child1.setMaxWidthPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(120);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(40);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_cross_max_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(10);
  root_child0.setMaxWidthPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(15);
  root_child1.setMaxWidthPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(160);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(40);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_main_min_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(15);
  root_child0.setMinWidthPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(10);
  root_child1.setMinWidthPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(120);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(80);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(80);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(120);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(80);
  expect(root_child1.getComputedHeight()).toBe(200);

  root.freeRecursive();

  config.free();
});

test("percentage_flex_basis_cross_min_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(10);
  root_child0.setMinWidthPercent(60);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(15);
  root_child1.setMinWidthPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(150);

  root.freeRecursive();

  config.free();
});

test("percentage_multiple_nested_with_padding_margin_and_percentage_values", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasisPercent(10);
  root_child0.setMinWidthPercent(60);
  root_child0.setMargin(Edge.All, 5);
  root_child0.setPadding(Edge.All, 3);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidthPercent(50);
  root_child0_child0.setMargin(Edge.All, 5);
  root_child0_child0.setPaddingPercent(Edge.All, 3);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0.setWidthPercent(45);
  root_child0_child0_child0.setMarginPercent(Edge.All, 5);
  root_child0_child0_child0.setPadding(Edge.All, 3);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(4);
  root_child1.setFlexBasisPercent(15);
  root_child1.setMinWidthPercent(20);
  root.insertChild(root_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(5);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(190);
  expect(root_child0.getComputedHeight()).toBe(48);

  expect(root_child0_child0.getComputedLeft()).toBe(8);
  expect(root_child0_child0.getComputedTop()).toBe(8);
  expect(root_child0_child0.getComputedWidth()).toBe(92);
  expect(root_child0_child0.getComputedHeight()).toBe(25);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(10);
  expect(root_child0_child0_child0.getComputedTop()).toBe(10);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(36);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(6);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(58);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(142);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(5);
  expect(root_child0.getComputedTop()).toBe(5);
  expect(root_child0.getComputedWidth()).toBe(190);
  expect(root_child0.getComputedHeight()).toBe(48);

  expect(root_child0_child0.getComputedLeft()).toBe(90);
  expect(root_child0_child0.getComputedTop()).toBe(8);
  expect(root_child0_child0.getComputedWidth()).toBe(92);
  expect(root_child0_child0.getComputedHeight()).toBe(25);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(46);
  expect(root_child0_child0_child0.getComputedTop()).toBe(10);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(36);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(6);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(58);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(142);

  root.freeRecursive();

  config.free();
});

test("percentage_margin_should_calculate_based_only_on_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setMarginPercent(Edge.All, 10);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedWidth()).toBe(160);
  expect(root_child0.getComputedHeight()).toBe(60);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(20);
  expect(root_child0.getComputedTop()).toBe(20);
  expect(root_child0.getComputedWidth()).toBe(160);
  expect(root_child0.getComputedHeight()).toBe(60);

  expect(root_child0_child0.getComputedLeft()).toBe(150);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("percentage_padding_should_calculate_based_only_on_width", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root_child0.setPaddingPercent(Edge.All, 10);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(10);
  root_child0_child0.setHeight(10);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(20);
  expect(root_child0_child0.getComputedTop()).toBe(20);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(170);
  expect(root_child0_child0.getComputedTop()).toBe(20);
  expect(root_child0_child0.getComputedWidth()).toBe(10);
  expect(root_child0_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("percentage_absolute_position", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setPositionPercent(Edge.Top, 10);
  root_child0.setPositionPercent(Edge.Left, 30);
  root_child0.setWidth(10);
  root_child0.setHeight(10);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(60);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(60);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(10);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("percentage_width_height_undefined_parent_size", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeightPercent(50);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(0);
  expect(root.getComputedHeight()).toBe(0);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(0);
  expect(root.getComputedHeight()).toBe(0);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("percent_within_flex_grow", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(350);
  root.setHeight(100);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(100);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = newFixtureNode(config);
  root_child1_child0.setWidthPercent(100);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child2 = newFixtureNode(config);
  root_child2.setWidth(100);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(350);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(100);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(150);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(150);
  expect(root_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(250);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(350);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(250);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(100);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(150);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(150);
  expect(root_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(100);
  expect(root_child2.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("percentage_container_in_wrapping_container", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setAlignItems(Align.Center);
  root.setWidth(200);
  root.setHeight(200);
  root.setJustifyContent(Justify.Center);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0.setJustifyContent(Justify.Center);
  root_child0_child0.setWidthPercent(100);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0.setWidth(50);
  root_child0_child0_child0.setHeight(50);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);

  const root_child0_child0_child1 = newFixtureNode(config);
  root_child0_child0_child1.setWidth(50);
  root_child0_child0_child1.setHeight(50);
  root_child0_child0.insertChild(root_child0_child0_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(100);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0_child1.getComputedLeft()).toBe(50);
  expect(root_child0_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child0_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(75);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(100);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(50);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child0_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("percent_absolute_position", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(60);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(50);
  root_child0.setWidthPercent(100);
  root_child0.setPositionPercent(Edge.Left, 50);
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidthPercent(100);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = newFixtureNode(config);
  root_child0_child1.setWidthPercent(100);
  root_child0.insertChild(root_child0_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(60);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(60);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(60);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(60);
  expect(root_child0_child1.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(60);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(60);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(-60);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(60);
  expect(root_child0_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("percent_of_minmax_main", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setFlexDirection(FlexDirection.Row);
  root.setMinWidth(60);
  root.setMaxWidth(60);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("percent_of_minmax_cross_stretched", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setMinWidth(60);
  root.setMaxWidth(60);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("percent_absolute_of_minmax_cross_stretched", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setMinWidth(60);
  root.setMaxWidth(60);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeight(20);
  root_child0.setPositionType(PositionType.Absolute);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("percent_of_minmax_cross_unstretched", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setMinWidth(60);
  root.setMaxWidth(60);
  root.setHeight(50);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(60);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(30);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(30);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("percent_of_max_cross_unstretched", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setMaxWidth(60);
  root.setHeight(50);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidthPercent(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(0);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(0);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(0);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});
