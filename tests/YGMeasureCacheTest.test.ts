// Port of yoga-cpp/tests/YGMeasureCacheTest.cpp

import { expect, test } from "vitest";
import {
  Align,
  Direction,
  Edge,
  FlexDirection,
  type MeasureFunction,
  MeasureMode,
  Node,
} from "../src/index.ts";

type Counter = { count: number };

const _measureMax: MeasureFunction = (width, widthMode, height, heightMode, node) => {
  const measureCount = node.getContext() as Counter;
  measureCount.count++;

  return {
    width: widthMode === MeasureMode.Undefined ? 10 : width,
    height: heightMode === MeasureMode.Undefined ? 10 : height,
  };
};

const _measureMin: MeasureFunction = (width, widthMode, height, heightMode, node) => {
  const measureCount = node.getContext() as Counter;
  measureCount.count = measureCount.count + 1;
  return {
    width:
      widthMode === MeasureMode.Undefined || (widthMode === MeasureMode.AtMost && width > 10)
        ? 10
        : width,
    height:
      heightMode === MeasureMode.Undefined || (heightMode === MeasureMode.AtMost && height > 10)
        ? 10
        : height,
  };
};

const _measure_84_49: MeasureFunction = (_width, _widthMode, _height, _heightMode, node) => {
  const measureCount = node.getContext() as Counter | null;
  if (measureCount != null) {
    measureCount.count++;
  }

  return { width: 84, height: 49 };
};

test("measure_once_single_flexible_child", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  const measureCount: Counter = { count: 0 };
  root_child0.setContext(measureCount);
  root_child0.setMeasureFunc(_measureMax);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // One measure for the layout, plus one min-content probe for the flexible
  // item's CSS Flexbox §4.5 automatic minimum size.
  expect(measureCount.count).toBe(2);

  root.freeRecursive();
});

test("remeasure_with_same_exact_width_larger_than_needed_height", () => {
  const root = new Node();

  const root_child0 = new Node();
  const measureCount: Counter = { count: 0 };
  root_child0.setContext(measureCount);
  root_child0.setMeasureFunc(_measureMin);
  root.insertChild(root_child0, 0);

  root.calculateLayout(100, 100, Direction.LTR);
  root.calculateLayout(100, 50, Direction.LTR);

  expect(measureCount.count).toBe(1);

  root.freeRecursive();
});

test("remeasure_with_same_atmost_width_larger_than_needed_height", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node();
  const measureCount: Counter = { count: 0 };
  root_child0.setContext(measureCount);
  root_child0.setMeasureFunc(_measureMin);
  root.insertChild(root_child0, 0);

  root.calculateLayout(100, 100, Direction.LTR);
  root.calculateLayout(100, 50, Direction.LTR);

  expect(measureCount.count).toBe(1);

  root.freeRecursive();
});

test("remeasure_with_computed_width_larger_than_needed_height", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node();
  const measureCount: Counter = { count: 0 };
  root_child0.setContext(measureCount);
  root_child0.setMeasureFunc(_measureMin);
  root.insertChild(root_child0, 0);

  root.calculateLayout(100, 100, Direction.LTR);
  root.setAlignItems(Align.Stretch);
  root.calculateLayout(10, 50, Direction.LTR);

  expect(measureCount.count).toBe(1);

  root.freeRecursive();
});

test("remeasure_with_atmost_computed_width_undefined_height", () => {
  const root = new Node();
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node();
  const measureCount: Counter = { count: 0 };
  root_child0.setContext(measureCount);
  root_child0.setMeasureFunc(_measureMin);
  root.insertChild(root_child0, 0);

  root.calculateLayout(100, undefined, Direction.LTR);
  root.calculateLayout(10, undefined, Direction.LTR);

  expect(measureCount.count).toBe(1);

  root.freeRecursive();
});

test("remeasure_with_already_measured_value_smaller_but_still_float_equal", () => {
  // In C++ 288 - 2 * 2.88f is inexact in float32, so the available size differs from the measured
  // one by an epsilon; the cache must still treat them as equal.
  const measureCount: Counter = { count: 0 };

  const root = new Node();
  root.setWidth(288);
  root.setHeight(288);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = new Node();
  root_child0.setPadding(Edge.All, 2.88);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node();
  root_child0_child0.setContext(measureCount);
  root_child0_child0.setMeasureFunc(_measure_84_49);
  root_child0.insertChild(root_child0_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  root.freeRecursive();

  expect(measureCount.count).toBe(1);
});
