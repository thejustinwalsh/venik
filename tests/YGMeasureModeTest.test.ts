import { expect, test } from "vitest";
import { newFixtureNode } from "./util/testUtil.ts";
import {
  Align,
  Direction,
  FlexDirection,
  type MeasureFunction,
  MeasureMode,
  Overflow,
} from "../src/index.ts";

type MeasureConstraint = {
  width: number;
  widthMode: MeasureMode;
  height: number;
  heightMode: MeasureMode;
};

// The C++ keeps a malloc'd array + length in the node context; here the
// context is a plain array that the measure function appends to.
const _measure: MeasureFunction = (width, widthMode, height, heightMode, node) => {
  const constraintList = node.getContext() as MeasureConstraint[];
  constraintList.push({ width, widthMode, height, heightMode });

  return {
    width: widthMode === MeasureMode.Undefined ? 10 : width,
    height: heightMode === MeasureMode.Undefined ? 10 : width,
  };
};

test("exactly_measure_stretched_child_column", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.width).toBe(100);
  expect(constraintList[0]?.widthMode).toBe(MeasureMode.Exactly);
  root.freeRecursive();
});

test("exactly_measure_stretched_child_row", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.height).toBe(100);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.Exactly);
  root.freeRecursive();
});

test("at_most_main_axis_column", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.height).toBe(100);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.AtMost);
  root.freeRecursive();
});

test("at_most_cross_axis_column", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.width).toBe(100);
  expect(constraintList[0]?.widthMode).toBe(MeasureMode.AtMost);
  root.freeRecursive();
});

test("at_most_main_axis_row", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.width).toBe(100);
  expect(constraintList[0]?.widthMode).toBe(MeasureMode.AtMost);
  root.freeRecursive();
});

test("at_most_cross_axis_row", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.FlexStart);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.height).toBe(100);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.AtMost);
  root.freeRecursive();
});

test("flex_child", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setFlexGrow(1);
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(3);

  expect(constraintList[0]?.height).toBe(100);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.AtMost);

  // Min-content probe for the CSS Flexbox §4.5 automatic minimum size
  expect(constraintList[1]?.height).toBe(0);
  expect(constraintList[1]?.heightMode).toBe(MeasureMode.AtMost);

  expect(constraintList[2]?.height).toBe(100);
  expect(constraintList[2]?.heightMode).toBe(MeasureMode.Exactly);
  root.freeRecursive();
});

test("flex_child_with_flex_basis", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setHeight(100);

  const root_child0 = newFixtureNode();
  root_child0.setFlexGrow(1);
  root_child0.setFlexBasis(0);
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(2);

  // Min-content probe for the CSS Flexbox §4.5 automatic minimum size
  expect(constraintList[0]?.height).toBe(0);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.AtMost);

  expect(constraintList[1]?.height).toBe(100);
  expect(constraintList[1]?.heightMode).toBe(MeasureMode.Exactly);
  root.freeRecursive();
});

test("overflow_scroll_column", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setAlignItems(Align.FlexStart);
  root.setOverflow(Overflow.Scroll);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.width).toBe(100);
  expect(constraintList[0]?.widthMode).toBe(MeasureMode.AtMost);

  expect(constraintList[0]?.height).toBeNaN();
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.Undefined);
  root.freeRecursive();
});

test("overflow_scroll_row", () => {
  const constraintList: MeasureConstraint[] = [];

  const root = newFixtureNode();
  root.setAlignItems(Align.FlexStart);
  root.setFlexDirection(FlexDirection.Row);
  root.setOverflow(Overflow.Scroll);
  root.setHeight(100);
  root.setWidth(100);

  const root_child0 = newFixtureNode();
  root_child0.setContext(constraintList);
  root_child0.setMeasureFunc(_measure);
  root.insertChild(root_child0, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(constraintList.length).toBe(1);

  expect(constraintList[0]?.width).toBeNaN();
  expect(constraintList[0]?.widthMode).toBe(MeasureMode.Undefined);

  expect(constraintList[0]?.height).toBe(100);
  expect(constraintList[0]?.heightMode).toBe(MeasureMode.AtMost);
  root.freeRecursive();
});
