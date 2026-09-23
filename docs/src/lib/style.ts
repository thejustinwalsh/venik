/**
 * The React Native / Yoga flavoured style props of the examples page: what
 * each key accepts, and how it is applied to a baba-yaga node.
 */
import {
  Align,
  BoxSizing,
  Direction,
  Display,
  Edge,
  FlexDirection,
  Gutter,
  Justify,
  Node,
  Overflow,
  PositionType,
  Wrap,
  type Percent,
} from "baba-yaga";
import type { StyleValue } from "./jsx.ts";

export class StyleError extends Error {}

type Enum = Record<string, number>;

/** What a style key accepts, for validation and for the editor's controls. */
export type StyleSpec =
  | { kind: "number"; min: number; max: number; step: number }
  | { kind: "length"; auto: boolean; negative: boolean }
  | { kind: "enum"; options: Enum };

const flexDirections: Enum = {
  column: FlexDirection.Column,
  "column-reverse": FlexDirection.ColumnReverse,
  row: FlexDirection.Row,
  "row-reverse": FlexDirection.RowReverse,
};
const justifies: Enum = {
  "flex-start": Justify.FlexStart,
  center: Justify.Center,
  "flex-end": Justify.FlexEnd,
  "space-between": Justify.SpaceBetween,
  "space-around": Justify.SpaceAround,
  "space-evenly": Justify.SpaceEvenly,
  stretch: Justify.Stretch,
  start: Justify.Start,
  end: Justify.End,
};
const aligns: Enum = {
  auto: Align.Auto,
  "flex-start": Align.FlexStart,
  center: Align.Center,
  "flex-end": Align.FlexEnd,
  stretch: Align.Stretch,
  baseline: Align.Baseline,
  "space-between": Align.SpaceBetween,
  "space-around": Align.SpaceAround,
  "space-evenly": Align.SpaceEvenly,
  start: Align.Start,
  end: Align.End,
};
const wraps: Enum = { nowrap: Wrap.NoWrap, wrap: Wrap.Wrap, "wrap-reverse": Wrap.WrapReverse };
const positions: Enum = {
  static: PositionType.Static,
  relative: PositionType.Relative,
  absolute: PositionType.Absolute,
};
const displays: Enum = { flex: Display.Flex, none: Display.None, contents: Display.Contents };
const overflows: Enum = {
  visible: Overflow.Visible,
  hidden: Overflow.Hidden,
  scroll: Overflow.Scroll,
};
const boxSizings: Enum = { "border-box": BoxSizing.BorderBox, "content-box": BoxSizing.ContentBox };
const directions: Enum = { inherit: Direction.Inherit, ltr: Direction.LTR, rtl: Direction.RTL };

const edges: Record<string, Edge> = {
  "": Edge.All,
  Top: Edge.Top,
  Left: Edge.Left,
  Right: Edge.Right,
  Bottom: Edge.Bottom,
  Start: Edge.Start,
  End: Edge.End,
  Horizontal: Edge.Horizontal,
  Inline: Edge.Horizontal,
  Vertical: Edge.Vertical,
  Block: Edge.Vertical,
};

const isPercent = (value: StyleValue): value is Percent =>
  typeof value === "string" && /^-?\d+(\.\d+)?%$/.test(value);

function pick(key: string, value: StyleValue, table: Enum): number {
  const found = typeof value === "string" ? table[value] : undefined;
  if (found === undefined) {
    throw new StyleError(`\`${key}\` must be one of ${Object.keys(table).map((k) => `"${k}"`).join(", ")}`);
  }
  return found;
}

function num(key: string, value: StyleValue): number {
  if (typeof value !== "number") throw new StyleError(`\`${key}\` must be a number`);
  return value;
}

function length(key: string, value: StyleValue, allowAuto: boolean): number | Percent | "auto" {
  if (typeof value === "number") return value;
  if (isPercent(value)) return value;
  if (value === "auto" && allowAuto) return value;
  throw new StyleError(`\`${key}\` must be a number${allowAuto ? ', "auto"' : ""} or a percentage like "50%"`);
}

type Setter = (node: Node, key: string, value: StyleValue) => void;

const setters: Record<string, Setter> = {};
const specs: Record<string, StyleSpec> = {};

const def = (key: string, spec: StyleSpec, setter: Setter) => {
  setters[key] = setter;
  specs[key] = spec;
};
const size = { kind: "length", auto: true, negative: false } as const;
const limit = { kind: "length", auto: false, negative: false } as const;
const inset = { kind: "length", auto: true, negative: true } as const;
const enumOf = (options: Enum): StyleSpec => ({ kind: "enum", options });
const factor: StyleSpec = { kind: "number", min: 0, max: 10, step: 0.1 };

def("width", size, (n, k, v) => n.setWidth(length(k, v, true)));
def("height", size, (n, k, v) => n.setHeight(length(k, v, true)));
def("minWidth", limit, (n, k, v) => n.setMinWidth(length(k, v, false) as number | Percent));
def("minHeight", limit, (n, k, v) => n.setMinHeight(length(k, v, false) as number | Percent));
def("maxWidth", limit, (n, k, v) => n.setMaxWidth(length(k, v, false) as number | Percent));
def("maxHeight", limit, (n, k, v) => n.setMaxHeight(length(k, v, false) as number | Percent));
def("flex", factor, (n, k, v) => n.setFlex(num(k, v)));
def("flexGrow", factor, (n, k, v) => n.setFlexGrow(num(k, v)));
def("flexShrink", factor, (n, k, v) => n.setFlexShrink(num(k, v)));
def("flexBasis", size, (n, k, v) => n.setFlexBasis(length(k, v, true)));
def("aspectRatio", { kind: "number", min: 0.1, max: 4, step: 0.01 }, (n, k, v) => n.setAspectRatio(num(k, v)));
def("flexDirection", enumOf(flexDirections), (n, k, v) => n.setFlexDirection(pick(k, v, flexDirections) as FlexDirection));
def("flexWrap", enumOf(wraps), (n, k, v) => n.setFlexWrap(pick(k, v, wraps) as Wrap));
def("justifyContent", enumOf(justifies), (n, k, v) => n.setJustifyContent(pick(k, v, justifies) as Justify));
def("alignItems", enumOf(aligns), (n, k, v) => n.setAlignItems(pick(k, v, aligns) as Align));
def("alignSelf", enumOf(aligns), (n, k, v) => n.setAlignSelf(pick(k, v, aligns) as Align));
def("alignContent", enumOf(aligns), (n, k, v) => n.setAlignContent(pick(k, v, aligns) as Align));
def("position", enumOf(positions), (n, k, v) => n.setPositionType(pick(k, v, positions) as PositionType));
def("display", enumOf(displays), (n, k, v) => n.setDisplay(pick(k, v, displays) as Display));
def("overflow", enumOf(overflows), (n, k, v) => n.setOverflow(pick(k, v, overflows) as Overflow));
def("boxSizing", enumOf(boxSizings), (n, k, v) => n.setBoxSizing(pick(k, v, boxSizings) as BoxSizing));
def("direction", enumOf(directions), (n, k, v) => n.setDirection(pick(k, v, directions) as Direction));
def("gap", limit, (n, k, v) => n.setGap(Gutter.All, length(k, v, false) as number | Percent));
def("rowGap", limit, (n, k, v) => n.setGap(Gutter.Row, length(k, v, false) as number | Percent));
def("columnGap", limit, (n, k, v) => n.setGap(Gutter.Column, length(k, v, false) as number | Percent));
def("top", inset, (n, k, v) => n.setPosition(Edge.Top, length(k, v, true)));
def("left", inset, (n, k, v) => n.setPosition(Edge.Left, length(k, v, true)));
def("right", inset, (n, k, v) => n.setPosition(Edge.Right, length(k, v, true)));
def("bottom", inset, (n, k, v) => n.setPosition(Edge.Bottom, length(k, v, true)));
def("start", inset, (n, k, v) => n.setPosition(Edge.Start, length(k, v, true)));
def("end", inset, (n, k, v) => n.setPosition(Edge.End, length(k, v, true)));
def("inset", inset, (n, k, v) => n.setPosition(Edge.All, length(k, v, true)));
def("insetInline", inset, (n, k, v) => n.setPosition(Edge.Horizontal, length(k, v, true)));
def("insetBlock", inset, (n, k, v) => n.setPosition(Edge.Vertical, length(k, v, true)));

for (const [suffix, edge] of Object.entries(edges)) {
  def(`margin${suffix}`, inset, (n, k, v) => n.setMargin(edge, length(k, v, true)));
  def(`padding${suffix}`, limit, (n, k, v) => n.setPadding(edge, length(k, v, false) as number | Percent));
  const border: Setter = (n, k, v) => n.setBorder(edge, num(k, v));
  const borderSpec: StyleSpec = { kind: "number", min: 0, max: 50, step: 1 };
  def(`border${suffix}Width`, borderSpec, border);
  def(`border${suffix}`, borderSpec, border);
}

export const styleKeys: readonly string[] = Object.keys(setters).sort();

/** What `key` accepts, or undefined for an unknown key. */
export function styleSpec(key: string): StyleSpec | undefined {
  return specs[key];
}

/** Throws a `StyleError` naming the problem for an unknown key or a bad value. */
export function applyStyle(node: Node, key: string, value: StyleValue): void {
  const setter = setters[key];
  if (setter === undefined) throw new StyleError(`Unknown style \`${key}\``);
  setter(node, key, value);
}
