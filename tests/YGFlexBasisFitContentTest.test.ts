import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { newFixtureNode } from "./util/testUtil.ts";
import {
  Config,
  Direction,
  FlexDirection,
  MeasureMode,
  Node,
  Overflow,
  type MeasureFunction,
  type Size,
} from "../src/index.ts";

function measureTextLike(
  width: number,
  widthMode: MeasureMode,
  _height: number,
  _heightMode: MeasureMode,
  _node: Node,
): Size {
  let measuredWidth = 200.0;
  if (widthMode === MeasureMode.AtMost) {
    measuredWidth = Math.min(measuredWidth, width);
  }
  return { width: measuredWidth, height: 20.0 };
}

// `static uint32_t measureCount` of the scroll_avoids_remeasure test.
let measureCount = 0;

describe("YGFlexBasisFitContentTest", () => {
  let config: Config;
  let root: Node | null = null;

  beforeEach(() => {
    root = null;
    config = new Config();
  });

  afterEach(() => {
    if (root !== null) {
      root.freeRecursive();
    }
    config.free();
  });

  // Auto-height container with a percentage-height child produces the same
  // layout regardless of feature state, because Check 3 preserves percentage
  // resolution when availableInnerHeight is NaN.
  test("percentage_height_converges", () => {
    root = newFixtureNode(config);
    root.setHeight(300);
    root.setWidth(100);

    const container = newFixtureNode(config);
    root.insertChild(container, 0);

    const child = newFixtureNode(config);
    child.setHeightPercent(50);
    container.insertChild(child, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(child.getComputedHeight()).toBe(75);
    expect(container.getComputedHeight()).toBe(150);
  });

  // Two auto-height containers with percentage children and flexGrow:1 produce
  // the same layout regardless of feature state.
  test("percentage_with_flex_grow_converges", () => {
    root = newFixtureNode(config);
    root.setHeight(400);
    root.setWidth(100);

    const containerA = newFixtureNode(config);
    containerA.setFlexGrow(1);
    root.insertChild(containerA, 0);

    const childA = newFixtureNode(config);
    childA.setHeightPercent(25);
    containerA.insertChild(childA, 0);

    const containerB = newFixtureNode(config);
    containerB.setFlexGrow(1);
    root.insertChild(containerB, 1);

    const childB = newFixtureNode(config);
    childB.setHeightPercent(50);
    containerB.insertChild(childB, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(containerA.getComputedHeight()).toBe(150);
    expect(containerB.getComputedHeight()).toBe(250);
  });

  // Auto-height container with flexShrink and a percentage child causing
  // overflow produces the same layout regardless of feature state.
  test("flex_shrink_overflow_converges", () => {
    root = newFixtureNode(config);
    root.setHeight(200);
    root.setWidth(100);

    const container = newFixtureNode(config);
    container.setFlexShrink(1);
    root.insertChild(container, 0);

    const child = newFixtureNode(config);
    child.setHeightPercent(100);
    container.insertChild(child, 0);

    const fixed = newFixtureNode(config);
    fixed.setHeight(150);
    root.insertChild(fixed, 1);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(container.getComputedHeight()).toBe(50);
    expect(fixed.getComputedHeight()).toBe(150);
  });

  // In a scroll container (column), changing a sibling's height does not cause
  // re-measurement of unaffected subtrees when the feature is enabled.
  test("scroll_avoids_remeasure", () => {
    const measureFunc: MeasureFunction = (_width, _widthMode, _height, _heightMode, _node) => {
      measureCount++;
      return { width: 50, height: 50 };
    };

    measureCount = 0;

    root = newFixtureNode(config);
    root.setOverflow(Overflow.Scroll);
    root.setWidth(100);
    root.setHeight(500);

    const sibling = newFixtureNode(config);
    sibling.setHeight(100);
    root.insertChild(sibling, 0);

    const wrapper = newFixtureNode(config);
    root.insertChild(wrapper, 1);

    const inner = newFixtureNode(config);
    wrapper.insertChild(inner, 0);

    const leaf = newFixtureNode(config);
    leaf.setMeasureFunc(measureFunc);
    inner.insertChild(leaf, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);
    const firstPassCount = measureCount;

    sibling.setHeight(200);
    root.calculateLayout(undefined, undefined, Direction.LTR);
    const secondPassCount = measureCount - firstPassCount;

    expect(leaf.getComputedHeight()).toBe(50);

    expect(secondPassCount).toBe(0);
  });

  // Row direction is unaffected by the optimization. Width FitContent is always
  // preserved to support text wrapping through container nodes.
  test("row_direction_unchanged", () => {
    root = newFixtureNode(config);
    root.setWidth(100);
    root.setHeight(100);

    const container = newFixtureNode(config);
    root.insertChild(container, 0);

    const text = newFixtureNode(config);
    text.setMeasureFunc(measureTextLike);
    container.insertChild(text, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(text.getComputedWidth()).toBe(100);
  });

  // Scroll container in row direction: width FitContent is skipped for the
  // main axis (row) in scroll containers, matching legacy behavior.
  test("row_scroll_skips_width", () => {
    root = newFixtureNode(config);
    root.setFlexDirection(FlexDirection.Row);
    root.setOverflow(Overflow.Scroll);
    root.setWidth(100);
    root.setHeight(100);

    const text = newFixtureNode(config);
    text.setMeasureFunc(measureTextLike);
    root.insertChild(text, 0);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(text.getComputedWidth()).toBe(200);
  });
});
