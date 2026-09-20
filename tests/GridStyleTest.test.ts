// Port of yoga-cpp/tests/GridStyleTest.cpp

import { expect, test } from "vitest";
import { GridLine } from "../src/style/GridLine.ts";
import { GridTrackSize } from "../src/style/GridTrack.ts";
import { Style } from "../src/style/Style.ts";

// Not ported: static_assert(sizeof(GridStyleStorage) == sizeof(void*)).
// GridStyleStorage is a C++ memory layout optimisation; the TS Style holds
// plain values.
//
// C++ `a == b` is `a.equals(b)`, copy construction is `style.clone()` and copy
// assignment is `style.assign(other)`.

test("unset_grid_style_reads_as_the_defaults", () => {
  const style = new Style();

  expect(style.gridTemplateColumns().length).toBe(0);
  expect(style.gridAutoRows().length).toBe(0);
  expect(style.gridColumnStart()).toEqual(GridLine.auto());
  expect(style.gridRowEnd()).toEqual(GridLine.auto());
});

test("unset_grid_style_equals_grid_style_set_to_the_defaults", () => {
  const unset = new Style();

  const setToDefaults = new Style();
  setToDefaults.setGridColumnStart(GridLine.auto());

  expect(unset.equals(setToDefaults)).toBe(true);
  expect(setToDefaults.equals(unset)).toBe(true);
});

test("styles_with_different_grid_values_are_not_equal", () => {
  const style = new Style();
  const withColumnStart = new Style();
  withColumnStart.setGridColumnStart(GridLine.fromInteger(2));

  expect(style.equals(withColumnStart)).toBe(false);
  expect(withColumnStart.equals(style)).toBe(false);
});

test("copies_do_not_share_grid_style", () => {
  const style = new Style();
  style.setGridTemplateColumns([GridTrackSize.length(10.0)]);
  style.setGridRowEnd(GridLine.span(3));

  const copy = style.clone();

  expect(copy.equals(style)).toBe(true);
  expect(copy.gridTemplateColumns()[0]).toEqual(GridTrackSize.length(10.0));
  expect(copy.gridRowEnd()).toEqual(GridLine.span(3));

  copy.setGridTemplateColumnAt(0, GridTrackSize.length(20.0));

  expect(style.gridTemplateColumns()[0]).toEqual(GridTrackSize.length(10.0));
  expect(copy.equals(style)).toBe(false);
});

test("assigning_an_unset_style_clears_a_set_one", () => {
  const style = new Style();
  style.setGridTemplateColumns([GridTrackSize.length(10.0)]);
  style.setGridRowStart(GridLine.span(2));

  style.assign(new Style());

  expect(style.gridTemplateColumns().length).toBe(0);
  expect(style.gridRowStart()).toEqual(GridLine.auto());
});

test("tracks_can_be_sized_then_filled", () => {
  const style = new Style();
  style.resizeGridTemplateColumns(2);
  style.setGridTemplateColumnAt(0, GridTrackSize.fr(1.0));
  style.setGridTemplateColumnAt(1, GridTrackSize.percent(50.0));

  expect(style.gridTemplateColumns().length).toBe(2);
  expect(style.gridTemplateColumns()[0]).toEqual(GridTrackSize.fr(1.0));
  expect(style.gridTemplateColumns()[1]).toEqual(GridTrackSize.percent(50.0));
});
