import { expect, test } from "vitest";
import { newFixtureNode } from "./util/testUtil.ts";
import {
  Config,
  Direction,
  FlexDirection,
  type MeasureFunction,
} from "../src/index.ts";

test("scale_change_invalidates_layout", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  config.setPointScaleFactor(1);

  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  root_child0.setFlexGrow(1);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
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

  const root = newFixtureNode(config);
  config.setPointScaleFactor(1);

  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(50);
  root.setHeight(50);

  const root_child0 = newFixtureNode(config);
  expect(measureCallCount).toBe(0);

  root_child0.setMeasureFunc(measureCustom);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
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
});
