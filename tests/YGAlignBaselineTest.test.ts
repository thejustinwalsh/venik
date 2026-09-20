import { expect, test } from "vitest";
import { newFixtureNode } from "./util/testUtil.ts";
import { Align, Config, Direction, Edge, FlexDirection, Node, type Size } from "../src/index.ts";

function _baselineFunc(_width: number, height: number): number {
  return height / 2;
}

function _measure1(): Size {
  return { width: 42, height: 50 };
}

function _measure2(): Size {
  return { width: 279, height: 126 };
}

function createYGNode(
  config: Config,
  direction: FlexDirection,
  width: number,
  height: number,
  alignBaseline: boolean,
): Node {
  const node = newFixtureNode(config);
  node.setFlexDirection(direction);
  if (alignBaseline) {
    node.setAlignItems(Align.Baseline);
  }
  node.setWidth(width);
  node.setHeight(height);
  return node;
}

// Test case for bug in T32999822
test("align_baseline_parent_ht_not_specified", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignContent(Align.Stretch);
  root.setAlignItems(Align.Baseline);
  root.setWidth(340);
  root.setMaxHeight(170);
  root.setMinHeight(0);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(0);
  root_child0.setFlexShrink(1);
  root_child0.setMeasureFunc(_measure1);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexGrow(0);
  root_child1.setFlexShrink(1);
  root_child1.setMeasureFunc(_measure2);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(340);
  expect(root.getComputedHeight()).toBe(126);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(42);
  expect(root_child0.getComputedHeight()).toBe(50);
  expect(root_child0.getComputedTop()).toBe(76);

  expect(root_child1.getComputedLeft()).toBe(42);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(279);
  expect(root_child1.getComputedHeight()).toBe(126);

  root.freeRecursive();

  config.free();
});

test("align_baseline_with_no_parent_ht", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(150);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(40);
  root_child1.setBaselineFunc(_baselineFunc);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(150);
  expect(root.getComputedHeight()).toBe(70);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(30);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(40);

  root.freeRecursive();

  config.free();
});

test("align_baseline_with_no_baseline_func_and_no_parent_ht", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(150);

  const root_child0 = newFixtureNode(config);
  root_child0.setWidth(50);
  root_child0.setHeight(80);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setWidth(50);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(150);
  expect(root.getComputedHeight()).toBe(80);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(80);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(30);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_column_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_with_padding_in_column_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1_child1.setPadding(Edge.Left, 100);
  root_child1_child1.setPadding(Edge.Right, 100);
  root_child1_child1.setPadding(Edge.Top, 100);
  root_child1_child1.setPadding(Edge.Bottom, 100);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_with_padding_using_child_in_column_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root_child1.setPadding(Edge.Left, 100);
  root_child1.setPadding(Edge.Right, 100);
  root_child1.setPadding(Edge.Top, 100);
  root_child1.setPadding(Edge.Bottom, 100);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(0);

  expect(root_child1_child0.getComputedLeft()).toBe(100);
  expect(root_child1_child0.getComputedTop()).toBe(100);

  expect(root_child1_child1.getComputedLeft()).toBe(100);
  expect(root_child1_child1.getComputedTop()).toBe(400);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_with_margin_using_child_in_column_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root_child1.setMargin(Edge.Left, 100);
  root_child1.setMargin(Edge.Right, 100);
  root_child1.setMargin(Edge.Top, 100);
  root_child1.setMargin(Edge.Bottom, 100);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(600);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_with_margin_in_column_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1_child1.setMargin(Edge.Left, 100);
  root_child1_child1.setMargin(Edge.Right, 100);
  root_child1_child1.setMargin(Edge.Top, 100);
  root_child1_child1.setMargin(Edge.Bottom, 100);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(0);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(100);
  expect(root_child1_child1.getComputedTop()).toBe(400);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_row_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Row, 500, 800, true);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(500);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_with_padding_in_row_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Row, 500, 800, true);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1_child1.setPadding(Edge.Left, 100);
  root_child1_child1.setPadding(Edge.Right, 100);
  root_child1_child1.setPadding(Edge.Top, 100);
  root_child1_child1.setPadding(Edge.Bottom, 100);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(500);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_with_margin_in_row_as_reference", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Row, 500, 800, true);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1_child1.setMargin(Edge.Left, 100);
  root_child1_child1.setMargin(Edge.Right, 100);
  root_child1_child1.setMargin(Edge.Top, 100);
  root_child1_child1.setMargin(Edge.Bottom, 100);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(600);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_column_as_reference_with_no_baseline_func", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Column, 500, 800, false);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(0);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_row_as_reference_with_no_baseline_func", () => {
  const config = new Config();

  const root = createYGNode(config, FlexDirection.Row, 1000, 1000, true);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = createYGNode(config, FlexDirection.Row, 500, 800, true);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(500);
  expect(root_child1_child1.getComputedTop()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_column_as_reference_with_height_not_specified", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(1000);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexDirection(FlexDirection.Column);
  root_child1.setWidth(500);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedHeight()).toBe(800);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(700);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_row_as_reference_with_height_not_specified", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(1000);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexDirection(FlexDirection.Row);
  root_child1.setWidth(500);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setBaselineFunc(_baselineFunc);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedHeight()).toBe(900);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(400);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(500);
  expect(root_child1_child1.getComputedTop()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_column_as_reference_with_no_baseline_func_and_height_not_specified", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(1000);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexDirection(FlexDirection.Column);
  root_child1.setWidth(500);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 300, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedHeight()).toBe(700);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedHeight()).toBe(700);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(0);
  expect(root_child1_child1.getComputedTop()).toBe(300);

  root.freeRecursive();

  config.free();
});

test("align_baseline_parent_using_child_in_row_as_reference_with_no_baseline_func_and_height_not_specified", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(1000);

  const root_child0 = createYGNode(config, FlexDirection.Column, 500, 600, false);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root_child1.setFlexDirection(FlexDirection.Row);
  root_child1.setWidth(500);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = createYGNode(config, FlexDirection.Column, 500, 500, false);
  root_child1.insertChild(root_child1_child0, 0);

  const root_child1_child1 = createYGNode(config, FlexDirection.Column, 500, 400, false);
  root_child1_child1.setIsReferenceBaseline(true);
  root_child1.insertChild(root_child1_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedHeight()).toBe(700);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);

  expect(root_child1.getComputedLeft()).toBe(500);
  expect(root_child1.getComputedTop()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);

  expect(root_child1_child1.getComputedLeft()).toBe(500);
  expect(root_child1_child1.getComputedTop()).toBe(0);

  root.freeRecursive();

  config.free();
});
