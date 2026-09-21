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
import { maxOrDefined } from "../math.ts";
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
  readonly margin: Readonly<EdgeLengths> = undefinedEdges();
  readonly position: Readonly<EdgeLengths> = undefinedEdges();
  readonly padding: Readonly<EdgeLengths> = undefinedEdges();
  readonly border: Readonly<EdgeLengths> = undefinedEdges();
  // One bit per `Edge` that holds a defined length. Resolving a physical edge
  // consults these instead of probing up to five lengths, and most nodes leave
  // most groups empty. Kept in sync by the setters below.
  private definedMargin = 0;
  private definedPosition = 0;
  private definedPadding = 0;
  private definedBorder = 0;
  // What `computeEdge` gives for each physical edge, under LTR (0-3) and RTL
  // (4-7). Layout asks for these dozens of times per node and pass, so the
  // setters work them out once. A group without lengths shares `NO_EDGES`.
  private resolvedMargin: StyleLength[] = NO_EDGES;
  private resolvedPosition: StyleLength[] = NO_EDGES;
  private resolvedPadding: StyleLength[] = NO_EDGES;
  private resolvedBorder: StyleLength[] = NO_EDGES;
  // `computeMarginForAxis` of both axes, valid while no margin is a percentage.
  private marginHasPercent = false;
  private marginHasAuto = false;
  private marginForRow = 0;
  private marginForColumn = 0;
  // Padding plus border of each physical edge, laid out like `resolvedPadding`
  // and valid while no padding is a percentage.
  private paddingHasPercent = false;
  private paddingAndBorder: number[] = NO_INSETS;
  readonly gap: GutterLengths = [
    StyleLength.undefined(),
    StyleLength.undefined(),
    StyleLength.undefined(),
  ];
  readonly dimensions: Readonly<DimensionLengths> = [StyleLength.ofAuto(), StyleLength.ofAuto()];
  readonly minDimensions: Readonly<DimensionLengths> = [
    StyleLength.undefined(),
    StyleLength.undefined(),
  ];
  readonly maxDimensions: Readonly<DimensionLengths> = [
    StyleLength.undefined(),
    StyleLength.undefined(),
  ];
  /** Whether any min or max size is set. Most nodes have none, and bounding a size is then a no-op. */
  hasSizeBounds = false;

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
    copyInto(this.margin as EdgeLengths, other.margin);
    this.definedMargin = other.definedMargin;
    this.resolvedMargin = resolveEdges(this.margin, this.definedMargin, this.resolvedMargin);
    this.updateMarginForAxes();
    copyInto(this.position as EdgeLengths, other.position);
    this.definedPosition = other.definedPosition;
    this.resolvedPosition = resolveEdges(
      this.position,
      this.definedPosition,
      this.resolvedPosition,
    );
    copyInto(this.padding as EdgeLengths, other.padding);
    this.definedPadding = other.definedPadding;
    this.resolvedPadding = resolveEdges(this.padding, this.definedPadding, this.resolvedPadding);
    copyInto(this.border as EdgeLengths, other.border);
    this.definedBorder = other.definedBorder;
    this.resolvedBorder = resolveEdges(this.border, this.definedBorder, this.resolvedBorder);
    this.updatePaddingAndBorder();
    copyInto(this.gap, other.gap);
    copyInto(this.dimensions as DimensionLengths, other.dimensions);
    copyInto(this.minDimensions as DimensionLengths, other.minDimensions);
    copyInto(this.maxDimensions as DimensionLengths, other.maxDimensions);
    this.hasSizeBounds = other.hasSizeBounds;
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

  /** Returns whether the value changed. */
  setMargin(edge: Edge, value: StyleLength): boolean {
    if (this.margin[edge].equals(value)) {
      return false;
    }
    (this.margin as EdgeLengths)[edge] = value;
    this.definedMargin = withEdge(this.definedMargin, edge, value);
    this.resolvedMargin = resolveEdges(this.margin, this.definedMargin, this.resolvedMargin);
    this.updateMarginForAxes();
    return true;
  }

  /** Returns whether the value changed. */
  setPosition(edge: Edge, value: StyleLength): boolean {
    if (this.position[edge].equals(value)) {
      return false;
    }
    (this.position as EdgeLengths)[edge] = value;
    this.definedPosition = withEdge(this.definedPosition, edge, value);
    this.resolvedPosition = resolveEdges(
      this.position,
      this.definedPosition,
      this.resolvedPosition,
    );
    return true;
  }

  /** Returns whether the value changed. */
  setPadding(edge: Edge, value: StyleLength): boolean {
    if (this.padding[edge].equals(value)) {
      return false;
    }
    (this.padding as EdgeLengths)[edge] = value;
    this.definedPadding = withEdge(this.definedPadding, edge, value);
    this.resolvedPadding = resolveEdges(this.padding, this.definedPadding, this.resolvedPadding);
    this.updatePaddingAndBorder();
    return true;
  }

  /** Returns whether the value changed. */
  setBorder(edge: Edge, value: StyleLength): boolean {
    if (this.border[edge].equals(value)) {
      return false;
    }
    (this.border as EdgeLengths)[edge] = value;
    this.definedBorder = withEdge(this.definedBorder, edge, value);
    this.resolvedBorder = resolveEdges(this.border, this.definedBorder, this.resolvedBorder);
    this.updatePaddingAndBorder();
    return true;
  }

  /** Returns whether the value changed. */
  setDimension(dimension: Dimension, value: StyleLength): boolean {
    if (this.dimensions[dimension].equals(value)) {
      return false;
    }
    (this.dimensions as DimensionLengths)[dimension] = value;
    return true;
  }

  /** Returns whether the value changed. */
  setMinDimension(dimension: Dimension, value: StyleLength): boolean {
    if (this.minDimensions[dimension].equals(value)) {
      return false;
    }
    (this.minDimensions as DimensionLengths)[dimension] = value;
    this.updateHasSizeBounds();
    return true;
  }

  /** Returns whether the value changed. */
  setMaxDimension(dimension: Dimension, value: StyleLength): boolean {
    if (this.maxDimensions[dimension].equals(value)) {
      return false;
    }
    (this.maxDimensions as DimensionLengths)[dimension] = value;
    this.updateHasSizeBounds();
    return true;
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
    return edgeLength(this.resolvedPosition, flexStartEdge(axis), direction).isDefined();
  }

  isFlexStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, flexStartEdge(axis), direction).isAuto();
  }

  isInlineStartPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(
      this.resolvedPosition,
      inlineStartEdge(axis, direction),
      direction,
    ).isDefined();
  }

  isInlineStartPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, inlineStartEdge(axis, direction), direction).isAuto();
  }

  isFlexEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, flexEndEdge(axis), direction).isDefined();
  }

  isFlexEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, flexEndEdge(axis), direction).isAuto();
  }

  isInlineEndPositionDefined(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, inlineEndEdge(axis, direction), direction).isDefined();
  }

  isInlineEndPositionAuto(axis: FlexDirection, direction: Direction): boolean {
    return edgeLength(this.resolvedPosition, inlineEndEdge(axis, direction), direction).isAuto();
  }

  computeFlexStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = edgeLength(this.resolvedPosition, flexStartEdge(axis), direction).resolve(
      axisSize,
    );
    return value !== value ? 0 : value;
  }

  computeInlineStartPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = edgeLength(
      this.resolvedPosition,
      inlineStartEdge(axis, direction),
      direction,
    ).resolve(axisSize);
    return value !== value ? 0 : value;
  }

  computeFlexEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = edgeLength(this.resolvedPosition, flexEndEdge(axis), direction).resolve(axisSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndPosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const value = edgeLength(
      this.resolvedPosition,
      inlineEndEdge(axis, direction),
      direction,
    ).resolve(axisSize);
    return value !== value ? 0 : value;
  }

  computeFlexStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = edgeLength(this.resolvedMargin, flexStartEdge(axis), direction).resolve(
      widthSize,
    );
    return value !== value ? 0 : value;
  }

  computeInlineStartMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = edgeLength(
      this.resolvedMargin,
      inlineStartEdge(axis, direction),
      direction,
    ).resolve(widthSize);
    return value !== value ? 0 : value;
  }

  computeFlexEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = edgeLength(this.resolvedMargin, flexEndEdge(axis), direction).resolve(widthSize);
    return value !== value ? 0 : value;
  }

  computeInlineEndMargin(axis: FlexDirection, direction: Direction, widthSize: number): number {
    const value = edgeLength(
      this.resolvedMargin,
      inlineEndEdge(axis, direction),
      direction,
    ).resolve(widthSize);
    return value !== value ? 0 : value;
  }

  computeFlexStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      edgeLength(this.resolvedBorder, flexStartEdge(axis), direction).resolve(0),
      0,
    );
  }

  computeInlineStartBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      edgeLength(this.resolvedBorder, inlineStartEdge(axis, direction), direction).resolve(0),
      0,
    );
  }

  computeFlexEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      edgeLength(this.resolvedBorder, flexEndEdge(axis), direction).resolve(0),
      0,
    );
  }

  computeInlineEndBorder(axis: FlexDirection, direction: Direction): number {
    return maxOrDefined(
      edgeLength(this.resolvedBorder, inlineEndEdge(axis, direction), direction).resolve(0),
      0,
    );
  }

  computeFlexStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      edgeLength(this.resolvedPadding, flexStartEdge(axis), direction).resolve(widthSize),
      0,
    );
  }

  computeInlineStartPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      edgeLength(this.resolvedPadding, inlineStartEdge(axis, direction), direction).resolve(
        widthSize,
      ),
      0,
    );
  }

  computeFlexEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      edgeLength(this.resolvedPadding, flexEndEdge(axis), direction).resolve(widthSize),
      0,
    );
  }

  computeInlineEndPadding(axis: FlexDirection, direction: Direction, widthSize: number): number {
    return maxOrDefined(
      edgeLength(this.resolvedPadding, inlineEndEdge(axis, direction), direction).resolve(
        widthSize,
      ),
      0,
    );
  }

  computeInlineStartPaddingAndBorder(
    axis: FlexDirection,
    direction: Direction,
    widthSize: number,
  ): number {
    if ((this.definedPadding | this.definedBorder) === 0) {
      return 0;
    }
    if (!this.paddingHasPercent) {
      return this.paddingAndBorder[edgeIndex(inlineStartEdge(axis, direction), direction)]!;
    }
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
    if ((this.definedPadding | this.definedBorder) === 0) {
      return 0;
    }
    if (!this.paddingHasPercent) {
      return this.paddingAndBorder[edgeIndex(flexStartEdge(axis), direction)]!;
    }
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
    if ((this.definedPadding | this.definedBorder) === 0) {
      return 0;
    }
    if (!this.paddingHasPercent) {
      return this.paddingAndBorder[edgeIndex(inlineEndEdge(axis, direction), direction)]!;
    }
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
    if ((this.definedPadding | this.definedBorder) === 0) {
      return 0;
    }
    if (!this.paddingHasPercent) {
      return this.paddingAndBorder[edgeIndex(flexEndEdge(axis), direction)]!;
    }
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
    if (this.definedBorder === 0) {
      return 0;
    }
    return (
      this.computeInlineStartBorder(axis, Direction.LTR) +
      this.computeInlineEndBorder(axis, Direction.LTR)
    );
  }

  computeMarginForAxis(axis: FlexDirection, widthSize: number): number {
    if (this.definedMargin === 0) {
      return 0;
    }
    if (!this.marginHasPercent) {
      return isRow(axis) ? this.marginForRow : this.marginForColumn;
    }
    return this.resolveMarginForAxis(axis, widthSize);
  }

  private resolveMarginForAxis(axis: FlexDirection, widthSize: number): number {
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
    return (
      this.marginHasAuto && edgeLength(this.resolvedMargin, flexStartEdge(axis), direction).isAuto()
    );
  }

  flexEndMarginIsAuto(axis: FlexDirection, direction: Direction): boolean {
    return (
      this.marginHasAuto && edgeLength(this.resolvedMargin, flexEndEdge(axis), direction).isAuto()
    );
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

  private updateMarginForAxes(): void {
    let hasPercent = false;
    let hasAuto = false;
    for (let i = 0; i < 8; i++) {
      hasPercent = hasPercent || this.resolvedMargin[i]!.isPercent();
      hasAuto = hasAuto || this.resolvedMargin[i]!.isAuto();
    }
    this.marginHasPercent = hasPercent;
    this.marginHasAuto = hasAuto;
    if (!hasPercent) {
      this.marginForRow = this.resolveMarginForAxis(FlexDirection.Row, NaN);
      this.marginForColumn = this.resolveMarginForAxis(FlexDirection.Column, NaN);
    }
  }

  private updatePaddingAndBorder(): void {
    let hasPercent = false;
    for (let i = 0; i < 8; i++) {
      hasPercent = hasPercent || this.resolvedPadding[i]!.isPercent();
    }
    this.paddingHasPercent = hasPercent;
    if (hasPercent || (this.definedPadding | this.definedBorder) === 0) {
      return;
    }
    if (this.paddingAndBorder === NO_INSETS) {
      this.paddingAndBorder = NO_INSETS.slice();
    }
    for (let i = 0; i < 8; i++) {
      this.paddingAndBorder[i] =
        maxOrDefined(this.resolvedPadding[i]!.resolve(NaN), 0) +
        maxOrDefined(this.resolvedBorder[i]!.resolve(0), 0);
    }
  }

  private updateHasSizeBounds(): void {
    this.hasSizeBounds =
      this.minDimensions[Dimension.Width].isDefined() ||
      this.minDimensions[Dimension.Height].isDefined() ||
      this.maxDimensions[Dimension.Width].isDefined() ||
      this.maxDimensions[Dimension.Height].isDefined();
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

const NO_EDGES: StyleLength[] = [];
for (let i = 0; i < 8; i++) {
  NO_EDGES.push(StyleLength.undefined());
}

const NO_INSETS: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

/** Where the caches keep a physical edge for a layout direction. */
function edgeIndex(edge: PhysicalEdge, layoutDirection: Direction): number {
  return layoutDirection === Direction.RTL ? edge + 4 : edge;
}

/** The cached `computeEdge` of a physical edge. */
function edgeLength(
  resolved: readonly StyleLength[],
  edge: PhysicalEdge,
  layoutDirection: Direction,
): StyleLength {
  return resolved[edgeIndex(edge, layoutDirection)]!;
}

/** Refills the cache behind `edgeLength`, reusing `resolved` once a style has its own. */
function resolveEdges(
  edges: Readonly<EdgeLengths>,
  defined: number,
  resolved: StyleLength[],
): StyleLength[] {
  if (resolved === NO_EDGES) {
    if (defined === 0) {
      return resolved;
    }
    resolved = NO_EDGES.slice();
  }
  for (let edge = PhysicalEdge.Left; edge <= PhysicalEdge.Bottom; edge++) {
    resolved[edge] = computeEdge(edges, defined, edge as PhysicalEdge, Direction.LTR);
    resolved[edge + 4] = computeEdge(edges, defined, edge as PhysicalEdge, Direction.RTL);
  }
  return resolved;
}

function withEdge(defined: number, edge: Edge, value: StyleLength): number {
  return value.isDefined() ? defined | (1 << edge) : defined & ~(1 << edge);
}

function computeEdge(
  edges: Readonly<EdgeLengths>,
  defined: number,
  edge: PhysicalEdge,
  layoutDirection: Direction,
): StyleLength {
  if (defined === 0) {
    return StyleLength.undefined();
  }
  switch (edge) {
    case PhysicalEdge.Left:
      if (layoutDirection === Direction.LTR && (defined & START) !== 0) {
        return edges[Edge.Start];
      } else if (layoutDirection === Direction.RTL && (defined & END) !== 0) {
        return edges[Edge.End];
      } else if ((defined & LEFT) !== 0) {
        return edges[Edge.Left];
      } else if ((defined & HORIZONTAL) !== 0) {
        return edges[Edge.Horizontal];
      } else {
        return edges[Edge.All];
      }
    case PhysicalEdge.Top:
      if ((defined & TOP) !== 0) {
        return edges[Edge.Top];
      } else if ((defined & VERTICAL) !== 0) {
        return edges[Edge.Vertical];
      } else {
        return edges[Edge.All];
      }
    case PhysicalEdge.Right:
      if (layoutDirection === Direction.LTR && (defined & END) !== 0) {
        return edges[Edge.End];
      } else if (layoutDirection === Direction.RTL && (defined & START) !== 0) {
        return edges[Edge.Start];
      } else if ((defined & RIGHT) !== 0) {
        return edges[Edge.Right];
      } else if ((defined & HORIZONTAL) !== 0) {
        return edges[Edge.Horizontal];
      } else {
        return edges[Edge.All];
      }
    case PhysicalEdge.Bottom:
      if ((defined & BOTTOM) !== 0) {
        return edges[Edge.Bottom];
      } else if ((defined & VERTICAL) !== 0) {
        return edges[Edge.Vertical];
      } else {
        return edges[Edge.All];
      }
  }
}

const LEFT = 1 << Edge.Left;
const TOP = 1 << Edge.Top;
const RIGHT = 1 << Edge.Right;
const BOTTOM = 1 << Edge.Bottom;
const START = 1 << Edge.Start;
const END = 1 << Edge.End;
const HORIZONTAL = 1 << Edge.Horizontal;
const VERTICAL = 1 << Edge.Vertical;
