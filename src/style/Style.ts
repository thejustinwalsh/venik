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
import { StyleLength } from "./StyleLength.ts";

/**
 * The style of a node: plain fields, plus the methods that resolve them
 * against a direction or a reference length.
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

  direction: Direction = Direction.Inherit;
  flexDirection: FlexDirection = FlexDirection.Row;
  justifyContent: Justify = Justify.FlexStart;
  alignContent: Align = Align.Stretch;
  alignItems: Align = Align.Stretch;
  alignSelf: Align = Align.Auto;
  positionType: PositionType = PositionType.Static;
  flexWrap: Wrap = Wrap.NoWrap;
  overflow: Overflow = Overflow.Visible;
  display: Display = Display.Flex;
  boxSizing: BoxSizing = BoxSizing.BorderBox;

  // NaN is undefined.
  flex: number = NaN;
  flexGrow: number = NaN;
  flexShrink: number = NaN;
  flexBasis: StyleLength = StyleLength.ofAuto();
  /** Degenerate ratios (0, infinite) are stored as undefined by `Node.setAspectRatio`. */
  aspectRatio: number = NaN;

  // Indexed by `Edge`, `Gutter` and `Dimension`.
  readonly margin: EdgeLengths = undefinedEdges();
  readonly position: EdgeLengths = undefinedEdges();
  readonly padding: EdgeLengths = undefinedEdges();
  readonly border: EdgeLengths = undefinedEdges();
  readonly gap: GutterLengths = [
    StyleLength.undefined(),
    StyleLength.undefined(),
    StyleLength.undefined(),
  ];
  readonly dimensions: DimensionLengths = [StyleLength.ofAuto(), StyleLength.ofAuto()];
  readonly minDimensions: DimensionLengths = [StyleLength.undefined(), StyleLength.undefined()];
  readonly maxDimensions: DimensionLengths = [StyleLength.undefined(), StyleLength.undefined()];

  /** Copies every property of `other`. `this` shares no mutable state with `other` afterwards. */
  assign(other: Style): void {
    this.direction = other.direction;
    this.flexDirection = other.flexDirection;
    this.justifyContent = other.justifyContent;
    this.alignContent = other.alignContent;
    this.alignItems = other.alignItems;
    this.alignSelf = other.alignSelf;
    this.positionType = other.positionType;
    this.flexWrap = other.flexWrap;
    this.overflow = other.overflow;
    this.display = other.display;
    this.boxSizing = other.boxSizing;
    this.flex = other.flex;
    this.flexGrow = other.flexGrow;
    this.flexShrink = other.flexShrink;
    this.flexBasis = other.flexBasis;
    copyInto(this.margin, other.margin);
    copyInto(this.position, other.position);
    copyInto(this.padding, other.padding);
    copyInto(this.border, other.border);
    copyInto(this.gap, other.gap);
    copyInto(this.dimensions, other.dimensions);
    copyInto(this.minDimensions, other.minDimensions);
    copyInto(this.maxDimensions, other.maxDimensions);
    this.aspectRatio = other.aspectRatio;
  }

  /** C++ `operator==`. */
  equals(other: Style): boolean {
    // Like C++, boxSizing is not part of the comparison.
    return (
      this.direction === other.direction &&
      this.flexDirection === other.flexDirection &&
      this.justifyContent === other.justifyContent &&
      this.alignContent === other.alignContent &&
      this.alignItems === other.alignItems &&
      this.alignSelf === other.alignSelf &&
      this.positionType === other.positionType &&
      this.flexWrap === other.flexWrap &&
      this.overflow === other.overflow &&
      this.display === other.display &&
      Object.is(this.flex, other.flex) &&
      Object.is(this.flexGrow, other.flexGrow) &&
      Object.is(this.flexShrink, other.flexShrink) &&
      this.flexBasis.equals(other.flexBasis) &&
      lengthsEqual(this.margin, other.margin) &&
      lengthsEqual(this.position, other.position) &&
      lengthsEqual(this.padding, other.padding) &&
      lengthsEqual(this.border, other.border) &&
      lengthsEqual(this.gap, other.gap) &&
      lengthsEqual(this.dimensions, other.dimensions) &&
      lengthsEqual(this.minDimensions, other.minDimensions) &&
      lengthsEqual(this.maxDimensions, other.maxDimensions) &&
      Object.is(this.aspectRatio, other.aspectRatio)
    );
  }

  horizontalInsetsDefined(): boolean {
    const position = this.position;
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
    const position = this.position;
    return (
      position[Edge.Top]!.isDefined() ||
      position[Edge.Bottom]!.isDefined() ||
      position[Edge.All]!.isDefined() ||
      position[Edge.Vertical]!.isDefined()
    );
  }

  isFlexStartPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, flexStartEdge(axis), direction).isDefined();
  }

  isFlexStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, flexStartEdge(axis), direction).isAuto();
  }

  isInlineStartPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, inlineStartEdge(axis, direction), direction).isDefined();
  }

  isInlineStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, inlineStartEdge(axis, direction), direction).isAuto();
  }

  isFlexEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, flexEndEdge(axis), direction).isDefined();
  }

  isFlexEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, flexEndEdge(axis), direction).isAuto();
  }

  isInlineEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, inlineEndEdge(axis, direction), direction).isDefined();
  }

  isInlineEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.position, inlineEndEdge(axis, direction), direction).isAuto();
  }

  computeFlexStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position, flexStartEdge(axis), direction).resolve(axisSize);
    return value !== value ? 0 : value;
  }

  computeInlineStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position, inlineStartEdge(axis, direction), direction).resolve(
      axisSize,
    );
    return value !== value ? 0 : value;
  }

  computeFlexEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position, flexEndEdge(axis), direction).resolve(axisSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = computeEdge(this.position, inlineEndEdge(axis, direction), direction).resolve(
      axisSize,
    );
    return value !== value ? 0 : value;
  }

  computeFlexStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin, flexStartEdge(axis), direction).resolve(widthSize);
    return value !== value ? 0 : value;
  }

  computeInlineStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin, inlineStartEdge(axis, direction), direction).resolve(
      widthSize,
    );
    return value !== value ? 0 : value;
  }

  computeFlexEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin, flexEndEdge(axis), direction).resolve(widthSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = computeEdge(this.margin, inlineEndEdge(axis, direction), direction).resolve(
      widthSize,
    );
    return value !== value ? 0 : value;
  }

  computeFlexStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border, flexStartEdge(axis), direction).resolve(0), 0);
  }

  computeInlineStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      computeEdge(this.border, inlineStartEdge(axis, direction), direction).resolve(0),
      0,
    );
  }

  computeFlexEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(computeEdge(this.border, flexEndEdge(axis), direction).resolve(0), 0);
  }

  computeInlineEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      computeEdge(this.border, inlineEndEdge(axis, direction), direction).resolve(0),
      0,
    );
  }

  computeFlexStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      computeEdge(this.padding, flexStartEdge(axis), direction).resolve(widthSize),
      0,
    );
  }

  computeInlineStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      computeEdge(this.padding, inlineStartEdge(axis, direction), direction).resolve(widthSize),
      0,
    );
  }

  computeFlexEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      computeEdge(this.padding, flexEndEdge(axis), direction).resolve(widthSize),
      0,
    );
  }

  computeInlineEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      computeEdge(this.padding, inlineEndEdge(axis, direction), direction).resolve(widthSize),
      0,
    );
  }

  computeInlineStartPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeInlineStartPadding(axis, direction, widthSize) +
      this.computeInlineStartBorder(axis, direction)
    );
  }

  computeFlexStartPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeFlexStartPadding(axis, direction, widthSize) +
      this.computeFlexStartBorder(axis, direction)
    );
  }

  computeInlineEndPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeInlineEndPadding(axis, direction, widthSize) +
      this.computeInlineEndBorder(axis, direction)
    );
  }

  computeFlexEndPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    return (
      this.computeFlexEndPadding(axis, direction, widthSize) +
      this.computeFlexEndBorder(axis, direction)
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
    return maxOrDefined(gap.resolve(ownerSize), 0);
  }

  flexStartMarginIsAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.margin, flexStartEdge(axis), direction).isAuto();
  }

  flexEndMarginIsAuto(axis: FlexDirection, direction: Direction): boolean {
    return computeEdge(this.margin, flexEndEdge(axis), direction).isAuto();
  }

  /** Allocation-free `resolvedMinDimension` for the layout algorithm: NaN when undefined. */
  resolvedMinDimension(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    return this.resolveDimensionBound(
      this.minDimensions[axis]!,
      direction,
      axis,
      referenceLength,
      ownerWidth,
    );
  }

  /** Allocation-free `resolvedMaxDimension` for the layout algorithm: NaN when undefined. */
  resolvedMaxDimension(
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    return this.resolveDimensionBound(
      this.maxDimensions[axis]!,
      direction,
      axis,
      referenceLength,
      ownerWidth,
    );
  }

  private resolveDimensionBound(
    bound: StyleLength,
    direction: Direction,
    axis: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const value = bound.resolve(referenceLength);
    if (this.boxSizing === BoxSizing.BorderBox || value !== value) {
      return value;
    }

    const dimensionPaddingAndBorder = this.computePaddingAndBorderForDimension(
      direction,
      axis,
      ownerWidth,
    );

    return (
      value +
      (dimensionPaddingAndBorder === dimensionPaddingAndBorder ? dimensionPaddingAndBorder : 0)
    );
  }

  private computeColumnGap(): StyleLength {
    const column = this.gap[Gutter.Column]!;
    return column.isDefined() ? column : this.gap[Gutter.All]!;
  }

  private computeRowGap(): StyleLength {
    const row = this.gap[Gutter.Row]!;
    return row.isDefined() ? row : this.gap[Gutter.All]!;
  }
}

type EdgeLengths = [
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
  StyleLength,
];
type GutterLengths = [StyleLength, StyleLength, StyleLength];
type DimensionLengths = [StyleLength, StyleLength];

function undefinedEdges(): EdgeLengths {
  const undefinedLength = StyleLength.undefined();
  return [
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
    undefinedLength,
  ];
}

function copyInto<T>(to: T[], from: readonly T[]): void {
  for (let i = 0, length = from.length; i < length; i++) {
    to[i] = from[i]!;
  }
}

function lengthsEqual(lhs: readonly StyleLength[], rhs: readonly StyleLength[]): boolean {
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
