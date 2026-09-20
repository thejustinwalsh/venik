import { expect, test } from "vitest";
import { Config, Direction, Edge, type MeasureFunction, Node, PositionType } from "../src/index.ts";

const _measureFloor: MeasureFunction = () => {
  return { width: 10.2, height: 10.2 };
};

const _measureCeil: MeasureFunction = () => {
  return { width: 10.5, height: 10.5 };
};

const _measureFractial: MeasureFunction = () => {
  return { width: 0.5, height: 0.5 };
};

test("rounding_feature_with_custom_measure_func_floor", () => {
  const config = new Config();
  const root = new Node(config);

  const root_child0 = new Node(config);
  root_child0.setMeasureFunc(_measureFloor);
  root.insertChild(root_child0, 0);

  config.setPointScaleFactor(0.0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root_child0.getComputedWidth()).toBeCloseTo(10.2, 4);
  expect(root_child0.getComputedHeight()).toBeCloseTo(10.2, 4);

  config.setPointScaleFactor(1.0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedWidth()).toBe(11);
  expect(root_child0.getComputedHeight()).toBe(11);

  config.setPointScaleFactor(2.0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root_child0.getComputedWidth()).toBeCloseTo(10.5, 4);
  expect(root_child0.getComputedHeight()).toBeCloseTo(10.5, 4);

  config.setPointScaleFactor(4.0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedWidth()).toBeCloseTo(10.25, 4);
  expect(root_child0.getComputedHeight()).toBeCloseTo(10.25, 4);

  config.setPointScaleFactor(1.0 / 3.0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root_child0.getComputedWidth()).toBe(12);
  expect(root_child0.getComputedHeight()).toBe(12);

  root.freeRecursive();

  config.free();
});

test("rounding_feature_with_custom_measure_func_ceil", () => {
  const config = new Config();
  const root = new Node(config);

  const root_child0 = new Node(config);
  root_child0.setMeasureFunc(_measureCeil);
  root.insertChild(root_child0, 0);

  config.setPointScaleFactor(1.0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedWidth()).toBe(11);
  expect(root_child0.getComputedHeight()).toBe(11);

  root.freeRecursive();

  config.free();
});

test("rounding_feature_with_custom_measure_and_fractial_matching_scale", () => {
  const config = new Config();
  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);

  const root_child0 = new Node(config);
  root_child0.setPosition(Edge.Left, 73.625);
  root_child0.setPositionType(PositionType.Relative);
  root_child0.setMeasureFunc(_measureFractial);
  root.insertChild(root_child0, 0);

  config.setPointScaleFactor(2.0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root_child0.getComputedWidth()).toBeCloseTo(0.5, 4);
  expect(root_child0.getComputedHeight()).toBeCloseTo(0.5, 4);
  expect(root_child0.getComputedLeft()).toBeCloseTo(73.5, 4);

  root.freeRecursive();

  config.free();
});
