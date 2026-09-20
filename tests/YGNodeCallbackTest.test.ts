// Port of yoga-cpp/tests/YGNodeCallbackTest.cpp

import { expect, test } from "vitest";
import { MeasureMode, Node } from "../src/index.ts";

test("hasMeasureFunc_initial", () => {
  const n = new Node();
  expect(n.hasMeasureFunc()).toBe(false);
});

test("hasMeasureFunc_with_measure_fn", () => {
  const n = new Node();
  n.setMeasureFunc(() => {
    return { width: 0, height: 0 };
  });
  expect(n.hasMeasureFunc()).toBe(true);
});

test("measure_with_measure_fn", () => {
  const n = new Node();

  n.setMeasureFunc((w, wm, h, hm) => {
    return { width: w * wm, height: h / hm };
  });

  expect(n.measure(23, MeasureMode.Exactly, 24, MeasureMode.AtMost)).toEqual({
    width: 23,
    height: 12,
  });
});

test("hasMeasureFunc_after_unset", () => {
  const n = new Node();
  n.setMeasureFunc(() => {
    return { width: 0, height: 0 };
  });

  n.setMeasureFunc(null);
  expect(n.hasMeasureFunc()).toBe(false);
});

test("hasBaselineFunc_initial", () => {
  const n = new Node();
  expect(n.hasBaselineFunc()).toBe(false);
});

test("hasBaselineFunc_with_baseline_fn", () => {
  const n = new Node();
  n.setBaselineFunc(() => 0.0);
  expect(n.hasBaselineFunc()).toBe(true);
});

test("baseline_with_baseline_fn", () => {
  const n = new Node();
  n.setBaselineFunc((w, h) => w + h);

  expect(n.baseline(1.25, 2.5)).toBe(3.75);
});

test("hasBaselineFunc_after_unset", () => {
  const n = new Node();
  n.setBaselineFunc(() => 0.0);

  n.setBaselineFunc(null);
  expect(n.hasBaselineFunc()).toBe(false);
});
