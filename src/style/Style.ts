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
  Unit,
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
  // Empty edge groups share one immutable array. The first setter that gives
  // a group a value replaces it with an owned copy, and resetting its last
  // value returns it to the shared array.
  private margin_: Readonly<EdgeLengths> = UNDEFINED_EDGE_LENGTHS;
  private position_: Readonly<EdgeLengths> = UNDEFINED_EDGE_LENGTHS;
  private padding_: Readonly<EdgeLengths> = UNDEFINED_EDGE_LENGTHS;
  private border_: Readonly<EdgeLengths> = UNDEFINED_EDGE_LENGTHS;

  get margin(): Readonly<EdgeLengths> {
    return this.margin_;
  }

  get position(): Readonly<EdgeLengths> {
    return this.position_;
  }

  get padding(): Readonly<EdgeLengths> {
    return this.padding_;
  }

  get border(): Readonly<EdgeLengths> {
    return this.border_;
  }
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
  private paddingHasPercent = false;
  /**
   * Margin, border and padding of each physical edge in points, laid out like
   * `resolvedMargin`: what layout copies into a node's results. Auto and
   * undefined count as 0. Only valid while `edgesNeedOwnerWidth` is false.
   */
  marginPoints: readonly number[] = NO_INSETS;
  borderPoints: readonly number[] = NO_INSETS;
  paddingPoints: readonly number[] = NO_INSETS;
  /** Whether a margin or padding is a percentage, so that the edges depend on the owner's width. */
  edgesNeedOwnerWidth = false;
  private positionHasPercent = false;
  private gapHasPercent = false;
  // These four groups stay on shared, read-only defaults until their first
  // change. Most nodes never set gaps or bounds, and many never set an
  // explicit size, so allocating four arrays per Style is otherwise wasted.
  gap: Readonly<GutterLengths> = DEFAULT_GAP;
  dimensions: Readonly<DimensionLengths> = DEFAULT_DIMENSIONS;
  minDimensions: Readonly<DimensionLengths> = DEFAULT_SIZE_BOUNDS;
  maxDimensions: Readonly<DimensionLengths> = DEFAULT_SIZE_BOUNDS;
  /** Whether any min or max size is set. Most nodes have none, and bounding a size is then a no-op. */
  hasSizeBounds = false;
  // The min and max sizes in points (NaN when unset), valid while neither is a percentage.
  private sizeBoundsArePoints = true;
  private minPoints: number[] = NO_SIZE_BOUNDS;
  private maxPoints: number[] = NO_SIZE_BOUNDS;

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
    this.margin_ = assignEdgeLengths(this.margin_, other.margin_);
    this.definedMargin = other.definedMargin;
    this.resolvedMargin = resolveEdges(this.margin, this.definedMargin, this.resolvedMargin);
    this.updateMarginForAxes();
    this.position_ = assignEdgeLengths(this.position_, other.position_);
    this.definedPosition = other.definedPosition;
    this.resolvedPosition = resolveEdges(
      this.position,
      this.definedPosition,
      this.resolvedPosition,
    );
    this.padding_ = assignEdgeLengths(this.padding_, other.padding_);
    this.definedPadding = other.definedPadding;
    this.resolvedPadding = resolveEdges(this.padding, this.definedPadding, this.resolvedPadding);
    this.border_ = assignEdgeLengths(this.border_, other.border_);
    this.definedBorder = other.definedBorder;
    this.resolvedBorder = resolveEdges(this.border, this.definedBorder, this.resolvedBorder);
    this.updatePaddingAndBorder();
    this.gap = assignLengths(this.gap, other.gap, DEFAULT_GAP);
    this.dimensions = assignLengths(this.dimensions, other.dimensions, DEFAULT_DIMENSIONS);
    this.minDimensions = assignLengths(
      this.minDimensions,
      other.minDimensions,
      DEFAULT_SIZE_BOUNDS,
    );
    this.maxDimensions = assignLengths(
      this.maxDimensions,
      other.maxDimensions,
      DEFAULT_SIZE_BOUNDS,
    );
    this.updateHasSizeBounds();
    this.aspectRatio = other.aspectRatio;
    this.updatePositionHasPercent();
    this.updateGapHasPercent();
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
    this.definedMargin = withEdge(this.definedMargin, edge, value);
    if (this.definedMargin === 0) {
      this.margin_ = UNDEFINED_EDGE_LENGTHS;
    } else {
      const margin = writableEdgeLengths(this.margin_);
      margin[edge] = value;
      this.margin_ = margin;
    }
    this.resolvedMargin = resolveEdges(this.margin, this.definedMargin, this.resolvedMargin);
    this.updateMarginForAxes();
    return true;
  }

  /** Returns whether the value changed. */
  setPosition(edge: Edge, value: StyleLength): boolean {
    if (this.position[edge].equals(value)) {
      return false;
    }
    this.definedPosition = withEdge(this.definedPosition, edge, value);
    if (this.definedPosition === 0) {
      this.position_ = UNDEFINED_EDGE_LENGTHS;
    } else {
      const position = writableEdgeLengths(this.position_);
      position[edge] = value;
      this.position_ = position;
    }
    this.resolvedPosition = resolveEdges(
      this.position,
      this.definedPosition,
      this.resolvedPosition,
    );
    this.updatePositionHasPercent();
    return true;
  }

  /** Returns whether the value changed. */
  setPadding(edge: Edge, value: StyleLength): boolean {
    if (this.padding[edge].equals(value)) {
      return false;
    }
    this.definedPadding = withEdge(this.definedPadding, edge, value);
    if (this.definedPadding === 0) {
      this.padding_ = UNDEFINED_EDGE_LENGTHS;
    } else {
      const padding = writableEdgeLengths(this.padding_);
      padding[edge] = value;
      this.padding_ = padding;
    }
    this.resolvedPadding = resolveEdges(this.padding, this.definedPadding, this.resolvedPadding);
    this.updatePaddingAndBorder();
    return true;
  }

  /** Returns whether the value changed. */
  setBorder(edge: Edge, value: StyleLength): boolean {
    if (this.border[edge].equals(value)) {
      return false;
    }
    this.definedBorder = withEdge(this.definedBorder, edge, value);
    if (this.definedBorder === 0) {
      this.border_ = UNDEFINED_EDGE_LENGTHS;
    } else {
      const border = writableEdgeLengths(this.border_);
      border[edge] = value;
      this.border_ = border;
    }
    this.resolvedBorder = resolveEdges(this.border, this.definedBorder, this.resolvedBorder);
    this.updatePaddingAndBorder();
    return true;
  }

  /** Returns whether the value changed. */
  setGap(gutter: Gutter, value: StyleLength): boolean {
    if (this.gap[gutter].equals(value)) {
      return false;
    }
    if (this.gap === DEFAULT_GAP) {
      this.gap = [...DEFAULT_GAP];
    }
    (this.gap as GutterLengths)[gutter] = value;
    this.updateGapHasPercent();
    return true;
  }

  /** Returns whether the value changed. */
  setDimension(dimension: Dimension, value: StyleLength): boolean {
    if (this.dimensions[dimension].equals(value)) {
      return false;
    }
    if (this.dimensions === DEFAULT_DIMENSIONS) {
      this.dimensions = [...DEFAULT_DIMENSIONS];
    }
    (this.dimensions as DimensionLengths)[dimension] = value;
    this.updateDependsOnOwnerSize();
    return true;
  }

  /** Returns whether the value changed. */
  setMinDimension(dimension: Dimension, value: StyleLength): boolean {
    if (this.minDimensions[dimension].equals(value)) {
      return false;
    }
    if (this.minDimensions === DEFAULT_SIZE_BOUNDS) {
      this.minDimensions = [...DEFAULT_SIZE_BOUNDS];
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
    if (this.maxDimensions === DEFAULT_SIZE_BOUNDS) {
      this.maxDimensions = [...DEFAULT_SIZE_BOUNDS];
    }
    (this.maxDimensions as DimensionLengths)[dimension] = value;
    this.updateHasSizeBounds();
    return true;
  }

  /** Whether any `position` edge is set. */
  hasInsets(): boolean {
    return this.definedPosition !== 0;
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
      const index = edgeIndex(inlineStartEdge(axis, direction), direction);
      return this.paddingPoints[index]! + this.borderPoints[index]!;
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
      const index = edgeIndex(flexStartEdge(axis), direction);
      return this.paddingPoints[index]! + this.borderPoints[index]!;
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
      const index = edgeIndex(inlineEndEdge(axis, direction), direction);
      return this.paddingPoints[index]! + this.borderPoints[index]!;
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
      const index = edgeIndex(flexEndEdge(axis), direction);
      return this.paddingPoints[index]! + this.borderPoints[index]!;
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
    if (this.sizeBoundsArePoints && this.boxSizing === BoxSizing.BorderBox) {
      return this.minPoints[axis]!;
    }
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
    if (this.sizeBoundsArePoints && this.boxSizing === BoxSizing.BorderBox) {
      return this.maxPoints[axis]!;
    }
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

  /**
   * Whether a margin, padding or size of the node is a percentage. The node's
   * layout then depends on its owner's size, beyond the space it is given. The
   * owner resolves the node's width and height into that space, but aligning
   * several lines asks for the node's own cross size again.
   */
  dependsOnOwnerSize = false;

  /**
   * Whether the node's layout depends on the space its owner offers beyond
   * the size it ends up with: a percentage anywhere, a percentage flex basis,
   * or an aspect ratio, which derives one axis from the space of the other.
   * The layout cache of the owner reuses a result computed in a different
   * space only when no child depends on that space.
   */
  dependsOnOwnerSpace = false;

  private updateDependsOnOwnerSize(): void {
    this.dependsOnOwnerSize =
      this.edgesNeedOwnerWidth ||
      !this.sizeBoundsArePoints ||
      this.dimensions[Dimension.Width].isPercent() ||
      this.dimensions[Dimension.Height].isPercent();
    this.updateDependsOnOwnerSpace();
  }

  updateDependsOnOwnerSpace(): void {
    this.dependsOnOwnerSpace =
      this.dependsOnOwnerSize ||
      this.positionHasPercent ||
      this.gapHasPercent ||
      this.flexBasis.isPercent() ||
      this.aspectRatio === this.aspectRatio ||
      this.overflow === Overflow.Scroll;
  }

  private updatePositionHasPercent(): void {
    let hasPercent = false;
    for (let i = 0; i < 8; i++) {
      hasPercent = hasPercent || this.resolvedPosition[i]!.isPercent();
    }
    this.positionHasPercent = hasPercent;
    this.updateDependsOnOwnerSpace();
  }

  private updateGapHasPercent(): void {
    this.gapHasPercent =
      this.gap[Gutter.Column]!.isPercent() ||
      this.gap[Gutter.Row]!.isPercent() ||
      this.gap[Gutter.All]!.isPercent();
    this.updateDependsOnOwnerSpace();
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
    this.edgesNeedOwnerWidth = hasPercent || this.paddingHasPercent;
    this.updateDependsOnOwnerSize();
    if (!hasPercent) {
      this.marginPoints = resolvePoints(this.resolvedMargin, this.marginPoints, false);
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
    this.edgesNeedOwnerWidth = hasPercent || this.marginHasPercent;
    this.updateDependsOnOwnerSize();
    this.borderPoints = resolvePoints(this.resolvedBorder, this.borderPoints, true);
    if (!hasPercent) {
      this.paddingPoints = resolvePoints(this.resolvedPadding, this.paddingPoints, true);
    }
  }

  private updateHasSizeBounds(): void {
    let hasSizeBounds = false;
    let arePoints = true;
    for (let dim = Dimension.Width; dim <= Dimension.Height; dim++) {
      const min = this.minDimensions[dim]!;
      const max = this.maxDimensions[dim]!;
      hasSizeBounds = hasSizeBounds || min.isDefined() || max.isDefined();
      arePoints = arePoints && !min.isPercent() && !max.isPercent();
    }
    this.hasSizeBounds = hasSizeBounds;
    this.sizeBoundsArePoints = arePoints;
    this.updateDependsOnOwnerSize();
    if (this.minPoints === NO_SIZE_BOUNDS) {
      if (!hasSizeBounds) {
        return;
      }
      this.minPoints = [NaN, NaN];
      this.maxPoints = [NaN, NaN];
    }
    for (let dim = Dimension.Width; dim <= Dimension.Height; dim++) {
      this.minPoints[dim] = this.minDimensions[dim]!.resolve(NaN);
      this.maxPoints[dim] = this.maxDimensions[dim]!.resolve(NaN);
    }
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

const DEFAULT_GAP: Readonly<GutterLengths> = [
  StyleLength.undefined(),
  StyleLength.undefined(),
  StyleLength.undefined(),
];
const DEFAULT_DIMENSIONS: Readonly<DimensionLengths> = [
  StyleLength.ofAuto(),
  StyleLength.ofAuto(),
];
const DEFAULT_SIZE_BOUNDS: Readonly<DimensionLengths> = [
  StyleLength.undefined(),
  StyleLength.undefined(),
];

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

const UNDEFINED_EDGE_LENGTHS: Readonly<EdgeLengths> = Object.freeze(undefinedEdges());

/** Returns a style-owned edge array, copying the shared default on first write. */
function writableEdgeLengths(edges: Readonly<EdgeLengths>): EdgeLengths {
  return edges === UNDEFINED_EDGE_LENGTHS ? ([...edges] as EdgeLengths) : (edges as EdgeLengths);
}

/** Copies an edge group without allocating when the source is empty. */
function assignEdgeLengths(
  current: Readonly<EdgeLengths>,
  source: Readonly<EdgeLengths>,
): Readonly<EdgeLengths> {
  if (source === UNDEFINED_EDGE_LENGTHS) {
    return UNDEFINED_EDGE_LENGTHS;
  }
  const target = writableEdgeLengths(current);
  copyInto(target, source);
  return target;
}

function copyInto<T>(to: T[], from: readonly T[]): void {
  for (let i = 0, length = from.length; i < length; i++) {
    to[i] = from[i]!;
  }
}

function assignLengths<T extends readonly StyleLength[]>(
  current: T,
  source: T,
  defaults: T,
): T {
  if (source === defaults) {
    return defaults;
  }
  if (current === defaults) {
    return [...source] as unknown as T;
  }
  copyInto(current as unknown as StyleLength[], source);
  return current;
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

const NO_SIZE_BOUNDS: number[] = [NaN, NaN];
const NO_INSETS: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

/** Refills one of the `*Points` caches, reusing `points` once a style has its own. */
function resolvePoints(
  resolved: readonly StyleLength[],
  points: readonly number[],
  clampToZero: boolean,
): readonly number[] {
  if (points === NO_INSETS) {
    if (resolved === NO_EDGES) {
      return points;
    }
    points = NO_INSETS.slice();
  }
  for (let i = 0; i < 8; i++) {
    // A percentage only gets here for a border, which has none: it counts as 0.
    const value = resolved[i]!.unit === Unit.Point ? resolved[i]!.value : 0;
    (points as number[])[i] = value !== value || (clampToZero && value < 0) ? 0 : value;
  }
  return points;
}

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
