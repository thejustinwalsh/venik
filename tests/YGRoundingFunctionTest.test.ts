// Port of yoga-cpp/tests/YGRoundingFunctionTest.cpp

import { expect, test } from "vitest";
import {
  Config,
  Direction,
  Edge,
  type MeasureFunction,
  Node,
  roundValueToPixelGrid,
} from "../src/index.ts";

test("rounding_value", () => {
  // Test that whole numbers are rounded to whole despite ceil/floor flags
  expect(roundValueToPixelGrid(6.000001, 2.0, false, false)).toBe(6);
  expect(roundValueToPixelGrid(6.000001, 2.0, true, false)).toBe(6);
  expect(roundValueToPixelGrid(6.000001, 2.0, false, true)).toBe(6);
  expect(roundValueToPixelGrid(5.999999, 2.0, false, false)).toBe(6);
  expect(roundValueToPixelGrid(5.999999, 2.0, true, false)).toBe(6);
  expect(roundValueToPixelGrid(5.999999, 2.0, false, true)).toBe(6);
  // Same tests for negative numbers
  expect(roundValueToPixelGrid(-6.000001, 2.0, false, false)).toBe(-6);
  expect(roundValueToPixelGrid(-6.000001, 2.0, true, false)).toBe(-6);
  expect(roundValueToPixelGrid(-6.000001, 2.0, false, true)).toBe(-6);
  expect(roundValueToPixelGrid(-5.999999, 2.0, false, false)).toBe(-6);
  expect(roundValueToPixelGrid(-5.999999, 2.0, true, false)).toBe(-6);
  expect(roundValueToPixelGrid(-5.999999, 2.0, false, true)).toBe(-6);

  // Test that numbers with fraction are rounded correctly accounting for
  // ceil/floor flags
  expect(roundValueToPixelGrid(6.01, 2.0, false, false)).toBe(6);
  expect(roundValueToPixelGrid(6.01, 2.0, true, false)).toBeCloseTo(6.5, 4);
  expect(roundValueToPixelGrid(6.01, 2.0, false, true)).toBe(6);
  expect(roundValueToPixelGrid(5.99, 2.0, false, false)).toBe(6);
  expect(roundValueToPixelGrid(5.99, 2.0, true, false)).toBe(6);
  expect(roundValueToPixelGrid(5.99, 2.0, false, true)).toBeCloseTo(5.5, 4);
  // Same tests for negative numbers
  expect(roundValueToPixelGrid(-6.01, 2.0, false, false)).toBe(-6);
  expect(roundValueToPixelGrid(-6.01, 2.0, true, false)).toBe(-6);
  expect(roundValueToPixelGrid(-6.01, 2.0, false, true)).toBeCloseTo(-6.5, 4);
  expect(roundValueToPixelGrid(-5.99, 2.0, false, false)).toBe(-6);
  expect(roundValueToPixelGrid(-5.99, 2.0, true, false)).toBeCloseTo(-5.5, 4);
  expect(roundValueToPixelGrid(-5.99, 2.0, false, true)).toBe(-6);

  // Rounding up/down halfway values is as expected for both positive and
  // negative numbers
  expect(roundValueToPixelGrid(-3.5, 1.0, false, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.4, 1.0, false, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.6, 1.0, false, false)).toBe(-4);
  expect(roundValueToPixelGrid(-3.499999, 1.0, false, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.500001, 1.0, false, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.5001, 1.0, false, false)).toBe(-4);

  expect(roundValueToPixelGrid(-3.5, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.4, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.6, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.499999, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.500001, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.5001, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3.00001, 1.0, true, false)).toBe(-3);
  expect(roundValueToPixelGrid(-3, 1.0, true, false)).toBe(-3);

  expect(roundValueToPixelGrid(-3.5, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.4, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.6, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.499999, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.500001, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.5001, 1.0, false, true)).toBe(-4);
  expect(roundValueToPixelGrid(-3.00001, 1.0, false, true)).toBe(-3);
  expect(roundValueToPixelGrid(-3, 1.0, false, true)).toBe(-3);

  // NAN is treated as expected:
  expect(roundValueToPixelGrid(NaN, 1.5, false, false)).toBeNaN();
  expect(roundValueToPixelGrid(1.5, NaN, false, false)).toBeNaN();
  expect(roundValueToPixelGrid(NaN, NaN, false, false)).toBeNaN();
});

const measureText: MeasureFunction = () => {
  return { width: 10, height: 10 };
};

// Regression test for https://github.com/facebook/yoga/issues/824
test("consistent_rounding_during_repeated_layouts", () => {
  const config = new Config();
  config.setPointScaleFactor(2);

  const root = new Node(config);
  root.setMargin(Edge.Top, -1.49);
  root.setWidth(500);
  root.setHeight(500);

  const node0 = new Node(config);
  root.insertChild(node0, 0);

  const node1 = new Node(config);
  node1.setMeasureFunc(measureText);
  node0.insertChild(node1, 0);

  for (let i = 0; i < 5; i++) {
    // Dirty the tree so YGRoundToPixelGrid runs again
    root.setMargin(Edge.Left, i + 1);

    root.calculateLayout(undefined, undefined, Direction.LTR);
    expect(node1.getComputedHeight()).toBe(10);
  }

  root.freeRecursive();

  config.free();
});

test("per_node_point_scale_factor", () => {
  const config1 = new Config();
  config1.setPointScaleFactor(2);

  const config2 = new Config();
  config2.setPointScaleFactor(1);

  const config3 = new Config();
  config3.setPointScaleFactor(0.5);

  const root = new Node(config1);
  root.setWidth(11.5);
  root.setHeight(11.5);

  const node0 = new Node(config2);
  node0.setWidth(9.5);
  node0.setHeight(9.5);
  root.insertChild(node0, 0);

  const node1 = new Node(config3);
  node1.setWidth(7);
  node1.setHeight(7);
  node0.insertChild(node1, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBeCloseTo(11.5, 4);
  expect(root.getComputedHeight()).toBeCloseTo(11.5, 4);

  expect(node0.getComputedWidth()).toBe(10);
  expect(node0.getComputedHeight()).toBe(10);

  expect(node1.getComputedWidth()).toBe(8);
  expect(node1.getComputedHeight()).toBe(8);

  root.freeRecursive();

  config1.free();
  config2.free();
  config3.free();
});

test("raw_layout_dimensions", () => {
  const config = new Config();
  config.setPointScaleFactor(0.5);

  const root = new Node(config);
  root.setWidth(11.5);
  root.setHeight(9.5);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedWidth()).toBe(12);
  expect(root.getComputedHeight()).toBe(10);
  expect(root.getComputedRawWidth()).toBeCloseTo(11.5, 4);
  expect(root.getComputedRawHeight()).toBeCloseTo(9.5, 4);

  root.freeRecursive();

  config.free();
});
