// The public API, as published. Every key of every export is listed, so an
// internal member that leaks into the declarations (or a public one that goes
// missing) fails `npm run typecheck:dist`.
import { expectTypeOf } from "vitest";
import * as venik from "venik";
import {
  Align,
  Config,
  Direction,
  Edge,
  FlexDirection,
  Gutter,
  type Layout,
  type MeasureFunction,
  Node,
  type Percent,
  SizingMode,
  type Size,
  Unit,
  type Value,
} from "venik";

// Exports.
expectTypeOf<keyof typeof venik>().toEqualTypeOf<
  | "Align"
  | "BoxSizing"
  | "Config"
  | "Dimension"
  | "Direction"
  | "Display"
  | "Edge"
  | "FlexDirection"
  | "Gutter"
  | "Justify"
  | "Node"
  | "Overflow"
  | "PositionType"
  | "SizingMode"
  | "Undefined"
  | "Unit"
  | "Wrap"
  | "roundValueToPixelGrid"
>();

// Node: fields and methods.
type NodeKeys =
  | "hasNewLayout"
  | "context"
  | "owner"
  | "calculateLayout"
  | "isDirty"
  | "markDirty"
  | "setDirtiedFunc"
  | "unsetDirtiedFunc"
  | "insertChild"
  | "removeChild"
  | "detach"
  | "removeAllChildren"
  | "setChildren"
  | "getChild"
  | "getChildCount"
  | "setConfig"
  | "getConfig"
  | "setMeasureFunc"
  | "unsetMeasureFunc"
  | "hasMeasureFunc"
  | "setBaselineFunc"
  | "hasBaselineFunc"
  | "setIsReferenceBaseline"
  | "isReferenceBaseline"
  | `getComputed${"Left" | "Top" | "Right" | "Bottom" | "Width" | "Height" | "RawWidth" | "RawHeight"}`
  | `getComputed${"Layout" | "Direction" | "HadOverflow" | "Margin" | "Border" | "Padding"}`
  | "copyStyle"
  | `${"set" | "get"}${
      | "Direction"
      | "FlexDirection"
      | "JustifyContent"
      | "AlignContent"
      | "AlignItems"
      | "AlignSelf"
      | "PositionType"
      | "FlexWrap"
      | "Overflow"
      | "Display"
      | "BoxSizing"
      | "Flex"
      | "FlexGrow"
      | "FlexShrink"
      | "AspectRatio"
      | "FlexBasis"
      | "Width"
      | "Height"
      | "MinWidth"
      | "MinHeight"
      | "MaxWidth"
      | "MaxHeight"
      | "Position"
      | "Margin"
      | "Padding"
      | "Border"
      | "Gap"}`
  | `set${"FlexBasis" | "Width" | "Height" | "MinWidth" | "MinHeight" | "MaxWidth" | "MaxHeight"}Percent`
  | `set${"Position" | "Margin" | "Padding" | "Gap"}Percent`
  | `set${"FlexBasis" | "Width" | "Height" | "Position" | "Margin"}Auto`;
expectTypeOf<keyof Node>().toEqualTypeOf<NodeKeys>();

expectTypeOf<keyof Config>().toEqualTypeOf<"context" | "setPointScaleFactor" | "getPointScaleFactor">();
expectTypeOf(Config.getDefault).returns.toEqualTypeOf<Config>();

// Enums are const objects whose values are their own types.
expectTypeOf(FlexDirection.Row).toEqualTypeOf<2>();
expectTypeOf<FlexDirection>().toEqualTypeOf<0 | 1 | 2 | 3>();
expectTypeOf<Edge>().toEqualTypeOf<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>();

const node = new Node();

// Lengths: points, percentages as `${number}%`, "auto" only where CSS has it.
node.setWidth(10);
node.setWidth("50%");
node.setWidth("auto");
node.setWidth(undefined);
// @ts-expect-error a percentage needs its sign
node.setWidth("50");
node.setMinWidth("10%");
// @ts-expect-error min sizes have no auto
node.setMinWidth("auto");
// @ts-expect-error max sizes have no auto
node.setMaxHeight("auto");
node.setMargin(Edge.Left, "auto");
// @ts-expect-error padding has no auto
node.setPadding(Edge.Left, "auto");
// @ts-expect-error borders are points only
node.setBorder(Edge.All, "10%");
// @ts-expect-error gaps have no auto
node.setGap(Gutter.All, "auto");
// @ts-expect-error not an Edge
node.setMargin(9, 1);
// @ts-expect-error not a FlexDirection
node.setFlexDirection(4);
// @ts-expect-error Align is not FlexDirection's type
node.setFlexDirection(Align.Stretch);
expectTypeOf<Percent>().toEqualTypeOf<`${number}%`>();

// Getters.
expectTypeOf(node.getWidth()).toEqualTypeOf<Value>();
expectTypeOf<Value>().toEqualTypeOf<{ readonly unit: Unit; readonly value: number }>();
expectTypeOf(node.getBorder(Edge.All)).toBeNumber();
expectTypeOf(node.getComputedLayout()).toEqualTypeOf<Layout>();
expectTypeOf<Layout>().toEqualTypeOf<{
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
}>();
// @ts-expect-error the shared layout object is read-only
node.getComputedLayout().width = 1;
expectTypeOf(node.getChild(0)).toEqualTypeOf<Node | null>();
expectTypeOf(node.owner).toEqualTypeOf<Node | null>();

// Layout.
node.calculateLayout();
node.calculateLayout(100, "auto", Direction.RTL);
// @ts-expect-error a size is a number or "auto"
node.calculateLayout("100%");

// Callbacks.
const size: Size = { width: 0, height: 0 };
const measure: MeasureFunction = (width, widthMode, height, heightMode, measured) => {
  expectTypeOf(widthMode).toEqualTypeOf<SizingMode>();
  expectTypeOf(measured).toEqualTypeOf<Node>();
  size.width = width;
  size.height = height;
  return size;
};
node.setMeasureFunc(measure);
node.setMeasureFunc(null);
// @ts-expect-error a measure function returns a Size
node.setMeasureFunc(() => 1);
node.setBaselineFunc((width, height) => height);
node.setDirtiedFunc((dirtied) => expectTypeOf(dirtied).toEqualTypeOf<Node>());
