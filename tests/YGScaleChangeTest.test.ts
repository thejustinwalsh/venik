// Port of yoga-cpp/tests/YGScaleChangeTest.cpp

import { expect, test } from "vitest";
import {
  Align,
  Config,
  Direction,
  Errata,
  FlexDirection,
  Node,
  type MeasureFunction,
} from "../src/index.ts";

test("scale_change_invalidates_layout", () => {
  const config = new Config();

  const root = new Node(config);
  config.setPointScaleFactor(1);

  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = new Node(config);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedLeft()).toBe(25);

  config.setPointScaleFactor(1.5);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root_child0.getComputedLeft()).toBe(0);
  // Left should change due to pixel alignment of new scale factor
  expect(root_child1.getComputedLeft()).toBeCloseTo(25.333334, 4);

  root.freeRecursive();
  config.free();
});

test("errata_config_change_relayout", () => {
  const config = new Config();
  config.setErrata(Errata.StretchFlexBasis);
  const root = new Node(config);
  root.setWidth(500);
  root.setHeight(500);

  const root_child0 = new Node(config);
  root_child0.setAlignItems(Align.FlexStart);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setFlexGrow(1);
  root_child0_child0.setFlexShrink(1);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = new Node(config);
  root_child0_child0_child0.setFlexGrow(1);
  root_child0_child0_child0.setFlexShrink(1);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(500);

  config.setErrata(Errata.None);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  // This should be modified by the lack of the errata
  expect(root_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(0);
  // This should be modified by the lack of the errata
  expect(root_child0_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(0);
  // This should be modified by the lack of the errata
  expect(root_child0_child0_child0.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});

test("setting_compatible_config_maintains_layout_cache", () => {
  let measureCallCount = 0;
  const measureCustom: MeasureFunction = (_width, _widthMode, _height, _heightMode, _node) => {
    measureCallCount++;
    return {
      width: 25.0,
      height: 25.0,
    };
  };

  const config = new Config();

  const root = new Node(config);
  config.setPointScaleFactor(1);

  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = new Node(config);
  expect(measureCallCount).toBe(0);

  root_child0.setMeasureFunc(measureCustom);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setFlexGrow(1);
  root.insertChild(root_child1, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(measureCallCount).toBe(1);
  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedLeft()).toBe(25);

  const config2 = new Config();
  // Calling YGConfigSetPointScaleFactor multiple times, ensures that config2
  // gets a different config version that config1
  config2.setPointScaleFactor(1);
  config2.setPointScaleFactor(1.5);
  config2.setPointScaleFactor(1);

  root.setConfig(config2);
  root_child0.setConfig(config2);
  root_child1.setConfig(config2);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Measure should not be called again, as layout should have been cached since
  // config is functionally the same as before
  expect(measureCallCount).toBe(1);
  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedLeft()).toBe(25);

  root.freeRecursive();
  config.free();
  config2.free();
});
