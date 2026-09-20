// Port of yoga-cpp/yoga/style/Style.h
//
// Unlike C++, this Style holds plain values: StyleValuePool, StyleValueHandle
// and SmallValueBuffer are memory layout optimisations that are intentionally
// not ported.

import {
  flexEndEdge,
  flexStartEdge,
  inlineEndEdge,
  inlineStartEdge,
  isRow,
  PhysicalEdge,
} from "../algorithm/FlexDirection.ts";
import {
  Align,
  BoxSizing,
  Dimension,
  Direction,
  Display,
  Edge,
  FlexDirection,
  Gutter,
  Justify,
  Overflow,
  PositionType,
  Wrap,
} from "../enums.ts";
import { maxOrDefined } from "../numeric/Comparison.ts";
import { FloatOptional } from "../numeric/FloatOptional.ts";
import { StyleLength } from "./StyleLength.ts";
import { StyleSizeLength } from "./StyleSizeLength.ts";

/**
 * Port of `yoga::Style`. Accessor names are kept identical to C++
 * (`style.flexDirection()` / `style.setFlexDirection(v)`).
 *
 * Defaults of a new Style follow CSS: direction Inherit, flexDirection Row,
 * justifyContent FlexStart,
 * alignContent Stretch, alignItems Stretch, alignSelf Auto, positionType
 * Relative, flexWrap NoWrap, overflow Visible, display Flex, boxSizing
 * BorderBox, flexBasis auto, dimensions auto, every other number/length
 * undefined.
 */
export class Style {
  static readonly DefaultFlexGrow: number = 0.0;
  static readonly DefaultFlexShrink: number = 1.0;

  private direction_: Direction = Direction.Inherit;
  private flexDirection_: FlexDirection = FlexDirection.Row;
  private justifyContent_: Justify = Justify.FlexStart;
  private alignContent_: Align = Align.Stretch;
  private alignItems_: Align = Align.Stretch;
  private alignSelf_: Align = Align.Auto;
  private positionType_: PositionType = PositionType.Relative;
  private flexWrap_: Wrap = Wrap.NoWrap;
  private overflow_: Overflow = Overflow.Visible;
  private display_: Display = Display.Flex;
  private boxSizing_: BoxSizing = BoxSizing.BorderBox;

  private flex_: FloatOptional = UNDEFINED_NUMBER;
  private flexGrow_: FloatOptional = UNDEFINED_NUMBER;
  private flexShrink_: FloatOptional = UNDEFINED_NUMBER;
  private flexBasis_: StyleSizeLength = StyleSizeLength.ofAuto();
  private margin_: StyleLength[] = undefinedLengths(EDGE_COUNT);
  private position_: StyleLength[] = undefinedLengths(EDGE_COUNT);
  private padding_: StyleLength[] = undefinedLengths(EDGE_COUNT);
  private border_: StyleLength[] = undefinedLengths(EDGE_COUNT);
  private gap_: StyleLength[] = undefinedLengths(GUTTER_COUNT);
  private dimensions_: StyleSizeLength[] = [StyleSizeLength.ofAuto(), StyleSizeLength.ofAuto()];
  private minDimensions_: StyleSizeLength[] = [
    StyleSizeLength.undefined(),
    StyleSizeLength.undefined(),
  ];
  private maxDimensions_: StyleSizeLength[] = [
    StyleSizeLength.undefined(),
    StyleSizeLength.undefined(),
  ];
  private aspectRatio_: FloatOptional = UNDEFINED_NUMBER;

  /** C++ copy construction (`Style copy = style;`). The copy shares no mutable state with `this`. */
  clone(): Style {
    const copy = new Style();
    copy.assign(this);
    return copy;
  }

  /** C++ copy assignment (`style = other;`). `this` shares no mutable state with `other` afterwards. */
  assign(other: Style): void {
    this.direction_ = other.direction_;
    this.flexDirection_ = other.flexDirection_;
    this.justifyContent_ = other.justifyContent_;
    this.alignContent_ = other.alignContent_;
    this.alignItems_ = other.alignItems_;
    this.alignSelf_ = other.alignSelf_;
    this.positionType_ = other.positionType_;
    this.flexWrap_ = other.flexWrap_;
    this.overflow_ = other.overflow_;
    this.display_ = other.display_;
    this.boxSizing_ = other.boxSizing_;
    this.flex_ = other.flex_;
    this.flexGrow_ = other.flexGrow_;
    this.flexShrink_ = other.flexShrink_;
    this.flexBasis_ = other.flexBasis_;
    this.margin_ = other.margin_.slice();
    this.position_ = other.position_.slice();
    this.padding_ = other.padding_.slice();
    this.border_ = other.border_.slice();
    this.gap_ = other.gap_.slice();
    this.dimensions_ = other.dimensions_.slice();
    this.minDimensions_ = other.minDimensions_.slice();
    this.maxDimensions_ = other.maxDimensions_.slice();
    this.aspectRatio_ = other.aspectRatio_;
  }

  /** C++ `operator==`. */
  equals(other: Style): boolean {
    // Like C++, boxSizing is not part of the comparison.
    return (
      this.direction_ === other.direction_ &&
      this.flexDirection_ === other.flexDirection_ &&
      this.justifyContent_ === other.justifyContent_ &&
      this.alignContent_ === other.alignContent_ &&
      this.alignItems_ === other.alignItems_ &&
      this.alignSelf_ === other.alignSelf_ &&
      this.positionType_ === other.positionType_ &&
      this.flexWrap_ === other.flexWrap_ &&
      this.overflow_ === other.overflow_ &&
      this.display_ === other.display_ &&
      this.flex_.equals(other.flex_) &&
      this.flexGrow_.equals(other.flexGrow_) &&
      this.flexShrink_.equals(other.flexShrink_) &&
      this.flexBasis_.equals(other.flexBasis_) &&
      lengthsEqual(this.margin_, other.margin_) &&
      lengthsEqual(this.position_, other.position_) &&
      lengthsEqual(this.padding_, other.padding_) &&
      lengthsEqual(this.border_, other.border_) &&
      lengthsEqual(this.gap_, other.gap_) &&
      lengthsEqual(this.dimensions_, other.dimensions_) &&
      lengthsEqual(this.minDimensions_, other.minDimensions_) &&
      lengthsEqual(this.maxDimensions_, other.maxDimensions_) &&
      this.aspectRatio_.equals(other.aspectRatio_)
    );
  }

  direction(): Direction {
    return this.direction_;
  }
  setDirection(value: Direction): void {
    this.direction_ = value;
  }

  flexDirection(): FlexDirection {
    return this.flexDirection_;
  }
  setFlexDirection(value: FlexDirection): void {
    this.flexDirection_ = value;
  }

  justifyContent(): Justify {
    return this.justifyContent_;
  }
  setJustifyContent(value: Justify): void {
    this.justifyContent_ = value;
  }

  alignContent(): Align {
    return this.alignContent_;
  }
  setAlignContent(value: Align): void {
    this.alignContent_ = value;
  }

  alignItems(): Align {
    return this.alignItems_;
  }
  setAlignItems(value: Align): void {
    this.alignItems_ = value;
  }

  alignSelf(): Align {
    return this.alignSelf_;
  }
  setAlignSelf(value: Align): void {
    this.alignSelf_ = value;
  }

  positionType(): PositionType {
    return this.positionType_;
  }
  setPositionType(value: PositionType): void {
    this.positionType_ = value;
  }

  flexWrap(): Wrap {
    return this.flexWrap_;
  }
  setFlexWrap(value: Wrap): void {
    this.flexWrap_ = value;
  }

  overflow(): Overflow {
    return this.overflow_;
  }
  setOverflow(value: Overflow): void {
    this.overflow_ = value;
  }

  display(): Display {
    return this.display_;
  }
  setDisplay(value: Display): void {
    this.display_ = value;
  }

  flex(): FloatOptional {
    return this.flex_;
  }
  setFlex(value: FloatOptional): void {
    this.flex_ = value;
  }

  flexGrow(): FloatOptional {
    return this.flexGrow_;
  }
  setFlexGrow(value: FloatOptional): void {
    this.flexGrow_ = value;
  }

  flexShrink(): FloatOptional {
    return this.flexShrink_;
  }
  setFlexShrink(value: FloatOptional): void {
    this.flexShrink_ = value;
  }

  flexBasis(): StyleSizeLength {
    return this.flexBasis_;
  }
  setFlexBasis(value: StyleSizeLength): void {
    this.flexBasis_ = value;
  }

  margin(edge: Edge): StyleLength {
    return this.margin_[edge]!;
  }
  setMargin(edge: Edge, value: StyleLength): void {
    this.margin_[edge] = value;
  }

  position(edge: Edge): StyleLength {
    return this.position_[edge]!;
  }
  setPosition(edge: Edge, value: StyleLength): void {
    this.position_[edge] = value;
  }

  padding(edge: Edge): StyleLength {
    return this.padding_[edge]!;
  }
  setPadding(edge: Edge, value: StyleLength): void {
    this.padding_[edge] = value;
  }

  border(edge: Edge): StyleLength {
    return this.border_[edge]!;
  }
  setBorder(edge: Edge, value: StyleLength): void {
    this.border_[edge] = value;
  }

  gap(gutter: Gutter): StyleLength {
    return this.gap_[gutter]!;
  }
  setGap(gutter: Gutter, value: StyleLength): void {
    this.gap_[gutter] = value;
  }

  dimension(axis: Dimension): StyleSizeLength {
    return this.dimensions_[axis]!;
  }
  setDimension(axis: Dimension, value: StyleSizeLength): void {
    this.dimensions_[axis] = value;
  }

  minDimension(axis: Dimension): StyleSizeLength {
    return this.minDimensions_[axis]!;
  }
  setMinDimension(axis: Dimension, value: StyleSizeLength): void {
    this.minDimensions_[axis] = value;
  }

  resolvedMinDimension(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): FloatOptional {
    return new FloatOptional(this.resolvedMinDimensionValue(direction, axis, referenceLength, ownerWidth));
  }

  maxDimension(axis: Dimension): StyleSizeLength {
    return this.maxDimensions_[axis]!;
  }
  setMaxDimension(axis: Dimension, value: StyleSizeLength): void {
    this.maxDimensions_[axis] = value;
  }

  resolvedMaxDimension(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): FloatOptional {
    return new FloatOptional(this.resolvedMaxDimensionValue(direction, axis, referenceLength, ownerWidth));
  }

  aspectRatio(): FloatOptional {
    return this.aspectRatio_;
  }

  /** Degenerate aspect ratios (0, infinite) act as auto. See https://drafts.csswg.org/css-sizing-4/#valdef-aspect-ratio-ratio */
  setAspectRatio(value: FloatOptional): void {
    // degenerate aspect ratios act as auto.
    // see https://drafts.csswg.org/css-sizing-4/#valdef-aspect-ratio-ratio
    const ratio = value.unwrap();
    this.aspectRatio_ = ratio === 0 || ratio === Infinity || ratio === -Infinity ? UNDEFINED_NUMBER : value;
  }

  boxSizing(): BoxSizing {
    return this.boxSizing_;
  }
  setBoxSizing(value: BoxSizing): void {
    this.boxSizing_ = value;
  }

  horizontalInsetsDefined(): boolean {
    const position = this.position_;
    return (
      position[Edge.Left]!.isDefined() ||
      position[Edge.Right]!.isDefined() ||
      position[Edge.All]!.isDefined() ||
      position[Edge.Horizontal]!.isDefined() ||
      position[Edge.Start]!.isDefined() ||
      position[Edge.End]!.isDefined()
    );
  }

  verticalInsetsDefined(): boolean {
    const position = this.position_;
    return (
      position[Edge.Top]!.isDefined() ||
      position[Edge.Bottom]!.isDefined() ||
      position[Edge.All]!.isDefined() ||
      position[Edge.Vertical]!.isDefined()
    );
  }

  isFlexStartPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, flexStartEdge(axis), direction).isDefined();
  }

  isFlexStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, flexStartEdge(axis), direction).isAuto();
  }

  isInlineStartPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, inlineStartEdge(axis, direction), direction).isDefined();
  }

  isInlineStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, inlineStartEdge(axis, direction), direction).isAuto();
  }

  isFlexEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, flexEndEdge(axis), direction).isDefined();
  }

  isFlexEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, flexEndEdge(axis), direction).isAuto();
  }

  isInlineEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, inlineEndEdge(axis, direction), direction).isDefined();
  }

  isInlineEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position_, inlineEndEdge(axis, direction), direction).isAuto();
  }

  computeFlexStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position_, flexStartEdge(axis), direction).resolveValue(axisSize);
    return value !== value ? 0 : value;
  }

  computeInlineStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position_, inlineStartEdge(axis, direction), direction).resolveValue(axisSize);
    return value !== value ? 0 : value;
  }

  computeFlexEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position_, flexEndEdge(axis), direction).resolveValue(axisSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position_, inlineEndEdge(axis, direction), direction).resolveValue(axisSize);
    return value !== value ? 0 : value;
  }

  computeFlexStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin_, flexStartEdge(axis), direction).resolveValue(widthSize);
    return value !== value ? 0 : value;
  }

  computeInlineStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin_, inlineStartEdge(axis, direction), direction).resolveValue(widthSize);
    return value !== value ? 0 : value;
  }

  computeFlexEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin_, flexEndEdge(axis), direction).resolveValue(widthSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin_, inlineEndEdge(axis, direction), direction).resolveValue(widthSize);
    return value !== value ? 0 : value;
  }

  computeFlexStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border_, flexStartEdge(axis), direction).resolveValue(0), 0);
  }

  computeInlineStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border_, inlineStartEdge(axis, direction), direction).resolveValue(0), 0);
  }

  computeFlexEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border_, flexEndEdge(axis), direction).resolveValue(0), 0);
  }

  computeInlineEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border_, inlineEndEdge(axis, direction), direction).resolveValue(0), 0);
  }

  computeFlexStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(computeEdge(this.padding_, flexStartEdge(axis), direction).resolveValue(widthSize), 0);
  }

  computeInlineStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(computeEdge(this.padding_, inlineStartEdge(axis, direction), direction).resolveValue(widthSize), 0);
  }

  computeFlexEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(computeEdge(this.padding_, flexEndEdge(axis), direction).resolveValue(widthSize), 0);
  }

  computeInlineEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(computeEdge(this.padding_, inlineEndEdge(axis, direction), direction).resolveValue(widthSize), 0);
  }

  computeInlineStartPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeInlineStartPadding(axis, direction, widthSize) + this.computeInlineStartBorder(axis, direction)
    );
  }

  computeFlexStartPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeFlexStartPadding(axis, direction, widthSize) + this.computeFlexStartBorder(axis, direction)
    );
  }

  computeInlineEndPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeInlineEndPadding(axis, direction, widthSize) + this.computeInlineEndBorder(axis, direction)
    );
  }

  computeFlexEndPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeFlexEndPadding(axis, direction, widthSize) + this.computeFlexEndBorder(axis, direction)
    );
  }

  computePaddingAndBorderForDimension(
    direction: Direction,
    dimension: Dimension,
    widthSize: number,
  ): number {
    const flexDirectionForDimension =
      dimension === Dimension.Width ? FlexDirection.Row : FlexDirection.Column;

    return (
      this.computeFlexStartPaddingAndBorder(flexDirectionForDimension, direction, widthSize) +
      this.computeFlexEndPaddingAndBorder(flexDirectionForDimension, direction, widthSize)
    );
  }

  computeBorderForAxis(axis: FlexDirection): number {
    return (
      this.computeInlineStartBorder(axis, Direction.LTR) +
      this.computeInlineEndBorder(axis, Direction.LTR)
    );
  }

  computeMarginForAxis(axis: FlexDirection, widthSize: number): number {
    // The total margin for a given axis does not depend on the direction
    // so hardcoding LTR here to avoid piping direction to this function
    return (
      this.computeInlineStartMargin(axis, Direction.LTR, widthSize) +
      this.computeInlineEndMargin(axis, Direction.LTR, widthSize)
    );
  }

  computeGapForAxis(axis: FlexDirection, ownerSize: number): number {
    const gap = isRow(axis) ? this.computeColumnGap() : this.computeRowGap();
    return maxOrDefined(gap.resolveValue(ownerSize), 0);
  }

  flexStartMarginIsAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.margin_, flexStartEdge(axis), direction).isAuto();
  }

  flexEndMarginIsAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.margin_, flexEndEdge(axis), direction).isAuto();
  }

  /** Allocation-free `resolvedMinDimension` for the layout algorithm: NaN when undefined. */
  resolvedMinDimensionValue(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    return this.resolveDimensionBound(this.minDimensions_[axis]!, direction, axis, referenceLength, ownerWidth);
  }

  /** Allocation-free `resolvedMaxDimension` for the layout algorithm: NaN when undefined. */
  resolvedMaxDimensionValue(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    return this.resolveDimensionBound(this.maxDimensions_[axis]!, direction, axis, referenceLength, ownerWidth);
  }

  private resolveDimensionBound(
    bound: StyleSizeLength,
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const value = bound.resolveValue(referenceLength);
    if (this.boxSizing_ === BoxSizing.BorderBox || value !== value) {
      return value;
    }

    const dimensionPaddingAndBorder = this.computePaddingAndBorderForDimension(
      direction,
      axis,
      ownerWidth,
    );

    return (
      value + (dimensionPaddingAndBorder === dimensionPaddingAndBorder ? dimensionPaddingAndBorder : 0)
    );
  }

  private computeColumnGap(): StyleLength {
    const column = this.gap_[Gutter.Column]!;
    return column.isDefined() ? column : this.gap_[Gutter.All]!;
  }

  private computeRowGap(): StyleLength {
    const row = this.gap_[Gutter.Row]!;
    return row.isDefined() ? row : this.gap_[Gutter.All]!;
  }
}

const UNDEFINED_NUMBER = new FloatOptional();
const EDGE_COUNT = 9;
const GUTTER_COUNT = 3;

function undefinedLengths(count: number): StyleLength[] {
  return new Array<StyleLength>(count).fill(StyleLength.undefined());
}

function lengthsEqual<T extends { equals(rhs: T): boolean }>(
  lhs: readonly T[],
  rhs: readonly T[],
): boolean {
  for (let i = 0; i < lhs.length; i++) {
    if (!lhs[i]!.equals(rhs[i]!)) {
      return false;
    }
  }
  return true;
}

function computeEdge(
  edges: readonly StyleLength[],
  edge: PhysicalEdge,
  layoutDirection: Direction,
): StyleLength {
  switch (edge) {
    case PhysicalEdge.Left:
      if (layoutDirection === Direction.LTR && edges[Edge.Start]!.isDefined()) {
        return edges[Edge.Start]!;
      } else if (layoutDirection === Direction.RTL && edges[Edge.End]!.isDefined()) {
        return edges[Edge.End]!;
      } else if (edges[Edge.Left]!.isDefined()) {
        return edges[Edge.Left]!;
      } else if (edges[Edge.Horizontal]!.isDefined()) {
        return edges[Edge.Horizontal]!;
      } else {
        return edges[Edge.All]!;
      }
    case PhysicalEdge.Top:
      if (edges[Edge.Top]!.isDefined()) {
        return edges[Edge.Top]!;
      } else if (edges[Edge.Vertical]!.isDefined()) {
        return edges[Edge.Vertical]!;
      } else {
        return edges[Edge.All]!;
      }
    case PhysicalEdge.Right:
      if (layoutDirection === Direction.LTR && edges[Edge.End]!.isDefined()) {
        return edges[Edge.End]!;
      } else if (layoutDirection === Direction.RTL && edges[Edge.Start]!.isDefined()) {
        return edges[Edge.Start]!;
      } else if (edges[Edge.Right]!.isDefined()) {
        return edges[Edge.Right]!;
      } else if (edges[Edge.Horizontal]!.isDefined()) {
        return edges[Edge.Horizontal]!;
      } else {
        return edges[Edge.All]!;
      }
    case PhysicalEdge.Bottom:
      if (edges[Edge.Bottom]!.isDefined()) {
        return edges[Edge.Bottom]!;
      } else if (edges[Edge.Vertical]!.isDefined()) {
        return edges[Edge.Vertical]!;
      } else {
        return edges[Edge.All]!;
      }
  }
}
