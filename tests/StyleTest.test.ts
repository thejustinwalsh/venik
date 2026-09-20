import { expect, test } from "vitest";
import { Direction, Edge, FlexDirection, Gutter } from "../src/index.ts";
import { Style } from "../src/style/Style.ts";
import { StyleLength } from "../src/style/StyleLength.ts";

// Not ported: static_assert(sizeof(Style) <= 160, "Style grew. Was this intended?")

test("computed_padding_is_floored", () => {
  const style = new Style();
  style.setPadding(Edge.All, StyleLength.points(-1.0));
  const paddingStart = style.computeInlineStartPadding(
    FlexDirection.Row,
    Direction.LTR,
    0.0 /*widthSize*/,
  );
  expect(paddingStart).toBe(0);
});

test("computed_border_is_floored", () => {
  const style = new Style();
  style.setBorder(Edge.All, StyleLength.points(-1.0));
  const borderStart = style.computeInlineStartBorder(FlexDirection.Row, Direction.LTR);
  expect(borderStart).toBe(0);
});

test("computed_gap_is_floored", () => {
  const style = new Style();
  style.setGap(Gutter.Column, StyleLength.points(-1.0));
  const gapBetweenColumns = style.computeGapForAxis(FlexDirection.Row, 0.0);
  expect(gapBetweenColumns).toBe(0);
});

test("computed_margin_is_not_floored", () => {
  const style = new Style();
  style.setMargin(Edge.All, StyleLength.points(-1.0));
  const marginStart = style.computeInlineStartMargin(
    FlexDirection.Row,
    Direction.LTR,
    0.0 /*widthSize*/,
  );
  expect(marginStart).toBe(-1);
});
