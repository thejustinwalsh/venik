// Port of yoga-cpp/tests/YGMeasureTest.cpp

import { describe, expect, test } from "vitest";
import {
  Align,
  BoxSizing,
  Config,
  Direction,
  Edge,
  FlexDirection,
  Justify,
  type MeasureFunction,
  MeasureMode,
  Node,
  PositionType,
} from "../src/index.ts";

type Counter = { count: number };

const _measure: MeasureFunction = (_width, _widthMode, _height, _heightMode, node) => {
  const measureCount = node.getContext() as Counter | null;
  if (measureCount != null) {
    measureCount.count++;
  }

  return { width: 10, height: 10 };
};

const _simulate_wrapping_text: MeasureFunction = (width, widthMode) => {
  if (widthMode === MeasureMode.Undefined || width >= 68) {
    return { width: 68, height: 16 };
  }

  return { width: 50, height: 32 };
};

const _measure_assert_negative: MeasureFunction = (width, _widthMode, height) => {
  expect(width).toBeGreaterThanOrEqual(0);
  expect(height).toBeGreaterThanOrEqual(0);

  return { width: 0, height: 0 };
};

describe("YogaTest", () => {
  test("dont_measure_single_grow_shrink_child", () => {
    const root = new Node();
    root.setWidth(100);
    root.setHeight(100);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);
    root_child0.setFlexGrow(1);
    root_child0.setFlexShrink(1);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    // The layout itself still skips measuring, but CSS Flexbox §4.5 automatic
    // minimum sizing probes the flexible item's min-content size once.
    expect(measureCount.count).toBe(1);

    root.freeRecursive();
  });

  test("measure_absolute_child_with_no_constraints", () => {
    const root = new Node();

    const root_child0 = new Node();
    root.insertChild(root_child0, 0);

    const measureCount: Counter = { count: 0 };

    const root_child0_child0 = new Node();
    root_child0_child0.setPositionType(PositionType.Absolute);
    root_child0_child0.setContext(measureCount);
    root_child0_child0.setMeasureFunc(_measure);
    root_child0.insertChild(root_child0_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(1);

    root.freeRecursive();
  });

  test("dont_measure_when_min_equals_max", () => {
    const root = new Node();
    root.setAlignItems(Align.FlexStart);
    root.setWidth(100);
    root.setHeight(100);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);
    root_child0.setMinWidth(10);
    root_child0.setMaxWidth(10);
    root_child0.setMinHeight(10);
    root_child0.setMaxHeight(10);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(0);
    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    root.freeRecursive();
  });

  test("dont_measure_when_min_equals_max_percentages", () => {
    const root = new Node();
    root.setAlignItems(Align.FlexStart);
    root.setWidth(100);
    root.setHeight(100);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);
    root_child0.setMinWidthPercent(10);
    root_child0.setMaxWidthPercent(10);
    root_child0.setMinHeightPercent(10);
    root_child0.setMaxHeightPercent(10);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(0);
    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    root.freeRecursive();
  });

  test("measure_nodes_with_margin_auto_and_stretch", () => {
    const root = new Node();
    root.setWidth(500);
    root.setHeight(500);

    const root_child0 = new Node();
    root_child0.setMeasureFunc(_measure);
    root_child0.setMarginAuto(Edge.Left);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root_child0.getComputedLeft()).toBe(490);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    root.freeRecursive();
  });

  test("dont_measure_when_min_equals_max_mixed_width_percent", () => {
    const root = new Node();
    root.setAlignItems(Align.FlexStart);
    root.setWidth(100);
    root.setHeight(100);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);
    root_child0.setMinWidthPercent(10);
    root_child0.setMaxWidthPercent(10);
    root_child0.setMinHeight(10);
    root_child0.setMaxHeight(10);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(0);
    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    root.freeRecursive();
  });

  test("dont_measure_when_min_equals_max_mixed_height_percent", () => {
    const root = new Node();
    root.setAlignItems(Align.FlexStart);
    root.setWidth(100);
    root.setHeight(100);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);
    root_child0.setMinWidth(10);
    root_child0.setMaxWidth(10);
    root_child0.setMinHeightPercent(10);
    root_child0.setMaxHeightPercent(10);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(0);
    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    root.freeRecursive();
  });

  test("measure_enough_size_should_be_in_single_line", () => {
    const root = new Node();
    root.setWidth(100);

    const root_child0 = new Node();
    root_child0.setAlignSelf(Align.FlexStart);
    root_child0.setMeasureFunc(_simulate_wrapping_text);

    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root_child0.getComputedWidth()).toBe(68);
    expect(root_child0.getComputedHeight()).toBe(16);

    root.freeRecursive();
  });

  test("measure_not_enough_size_should_wrap", () => {
    const root = new Node();
    root.setWidth(55);

    const root_child0 = new Node();
    root_child0.setAlignSelf(Align.FlexStart);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root_child0.getComputedWidth()).toBe(50);
    expect(root_child0.getComputedHeight()).toBe(32);

    root.freeRecursive();
  });

  test("measure_zero_space_should_grow", () => {
    const root = new Node();
    root.setHeight(200);
    root.setFlexDirection(FlexDirection.Column);
    root.setFlexGrow(0);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setFlexDirection(FlexDirection.Column);
    root_child0.setPadding(Edge.All, 100);
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure);

    root.insertChild(root_child0, 0);

    root.calculateLayout(282, undefined, Direction.LTR);

    expect(root_child0.getComputedWidth()).toBe(282);
    expect(root_child0.getComputedTop()).toBe(0);

    root.freeRecursive();
  });

  test("measure_flex_direction_row_and_padding", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setPadding(Edge.Left, 25);
    root.setPadding(Edge.Top, 25);
    root.setPadding(Edge.Right, 25);
    root.setPadding(Edge.Bottom, 25);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(25);
    expect(root_child0.getComputedTop()).toBe(25);
    expect(root_child0.getComputedWidth()).toBe(50);
    expect(root_child0.getComputedHeight()).toBe(0);

    expect(root_child1.getComputedLeft()).toBe(75);
    expect(root_child1.getComputedTop()).toBe(25);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_flex_direction_column_and_padding", () => {
    const config = new Config();

    const root = new Node(config);
    root.setMargin(Edge.Top, 20);
    root.setPadding(Edge.All, 25);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(25);
    expect(root_child0.getComputedTop()).toBe(25);
    expect(root_child0.getComputedWidth()).toBe(0);
    expect(root_child0.getComputedHeight()).toBe(32);

    expect(root_child1.getComputedLeft()).toBe(25);
    expect(root_child1.getComputedTop()).toBe(57);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_flex_direction_row_no_padding", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setMargin(Edge.Top, 20);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(50);
    expect(root_child0.getComputedHeight()).toBe(50);

    expect(root_child1.getComputedLeft()).toBe(50);
    expect(root_child1.getComputedTop()).toBe(0);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_flex_direction_row_no_padding_align_items_flexstart", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setMargin(Edge.Top, 20);
    root.setWidth(50);
    root.setHeight(50);
    root.setAlignItems(Align.FlexStart);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(50);
    expect(root_child0.getComputedHeight()).toBe(32);

    expect(root_child1.getComputedLeft()).toBe(50);
    expect(root_child1.getComputedTop()).toBe(0);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_with_fixed_size", () => {
    const config = new Config();

    const root = new Node(config);
    root.setMargin(Edge.Top, 20);
    root.setPadding(Edge.All, 25);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root_child0.setWidth(10);
    root_child0.setHeight(10);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(25);
    expect(root_child0.getComputedTop()).toBe(25);
    expect(root_child0.getComputedWidth()).toBe(10);
    expect(root_child0.getComputedHeight()).toBe(10);

    expect(root_child1.getComputedLeft()).toBe(25);
    expect(root_child1.getComputedTop()).toBe(35);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_with_flex_shrink", () => {
    const config = new Config();

    const root = new Node(config);
    root.setMargin(Edge.Top, 20);
    root.setPadding(Edge.All, 25);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root_child0.setFlexShrink(1);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(25);
    expect(root_child0.getComputedTop()).toBe(25);
    expect(root_child0.getComputedWidth()).toBe(0);
    // `min-height: auto` keeps the text from shrinking below its content.
    expect(root_child0.getComputedHeight()).toBe(16);

    expect(root_child1.getComputedLeft()).toBe(25);
    expect(root_child1.getComputedTop()).toBe(41);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });

  test("measure_no_padding", () => {
    const config = new Config();

    const root = new Node(config);
    root.setMargin(Edge.Top, 20);
    root.setWidth(50);
    root.setHeight(50);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_simulate_wrapping_text);
    root_child0.setFlexShrink(1);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(5);
    root_child1.setHeight(5);
    root.insertChild(root_child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(20);
    expect(root.getComputedWidth()).toBe(50);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(50);
    expect(root_child0.getComputedHeight()).toBe(32);

    expect(root_child1.getComputedLeft()).toBe(0);
    expect(root_child1.getComputedTop()).toBe(32);
    expect(root_child1.getComputedWidth()).toBe(5);
    expect(root_child1.getComputedHeight()).toBe(5);

    root.freeRecursive();

    config.free();
  });
});

describe("YogaDeathTest", () => {
  test("cannot_add_child_to_node_with_measure_func", () => {
    const root = new Node();
    root.setMeasureFunc(_measure);

    const root_child0 = new Node();
    expect(() => root.insertChild(root_child0, 0)).toThrow();
    root_child0.free();
    root.freeRecursive();
  });

  test("cannot_add_nonnull_measure_func_to_non_leaf_node", () => {
    const root = new Node();
    const root_child0 = new Node();
    root.insertChild(root_child0, 0);
    expect(() => root.setMeasureFunc(_measure)).toThrow();
    root.freeRecursive();
  });
});

describe("YogaTest", () => {
  test("can_nullify_measure_func_on_any_node", () => {
    const root = new Node();
    root.insertChild(new Node(), 0);
    root.setMeasureFunc(null);
    expect(root.hasMeasureFunc()).toBe(false);
    root.freeRecursive();
  });

  test("cant_call_negative_measure", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Column);
    root.setWidth(50);
    root.setHeight(10);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_measure_assert_negative);
    root_child0.setMargin(Edge.Top, 20);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    root.freeRecursive();
    config.free();
  });

  test("cant_call_negative_measure_horizontal", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setWidth(10);
    root.setHeight(20);

    const root_child0 = new Node(config);
    root_child0.setMeasureFunc(_measure_assert_negative);
    root_child0.setMargin(Edge.Start, 20);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    root.freeRecursive();
    config.free();
  });

  const _measure_90_10: MeasureFunction = () => {
    return { width: 90, height: 10 };
  };

  const _measure_100_100: MeasureFunction = () => {
    return { width: 100, height: 100 };
  };

  test("percent_with_text_node", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setJustifyContent(Justify.SpaceBetween);
    root.setAlignItems(Align.Center);
    root.setWidth(100);
    root.setHeight(80);

    const root_child0 = new Node(config);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setMeasureFunc(_measure_90_10);
    root_child1.setMaxWidthPercent(50);
    root_child1.setPaddingPercent(Edge.Top, 50);
    root.insertChild(root_child1, 1);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(100);
    expect(root.getComputedHeight()).toBe(80);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(40);
    expect(root_child0.getComputedWidth()).toBe(0);
    expect(root_child0.getComputedHeight()).toBe(0);

    expect(root_child1.getComputedLeft()).toBe(50);
    expect(root_child1.getComputedTop()).toBe(10);
    expect(root_child1.getComputedWidth()).toBe(50);
    expect(root_child1.getComputedHeight()).toBe(60);

    root.freeRecursive();

    config.free();
  });

  test("percent_margin_with_measure_func", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setWidth(500);
    root.setHeight(500);

    const root_child0 = new Node(config);
    root_child0.setWidth(100);
    root_child0.setHeight(100);
    root_child0.setMargin(Edge.Top, 0);
    root_child0.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(100);
    root_child1.setHeight(100);
    root_child1.setMargin(Edge.Top, 100);
    root_child1.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child1, 1);

    const root_child2 = new Node(config);
    root_child2.setWidth(100);
    root_child2.setHeight(100);
    root_child2.setMarginPercent(Edge.Top, 10);
    root_child2.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child2, 2);

    const root_child3 = new Node(config);
    root_child3.setWidth(100);
    root_child3.setHeight(100);
    root_child3.setMarginPercent(Edge.Top, 20);
    root_child3.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child3, 3);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(500);
    expect(root.getComputedHeight()).toBe(500);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(100);
    expect(root_child0.getComputedHeight()).toBe(100);

    expect(root_child1.getComputedLeft()).toBe(100);
    expect(root_child1.getComputedTop()).toBe(100);
    expect(root_child1.getComputedWidth()).toBe(100);
    expect(root_child1.getComputedHeight()).toBe(100);

    expect(root_child2.getComputedLeft()).toBe(200);
    expect(root_child2.getComputedTop()).toBe(50);
    expect(root_child2.getComputedWidth()).toBe(100);
    expect(root_child2.getComputedHeight()).toBe(100);

    expect(root_child3.getComputedLeft()).toBe(300);
    expect(root_child3.getComputedTop()).toBe(100);
    expect(root_child3.getComputedWidth()).toBe(100);
    expect(root_child3.getComputedHeight()).toBe(100);

    root.freeRecursive();

    config.free();
  });

  test("percent_padding_with_measure_func", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setAlignItems(Align.FlexStart);
    root.setAlignContent(Align.FlexStart);
    root.setWidth(500);
    root.setHeight(500);

    const root_child0 = new Node(config);
    root_child0.setWidth(100);
    root_child0.setHeight(100);
    root_child0.setPadding(Edge.Top, 0);
    root_child0.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(100);
    root_child1.setHeight(100);
    root_child1.setPadding(Edge.Top, 100);
    root_child1.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child1, 1);

    const root_child2 = new Node(config);
    root_child2.setPaddingPercent(Edge.Top, 10);
    root_child2.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child2, 2);

    const root_child3 = new Node(config);
    root_child3.setPaddingPercent(Edge.Top, 20);
    root_child3.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child3, 3);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(500);
    expect(root.getComputedHeight()).toBe(500);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(100);
    expect(root_child0.getComputedHeight()).toBe(100);

    expect(root_child1.getComputedLeft()).toBe(100);
    expect(root_child1.getComputedTop()).toBe(0);
    expect(root_child1.getComputedWidth()).toBe(100);
    expect(root_child1.getComputedHeight()).toBe(100);

    expect(root_child2.getComputedLeft()).toBe(200);
    expect(root_child2.getComputedTop()).toBe(0);
    expect(root_child2.getComputedWidth()).toBe(100);
    expect(root_child2.getComputedHeight()).toBe(150);

    expect(root_child3.getComputedLeft()).toBe(300);
    expect(root_child3.getComputedTop()).toBe(0);
    expect(root_child3.getComputedWidth()).toBe(100);
    expect(root_child3.getComputedHeight()).toBe(200);

    root.freeRecursive();

    config.free();
  });

  test("percent_padding_and_percent_margin_with_measure_func", () => {
    const config = new Config();

    const root = new Node(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setAlignItems(Align.FlexStart);
    root.setAlignContent(Align.FlexStart);
    root.setWidth(500);
    root.setHeight(500);

    const root_child0 = new Node(config);
    root_child0.setWidth(100);
    root_child0.setHeight(100);
    root_child0.setPadding(Edge.Top, 0);
    root_child0.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child0, 0);

    const root_child1 = new Node(config);
    root_child1.setWidth(100);
    root_child1.setHeight(100);
    root_child1.setPadding(Edge.Top, 100);
    root_child1.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child1, 1);

    const root_child2 = new Node(config);
    root_child2.setPaddingPercent(Edge.Top, 10);
    root_child2.setMarginPercent(Edge.Top, 10);
    root_child2.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child2, 2);

    const root_child3 = new Node(config);
    root_child3.setPaddingPercent(Edge.Top, 20);
    root_child3.setMarginPercent(Edge.Top, 20);
    root_child3.setMeasureFunc(_measure_100_100);
    root.insertChild(root_child3, 3);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(500);
    expect(root.getComputedHeight()).toBe(500);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(100);
    expect(root_child0.getComputedHeight()).toBe(100);

    expect(root_child1.getComputedLeft()).toBe(100);
    expect(root_child1.getComputedTop()).toBe(0);
    expect(root_child1.getComputedWidth()).toBe(100);
    expect(root_child1.getComputedHeight()).toBe(100);

    expect(root_child2.getComputedLeft()).toBe(200);
    expect(root_child2.getComputedTop()).toBe(50);
    expect(root_child2.getComputedWidth()).toBe(100);
    expect(root_child2.getComputedHeight()).toBe(150);

    expect(root_child3.getComputedLeft()).toBe(300);
    expect(root_child3.getComputedTop()).toBe(100);
    expect(root_child3.getComputedWidth()).toBe(100);
    expect(root_child3.getComputedHeight()).toBe(200);

    root.freeRecursive();

    config.free();
  });

  const _measure_half_width_height: MeasureFunction = (
    width,
    _widthMode,
    height,
    _heightMode,
    node,
  ) => {
    const measureCount = node.getContext() as Counter | null;
    if (measureCount != null) {
      measureCount.count++;
    }

    return { width: 0.5 * width, height: 0.5 * height };
  };

  test("measure_content_box", () => {
    const root = new Node();
    root.setWidth(100);
    root.setHeight(200);
    root.setBoxSizing(BoxSizing.ContentBox);
    root.setPadding(Edge.All, 5);
    root.setBorder(Edge.All, 10);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure_half_width_height);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(1);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(130);
    expect(root.getComputedHeight()).toBe(230);

    expect(root_child0.getComputedLeft()).toBe(15);
    expect(root_child0.getComputedTop()).toBe(15);
    expect(root_child0.getComputedWidth()).toBe(100);
    expect(root_child0.getComputedHeight()).toBe(100);

    root.freeRecursive();
  });

  test("measure_border_box", () => {
    const root = new Node();
    root.setWidth(100);
    root.setHeight(200);
    root.setBoxSizing(BoxSizing.BorderBox);
    root.setPadding(Edge.All, 5);
    root.setBorder(Edge.All, 10);

    const measureCount: Counter = { count: 0 };

    const root_child0 = new Node();
    root_child0.setContext(measureCount);
    root_child0.setMeasureFunc(_measure_half_width_height);
    root.insertChild(root_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(measureCount.count).toBe(1);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(100);
    expect(root.getComputedHeight()).toBe(200);

    expect(root_child0.getComputedLeft()).toBe(15);
    expect(root_child0.getComputedTop()).toBe(15);
    expect(root_child0.getComputedWidth()).toBe(70);
    expect(root_child0.getComputedHeight()).toBe(85);

    root.freeRecursive();
  });

  test("min_width_larger_than_width_propagates_to_auto_parent", () => {
    const root = new Node();

    const root_child0 = new Node();
    root_child0.setFlexDirection(FlexDirection.Row);
    root_child0.setHeight(50);
    root.insertChild(root_child0, 0);

    const root_child0_child0 = new Node();
    root_child0_child0.setWidth(50);
    root_child0_child0.setMinWidth(100);
    root_child0_child0.setHeight(50);
    root_child0.insertChild(root_child0_child0, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(root.getComputedLeft()).toBe(0);
    expect(root.getComputedTop()).toBe(0);
    expect(root.getComputedWidth()).toBe(100);
    expect(root.getComputedHeight()).toBe(50);

    expect(root_child0.getComputedLeft()).toBe(0);
    expect(root_child0.getComputedTop()).toBe(0);
    expect(root_child0.getComputedWidth()).toBe(100);
    expect(root_child0.getComputedHeight()).toBe(50);

    expect(root_child0_child0.getComputedLeft()).toBe(0);
    expect(root_child0_child0.getComputedTop()).toBe(0);
    expect(root_child0_child0.getComputedWidth()).toBe(100);
    expect(root_child0_child0.getComputedHeight()).toBe(50);

    root.freeRecursive();
  });
});
