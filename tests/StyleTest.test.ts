import { expect, test } from "vitest";
import { Dimension, Direction, Edge, FlexDirection, Gutter, Node } from "../src/index.ts";
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

test("size and gap defaults detach independently on first change", () => {
  const first = new Style();
  const second = new Style();

  expect(first.gap).toBe(second.gap);
  expect(first.dimensions).toBe(second.dimensions);
  expect(first.minDimensions).toBe(second.minDimensions);
  expect(first.maxDimensions).toBe(second.maxDimensions);

  first.setGap(Gutter.Row, StyleLength.points(3));
  first.setDimension(Dimension.Width, StyleLength.points(10));
  first.setMinDimension(Dimension.Height, StyleLength.points(4));
  first.setMaxDimension(Dimension.Width, StyleLength.percent(80));

  expect(first.gap).not.toBe(second.gap);
  expect(first.dimensions).not.toBe(second.dimensions);
  expect(first.minDimensions).not.toBe(second.minDimensions);
  expect(first.maxDimensions).not.toBe(second.maxDimensions);
  expect(second.gap[Gutter.Row].isUndefined()).toBe(true);
  expect(second.dimensions[Dimension.Width].isAuto()).toBe(true);
  expect(second.minDimensions[Dimension.Height].isUndefined()).toBe(true);
  expect(second.maxDimensions[Dimension.Width].isUndefined()).toBe(true);
});

test("assign shares defaults but clones changed size and gap arrays", () => {
  const source = new Style();
  const target = new Style();
  target.setGap(Gutter.All, StyleLength.points(1));
  target.setDimension(Dimension.Width, StyleLength.points(1));
  target.setMinDimension(Dimension.Width, StyleLength.points(1));
  target.setMaxDimension(Dimension.Width, StyleLength.points(1));

  target.assign(source);
  expect(target.equals(source)).toBe(true);
  expect(target.gap).toBe(source.gap);
  expect(target.dimensions).toBe(source.dimensions);
  expect(target.minDimensions).toBe(source.minDimensions);
  expect(target.maxDimensions).toBe(source.maxDimensions);

  source.setGap(Gutter.Column, StyleLength.points(2));
  source.setDimension(Dimension.Height, StyleLength.points(20));
  source.setMinDimension(Dimension.Width, StyleLength.points(5));
  source.setMaxDimension(Dimension.Height, StyleLength.points(30));
  target.assign(source);

  expect(target.equals(source)).toBe(true);
  expect(target.gap).not.toBe(source.gap);
  expect(target.dimensions).not.toBe(source.dimensions);
  expect(target.minDimensions).not.toBe(source.minDimensions);
  expect(target.maxDimensions).not.toBe(source.maxDimensions);

  source.setGap(Gutter.Column, StyleLength.points(7));
  source.setDimension(Dimension.Height, StyleLength.points(21));
  source.setMinDimension(Dimension.Width, StyleLength.points(6));
  source.setMaxDimension(Dimension.Height, StyleLength.points(31));
  expect(target.gap[Gutter.Column].value).toBe(2);
  expect(target.dimensions[Dimension.Height].value).toBe(20);
  expect(target.minDimensions[Dimension.Width].value).toBe(5);
  expect(target.maxDimensions[Dimension.Height].value).toBe(30);
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

const edgeGroups = [
  {
    name: "margin",
    get: (style: Style) => style.margin,
    set: (style: Style, edge: Edge, value: StyleLength) => style.setMargin(edge, value),
  },
  {
    name: "position",
    get: (style: Style) => style.position,
    set: (style: Style, edge: Edge, value: StyleLength) => style.setPosition(edge, value),
  },
  {
    name: "padding",
    get: (style: Style) => style.padding,
    set: (style: Style, edge: Edge, value: StyleLength) => style.setPadding(edge, value),
  },
  {
    name: "border",
    get: (style: Style) => style.border,
    set: (style: Style, edge: Edge, value: StyleLength) => style.setBorder(edge, value),
  },
];

test.each(edgeGroups)("$name defaults detach on write and rejoin on reset", ({ get, set }) => {
  const first = new Style();
  const second = new Style();
  const sharedDefault = get(first);

  expect(get(second)).toBe(sharedDefault);
  expect(Object.isFrozen(sharedDefault)).toBe(true);
  expect(set(first, Edge.Left, StyleLength.undefined())).toBe(false);
  expect(get(first)).toBe(sharedDefault);

  expect(set(first, Edge.Left, StyleLength.points(10))).toBe(true);
  expect(get(first)).not.toBe(sharedDefault);
  expect(get(first)[Edge.Left].value).toBe(10);
  expect(get(second)[Edge.Left].isUndefined()).toBe(true);
  const owned = get(first);
  expect(set(first, Edge.Left, StyleLength.points(10, get(first)[Edge.Left]))).toBe(false);
  expect(get(first)).toBe(owned);
  expect(set(first, Edge.Top, StyleLength.points(30))).toBe(true);

  expect(set(second, Edge.Right, StyleLength.points(20))).toBe(true);
  expect(get(second)).not.toBe(get(first));
  expect(get(first)[Edge.Right].isUndefined()).toBe(true);

  expect(set(first, Edge.Left, StyleLength.undefined())).toBe(true);
  expect(get(first)).not.toBe(sharedDefault);
  expect(get(first)[Edge.Top].value).toBe(30);
  expect(set(first, Edge.Top, StyleLength.undefined())).toBe(true);
  expect(get(first)).toBe(sharedDefault);
  expect(get(first)[Edge.Left].isUndefined()).toBe(true);
});

test("assign copies owned edge arrays and shares empty defaults", () => {
  const source = new Style();
  source.setMargin(Edge.Left, StyleLength.points(1));
  source.setPosition(Edge.Top, StyleLength.percent(2));
  source.setPadding(Edge.Right, StyleLength.points(3));
  source.setBorder(Edge.Bottom, StyleLength.points(4));

  const copy = new Style();
  copy.assign(source);
  expect(copy.equals(source)).toBe(true);
  expect(copy.margin).not.toBe(source.margin);
  expect(copy.position).not.toBe(source.position);
  expect(copy.padding).not.toBe(source.padding);
  expect(copy.border).not.toBe(source.border);

  source.setMargin(Edge.Left, StyleLength.points(11));
  source.setPosition(Edge.Top, StyleLength.percent(12));
  source.setPadding(Edge.Right, StyleLength.points(13));
  source.setBorder(Edge.Bottom, StyleLength.points(14));
  expect(copy.margin[Edge.Left].value).toBe(1);
  expect(copy.position[Edge.Top].value).toBe(2);
  expect(copy.padding[Edge.Right].value).toBe(3);
  expect(copy.border[Edge.Bottom].value).toBe(4);

  const defaults = new Style();
  copy.assign(defaults);
  expect(copy.equals(defaults)).toBe(true);
  expect(copy.margin).toBe(defaults.margin);
  expect(copy.position).toBe(defaults.position);
  expect(copy.padding).toBe(defaults.padding);
  expect(copy.border).toBe(defaults.border);
});

test("copyStyle keeps node edge styles independent", () => {
  const source = new Node();
  source.setMargin(Edge.Left, 1);
  source.setPositionPercent(Edge.Top, 2);
  source.setPadding(Edge.Right, 3);
  source.setBorder(Edge.Bottom, 4);

  const copy = new Node();
  copy.copyStyle(source);
  source.setMargin(Edge.Left, 11);
  source.setPositionPercent(Edge.Top, 12);
  source.setPadding(Edge.Right, 13);
  source.setBorder(Edge.Bottom, 14);

  expect(copy.getMargin(Edge.Left).value).toBe(1);
  expect(copy.getPosition(Edge.Top).value).toBe(2);
  expect(copy.getPadding(Edge.Right).value).toBe(3);
  expect(copy.getBorder(Edge.Bottom)).toBe(4);
});
