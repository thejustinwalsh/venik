// Port of yoga-cpp/tests/YGAspectRatioTest.cpp

import { expect, test } from "vitest";
import {
  Align,
  Config,
  Direction,
  Edge,
  FlexDirection,
  Justify,
  MeasureMode,
  Node,
  PositionType,
  type Size,
} from "../src/index.ts";

function _measure(
  width: number,
  widthMode: MeasureMode,
  height: number,
  heightMode: MeasureMode,
): Size {
  return {
    width: widthMode === MeasureMode.Exactly ? width : 50,
    height: heightMode === MeasureMode.Exactly ? height : 50,
  };
}

test("aspect_ratio_cross_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_main_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_both_dimensions_defined_row", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(100);
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_both_dimensions_defined_column", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(100);
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_align_stretch", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_flex_grow", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_flex_shrink", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(150);
  root_child0.setFlexShrink(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_flex_shrink_2", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeightPercent(100);
  root_child0.setFlexShrink(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setHeightPercent(100);
  root_child1.setFlexShrink(1);
  root_child1.setAspectRatio(1);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_basis", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setFlexBasis(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_absolute_layout_width_defined", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setPosition(Edge.Left, 0);
  root_child0.setPosition(Edge.Top, 0);
  root_child0.setWidth(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_absolute_layout_height_defined", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setPosition(Edge.Left, 0);
  root_child0.setPosition(Edge.Top, 0);
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_with_max_cross_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setMaxWidth(40);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(40);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_with_max_main_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setMaxHeight(40);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(40);
  expect(root_child0.getComputedHeight()).toBe(40);

  root.freeRecursive();
});

test("aspect_ratio_with_min_cross_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(30);
  root_child0.setMinWidth(40);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(40);
  expect(root_child0.getComputedHeight()).toBe(30);

  root.freeRecursive();
});

test("aspect_ratio_with_min_main_defined", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(30);
  root_child0.setMinHeight(40);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(40);
  expect(root_child0.getComputedHeight()).toBe(40);

  root.freeRecursive();
});

test("aspect_ratio_double_cross", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setAspectRatio(2);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_half_cross", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(100);
  root_child0.setAspectRatio(0.5);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_double_main", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setAspectRatio(0.5);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_half_main", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(100);
  root_child0.setAspectRatio(2);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_with_measure_func", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setMeasureFunc(_measure);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_width_height_flex_grow_row", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(200);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_width_height_flex_grow_column", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(200);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_height_as_flex_basis", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setHeight(100);
  root_child1.setFlexGrow(1);
  root_child1.setAspectRatio(1);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(75);
  expect(root_child0.getComputedHeight()).toBe(75);

  expect(root_child1.getComputedLeft()).toBe(75);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(125);
  expect(root_child1.getComputedHeight()).toBe(125);

  root.freeRecursive();
});

test("aspect_ratio_width_as_flex_basis", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(200);
  root.setHeight(200);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(100);
  root_child1.setFlexGrow(1);
  root_child1.setAspectRatio(1);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(75);
  expect(root_child0.getComputedHeight()).toBe(75);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(75);
  expect(root_child1.getComputedWidth()).toBe(125);
  expect(root_child1.getComputedHeight()).toBe(125);

  root.freeRecursive();
});

test("aspect_ratio_overrides_flex_grow_row", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(0.5);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(200);

  root.freeRecursive();
});

test("aspect_ratio_overrides_flex_grow_column", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setFlexGrow(1);
  root_child0.setAspectRatio(2);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_left_right_absolute", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setPosition(Edge.Left, 10);
  root_child0.setPosition(Edge.Top, 10);
  root_child0.setPosition(Edge.Right, 10);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.freeRecursive();
});

test("aspect_ratio_top_bottom_absolute", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setPositionType(PositionType.Absolute);
  root_child0.setPosition(Edge.Left, 10);
  root_child0.setPosition(Edge.Top, 10);
  root_child0.setPosition(Edge.Bottom, 10);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(10);
  expect(root_child0.getComputedTop()).toBe(10);
  expect(root_child0.getComputedWidth()).toBe(80);
  expect(root_child0.getComputedHeight()).toBe(80);

  root.freeRecursive();
});

test("aspect_ratio_width_overrides_align_stretch_row", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_height_overrides_align_stretch_column", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_allow_child_overflow_parent_size", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setAspectRatio(4);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_defined_main_with_margin", () => {
  const root = new Node();
  root.setAlignItems(Align.Center);
  root.setJustifyContent(Justify.Center);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setHeight(50);
  root_child0.setAspectRatio(1);
  root_child0.setMargin(Edge.Left, 10);
  root_child0.setMargin(Edge.Right, 10);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_defined_cross_with_margin", () => {
  const root = new Node();
  root.setAlignItems(Align.Center);
  root.setJustifyContent(Justify.Center);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setAspectRatio(1);
  root_child0.setMargin(Edge.Left, 10);
  root_child0.setMargin(Edge.Right, 10);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_defined_cross_with_main_margin", () => {
  const root = new Node();
  root.setAlignItems(Align.Center);
  root.setJustifyContent(Justify.Center);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setAspectRatio(1);
  root_child0.setMargin(Edge.Top, 10);
  root_child0.setMargin(Edge.Bottom, 10);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});

test("aspect_ratio_should_prefer_explicit_height", () => {
  const config = new Config();
  config.setUseWebDefaults(true);

  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Column);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Column);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setFlexDirection(FlexDirection.Column);
  root_child0_child0.setHeight(100);
  root_child0_child0.setAspectRatio(2);
  root_child0.insertChild(root_child0_child0, 0);

  root.calculateLayout(100, 200, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();
});

test("aspect_ratio_should_prefer_explicit_width", () => {
  const config = new Config();
  config.setUseWebDefaults(true);

  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0.setWidth(100);
  root_child0_child0.setAspectRatio(0.5);
  root_child0.insertChild(root_child0_child0, 0);

  root.calculateLayout(200, 100, Direction.LTR);

  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedWidth()).toBe(100);
  expect(root_child0_child0.getComputedHeight()).toBe(200);

  root.freeRecursive();
});

test("aspect_ratio_should_prefer_flexed_dimension", () => {
  const config = new Config();
  config.setUseWebDefaults(true);

  const root = new Node(config);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Column);
  root_child0.setAspectRatio(2);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setAspectRatio(4);
  root_child0_child0.setFlexGrow(1);
  root_child0.insertChild(root_child0_child0, 0);

  root.calculateLayout(100, 100, Direction.LTR);

  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  root.freeRecursive();
});
