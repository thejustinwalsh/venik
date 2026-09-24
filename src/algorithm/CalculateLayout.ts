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
  SizingMode,
  Overflow,
  PositionType,
  Wrap,
} from "../enums.ts";
import { Event, LayoutData, LayoutPassReason, LayoutType } from "../event/event.ts";
import type { CachedMeasurement } from "../node/CachedMeasurement.ts";
import { LayoutResults } from "../node/LayoutResults.ts";
import type { Node } from "../node/Node.ts";
import { inexactEquals, maxOrDefined, minOrDefined, sameSpace } from "../math.ts";
import type { Style } from "../style/Style.ts";
import type { StyleLength } from "../style/StyleLength.ts";
import { layoutAbsoluteDescendants } from "./AbsoluteLayout.ts";
import { fallbackAlignment, fallbackJustification, resolveChildAlignment } from "./Align.ts";
import { baselineOf, calculateBaseline, isBaselineLayout } from "./Baseline.ts";
import {
  boundAxis,
  boundAxisAbovePaddingAndBorder,
  boundAxisInPlace,
  boundAxisValue,
  boundAxisWithinMinAndMax,
  paddingAndBorderForAxis,
} from "./BoundAxis.ts";
import {
  findCachedMeasurement,
  findRelaxedMeasurement,
  hasSameOwnerSize,
  LAYOUT_MISS,
  LAYOUT_STRETCHED,
  relaxedLayoutFits,
} from "./Cache.ts";
import {
  dimension,
  flexStartEdge,
  isColumn,
  isRow,
  PhysicalEdge,
  resolveCrossDirection,
  resolveDirection,
} from "./FlexDirection.ts";
import {
  acquireFlexLine,
  calculateFlexLine,
  type FlexLine,
  flexLinePoolDepth,
  releaseFlexLine,
  restoreFlexLinePool,
} from "./FlexLine.ts";
import { roundLayoutResultsToPixelGrid } from "./PixelGrid.ts";
import { needsTrailingPosition, setChildTrailingPosition } from "./TrailingPosition.ts";

let gCurrentGenerationCount = 0;
// Public layout calls currently executing. Clean-root fast exits are disabled
// inside callbacks so reentrant layouts retain the normal pass bookkeeping.
let gActiveLayoutPasses = 0;

// Whether the measurement under way has left results of its own somewhere in
// the subtree it went through, in place of those of the node's last layout:
// margins or paddings that are percentages, or the overflow flag.
let gMeasurementLeftResults = false;
// Set by `calculateLayoutImpl`: whether the result it computed is `relaxable`
// (see `CachedMeasurement`).
let gPassRelaxable = false;
// Set by `calculateLayoutImpl` for a layout pass: whether a measurement in
// the same space would have found another size. A measurement given an
// exact cross size skips the flex step and sums the items' flex bases, where
// a layout sums the sizes the items' own passes report: those differ when
// the content overflows and shrinks, and in the corners where an item's pass
// resolves its size otherwise than its basis was. A measurement that runs
// the flex step asks its items for measurements, which differ from their
// layouts by the same token, one level down.
let gPassMeasureDiffers = false;
// Set by `distributeFreeSpaceSecondPass`, for the line it laid out.
let gLineItemSizeDiffers = false;
let gLineItemMeasureDiffers = false;
// Set by `calculateLayoutImpl`: whether the layout it computed is
// `mainSizeInvariant`, and its `mainContentSize` (see `CachedMeasurement`).
let gPassMainSizeInvariant = false;
let gPassMainContentSize = NaN;
// Whether the pass issuing the current request, or a pass above it, aligns
// its children by their baselines. A measurement and a layout of the same
// node report different baselines, as Yoga computes them, and a node's
// baseline is computed from a child's: below such a pass, every result comes
// from a pass of the kind asked for.
let gOwnerIsBaselineLayout = false;

const DIRECTIONS = [Direction.LTR, Direction.RTL] as const;

function hasAutoHorizontalMargin(style: Style): boolean {
  for (let i = 0, length = DIRECTIONS.length; i < length; i++) {
    const direction = DIRECTIONS[i]!;
    if (
      style.flexStartMarginIsAuto(FlexDirection.Row, direction) ||
      style.flexEndMarginIsAuto(FlexDirection.Row, direction)
    ) {
      return true;
    }
  }
  return false;
}

function isColumnStretchEdge(owner: Node | null, child: Node | null): boolean {
  if (owner === null || child === null) {
    return false;
  }

  const ownerStyle = owner.style;
  const childStyle = child.style;
  const childWidth = child.getProcessedDimension(Dimension.Width);
  return (
    ownerStyle.display === Display.Flex &&
    isColumn(ownerStyle.flexDirection) &&
    ownerStyle.flexWrap === Wrap.NoWrap &&
    childStyle.positionType !== PositionType.Absolute &&
    childStyle.aspectRatio !== childStyle.aspectRatio &&
    (childWidth.isAuto() || childWidth.isUndefined()) &&
    !hasAutoHorizontalMargin(childStyle) &&
    resolveChildAlignment(owner, child) === Align.Stretch
  );
}

function isInColumnStretchScrollSubtree(node: Node): boolean {
  let current: Node | null = node;
  while (current !== null) {
    let owner: Node | null = current.owner;
    while (owner !== null && owner.style.display === Display.Contents) {
      owner = owner.owner;
    }
    if (owner === null || !isColumnStretchEdge(owner, current)) {
      return false;
    }
    if (owner.style.overflow === Overflow.Scroll) {
      return true;
    }
    current = owner;
  }
  return false;
}

function isNonZeroLength(length: StyleLength): boolean {
  const value = length.value;
  return length.isAuto() || (value === value && value !== 0.0);
}

const VERTICAL_EDGES = [Edge.Top, Edge.Bottom, Edge.Vertical, Edge.All] as const;

function hasNonZeroVerticalSpacing(style: Style): boolean {
  for (let i = 0, length = VERTICAL_EDGES.length; i < length; i++) {
    const edge = VERTICAL_EDGES[i]!;
    if (
      isNonZeroLength(style.margin[edge]) ||
      isNonZeroLength(style.padding[edge]) ||
      isNonZeroLength(style.border[edge])
    ) {
      return true;
    }
  }
  return false;
}

const ALL_EDGES = [
  Edge.Left,
  Edge.Top,
  Edge.Right,
  Edge.Bottom,
  Edge.Start,
  Edge.End,
  Edge.Horizontal,
  Edge.Vertical,
  Edge.All,
] as const;

const DIMENSIONS = [Dimension.Width, Dimension.Height] as const;

function hasPercentageLength(style: Style): boolean {
  for (let i = 0, length = ALL_EDGES.length; i < length; i++) {
    const edge = ALL_EDGES[i]!;
    if (
      style.margin[edge].isPercent() ||
      style.position[edge].isPercent() ||
      style.padding[edge].isPercent() ||
      style.border[edge].isPercent()
    ) {
      return true;
    }
  }

  for (let i = 0, length = DIMENSIONS.length; i < length; i++) {
    const dim = DIMENSIONS[i]!;
    if (
      style.dimensions[dim].isPercent() ||
      style.minDimensions[dim].isPercent() ||
      style.maxDimensions[dim].isPercent()
    ) {
      return true;
    }
  }

  return (
    style.flexBasis.isPercent() ||
    style.gap[Gutter.Column].isPercent() ||
    style.gap[Gutter.Row].isPercent() ||
    style.gap[Gutter.All].isPercent()
  );
}

function hasNonZeroFlex(node: Node): boolean {
  const style = node.style;
  const flex = style.flex;
  const flexGrow = style.flexGrow;
  const flexShrink = style.flexShrink;

  const canGrow = flexGrow === flexGrow ? flexGrow !== 0.0 : flex > 0.0;
  // An unset flex-shrink is the CSS default of 1.
  const canShrink = flexShrink === flexShrink ? flexShrink !== 0.0 : true;
  return canGrow || canShrink;
}

function isHeightFitContentIndependent(node: Node): boolean {
  const style = node.style;
  const height = style.dimensions[Dimension.Height];
  const flexBasis = style.flexBasis;
  const hasRelativePercentPosition =
    style.position[Edge.Top].isPercent() ||
    style.position[Edge.Bottom].isPercent() ||
    style.position[Edge.Vertical].isPercent() ||
    style.position[Edge.All].isPercent();

  return (
    !node.hasMeasureFunc() &&
    !node.hasBaselineFunc() &&
    !node.isReferenceBaseline() &&
    (height.isAuto() || height.isUndefined()) &&
    style.minDimensions[Dimension.Height].isUndefined() &&
    style.maxDimensions[Dimension.Height].isUndefined() &&
    (flexBasis.isAuto() || flexBasis.isUndefined()) &&
    !hasNonZeroFlex(node) &&
    style.boxSizing === BoxSizing.BorderBox &&
    style.aspectRatio !== style.aspectRatio &&
    style.positionType !== PositionType.Absolute &&
    style.overflow !== Overflow.Scroll &&
    style.display === Display.Flex &&
    isColumn(style.flexDirection) &&
    style.alignItems === Align.Stretch &&
    (style.alignSelf === Align.Auto || style.alignSelf === Align.Stretch) &&
    style.justifyContent === Justify.FlexStart &&
    style.flexWrap === Wrap.NoWrap &&
    !style.gap[Gutter.All].isDefined() &&
    !style.gap[Gutter.Row].isDefined() &&
    !hasRelativePercentPosition &&
    !hasNonZeroVerticalSpacing(style) &&
    !hasPercentageLength(style)
  );
}

// Scratch stack of `canSkipHeightFitContent`, which calls nothing re-entrant.
const heightFitContentStack: Node[] = [];

function canSkipHeightFitContent(root: Node | null): boolean {
  if (root === null) {
    return false;
  }

  const maxPendingNodes = 64;
  const stack = heightFitContentStack;
  stack.length = 0;
  stack.push(root);

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!isHeightFitContentIndependent(node)) {
      stack.length = 0;
      return false;
    }

    const children = node.getLayoutChildren();
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i]!;
      if (stack.length === maxPendingNodes) {
        stack.length = 0;
        return false;
      }
      stack.push(child);
    }
  }

  return true;
}

/** The max size (including margin) `constrainMaxSize*ForMode` clamp against; NaN if there is none. */
function maxSizeForMode(
  node: Node,
  direction: Direction,
  axis: FlexDirection,
  ownerAxisSize: number,
  ownerWidth: number,
): number {
  // Returning the NaN literal matters: V8 boxes a computed double that a
  // function returns (unless the call is inlined), but not a constant.
  if (node.style.maxDimensions[dimension(axis)].isUndefined()) {
    return NaN;
  }
  return (
    node.style.resolvedMaxDimension(direction, dimension(axis), ownerAxisSize, ownerWidth) +
    node.style.computeMarginForAxis(axis, ownerWidth)
  );
}

/** The `size` out parameter of C++ `constrainMaxSizeForMode`. Call before `constrainMaxSizeModeForMode`. */
function constrainMaxSizeForMode(mode: SizingMode, size: number, maxSize: number): number {
  if (mode === SizingMode.MaxContent) {
    return maxSize === maxSize ? maxSize : size;
  }
  return maxSize !== maxSize || size < maxSize ? size : maxSize;
}

/** The `mode` out parameter of C++ `constrainMaxSizeForMode`. */
function constrainMaxSizeModeForMode(mode: SizingMode, maxSize: number): SizingMode {
  return mode === SizingMode.MaxContent && maxSize === maxSize ? SizingMode.FitContent : mode;
}

function computeFlexBasisForChild(
  node: Node,
  child: Node,
  width: number,
  widthMode: SizingMode,
  height: number,
  ownerWidth: number,
  ownerHeight: number,
  heightMode: SizingMode,
  direction: Direction,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): void {
  const mainAxis = resolveDirection(node.style.flexDirection, direction);
  const isMainAxisRow = isRow(mainAxis);
  const mainAxisSize = isMainAxisRow ? width : height;
  const mainAxisOwnerSize = isMainAxisRow ? ownerWidth : ownerHeight;

  let childWidth = NaN;
  let childHeight = NaN;
  let childWidthSizingMode: SizingMode;
  let childHeightSizingMode: SizingMode;

  const resolvedFlexBasis = child.resolveFlexBasis(
    direction,
    mainAxis,
    mainAxisOwnerSize,
    ownerWidth,
  );
  const isRowStyleDimDefined = child.hasDefiniteLength(Dimension.Width, ownerWidth);
  const isColumnStyleDimDefined = child.hasDefiniteLength(Dimension.Height, ownerHeight);

  const useResolvedFlexBasis =
    resolvedFlexBasis === resolvedFlexBasis && mainAxisSize === mainAxisSize;

  if (useResolvedFlexBasis) {
    const childLayout = child.layout;
    if (
      childLayout.computedFlexBasis !== childLayout.computedFlexBasis ||
      childLayout.computedFlexBasisGeneration !== generationCount
    ) {
      const paddingAndBorder = paddingAndBorderForAxis(child, mainAxis, direction, ownerWidth);
      childLayout.computedFlexBasis = maxOrDefined(resolvedFlexBasis, paddingAndBorder);
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    const paddingAndBorder = paddingAndBorderForAxis(
      child,
      FlexDirection.Row,
      direction,
      ownerWidth,
    );

    child.layout.computedFlexBasis = maxOrDefined(
      child.getResolvedDimension(direction, Dimension.Width, ownerWidth, ownerWidth),
      paddingAndBorder,
    );
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    const paddingAndBorder = paddingAndBorderForAxis(
      child,
      FlexDirection.Column,
      direction,
      ownerWidth,
    );
    child.layout.computedFlexBasis = maxOrDefined(
      child.getResolvedDimension(direction, Dimension.Height, ownerHeight, ownerWidth),
      paddingAndBorder,
    );
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidthSizingMode = SizingMode.MaxContent;
    childHeightSizingMode = SizingMode.MaxContent;

    const marginRow = child.style.computeMarginForAxis(FlexDirection.Row, ownerWidth);
    const marginColumn = child.style.computeMarginForAxis(FlexDirection.Column, ownerWidth);

    if (isRowStyleDimDefined) {
      childWidth =
        child.getResolvedDimension(direction, Dimension.Width, ownerWidth, ownerWidth) + marginRow;
      childWidthSizingMode = SizingMode.StretchFit;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
        child.getResolvedDimension(direction, Dimension.Height, ownerHeight, ownerWidth) +
        marginColumn;
      childHeightSizingMode = SizingMode.StretchFit;
    }

    // The W3C spec doesn't say anything about the 'overflow' property, but all
    // major browsers appear to implement the following logic.
    if (
      (!isMainAxisRow && node.style.overflow === Overflow.Scroll) ||
      node.style.overflow !== Overflow.Scroll
    ) {
      if (childWidth !== childWidth && width === width) {
        childWidth = width;
        childWidthSizingMode = SizingMode.FitContent;
      }
    }

    // A zero-intrinsic-height column subtree has the same layout with an
    // unbounded height, allowing its measurement cache to survive unrelated
    // size changes elsewhere in a vertical scroll subtree.
    const parentDoesNotScroll = node.style.overflow !== Overflow.Scroll;
    let applyHeightFitContent = isMainAxisRow || parentDoesNotScroll;
    const childHadOverflow = child.isDirty() && child.layout.hadOverflow;
    const hasHeightIndependentSubtree =
      !isMainAxisRow &&
      parentDoesNotScroll &&
      childHeight !== childHeight &&
      height === height &&
      isColumnStretchEdge(node, child) &&
      isInColumnStretchScrollSubtree(node) &&
      canSkipHeightFitContent(child);
    if (hasHeightIndependentSubtree && childHadOverflow) {
      child.layout.hadOverflow = false;
    }
    if (hasHeightIndependentSubtree) {
      applyHeightFitContent = false;
    }

    if (applyHeightFitContent && childHeight !== childHeight && height === height) {
      childHeight = height;
      childHeightSizingMode = SizingMode.FitContent;
    }

    const aspectRatio = child.style.aspectRatio;
    const hasAspectRatio = aspectRatio === aspectRatio;
    if (hasAspectRatio) {
      if (!isMainAxisRow && childWidthSizingMode === SizingMode.StretchFit) {
        childHeight = marginColumn + (childWidth - marginRow) / aspectRatio;
        childHeightSizingMode = SizingMode.StretchFit;
      } else if (isMainAxisRow && childHeightSizingMode === SizingMode.StretchFit) {
        childWidth = marginRow + (childHeight - marginColumn) * aspectRatio;
        childWidthSizingMode = SizingMode.StretchFit;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch, set
    // the cross axis to be measured exactly with the available inner width

    const isStretched = resolveChildAlignment(node, child) === Align.Stretch;
    const hasExactWidth = width === width && widthMode === SizingMode.StretchFit;
    const childWidthStretch = isStretched && childWidthSizingMode !== SizingMode.StretchFit;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth && childWidthStretch) {
      childWidth = width;
      childWidthSizingMode = SizingMode.StretchFit;
      if (hasAspectRatio) {
        childHeight = (childWidth - marginRow) / aspectRatio;
        childHeightSizingMode = SizingMode.StretchFit;
      }
    }

    const hasExactHeight = height === height && heightMode === SizingMode.StretchFit;
    const childHeightStretch = isStretched && childHeightSizingMode !== SizingMode.StretchFit;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight && childHeightStretch) {
      childHeight = height;
      childHeightSizingMode = SizingMode.StretchFit;

      if (hasAspectRatio) {
        childWidth = (childHeight - marginColumn) * aspectRatio;
        childWidthSizingMode = SizingMode.StretchFit;
      }
    }

    const hasSizeBounds = child.style.hasSizeBounds;
    const maxWidth = hasSizeBounds
      ? maxSizeForMode(child, direction, FlexDirection.Row, ownerWidth, ownerWidth)
      : NaN;
    childWidth = constrainMaxSizeForMode(childWidthSizingMode, childWidth, maxWidth);
    childWidthSizingMode = constrainMaxSizeModeForMode(childWidthSizingMode, maxWidth);
    const maxHeight = hasSizeBounds
      ? maxSizeForMode(child, direction, FlexDirection.Column, ownerHeight, ownerWidth)
      : NaN;
    childHeight = constrainMaxSizeForMode(childHeightSizingMode, childHeight, maxHeight);
    childHeightSizingMode = constrainMaxSizeModeForMode(childHeightSizingMode, maxHeight);

    // Measure the child. A container that cannot grow ends up at the main
    // size it is measured to, and, unless it is stretched in a space that is
    // not yet known, at the cross size it is measured in. Measuring it in
    // that space is then the layout it needs: done as one, the layout pass
    // finds it in the cache instead of computing it a second time.
    // Cheapest and most often false first: most children measured here are
    // leaves.
    const promote =
      child.getLayoutChildCount() !== 0 &&
      // A measurement and a layout agree on the size only of a node whose
      // size follows its content: a percentage below resolves against another
      // reference in each. The flag is that of the last full pass, so a dirty
      // node waits for one.
      child.layout.contentSized &&
      !child.isDirty() &&
      !gOwnerIsBaselineLayout &&
      // Nor do they agree on the cross size of a node aligning its children
      // by their baselines, which each pass takes from passes of its own kind.
      !child.layout.baselineLayout &&
      !child.style.dependsOnOwnerSpace &&
      !child.hasMeasureFunc() &&
      child.resolveFlexGrow() === 0 &&
      // A measurement takes a space of nothing to fit for a size of nothing,
      // where a layout in it reports the content (see `isFixedSize`).
      !(childWidthSizingMode === SizingMode.FitContent && childWidth <= 0) &&
      !(childHeightSizingMode === SizingMode.FitContent && childHeight <= 0) &&
      (!isStretched ||
        (isMainAxisRow ? childHeightSizingMode : childWidthSizingMode) === SizingMode.StretchFit);
    calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      childWidthSizingMode,
      childHeightSizingMode,
      ownerWidth,
      ownerHeight,
      promote,
      LayoutPassReason.MeasureChild,
      layoutMarkerData,
      depth,
      generationCount,
    );

    child.layout.computedFlexBasis = maxOrDefined(
      child.layout.measuredDimensions[dimension(mainAxis)],
      paddingAndBorderForAxis(child, mainAxis, direction, ownerWidth),
    );
  }
  child.layout.computedFlexBasisGeneration = generationCount;
}

function measureNodeWithMeasureFunc(
  node: Node,
  direction: Direction,
  availableWidth: number,
  availableHeight: number,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  ownerWidth: number,
  ownerHeight: number,
  layoutMarkerData: LayoutData | null,
  reason: LayoutPassReason,
): void {
  if (!node.hasMeasureFunc()) {
    throw new Error("Expected node to have custom measure function");
  }

  if (widthSizingMode === SizingMode.MaxContent) {
    availableWidth = NaN;
  }
  if (heightSizingMode === SizingMode.MaxContent) {
    availableHeight = NaN;
  }

  const layout = node.layout;
  const paddingAndBorderAxisRow =
    layout.padding[PhysicalEdge.Left] +
    layout.padding[PhysicalEdge.Right] +
    layout.border[PhysicalEdge.Left] +
    layout.border[PhysicalEdge.Right];
  const paddingAndBorderAxisColumn =
    layout.padding[PhysicalEdge.Top] +
    layout.padding[PhysicalEdge.Bottom] +
    layout.border[PhysicalEdge.Top] +
    layout.border[PhysicalEdge.Bottom];

  // We want to make sure we don't call measure with negative size
  const innerWidth =
    availableWidth !== availableWidth
      ? availableWidth
      : maxOrDefined(0.0, availableWidth - paddingAndBorderAxisRow);
  const innerHeight =
    availableHeight !== availableHeight
      ? availableHeight
      : maxOrDefined(0.0, availableHeight - paddingAndBorderAxisColumn);

  if (widthSizingMode === SizingMode.StretchFit && heightSizingMode === SizingMode.StretchFit) {
    // Don't bother sizing the text if both dimensions are already defined.
    layout.measuredDimensions[Dimension.Width] = boundAxis(
      node,
      FlexDirection.Row,
      direction,
      availableWidth,
      ownerWidth,
      ownerWidth,
    );
    layout.measuredDimensions[Dimension.Height] = boundAxis(
      node,
      FlexDirection.Column,
      direction,
      availableHeight,
      ownerHeight,
      ownerWidth,
    );
  } else {
    if (__EVENTS__) Event.publish(node, Event.MeasureCallbackStart);

    // Measure the text under the current constraints.
    // Both numbers are read here, before anything else runs, so a measure
    // function may return the same object every time. An invalid (negative or
    // NaN) dimension counts as 0.
    const measuredSize = node.measure(innerWidth, widthSizingMode, innerHeight, heightSizingMode);
    const measuredWidth = maxOrDefined(0, measuredSize.width);
    const measuredHeight = maxOrDefined(0, measuredSize.height);

    if (__EVENTS__ && layoutMarkerData !== null) {
      layoutMarkerData.measureCallbacks += 1;
      layoutMarkerData.measureCallbackReasonsCount[reason]! += 1;
    }

    if (__EVENTS__ && Event.hasSubscribers()) {
      Event.publish(node, Event.MeasureCallbackEnd, {
        width: innerWidth,
        widthSizingMode,
        height: innerHeight,
        heightSizingMode,
        measuredWidth,
        measuredHeight,
        reason,
      });
    }

    layout.measuredDimensions[Dimension.Width] = boundAxis(
      node,
      FlexDirection.Row,
      direction,
      widthSizingMode === SizingMode.MaxContent || widthSizingMode === SizingMode.FitContent
        ? measuredWidth + paddingAndBorderAxisRow
        : availableWidth,
      ownerWidth,
      ownerWidth,
    );

    layout.measuredDimensions[Dimension.Height] = boundAxis(
      node,
      FlexDirection.Column,
      direction,
      heightSizingMode === SizingMode.MaxContent || heightSizingMode === SizingMode.FitContent
        ? measuredHeight + paddingAndBorderAxisColumn
        : availableHeight,
      ownerHeight,
      ownerWidth,
    );
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
function measureNodeWithoutChildren(
  node: Node,
  direction: Direction,
  availableWidth: number,
  availableHeight: number,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  ownerWidth: number,
  ownerHeight: number,
): void {
  const layout = node.layout;
  const paddingAndBorderRow =
    layout.padding[PhysicalEdge.Left] +
    layout.padding[PhysicalEdge.Right] +
    layout.border[PhysicalEdge.Left] +
    layout.border[PhysicalEdge.Right];
  const paddingAndBorderColumn =
    layout.padding[PhysicalEdge.Top] +
    layout.padding[PhysicalEdge.Bottom] +
    layout.border[PhysicalEdge.Top] +
    layout.border[PhysicalEdge.Bottom];

  const width = widthSizingMode === SizingMode.StretchFit ? availableWidth : paddingAndBorderRow;
  const height =
    heightSizingMode === SizingMode.StretchFit ? availableHeight : paddingAndBorderColumn;

  if (node.style.hasSizeBounds) {
    layout.measuredDimensions[Dimension.Width] = boundAxis(
      node,
      FlexDirection.Row,
      direction,
      width,
      ownerWidth,
      ownerWidth,
    );
    layout.measuredDimensions[Dimension.Height] = boundAxis(
      node,
      FlexDirection.Column,
      direction,
      height,
      ownerHeight,
      ownerWidth,
    );
  } else {
    // All `boundAxis` does without min or max sizes. The sums above are the
    // padding and border it would work out again.
    layout.measuredDimensions[Dimension.Width] =
      width >= paddingAndBorderRow ? width : paddingAndBorderRow;
    layout.measuredDimensions[Dimension.Height] =
      height >= paddingAndBorderColumn ? height : paddingAndBorderColumn;
  }
}

function isFixedSize(dim: number, sizingMode: SizingMode): boolean {
  return (
    sizingMode === SizingMode.StretchFit || (sizingMode === SizingMode.FitContent && dim <= 0.0)
  );
}

function measureNodeWithFixedSize(
  node: Node,
  direction: Direction,
  availableWidth: number,
  availableHeight: number,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  ownerWidth: number,
  ownerHeight: number,
): boolean {
  if (
    isFixedSize(availableWidth, widthSizingMode) &&
    isFixedSize(availableHeight, heightSizingMode)
  ) {
    const layout = node.layout;
    layout.measuredDimensions[Dimension.Width] = boundAxis(
      node,
      FlexDirection.Row,
      direction,
      availableWidth !== availableWidth ||
        (widthSizingMode === SizingMode.FitContent && availableWidth < 0.0)
        ? 0.0
        : availableWidth,
      ownerWidth,
      ownerWidth,
    );

    layout.measuredDimensions[Dimension.Height] = boundAxis(
      node,
      FlexDirection.Column,
      direction,
      availableHeight !== availableHeight ||
        (heightSizingMode === SizingMode.FitContent && availableHeight < 0.0)
        ? 0.0
        : availableHeight,
      ownerHeight,
      ownerWidth,
    );
    return true;
  }

  return false;
}

function resetLayout(node: Node): void {
  node.layout.reset();
  node.setLayoutDimension(0, Dimension.Width);
  node.setLayoutDimension(0, Dimension.Height);
}

function zeroOutLayoutRecursively(node: Node): void {
  resetLayout(node);
  node.hasNewLayout = true;

  const children = node.getChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    zeroOutLayoutRecursively(child);
  }
}

export function cleanupContentsNodesRecursively(node: Node, didPerformLayout: boolean): void {
  if (node.hasContentsChildren()) {
    const children = node.getChildren();
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i]!;
      if (child.style.display === Display.Contents) {
        resetLayout(child);
        if (didPerformLayout) {
          child.hasNewLayout = true;
        }
        child.setDirty(false);

        cleanupContentsNodesRecursively(child, didPerformLayout);
      }
    }
  }
}

function calculateAvailableInnerDimension(
  node: Node,
  direction: Direction,
  dimension: Dimension,
  availableDim: number,
  paddingAndBorder: number,
  ownerDim: number,
  ownerWidth: number,
): number {
  let availableInnerDim = availableDim - paddingAndBorder;
  // Max dimension overrides predefined dimension value; Min dimension in turn
  // overrides both of the above
  if (availableInnerDim === availableInnerDim) {
    // We want to make sure our available height does not violate min and max
    // constraints
    const minDimension = node.style.resolvedMinDimension(
      direction,
      dimension,
      ownerDim,
      ownerWidth,
    );
    const minInnerDim = minDimension !== minDimension ? 0.0 : minDimension - paddingAndBorder;

    const maxDimension = node.style.resolvedMaxDimension(
      direction,
      dimension,
      ownerDim,
      ownerWidth,
    );

    const maxInnerDim = maxDimension !== maxDimension ? Infinity : maxDimension - paddingAndBorder;
    availableInnerDim = maxOrDefined(minOrDefined(availableInnerDim, maxInnerDim), minInnerDim);
  }

  return availableInnerDim;
}

function computeFlexBasisForChildren(
  node: Node,
  availableInnerWidth: number,
  availableInnerHeight: number,
  ownerWidth: number,
  ownerHeight: number,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  direction: Direction,
  mainAxis: FlexDirection,
  performLayout: boolean,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): number {
  let totalOuterFlexBasis = 0.0;
  let singleFlexChild: Node | null = null;
  const children = node.getLayoutChildren();
  const sizingModeMainDim = isRow(mainAxis) ? widthSizingMode : heightSizingMode;
  // If there is only one child with flexGrow + flexShrink it means we can set
  // the computedFlexBasis to 0 instead of measuring and shrinking / flexing the
  // child to exactly match the remaining space
  if (sizingModeMainDim === SizingMode.StretchFit) {
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i]!;
      if (child.isNodeFlexible()) {
        if (
          singleFlexChild !== null ||
          inexactEquals(child.resolveFlexGrow(), 0.0) ||
          inexactEquals(child.resolveFlexShrink(), 0.0)
        ) {
          // There is already a flexible child, or this flexible child doesn't
          // have flexGrow and flexShrink, abort
          singleFlexChild = null;
          break;
        } else {
          singleFlexChild = child;
        }
      }
    }
  }

  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    if (child.style.display === Display.None) {
      // Only mutate display: none children during layout passes. Zeroing them
      // out during measure-only passes contributes nothing to the measurement,
      // but sets `hasNewLayout` on nodes the parent's layout pass may never
      // visit (e.g. when its layout is restored from cache).
      if (performLayout) {
        zeroOutLayoutRecursively(child);
        child.hasNewLayout = true;
        child.setDirty(false);
      }
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const childDirection = child.resolveDirection(direction);
      child.setLayoutPositionFromStyle(childDirection, availableInnerWidth, availableInnerHeight);
    }

    if (child.style.positionType === PositionType.Absolute) {
      continue;
    }
    if (child === singleFlexChild) {
      child.layout.computedFlexBasisGeneration = generationCount;
      child.layout.computedFlexBasis = 0;
    } else {
      computeFlexBasisForChild(
        node,
        child,
        availableInnerWidth,
        widthSizingMode,
        availableInnerHeight,
        ownerWidth,
        ownerHeight,
        heightSizingMode,
        direction,
        layoutMarkerData,
        depth,
        generationCount,
      );
    }

    totalOuterFlexBasis +=
      child.layout.computedFlexBasis +
      child.style.computeMarginForAxis(mainAxis, availableInnerWidth);
  }

  return totalOuterFlexBasis;
}

// The size a flex item starts from when the free space of its line is
// distributed: its flex base size while it can still flex, else its
// hypothetical main size, which is the base size within the min and max size.
//
// An item cannot flex when its factor is zero, or when its base size already
// lies beyond the limit on the side the line flexes to: a growing line leaves
// an item at its max size alone. An item below its min size still grows from
// its base size, so that the space it needs to reach the min size comes out of
// the free space (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths).
//
// `freeSpaceSign` is positive for a line that grows and negative for one that
// shrinks. `flexStartingSizeIsFrozen` tells, after the call, whether the limit
// keeps an item with a flex factor from flexing, and `flexHypotheticalSize`
// holds the item's hypothetical main size.
let flexStartingSizeIsFrozen = false;
let flexHypotheticalSize = 0;

function flexStartingSize(
  child: Node,
  direction: Direction,
  mainAxis: FlexDirection,
  availableInnerMainDim: number,
  availableInnerWidth: number,
  freeSpaceSign: number,
): number {
  const flexBasis = child.layout.computedFlexBasis;
  const hypotheticalSize = boundAxisWithinMinAndMax(
    child,
    direction,
    mainAxis,
    flexBasis,
    availableInnerMainDim,
    availableInnerWidth,
  );
  flexStartingSizeIsFrozen = false;
  flexHypotheticalSize = hypotheticalSize;
  if (freeSpaceSign > 0) {
    const flexGrow = child.resolveFlexGrow();
    if (flexGrow === flexGrow && flexGrow !== 0) {
      flexStartingSizeIsFrozen = flexBasis > hypotheticalSize;
      return flexBasis < hypotheticalSize ? flexBasis : hypotheticalSize;
    }
  } else if (freeSpaceSign < 0) {
    const flexShrink = child.resolveFlexShrink();
    if (flexShrink === flexShrink && flexShrink !== 0) {
      flexStartingSizeIsFrozen = flexBasis < hypotheticalSize;
      return flexBasis > hypotheticalSize ? flexBasis : hypotheticalSize;
    }
  }
  return hypotheticalSize;
}

// It distributes the free space to the flexible items and ensures that the size
// of the flex items abide the min and max constraints. At the end of this
// function the child nodes would have proper size. Prior using this function
// please ensure that distributeFreeSpaceFirstPass is called.
function distributeFreeSpaceSecondPass(
  flexLine: FlexLine,
  node: Node,
  mainAxis: FlexDirection,
  crossAxis: FlexDirection,
  direction: Direction,
  availableInnerMainDim: number,
  availableInnerCrossDim: number,
  availableInnerWidth: number,
  availableInnerHeight: number,
  freeSpaceSign: number,
  mainAxisOverflows: boolean,
  sizingModeCrossDim: SizingMode,
  performLayout: boolean,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): number {
  let childFlexBasis = 0;
  let flexShrinkScaledFactor = 0;
  let flexGrowFactor = 0;
  let deltaFreeSpace = 0;
  const isMainAxisRow = isRow(mainAxis);
  const mainDim = dimension(mainAxis);
  const crossDim = dimension(crossAxis);
  const isNodeFlexWrap = node.style.flexWrap !== Wrap.NoWrap;
  let itemSizeDiffers = false;
  let itemMeasureDiffers = false;

  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const currentLineChild = flexLine.itemsInFlow[i]!;
    const childStyle = currentLineChild.style;
    // Most nodes have no min or max size. Asking here keeps the calls that
    // apply them, which V8 does not inline into a function this large, off the
    // usual path.
    const hasSizeBounds = childStyle.hasSizeBounds;
    // Read before laying out the child, whose own lines take other flex lines.
    childFlexBasis = flexLine.startingSizes[i]!;
    const frozenSize = flexLine.frozenSizes[i]!;
    let updatedMainSize = childFlexBasis;

    if (frozenSize === frozenSize) {
      updatedMainSize = frozenSize;
    } else if (freeSpaceSign < 0) {
      flexShrinkScaledFactor = -currentLineChild.resolveFlexShrink() * childFlexBasis;
      // Is this child able to shrink?
      if (flexShrinkScaledFactor !== 0) {
        let childSize: number;

        // Use a relative epsilon guard instead of exact equality: after the
        // first pass removes all constrained items,
        // totalFlexShrinkScaledFactors may be near-zero rather than exactly 0
        // due to floating-point cancellation.  Dividing by a near-zero value
        // produces a gigantic childSize that overwhelms the min/max clamp.
        const shrinkFactorMagnitude = Math.abs(flexLine.layout.totalFlexShrinkScaledFactors);
        if (shrinkFactorMagnitude < 1e-6) {
          childSize = childFlexBasis + flexShrinkScaledFactor;
        } else {
          childSize =
            childFlexBasis +
            (flexLine.layout.remainingFreeSpace / flexLine.layout.totalFlexShrinkScaledFactors) *
              flexShrinkScaledFactor;
        }

        boundAxisValue[0] = childSize;
        boundAxisInPlace(
          currentLineChild,
          mainAxis,
          direction,
          availableInnerMainDim,
          availableInnerWidth,
        );
        updatedMainSize = boundAxisValue[0];
      }
    } else if (freeSpaceSign > 0) {
      flexGrowFactor = currentLineChild.resolveFlexGrow();

      // Is this child able to grow?
      if (flexGrowFactor === flexGrowFactor && flexGrowFactor !== 0) {
        boundAxisValue[0] =
          childFlexBasis +
          (flexLine.layout.remainingFreeSpace / flexLine.layout.totalFlexGrowFactors) *
            flexGrowFactor;
        boundAxisInPlace(
          currentLineChild,
          mainAxis,
          direction,
          availableInnerMainDim,
          availableInnerWidth,
        );
        updatedMainSize = boundAxisValue[0];
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const marginMain = childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);
    const marginCross = childStyle.computeMarginForAxis(crossAxis, availableInnerWidth);

    let childCrossSize: number;
    let childMainSize = updatedMainSize + marginMain;
    let childCrossSizingMode: SizingMode;
    let childMainSizingMode: SizingMode = SizingMode.StretchFit;

    const hasDefiniteCrossSize = currentLineChild.hasDefiniteLength(
      crossDim,
      availableInnerCrossDim,
    );
    const requiresStretchLayout =
      !hasDefiniteCrossSize &&
      resolveChildAlignment(node, currentLineChild) === Align.Stretch &&
      !childStyle.flexStartMarginIsAuto(crossAxis, direction) &&
      !childStyle.flexEndMarginIsAuto(crossAxis, direction);

    const aspectRatio = childStyle.aspectRatio;
    if (aspectRatio === aspectRatio) {
      childCrossSize = isMainAxisRow
        ? (childMainSize - marginMain) / aspectRatio
        : (childMainSize - marginMain) * aspectRatio;
      childCrossSizingMode = SizingMode.StretchFit;

      childCrossSize += marginCross;
    } else if (
      requiresStretchLayout &&
      availableInnerCrossDim === availableInnerCrossDim &&
      sizingModeCrossDim === SizingMode.StretchFit &&
      !(isNodeFlexWrap && mainAxisOverflows)
    ) {
      childCrossSize = availableInnerCrossDim;
      childCrossSizingMode = SizingMode.StretchFit;
    } else if (!hasDefiniteCrossSize) {
      childCrossSize = availableInnerCrossDim;
      childCrossSizingMode =
        childCrossSize !== childCrossSize ? SizingMode.MaxContent : SizingMode.FitContent;
    } else {
      childCrossSize =
        currentLineChild.getResolvedDimension(
          direction,
          crossDim,
          availableInnerCrossDim,
          availableInnerWidth,
        ) + marginCross;
      const isLoosePercentageMeasurement =
        currentLineChild.getProcessedDimension(crossDim).isPercent() &&
        sizingModeCrossDim !== SizingMode.StretchFit;
      childCrossSizingMode =
        childCrossSize !== childCrossSize || isLoosePercentageMeasurement
          ? SizingMode.MaxContent
          : SizingMode.StretchFit;
    }

    const maxMainSize = hasSizeBounds
      ? maxSizeForMode(
          currentLineChild,
          direction,
          mainAxis,
          availableInnerMainDim,
          availableInnerWidth,
        )
      : NaN;
    childMainSize = constrainMaxSizeForMode(childMainSizingMode, childMainSize, maxMainSize);
    childMainSizingMode = constrainMaxSizeModeForMode(childMainSizingMode, maxMainSize);
    const maxCrossSize = hasSizeBounds
      ? maxSizeForMode(
          currentLineChild,
          direction,
          crossAxis,
          availableInnerCrossDim,
          availableInnerWidth,
        )
      : NaN;
    childCrossSize = constrainMaxSizeForMode(childCrossSizingMode, childCrossSize, maxCrossSize);
    childCrossSizingMode = constrainMaxSizeModeForMode(childCrossSizingMode, maxCrossSize);

    const childWidth = isMainAxisRow ? childMainSize : childCrossSize;
    const childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

    const childWidthSizingMode = isMainAxisRow ? childMainSizingMode : childCrossSizingMode;
    const childHeightSizingMode = !isMainAxisRow ? childMainSizingMode : childCrossSizingMode;

    const isLayoutPass = performLayout && !requiresStretchLayout;
    // Recursively call the layout algorithm for this child with the updated
    // main size.
    calculateLayoutInternal(
      currentLineChild,
      childWidth,
      childHeight,
      node.layout.direction,
      childWidthSizingMode,
      childHeightSizingMode,
      availableInnerWidth,
      availableInnerHeight,
      isLayoutPass,
      isLayoutPass ? LayoutPassReason.FlexLayout : LayoutPassReason.FlexMeasure,
      layoutMarkerData,
      depth,
      generationCount,
    );
    node.layout.hadOverflow = node.layout.hadOverflow || currentLineChild.layout.hadOverflow;
    node.layout.measureHadOverflow =
      node.layout.measureHadOverflow || currentLineChild.layout.measureHadOverflow;
    const childLayout = currentLineChild.layout;
    itemSizeDiffers =
      itemSizeDiffers || Math.abs(childLayout.measuredDimensions[mainDim] - updatedMainSize) > 0.0001;
    itemMeasureDiffers = itemMeasureDiffers || childLayout.measureDiffers;
  }
  // After the items' passes, which set the same globals for their own lines.
  gLineItemSizeDiffers = itemSizeDiffers;
  gLineItemMeasureDiffers = itemMeasureDiffers;
  return deltaFreeSpace;
}

// Finds the flexible items that distributing the free space would take past
// their min or max size, and freezes them at that size in
// `flexLine.frozenSizes`. Their sizes come out of the free space, and their
// flex factors out of the totals, so that the second pass distributes what is
// left over the other items.
//
// This is the loop of https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths.
// Each round distributes the free space over the unfrozen items and sums up by
// how much their limits change the result. A positive sum means the limits
// took more space than there was: the round freezes the items it brought up to
// their min size, and the next one distributes the smaller rest. A negative sum
// freezes the items held at their max size. Freezing both kinds at once leaves
// space that no item may take, or takes space that is not there.
function distributeFreeSpaceFirstPass(
  flexLine: FlexLine,
  direction: Direction,
  mainAxis: FlexDirection,
  availableInnerMainDim: number,
  availableInnerWidth: number,
  freeSpaceSign: number,
): void {
  const itemCount = flexLine.itemCount;
  const startingSizes = flexLine.startingSizes;
  const frozenSizes = flexLine.frozenSizes;
  if (freeSpaceSign === 0) {
    return;
  }

  // Every round but the last freezes an item.
  for (let round = 0; round < itemCount; round++) {
    // Every item's tentative size is computed against the totals the round
    // started with (see https://github.com/react/yoga/issues/2006).
    const freeSpace = flexLine.layout.remainingFreeSpace;
    const totalFlexFactors =
      freeSpaceSign > 0
        ? flexLine.layout.totalFlexGrowFactors
        : flexLine.layout.totalFlexShrinkScaledFactors;
    let totalViolation = 0;
    let hasViolation = false;

    // The first sweep sums the violations up, the second one freezes.
    for (let sweep = 0; sweep < 2; sweep++) {
      for (let i = 0; i < itemCount; i++) {
        if (frozenSizes[i] === frozenSizes[i]) {
          continue;
        }
        const currentLineChild = flexLine.itemsInFlow[i]!;
        const childFlexBasis = startingSizes[i]!;

        const flexFactor =
          freeSpaceSign > 0
            ? currentLineChild.resolveFlexGrow()
            : -currentLineChild.resolveFlexShrink() * childFlexBasis;
        // Is this child able to flex?
        if (flexFactor !== flexFactor || flexFactor === 0) {
          continue;
        }

        const baseMainSize = childFlexBasis + (freeSpace / totalFlexFactors) * flexFactor;
        boundAxisValue[0] = baseMainSize;
        boundAxisInPlace(
          currentLineChild,
          mainAxis,
          direction,
          availableInnerMainDim,
          availableInnerWidth,
        );
        const boundMainSize = boundAxisValue[0]!;
        if (
          baseMainSize !== baseMainSize ||
          boundMainSize !== boundMainSize ||
          baseMainSize === boundMainSize
        ) {
          continue;
        }

        const violation = boundMainSize - baseMainSize;
        if (sweep === 0) {
          totalViolation += violation;
          hasViolation = true;
        } else if (totalViolation === 0 || (totalViolation > 0 ? violation > 0 : violation < 0)) {
          frozenSizes[i] = boundMainSize;
          flexLine.layout.remainingFreeSpace -= boundMainSize - childFlexBasis;
          if (freeSpaceSign > 0) {
            flexLine.layout.totalFlexGrowFactors -= flexFactor;
          } else {
            flexLine.layout.totalFlexShrinkScaledFactors -=
              -currentLineChild.resolveFlexShrink() * currentLineChild.layout.computedFlexBasis;
          }
        }
      }
      if (!hasViolation) {
        return;
      }
    }
  }
}

// Do two passes over the flex items to figure out how to distribute the
// remaining space.
//
// The first pass finds the items whose min/max constraints trigger, freezes
// them at those sizes, and excludes those sizes from the remaining space. It
// repeats until the constraints of no further item trigger, as the spec
// describes (https://www.w3.org/TR/CSS-flexbox-1/#resolve-flexible-lengths).
// That costs no layout: a round only bounds tentative sizes.
//
// The second pass sets the size of each flexible item, which lays the item out.
// It gives the frozen items the size they were frozen at, and distributes the
// remaining space amongst the others.
//
// At the end of this function the child nodes would have the proper size
// assigned to them.
//
function resolveFlexibleLength(
  node: Node,
  flexLine: FlexLine,
  mainAxis: FlexDirection,
  crossAxis: FlexDirection,
  direction: Direction,
  availableInnerMainDim: number,
  availableInnerCrossDim: number,
  availableInnerWidth: number,
  availableInnerHeight: number,
  mainAxisOverflows: boolean,
  sizingModeCrossDim: SizingMode,
  performLayout: boolean,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): void {
  // The line was filled by hypothetical main sizes, and its free space tells
  // whether it grows or shrinks. What gets distributed is the space left by the
  // sizes the items start from.
  const freeSpaceSign =
    flexLine.layout.remainingFreeSpace > 0 ? 1 : flexLine.layout.remainingFreeSpace < 0 ? -1 : 0;
  // Both passes work from `startingSizes` and `frozenSizes`, so that the min and
  // max size of an item are resolved once per line.
  const startingSizes = flexLine.startingSizes;
  const frozenSizes = flexLine.frozenSizes;
  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const child = flexLine.itemsInFlow[i]!;
    let startingSize = child.layout.computedFlexBasis;
    let frozenSize = NaN;
    if (child.style.hasSizeBounds) {
      startingSize = flexStartingSize(
        child,
        direction,
        mainAxis,
        availableInnerMainDim,
        availableInnerWidth,
        freeSpaceSign,
      );
      flexLine.layout.remainingFreeSpace += flexHypotheticalSize - startingSize;
      // An item that cannot flex takes no share of the free space either.
      if (flexStartingSizeIsFrozen) {
        frozenSize = startingSize;
        if (freeSpaceSign > 0) {
          flexLine.layout.totalFlexGrowFactors -= child.resolveFlexGrow();
        } else {
          flexLine.layout.totalFlexShrinkScaledFactors -=
            -child.resolveFlexShrink() * child.layout.computedFlexBasis;
        }
      }
    }
    if (i < startingSizes.length) {
      startingSizes[i] = startingSize;
      frozenSizes[i] = frozenSize;
    } else {
      startingSizes.push(startingSize);
      frozenSizes.push(frozenSize);
    }
  }
  const originalFreeSpace = flexLine.layout.remainingFreeSpace;

  // First pass: detect the flex items whose min/max constraints trigger
  distributeFreeSpaceFirstPass(
    flexLine,
    direction,
    mainAxis,
    availableInnerMainDim,
    availableInnerWidth,
    freeSpaceSign,
  );

  // Second pass: resolve the sizes of the flexible items
  const distributedFreeSpace = distributeFreeSpaceSecondPass(
    flexLine,
    node,
    mainAxis,
    crossAxis,
    direction,
    availableInnerMainDim,
    availableInnerCrossDim,
    availableInnerWidth,
    availableInnerHeight,
    freeSpaceSign,
    mainAxisOverflows,
    sizingModeCrossDim,
    performLayout,
    layoutMarkerData,
    depth,
    generationCount,
  );

  flexLine.layout.remainingFreeSpace = originalFreeSpace - distributedFreeSpace;
}

function justifyMainAxis(
  node: Node,
  flexLine: FlexLine,
  mainAxis: FlexDirection,
  crossAxis: FlexDirection,
  direction: Direction,
  sizingModeMainDim: SizingMode,
  sizingModeCrossDim: SizingMode,
  mainAxisOwnerSize: number,
  ownerWidth: number,
  availableInnerMainDim: number,
  availableInnerCrossDim: number,
  availableInnerWidth: number,
  performLayout: boolean,
  isNodeBaselineLayout: boolean,
): void {
  const style = node.style;

  const leadingPaddingAndBorderMain = style.computeFlexStartPaddingAndBorder(
    mainAxis,
    direction,
    ownerWidth,
  );
  const trailingPaddingAndBorderMain = style.computeFlexEndPaddingAndBorder(
    mainAxis,
    direction,
    ownerWidth,
  );

  const gap = style.computeGapForAxis(mainAxis, availableInnerMainDim);
  // If we are using "at most" rules in the main axis, make sure that
  // remainingFreeSpace is 0 when min main dimension is not given
  if (sizingModeMainDim === SizingMode.FitContent && flexLine.layout.remainingFreeSpace > 0) {
    const minMainDim = style.resolvedMinDimension(
      direction,
      dimension(mainAxis),
      mainAxisOwnerSize,
      ownerWidth,
    );
    if (style.minDimensions[dimension(mainAxis)].isDefined() && minMainDim === minMainDim) {
      // This condition makes sure that if the size of main dimension(after
      // considering child nodes main dim, leading and trailing padding etc)
      // falls below min dimension, then the remainingFreeSpace is reassigned
      // considering the min dimension

      // `minAvailableMainDim` denotes minimum available space in which child
      // can be laid out, it will exclude space consumed by padding and border.
      const minAvailableMainDim =
        minMainDim - leadingPaddingAndBorderMain - trailingPaddingAndBorderMain;
      const occupiedSpaceByChildNodes = availableInnerMainDim - flexLine.layout.remainingFreeSpace;
      flexLine.layout.remainingFreeSpace = maxOrDefined(
        0.0,
        minAvailableMainDim - occupiedSpaceByChildNodes,
      );
    } else {
      flexLine.layout.remainingFreeSpace = 0;
    }
  }

  // In order to position the elements in the main axis, we have two controls.
  // The space between the beginning and the first element and the space between
  // each two elements.
  let leadingMainDim = 0;
  let betweenMainDim = gap;
  const justifyContent =
    flexLine.layout.remainingFreeSpace >= 0
      ? style.justifyContent
      : fallbackJustification(style.justifyContent);

  const itemCount = flexLine.itemCount;
  if (flexLine.numberOfAutoMargins === 0) {
    switch (justifyContent) {
      case Justify.Start:
      case Justify.End:
      case Justify.Auto:
        // No-Op
        break;
      case Justify.Stretch:
        // No-Op
        break;
      case Justify.Center:
        leadingMainDim = flexLine.layout.remainingFreeSpace / 2;
        break;
      case Justify.FlexEnd:
        leadingMainDim = flexLine.layout.remainingFreeSpace;
        break;
      case Justify.SpaceBetween:
        if (itemCount > 1) {
          betweenMainDim += flexLine.layout.remainingFreeSpace / (itemCount - 1);
        }
        break;
      case Justify.SpaceEvenly:
        // Space is distributed evenly across all elements
        leadingMainDim = flexLine.layout.remainingFreeSpace / (itemCount + 1);
        betweenMainDim += leadingMainDim;
        break;
      case Justify.SpaceAround:
        // Space on the edges is half of the space between elements. A line
        // can be empty: all children absolute or hidden.
        if (itemCount > 0) {
          leadingMainDim = (0.5 * flexLine.layout.remainingFreeSpace) / itemCount;
          betweenMainDim += leadingMainDim * 2;
        }
        break;
      case Justify.FlexStart:
        break;
    }
  }

  flexLine.layout.mainDim = leadingPaddingAndBorderMain + leadingMainDim;
  flexLine.layout.crossDim = 0;

  let maxAscentForCurrentLine = 0;
  let maxDescentForCurrentLine = 0;
  const lastChild = flexLine.itemsInFlow[itemCount - 1];
  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const child = flexLine.itemsInFlow[i]!;
    const childLayout = child.layout;
    const childStyle = child.style;
    if (
      childStyle.flexStartMarginIsAuto(mainAxis, direction) &&
      flexLine.layout.remainingFreeSpace > 0.0
    ) {
      flexLine.layout.mainDim += flexLine.layout.remainingFreeSpace / flexLine.numberOfAutoMargins;
    }

    if (performLayout) {
      childLayout.position[flexStartEdge(mainAxis)] =
        childLayout.position[flexStartEdge(mainAxis)] + flexLine.layout.mainDim;
    }

    if (child !== lastChild) {
      flexLine.layout.mainDim += betweenMainDim;
    }

    if (
      childStyle.flexEndMarginIsAuto(mainAxis, direction) &&
      flexLine.layout.remainingFreeSpace > 0.0
    ) {
      flexLine.layout.mainDim += flexLine.layout.remainingFreeSpace / flexLine.numberOfAutoMargins;
    }
    const canSkipFlex = !performLayout && sizingModeCrossDim === SizingMode.StretchFit;
    if (canSkipFlex) {
      // If we skipped the flex step, then we can't rely on the measuredDims
      // because they weren't computed. This means we can't call
      // dimensionWithMargin.
      flexLine.layout.mainDim +=
        childStyle.computeMarginForAxis(mainAxis, availableInnerWidth) +
        boundAxisWithinMinAndMax(
          child,
          direction,
          mainAxis,
          childLayout.computedFlexBasis,
          availableInnerMainDim,
          availableInnerWidth,
        );
      flexLine.layout.crossDim = availableInnerCrossDim;
    } else {
      // The main dimension is the sum of all the elements dimension plus
      // the spacing.
      flexLine.layout.mainDim += child.dimensionWithMargin(mainAxis, availableInnerWidth);

      if (isNodeBaselineLayout) {
        // If the child is baseline aligned then the cross dimension is
        // calculated by adding maxAscent and maxDescent from the baseline.
        const ascent =
          baselineOf(child) +
          childStyle.computeFlexStartMargin(FlexDirection.Column, direction, availableInnerWidth);
        const descent =
          childLayout.measuredDimensions[Dimension.Height] +
          childStyle.computeMarginForAxis(FlexDirection.Column, availableInnerWidth) -
          ascent;

        maxAscentForCurrentLine = maxOrDefined(maxAscentForCurrentLine, ascent);
        maxDescentForCurrentLine = maxOrDefined(maxDescentForCurrentLine, descent);
      } else {
        // The cross dimension is the max of the elements dimension since
        // there can only be one element in that cross dimension in the case
        // when the items are not baseline aligned
        flexLine.layout.crossDim = maxOrDefined(
          flexLine.layout.crossDim,
          child.dimensionWithMargin(crossAxis, availableInnerWidth),
        );
      }
    }
  }
  flexLine.layout.mainDim += trailingPaddingAndBorderMain;

  if (isNodeBaselineLayout) {
    flexLine.layout.crossDim = maxAscentForCurrentLine + maxDescentForCurrentLine;
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm described in the W3C CSS documentation:
// https://www.w3.org/TR/CSS3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//    which are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//    are stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//    defined by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//    'collapse' and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//    bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//    minimum main size. For text blocks, for example, this is the width of the
//    widest word. Calculating the minimum width is expensive, so we forego it
//    and assume a default minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//    lengths.
//
// Input parameters:
//    - node: current node to be sized and laid out
//    - availableWidth & availableHeight: available size to be used for sizing
//      the node or YGUndefined if the size is not available; interpretation
//      depends on layout flags
//    - ownerDirection: the inline (text) direction within the owner
//      (left-to-right or right-to-left)
//    - widthSizingMode: indicates the sizing rules for the width (see below
//      for explanation)
//    - heightSizingMode: indicates the sizing rules for the height (see below
//      for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//      dimensions of the node or it requires the entire node and its subtree to
//      be laid out (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the information in node.style, which is treated as a
//    read-only input. It is responsible for setting the layout.direction and
//    layout.measuredDimensions fields for the input node as well as the
//    layout.position and layout.lineIndex fields for its child nodes. The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does not include margins.
//
//    When calling calculateLayoutImpl and calculateLayoutInternal, if the
//    caller passes an available size of undefined then it must also pass a
//    sizing mode of SizingMode.MaxContent in that dimension.
//

// STEP 8 of `calculateLayoutImpl`: places the lines of a wrapping node, and the
// children within each line, across the cross axis. Everything it needs beyond
// the arguments comes back out of the node, which the caller has just written.
function alignContentLines(
  node: Node,
  layoutChildren: readonly Node[],
  lineCount: number,
  totalLineCrossDim: number,
  availableInnerWidth: number,
  availableInnerHeight: number,
  availableInnerCrossDim: number,
  crossAxisOwnerSize: number,
  ownerWidth: number,
  sizingModeCrossDim: SizingMode,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): void {
  const style = node.style;
  const direction = node.layout.direction;
  const mainAxis = resolveDirection(style.flexDirection, direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);
  const crossDimension = dimension(crossAxis);
  const paddingAndBorderAxisCross = paddingAndBorderForAxis(node, crossAxis, direction, ownerWidth);
  const crossStartEdge = flexStartEdge(crossAxis);
  const leadingPaddingAndBorderCross =
    node.layout.padding[crossStartEdge] + node.layout.border[crossStartEdge];
  const crossAxisGap = style.computeGapForAxis(crossAxis, availableInnerCrossDim);

  let leadPerLine = 0;
  let currentLead = leadingPaddingAndBorderCross;
  let extraSpacePerLine = 0;

  const unclampedCrossDim =
    sizingModeCrossDim === SizingMode.StretchFit
      ? availableInnerCrossDim + paddingAndBorderAxisCross
      : node.hasDefiniteLength(crossDimension, crossAxisOwnerSize)
        ? node.getResolvedDimension(direction, crossDimension, crossAxisOwnerSize, ownerWidth)
        : totalLineCrossDim + paddingAndBorderAxisCross;

  const innerCrossDim =
    boundAxis(node, crossAxis, direction, unclampedCrossDim, crossAxisOwnerSize, ownerWidth) -
    paddingAndBorderAxisCross;

  const remainingAlignContentDim = innerCrossDim - totalLineCrossDim;

  const alignContent =
    remainingAlignContentDim >= 0 ? style.alignContent : fallbackAlignment(style.alignContent);

  switch (alignContent) {
    case Align.Start:
    case Align.End:
      // No-Op
      break;
    case Align.FlexEnd:
      currentLead += remainingAlignContentDim;
      break;
    case Align.Center:
      currentLead += remainingAlignContentDim / 2;
      break;
    case Align.Stretch:
      extraSpacePerLine = remainingAlignContentDim / lineCount;
      break;
    case Align.SpaceAround:
      currentLead += remainingAlignContentDim / (2 * lineCount);
      leadPerLine = remainingAlignContentDim / lineCount;
      break;
    case Align.SpaceEvenly:
      currentLead += remainingAlignContentDim / (lineCount + 1);
      leadPerLine = remainingAlignContentDim / (lineCount + 1);
      break;
    case Align.SpaceBetween:
      if (lineCount > 1) {
        leadPerLine = remainingAlignContentDim / (lineCount - 1);
      }
      break;
    case Align.Auto:
    case Align.FlexStart:
    case Align.Baseline:
      break;
  }
  let endIndex = 0;
  for (let i = 0; i < lineCount; i++) {
    const startIndex = endIndex;
    let index = startIndex;

    // compute the line's height and find the endIndex
    let lineHeight = 0;
    let maxAscentForCurrentLine = 0;
    let maxDescentForCurrentLine = 0;
    for (; index < layoutChildren.length; index++) {
      const child = layoutChildren[index]!;
      const childStyle = child.style;
      if (childStyle.display === Display.None) {
        continue;
      }
      if (childStyle.positionType !== PositionType.Absolute) {
        if (child.lineIndex !== i) {
          break;
        }
        if (child.isLayoutDimensionDefined(crossAxis)) {
          lineHeight = maxOrDefined(
            lineHeight,
            child.layout.measuredDimensions[crossDimension] +
              childStyle.computeMarginForAxis(crossAxis, availableInnerWidth),
          );
        }
        if (resolveChildAlignment(node, child) === Align.Baseline) {
          const ascent =
            baselineOf(child) +
            childStyle.computeFlexStartMargin(FlexDirection.Column, direction, availableInnerWidth);
          const descent =
            child.layout.measuredDimensions[Dimension.Height] +
            childStyle.computeMarginForAxis(FlexDirection.Column, availableInnerWidth) -
            ascent;
          maxAscentForCurrentLine = maxOrDefined(maxAscentForCurrentLine, ascent);
          maxDescentForCurrentLine = maxOrDefined(maxDescentForCurrentLine, descent);
          lineHeight = maxOrDefined(lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
        }
      }
    }
    endIndex = index;
    currentLead += i !== 0 ? crossAxisGap : 0;
    lineHeight += extraSpacePerLine;

    for (index = startIndex; index < endIndex; index++) {
      const child = layoutChildren[index]!;
      const childStyle = child.style;
      const childLayout = child.layout;
      if (childStyle.display === Display.None) {
        continue;
      }
      if (childStyle.positionType !== PositionType.Absolute) {
        switch (resolveChildAlignment(node, child)) {
          case Align.Start:
          case Align.End:
            // Not yet implemented
            break;
          case Align.FlexStart: {
            childLayout.position[flexStartEdge(crossAxis)] =
              currentLead +
              childStyle.computeFlexStartPosition(crossAxis, direction, availableInnerWidth);
            break;
          }
          case Align.FlexEnd: {
            childLayout.position[flexStartEdge(crossAxis)] =
              currentLead +
              lineHeight -
              childStyle.computeFlexEndMargin(crossAxis, direction, availableInnerWidth) -
              childLayout.measuredDimensions[crossDimension];
            break;
          }
          case Align.Center: {
            const childHeight = childLayout.measuredDimensions[crossDimension];

            childLayout.position[flexStartEdge(crossAxis)] =
              currentLead + (lineHeight - childHeight) / 2;
            break;
          }
          case Align.Stretch: {
            childLayout.position[flexStartEdge(crossAxis)] =
              currentLead +
              childStyle.computeFlexStartMargin(crossAxis, direction, availableInnerWidth);

            // Remeasure child with the line height as it as been only
            // measured with the owners height yet.
            if (!child.hasDefiniteLength(crossDimension, availableInnerCrossDim)) {
              const childWidth = isMainAxisRow
                ? childLayout.measuredDimensions[Dimension.Width] +
                  childStyle.computeMarginForAxis(mainAxis, availableInnerWidth)
                : leadPerLine + lineHeight;

              const childHeight = !isMainAxisRow
                ? childLayout.measuredDimensions[Dimension.Height] +
                  childStyle.computeMarginForAxis(crossAxis, availableInnerWidth)
                : leadPerLine + lineHeight;

              if (!(
                inexactEquals(childWidth, childLayout.measuredDimensions[Dimension.Width]) &&
                inexactEquals(childHeight, childLayout.measuredDimensions[Dimension.Height])
              )) {
                calculateLayoutInternal(
                  child,
                  childWidth,
                  childHeight,
                  direction,
                  SizingMode.StretchFit,
                  SizingMode.StretchFit,
                  availableInnerWidth,
                  availableInnerHeight,
                  true,
                  LayoutPassReason.MultilineStretch,
                  layoutMarkerData,
                  depth,
                  generationCount,
                );
              }
            }
            break;
          }
          case Align.Baseline: {
            childLayout.position[PhysicalEdge.Top] =
              currentLead +
              maxAscentForCurrentLine -
              baselineOf(child) +
              childStyle.computeFlexStartPosition(
                FlexDirection.Column,
                direction,
                availableInnerCrossDim,
              );

            break;
          }
          case Align.Auto:
          case Align.SpaceBetween:
          case Align.SpaceAround:
          case Align.SpaceEvenly:
            break;
        }
      }
    }

    currentLead = currentLead + leadPerLine + lineHeight;
  }
}

// STEP 7 of `calculateLayoutImpl`: positions the children of one line across
// the cross axis, stretching those that ask for it. What it does not take as an
// argument it reads back off the node, which the caller has just written.
function alignChildrenOnCrossAxis(
  node: Node,
  flexLine: FlexLine,
  containerCrossAxis: number,
  totalLineCrossDim: number,
  availableInnerMainDim: number,
  availableInnerCrossDim: number,
  availableInnerWidth: number,
  availableInnerHeight: number,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): void {
  const style = node.style;
  const direction = node.layout.direction;
  const mainAxis = resolveDirection(style.flexDirection, direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);
  const mainDimension = dimension(mainAxis);
  const crossDimension = dimension(crossAxis);
  const isNodeFlexWrap = style.flexWrap !== Wrap.NoWrap;
  const crossStartEdge = flexStartEdge(crossAxis);
  const leadingPaddingAndBorderCross =
    node.layout.padding[crossStartEdge] + node.layout.border[crossStartEdge];

  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const child = flexLine.itemsInFlow[i]!;
    const childStyle = child.style;
    let leadingCrossDim = leadingPaddingAndBorderCross;

    // For a relative children, we're either using alignItems (owner) or
    // alignSelf (child) in order to determine the position in the cross
    // axis
    const alignItem = resolveChildAlignment(node, child);

    // If the child uses align stretch, we need to lay it out one more
    // time, this time forcing the cross-axis size to be the computed
    // cross size for the current line.
    if (
      alignItem === Align.Stretch &&
      !childStyle.flexStartMarginIsAuto(crossAxis, direction) &&
      !childStyle.flexEndMarginIsAuto(crossAxis, direction)
    ) {
      // If the child defines a definite size for its cross axis, there's
      // no need to stretch.
      if (!child.hasDefiniteLength(crossDimension, availableInnerCrossDim)) {
        let childMainSize = child.layout.measuredDimensions[mainDimension];
        const aspectRatio = childStyle.aspectRatio;
        let childCrossSize =
          aspectRatio === aspectRatio
            ? childStyle.computeMarginForAxis(crossAxis, availableInnerWidth) +
              (isMainAxisRow ? childMainSize / aspectRatio : childMainSize * aspectRatio)
            : flexLine.layout.crossDim;

        childMainSize += childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);

        // Both sizing modes start as StretchFit, which
        // constrainMaxSizeForMode never changes.
        childMainSize = constrainMaxSizeForMode(
          SizingMode.StretchFit,
          childMainSize,
          maxSizeForMode(child, direction, mainAxis, availableInnerMainDim, availableInnerWidth),
        );
        childCrossSize = constrainMaxSizeForMode(
          SizingMode.StretchFit,
          childCrossSize,
          maxSizeForMode(child, direction, crossAxis, availableInnerCrossDim, availableInnerWidth),
        );

        const childWidth = isMainAxisRow ? childMainSize : childCrossSize;
        const childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

        const alignContent = style.alignContent;
        const crossAxisDoesNotGrow = alignContent !== Align.Stretch && isNodeFlexWrap;
        const childWidthSizingMode =
          childWidth !== childWidth || (!isMainAxisRow && crossAxisDoesNotGrow)
            ? SizingMode.MaxContent
            : SizingMode.StretchFit;
        const childHeightSizingMode =
          childHeight !== childHeight || (isMainAxisRow && crossAxisDoesNotGrow)
            ? SizingMode.MaxContent
            : SizingMode.StretchFit;

        calculateLayoutInternal(
          child,
          childWidth,
          childHeight,
          direction,
          childWidthSizingMode,
          childHeightSizingMode,
          availableInnerWidth,
          availableInnerHeight,
          true,
          LayoutPassReason.Stretch,
          layoutMarkerData,
          depth,
          generationCount,
        );
      }
    } else {
      const remainingCrossDim =
        containerCrossAxis - child.dimensionWithMargin(crossAxis, availableInnerWidth);

      if (
        childStyle.flexStartMarginIsAuto(crossAxis, direction) &&
        childStyle.flexEndMarginIsAuto(crossAxis, direction)
      ) {
        leadingCrossDim += maxOrDefined(0.0, remainingCrossDim / 2);
      } else if (childStyle.flexEndMarginIsAuto(crossAxis, direction)) {
        // No-Op
      } else if (childStyle.flexStartMarginIsAuto(crossAxis, direction)) {
        leadingCrossDim += maxOrDefined(0.0, remainingCrossDim);
      } else if (alignItem === Align.FlexStart) {
        // No-Op
      } else if (alignItem === Align.Center) {
        leadingCrossDim += remainingCrossDim / 2;
      } else {
        leadingCrossDim += remainingCrossDim;
      }
    }
    // And we apply the position
    child.layout.position[flexStartEdge(crossAxis)] =
      child.layout.position[flexStartEdge(crossAxis)] + totalLineCrossDim + leadingCrossDim;
  }
}

function calculateLayoutImpl(
  node: Node,
  availableWidth: number,
  availableHeight: number,
  ownerDirection: Direction,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  ownerWidth: number,
  ownerHeight: number,
  performLayout: boolean,
  reason: LayoutPassReason,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): boolean {
  if (availableWidth !== availableWidth && widthSizingMode !== SizingMode.MaxContent) {
    throw new Error(
      "availableWidth is indefinite so widthSizingMode must be SizingMode::MaxContent",
    );
  }
  if (availableHeight !== availableHeight && heightSizingMode !== SizingMode.MaxContent) {
    throw new Error(
      "availableHeight is indefinite so heightSizingMode must be SizingMode::MaxContent",
    );
  }

  if (__EVENTS__ && layoutMarkerData !== null) {
    if (performLayout) {
      layoutMarkerData.layouts += 1;
    } else {
      layoutMarkerData.measures += 1;
    }
  }

  const style = node.style;
  const layout = node.layout;
  // A baseline is computed from the baseline of a child, and that from its
  // child's: what holds for the children of a node aligning by baselines
  // holds for everything below them.
  const underBaselineLayout = gOwnerIsBaselineLayout;
  // Only a result of the full algorithm below can be relaxable.
  gPassRelaxable = false;
  gPassMeasureDiffers = false;
  gPassMainSizeInvariant = false;

  // Set the resolved resolution in the node's layout.
  const direction = node.resolveDirection(ownerDirection);
  layout.direction = direction;

  // Also when only measuring, and whichever way the size is found: the flag of
  // an earlier pass says nothing about this one.
  layout.hadOverflow = false;
  layout.measureHadOverflow = false;

  let marginAxisRow: number;
  let marginAxisColumn: number;
  if (!style.edgesNeedOwnerWidth) {
    // Without percentages the style already knows every edge in points.
    const offset = direction === Direction.RTL ? 4 : 0;
    const marginPoints = style.marginPoints;
    const borderPoints = style.borderPoints;
    const paddingPoints = style.paddingPoints;
    for (let edge = PhysicalEdge.Left; edge <= PhysicalEdge.Bottom; edge++) {
      layout.margin[edge] = marginPoints[offset + edge]!;
      layout.border[edge] = borderPoints[offset + edge]!;
      layout.padding[edge] = paddingPoints[offset + edge]!;
    }
    marginAxisRow = layout.margin[PhysicalEdge.Left] + layout.margin[PhysicalEdge.Right];
    marginAxisColumn = layout.margin[PhysicalEdge.Top] + layout.margin[PhysicalEdge.Bottom];
  } else {
    const flexRowDirection = resolveDirection(FlexDirection.Row, direction);
    const flexColumnDirection = resolveDirection(FlexDirection.Column, direction);

    const startEdge = direction === Direction.LTR ? PhysicalEdge.Left : PhysicalEdge.Right;
    const endEdge = direction === Direction.LTR ? PhysicalEdge.Right : PhysicalEdge.Left;

    const marginRowLeading = style.computeInlineStartMargin(
      flexRowDirection,
      direction,
      ownerWidth,
    );
    layout.margin[startEdge] = marginRowLeading;
    const marginRowTrailing = style.computeInlineEndMargin(flexRowDirection, direction, ownerWidth);
    layout.margin[endEdge] = marginRowTrailing;
    const marginColumnLeading = style.computeInlineStartMargin(
      flexColumnDirection,
      direction,
      ownerWidth,
    );
    layout.margin[PhysicalEdge.Top] = marginColumnLeading;
    const marginColumnTrailing = style.computeInlineEndMargin(
      flexColumnDirection,
      direction,
      ownerWidth,
    );
    layout.margin[PhysicalEdge.Bottom] = marginColumnTrailing;

    marginAxisRow = marginRowLeading + marginRowTrailing;
    marginAxisColumn = marginColumnLeading + marginColumnTrailing;

    layout.border[startEdge] = style.computeInlineStartBorder(flexRowDirection, direction);
    layout.border[endEdge] = style.computeInlineEndBorder(flexRowDirection, direction);
    layout.border[PhysicalEdge.Top] = style.computeInlineStartBorder(
      flexColumnDirection,
      direction,
    );
    layout.border[PhysicalEdge.Bottom] = style.computeInlineEndBorder(
      flexColumnDirection,
      direction,
    );

    layout.padding[startEdge] = style.computeInlineStartPadding(
      flexRowDirection,
      direction,
      ownerWidth,
    );
    layout.padding[endEdge] = style.computeInlineEndPadding(
      flexRowDirection,
      direction,
      ownerWidth,
    );
    layout.padding[PhysicalEdge.Top] = style.computeInlineStartPadding(
      flexColumnDirection,
      direction,
      ownerWidth,
    );
    layout.padding[PhysicalEdge.Bottom] = style.computeInlineEndPadding(
      flexColumnDirection,
      direction,
      ownerWidth,
    );
  }

  if (node.hasMeasureFunc()) {
    measureNodeWithMeasureFunc(
      node,
      direction,
      availableWidth - marginAxisRow,
      availableHeight - marginAxisColumn,
      widthSizingMode,
      heightSizingMode,
      ownerWidth,
      ownerHeight,
      layoutMarkerData,
      reason,
    );
    // A measure function answers for its content, as far as the cache can tell.
    layout.contentSized = true;
    layout.measureDiffers = false;

    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    if (node.hasContentsChildren()) cleanupContentsNodesRecursively(node, performLayout);
    return false;
  }

  const childCount = node.getLayoutChildCount();
  if (childCount === 0) {
    measureNodeWithoutChildren(
      node,
      direction,
      availableWidth - marginAxisRow,
      availableHeight - marginAxisColumn,
      widthSizingMode,
      heightSizingMode,
      ownerWidth,
      ownerHeight,
    );
    layout.contentSized = true;
    layout.measureDiffers = false;

    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    if (node.hasContentsChildren()) cleanupContentsNodesRecursively(node, performLayout);
    return false;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm
  // if we already know the size
  if (
    !performLayout &&
    measureNodeWithFixedSize(
      node,
      direction,
      availableWidth - marginAxisRow,
      availableHeight - marginAxisColumn,
      widthSizingMode,
      heightSizingMode,
      ownerWidth,
      ownerHeight,
    )
  ) {
    // The children are not visited: what the last full pass found out about
    // them holds while nothing below changed.
    layout.contentSized = layout.contentSized && !node.isDirty();
    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    if (node.hasContentsChildren())
      cleanupContentsNodesRecursively(node, /* didPerformLayout */ false);
    return false;
  }

  // Clean and update all display: contents nodes with a direct path to the
  // current node as they will not be traversed
  if (node.hasContentsChildren()) cleanupContentsNodesRecursively(node, performLayout);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const mainAxis = resolveDirection(style.flexDirection, direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);
  // Hoisted: every copy of `dimension` inlined here costs the same budget as
  // a helper V8 then leaves as a real call.
  const mainDimension = dimension(mainAxis);
  const crossDimension = dimension(crossAxis);
  const isNodeFlexWrap = style.flexWrap !== Wrap.NoWrap;

  const mainAxisOwnerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const crossAxisOwnerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  // Straight out of the results written just above: the padding and border of
  // an axis add up to the same total whichever way the direction runs, and
  // asking the style again is four calls the inlining budget has to pay for.
  const paddingAndBorderAxisRowEdges =
    layout.padding[PhysicalEdge.Left] +
    layout.padding[PhysicalEdge.Right] +
    layout.border[PhysicalEdge.Left] +
    layout.border[PhysicalEdge.Right];
  const paddingAndBorderAxisColumnEdges =
    layout.padding[PhysicalEdge.Top] +
    layout.padding[PhysicalEdge.Bottom] +
    layout.border[PhysicalEdge.Top] +
    layout.border[PhysicalEdge.Bottom];
  const paddingAndBorderAxisMain = isMainAxisRow
    ? paddingAndBorderAxisRowEdges
    : paddingAndBorderAxisColumnEdges;
  const paddingAndBorderAxisCross = isMainAxisRow
    ? paddingAndBorderAxisColumnEdges
    : paddingAndBorderAxisRowEdges;
  // Once per node: it walks the children, and both the per-line justification
  // and STEP 8 below ask for it.
  const isNodeBaselineLayout = isBaselineLayout(node);
  gOwnerIsBaselineLayout = isNodeBaselineLayout || underBaselineLayout;
  layout.baselineLayout = isNodeBaselineLayout;

  let sizingModeMainDim = isMainAxisRow ? widthSizingMode : heightSizingMode;
  const sizingModeCrossDim = isMainAxisRow ? heightSizingMode : widthSizingMode;
  const mainSpaceWasToFit = sizingModeMainDim !== SizingMode.StretchFit;

  const paddingAndBorderAxisRow = paddingAndBorderAxisRowEdges;
  const paddingAndBorderAxisColumn = paddingAndBorderAxisColumnEdges;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS

  const availableInnerWidth = calculateAvailableInnerDimension(
    node,
    direction,
    Dimension.Width,
    availableWidth - marginAxisRow,
    paddingAndBorderAxisRow,
    ownerWidth,
    ownerWidth,
  );
  const availableInnerHeight = calculateAvailableInnerDimension(
    node,
    direction,
    Dimension.Height,
    availableHeight - marginAxisColumn,
    paddingAndBorderAxisColumn,
    ownerHeight,
    ownerWidth,
  );

  let availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;
  // Items measured in a space of nothing to fit report nothing (see
  // `isFixedSize`): what they take here is not their content.
  const mainSpaceIsNothing = availableInnerMainDim <= 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM

  // Computed basis + margins + gap
  let totalMainDim = 0;
  totalMainDim += computeFlexBasisForChildren(
    node,
    availableInnerWidth,
    availableInnerHeight,
    availableInnerWidth,
    availableInnerHeight,
    widthSizingMode,
    heightSizingMode,
    direction,
    mainAxis,
    performLayout,
    layoutMarkerData,
    depth,
    generationCount,
  );

  if (childCount > 1) {
    totalMainDim += style.computeGapForAxis(mainAxis, availableInnerMainDim) * (childCount - 1);
  }

  const mainAxisOverflows =
    sizingModeMainDim !== SizingMode.MaxContent && totalMainDim > availableInnerMainDim;

  if (isNodeFlexWrap && mainAxisOverflows && sizingModeMainDim === SizingMode.FitContent) {
    sizingModeMainDim = SizingMode.StretchFit;
  }
  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Index of the beginning of the current line
  const layoutChildren = node.getLayoutChildren();
  let startOfLineIndex = 0;

  // Number of lines.
  let lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  let totalLineCrossDim = 0;

  const crossAxisGap = style.computeGapForAxis(crossAxis, availableInnerCrossDim);

  // Max main dimension of all the lines.
  let maxLineMainDim = 0;
  // What a measurement that skips the flex step reports as overflow: the
  // lines' free space before flexible lengths are resolved.
  let preFlexOverflow = false;
  // The lines' overflow after the flex step, without what the children report.
  let ownOverflow = false;
  // See `gPassMeasureDiffers`: what the items' passes reported.
  let itemSizeDiffers = false;
  let itemMeasureDiffers = false;
  // Whether a line has items that can grow. The node's own flex factor then
  // decides whether they fill a space that fits the content (see STEP 5).
  let linesCanGrow = false;
  // Whether a line has an auto margin along the main axis, which takes free
  // space the same way.
  let linesHaveAutoMargins = false;
  // The most a line's items take along the main axis before they flex: bases
  // within their bounds, margins and gaps. What the node needs to hold them.
  let maxLineSizeConsumed = 0;
  const flexLine = acquireFlexLine();
  for (; startOfLineIndex < layoutChildren.length; lineCount++) {
    calculateFlexLine(
      node,
      ownerDirection,
      availableInnerWidth,
      availableInnerMainDim,
      layoutChildren,
      startOfLineIndex,
      lineCount,
      flexLine,
    );
    startOfLineIndex = flexLine.endOfLineIndex;

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const canSkipFlex = !performLayout && sizingModeCrossDim === SizingMode.StretchFit;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated. If
    // the main dimension size isn't known, it is computed based on the line
    // length, so there's no more space left to distribute.

    let sizeBasedOnContent = false;
    // If we don't measure with exact main dimension we want to ensure we don't
    // violate min and max
    if (sizingModeMainDim !== SizingMode.StretchFit) {
      const minInnerMainDim = isMainAxisRow
        ? style.resolvedMinDimension(direction, Dimension.Width, ownerWidth, ownerWidth) -
          paddingAndBorderAxisRow
        : style.resolvedMinDimension(direction, Dimension.Height, ownerHeight, ownerWidth) -
          paddingAndBorderAxisColumn;
      const maxInnerMainDim = isMainAxisRow
        ? style.resolvedMaxDimension(direction, Dimension.Width, ownerWidth, ownerWidth) -
          paddingAndBorderAxisRow
        : style.resolvedMaxDimension(direction, Dimension.Height, ownerHeight, ownerWidth) -
          paddingAndBorderAxisColumn;

      if (flexLine.sizeConsumed < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (flexLine.sizeConsumed > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (flexLine.layout.totalFlexGrowFactors === 0 || node.resolveFlexGrow() === 0) {
          // If we don't have any children to flex or we can't flex the node
          // itself, space we've used is all space we need. Root node also
          // should be shrunk to minimum
          availableInnerMainDim = flexLine.sizeConsumed;
        }

        sizeBasedOnContent = true;
      }
    }

    if (!sizeBasedOnContent && availableInnerMainDim === availableInnerMainDim) {
      flexLine.layout.remainingFreeSpace = availableInnerMainDim - flexLine.sizeConsumed;
    } else if (flexLine.sizeConsumed < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its content. sizeConsumed is negative which means
      // the node will allocate 0 points for its content. Consequently,
      // remainingFreeSpace is 0 - sizeConsumed.
      flexLine.layout.remainingFreeSpace = -flexLine.sizeConsumed;
    }

    preFlexOverflow = preFlexOverflow || flexLine.layout.remainingFreeSpace < -0.0001;
    linesCanGrow = linesCanGrow || flexLine.layout.totalFlexGrowFactors !== 0;
    linesHaveAutoMargins = linesHaveAutoMargins || flexLine.numberOfAutoMargins !== 0;
    maxLineSizeConsumed = Math.max(maxLineSizeConsumed, flexLine.sizeConsumed);

    if (!canSkipFlex) {
      resolveFlexibleLength(
        node,
        flexLine,
        mainAxis,
        crossAxis,
        direction,
        availableInnerMainDim,
        availableInnerCrossDim,
        availableInnerWidth,
        availableInnerHeight,
        mainAxisOverflows,
        sizingModeCrossDim,
        performLayout,
        layoutMarkerData,
        depth,
        generationCount,
      );
      itemSizeDiffers = itemSizeDiffers || gLineItemSizeDiffers;
      itemMeasureDiffers = itemMeasureDiffers || gLineItemMeasureDiffers;
    }

    // Less than the layout cache tells available sizes apart by is a rounding
    // error, not an overflow.
    ownOverflow = ownOverflow || flexLine.layout.remainingFreeSpace < -0.0001;
    layout.hadOverflow = layout.hadOverflow || flexLine.layout.remainingFreeSpace < -0.0001;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis. Their dimensions are also set in the cross axis with the exception
    // of items that are aligned "stretch". We need to compute these stretch
    // values and set the final positions.

    justifyMainAxis(
      node,
      flexLine,
      mainAxis,
      crossAxis,
      direction,
      sizingModeMainDim,
      sizingModeCrossDim,
      mainAxisOwnerSize,
      ownerWidth,
      availableInnerMainDim,
      availableInnerCrossDim,
      availableInnerWidth,
      performLayout,
      isNodeBaselineLayout,
    );

    let containerCrossAxis = availableInnerCrossDim;
    if (
      sizingModeCrossDim === SizingMode.MaxContent ||
      sizingModeCrossDim === SizingMode.FitContent
    ) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
        boundAxisAbovePaddingAndBorder(
          node,
          crossAxis,
          direction,
          flexLine.layout.crossDim + paddingAndBorderAxisCross,
          crossAxisOwnerSize,
          ownerWidth,
          paddingAndBorderAxisCross,
        ) - paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && sizingModeCrossDim === SizingMode.StretchFit) {
      flexLine.layout.crossDim = availableInnerCrossDim;
    }

    // As-per https://www.w3.org/TR/css-flexbox-1/#cross-sizing, the
    // cross-size of the line within a single-line container should be bound to
    // min/max constraints before alignment within the line. In a multi-line
    // container, affecting alignment between the lines.
    if (!isNodeFlexWrap) {
      flexLine.layout.crossDim =
        boundAxisAbovePaddingAndBorder(
          node,
          crossAxis,
          direction,
          flexLine.layout.crossDim + paddingAndBorderAxisCross,
          crossAxisOwnerSize,
          ownerWidth,
          paddingAndBorderAxisCross,
        ) - paddingAndBorderAxisCross;
    }

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    // In a function of its own for the V8 inlining budget: the helpers below
    // are the priciest of the layout, and sharing one budget with the rest of
    // `calculateLayoutImpl` leaves them as real calls.
    if (performLayout) {
      alignChildrenOnCrossAxis(
        node,
        flexLine,
        containerCrossAxis,
        totalLineCrossDim,
        availableInnerMainDim,
        availableInnerCrossDim,
        availableInnerWidth,
        availableInnerHeight,
        layoutMarkerData,
        depth,
        generationCount,
      );
    }

    const appliedCrossGap = lineCount !== 0 ? crossAxisGap : 0.0;
    totalLineCrossDim += flexLine.layout.crossDim + appliedCrossGap;
    maxLineMainDim = maxOrDefined(maxLineMainDim, flexLine.layout.mainDim);
  }
  releaseFlexLine(flexLine);

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  // Kept in a function of its own so that it brings its own V8 inlining
  // budget: `calculateLayoutImpl` spends all of a shared one long before the
  // helpers of this step, which then stay real calls.
  if (performLayout && (isNodeFlexWrap || isNodeBaselineLayout)) {
    alignContentLines(
      node,
      layoutChildren,
      lineCount,
      totalLineCrossDim,
      availableInnerWidth,
      availableInnerHeight,
      availableInnerCrossDim,
      crossAxisOwnerSize,
      ownerWidth,
      sizingModeCrossDim,
      layoutMarkerData,
      depth,
      generationCount,
    );
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS

  layout.measuredDimensions[Dimension.Width] = boundAxisAbovePaddingAndBorder(
    node,
    FlexDirection.Row,
    direction,
    availableWidth - marginAxisRow,
    ownerWidth,
    ownerWidth,
    paddingAndBorderAxisRowEdges,
  );

  layout.measuredDimensions[Dimension.Height] = boundAxisAbovePaddingAndBorder(
    node,
    FlexDirection.Column,
    direction,
    availableHeight - marginAxisColumn,
    ownerHeight,
    ownerWidth,
    paddingAndBorderAxisColumnEdges,
  );

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (
    sizingModeMainDim === SizingMode.MaxContent ||
    (style.overflow !== Overflow.Scroll && sizingModeMainDim === SizingMode.FitContent)
  ) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    layout.measuredDimensions[mainDimension] = boundAxisAbovePaddingAndBorder(
      node,
      mainAxis,
      direction,
      maxLineMainDim,
      mainAxisOwnerSize,
      ownerWidth,
      paddingAndBorderAxisMain,
    );
  } else if (sizingModeMainDim === SizingMode.FitContent && style.overflow === Overflow.Scroll) {
    layout.measuredDimensions[mainDimension] = maxOrDefined(
      minOrDefined(
        availableInnerMainDim + paddingAndBorderAxisMain,
        boundAxisWithinMinAndMax(
          node,
          direction,
          mainAxis,
          maxLineMainDim,
          mainAxisOwnerSize,
          ownerWidth,
        ),
      ),
      paddingAndBorderAxisMain,
    );
  }

  if (
    sizingModeCrossDim === SizingMode.MaxContent ||
    (style.overflow !== Overflow.Scroll && sizingModeCrossDim === SizingMode.FitContent)
  ) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    layout.measuredDimensions[crossDimension] = boundAxisAbovePaddingAndBorder(
      node,
      crossAxis,
      direction,
      totalLineCrossDim + paddingAndBorderAxisCross,
      crossAxisOwnerSize,
      ownerWidth,
      paddingAndBorderAxisCross,
    );
  } else if (sizingModeCrossDim === SizingMode.FitContent && style.overflow === Overflow.Scroll) {
    layout.measuredDimensions[crossDimension] = maxOrDefined(
      minOrDefined(
        availableInnerCrossDim + paddingAndBorderAxisCross,
        boundAxisWithinMinAndMax(
          node,
          direction,
          crossAxis,
          totalLineCrossDim + paddingAndBorderAxisCross,
          crossAxisOwnerSize,
          ownerWidth,
        ),
      ),
      paddingAndBorderAxisCross,
    );
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && style.flexWrap === Wrap.WrapReverse) {
    for (let i = 0, length = layoutChildren.length; i < length; i++) {
      const child = layoutChildren[i]!;
      if (child.style.positionType !== PositionType.Absolute) {
        const childLayout = child.layout;
        childLayout.position[flexStartEdge(crossAxis)] =
          layout.measuredDimensions[crossDimension] -
          childLayout.position[flexStartEdge(crossAxis)] -
          childLayout.measuredDimensions[crossDimension];
      }
    }
  }

  if (performLayout) {
    // STEP 10: SETTING TRAILING POSITIONS FOR CHILDREN
    const needsMainTrailingPos = needsTrailingPosition(mainAxis);
    const needsCrossTrailingPos = needsTrailingPosition(crossAxis);

    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (let i = 0, length = layoutChildren.length; i < length; i++) {
        const child = layoutChildren[i]!;
        // Absolute children will be handled by their containing block since we
        // cannot guarantee that their positions are set when their parents are
        // done with layout.
        if (
          child.style.display === Display.None ||
          child.style.positionType === PositionType.Absolute
        ) {
          continue;
        }

        if (needsMainTrailingPos) {
          setChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setChildTrailingPosition(node, child, crossAxis);
        }
      }
    }

    // STEP 11: SIZING AND POSITIONING ABSOLUTE CHILDREN
    // Let the containing block layout its absolute descendants.
    if (style.positionType !== PositionType.Static || depth === 1) {
      layout.absoluteWalkSizingMode = isMainAxisRow ? sizingModeMainDim : sizingModeCrossDim;
      layoutAbsoluteDescendants(
        node,
        node,
        layout.absoluteWalkSizingMode,
        direction,
        layoutMarkerData,
        depth,
        generationCount,
        0.0,
        0.0,
      );
    }
  }

  // What the pass found out for the cache. A node whose size follows its
  // content in any space that fits it: no child depends on the space, none
  // is dirty yet unvisited, and the items cannot fill the space, which they
  // do when both the node and an item can grow.
  let contentSized = !(linesCanGrow && node.resolveFlexGrow() !== 0);
  for (let i = 0, length = layoutChildren.length; contentSized && i < length; i++) {
    const child = layoutChildren[i]!;
    if (child.style.display === Display.None) {
      continue;
    }
    contentSized =
      !child.style.dependsOnOwnerSpace &&
      child.layout.contentSized &&
      !(child.isDirty() && child.layout.generationCount !== generationCount);
  }
  layout.contentSized = contentSized;
  if (performLayout) {
    // The flag a measurement in this space would have reported: none where it
    // would have taken the node's size for granted, the lines' overflow before
    // the flex step where it would have skipped that step, and otherwise what
    // this pass found, including what its children report for a measurement.
    layout.measureHadOverflow =
      widthSizingMode === SizingMode.StretchFit && heightSizingMode === SizingMode.StretchFit
        ? false
        : sizingModeCrossDim === SizingMode.StretchFit
          ? preFlexOverflow
          : ownOverflow || layout.measureHadOverflow;
  } else {
    layout.measureHadOverflow = layout.hadOverflow;
  }
  // A measurement in a space it takes for fixed (see `measureNodeWithFixedSize`)
  // reports that space, which for a space of nothing to fit is nothing, where
  // this algorithm reports the content.
  const measurementShortcutDiffers =
    isFixedSize(availableWidth - marginAxisRow, widthSizingMode) &&
    isFixedSize(availableHeight - marginAxisColumn, heightSizingMode) &&
    (widthSizingMode === SizingMode.FitContent || heightSizingMode === SizingMode.FitContent);
  const measureDiffers =
    performLayout &&
    (measurementShortcutDiffers ||
      (sizingModeCrossDim === SizingMode.StretchFit
        ? mainSpaceWasToFit && (preFlexOverflow || itemSizeDiffers)
        : itemMeasureDiffers));
  layout.measureDiffers = measureDiffers;
  gPassMeasureDiffers = measureDiffers;
  gPassRelaxable =
    contentSized &&
    !isNodeBaselineLayout &&
    !style.hasSizeBounds &&
    style.overflow !== Overflow.Scroll &&
    !measureDiffers;
  // More room along the main axis changes nothing below when the items sit at
  // its start and nothing takes free space, and the node places no absolute
  // descendant against itself. A reversed axis positions from the far edge.
  gPassMainSizeInvariant =
    performLayout &&
    !isNodeFlexWrap &&
    !mainSpaceIsNothing &&
    !preFlexOverflow &&
    !linesCanGrow &&
    !linesHaveAutoMargins &&
    (style.justifyContent === Justify.FlexStart || style.justifyContent === Justify.Start) &&
    (mainAxis === FlexDirection.Row || mainAxis === FlexDirection.Column) &&
    style.positionType === PositionType.Static &&
    depth !== 1;
  gPassMainContentSize = maxLineSizeConsumed + paddingAndBorderAxisMain;
  return true;
}

// The main size of a `mainSizeInvariant` layout restored in a larger exact
// main size: the room asked for, less the margin, as STEP 9 would compute it.
function setStretchedMainSize(node: Node, availableWidth: number, availableHeight: number): void {
  const layout = node.layout;
  if (isRow(resolveDirection(node.style.flexDirection, layout.direction))) {
    layout.measuredDimensions[Dimension.Width] = Math.max(
      availableWidth - layout.margin[PhysicalEdge.Left] - layout.margin[PhysicalEdge.Right],
      layout.padding[PhysicalEdge.Left] +
        layout.padding[PhysicalEdge.Right] +
        layout.border[PhysicalEdge.Left] +
        layout.border[PhysicalEdge.Right],
    );
  } else {
    layout.measuredDimensions[Dimension.Height] = Math.max(
      availableHeight - layout.margin[PhysicalEdge.Top] - layout.margin[PhysicalEdge.Bottom],
      layout.padding[PhysicalEdge.Top] +
        layout.padding[PhysicalEdge.Bottom] +
        layout.border[PhysicalEdge.Top] +
        layout.border[PhysicalEdge.Bottom],
    );
  }
}

// Both helpers below are kept out of calculateLayoutInternal, which has to stay
// small enough for V8 to inline the cache probes into it.

// Brings a node's results back from a cache entry, next to its measured size.
function restoreCachedResults(
  layout: LayoutResults,
  cachedResults: CachedMeasurement,
  performLayout: boolean,
): void {
  layout.baseline = cachedResults.baseline;
  // A measurement reports the flag of a measurement, also from a layout's
  // entry. One that brings back another flag than the one of the node's last
  // layout leaves a result of its own, like one that is computed.
  const hadOverflow = performLayout ? cachedResults.hadOverflow : cachedResults.measureHadOverflow;
  if (!performLayout && layout.hadOverflow !== hadOverflow) {
    layout.measuredSinceLayout = true;
    gMeasurementLeftResults = true;
  }
  layout.hadOverflow = hadOverflow;
  layout.measureHadOverflow = cachedResults.measureHadOverflow;
}

// After a node is computed: tells the layout cache of the node and of its
// owners apart from what a measurement left in the subtree.
function noteResultsLeftByMeasurement(
  node: Node,
  performLayout: boolean,
  hadOverflow: boolean,
  outerMeasurementLeftResults: boolean,
): void {
  const layout = node.layout;
  if (performLayout) {
    // Every node below has been laid out after it was last measured.
    layout.measuredSinceLayout = false;
    gMeasurementLeftResults = outerMeasurementLeftResults;
  } else if (
    gMeasurementLeftResults ||
    node.style.edgesNeedOwnerWidth ||
    layout.hadOverflow !== hadOverflow
  ) {
    layout.measuredSinceLayout = true;
    gMeasurementLeftResults = true;
  } else {
    gMeasurementLeftResults = outerMeasurementLeftResults;
  }
}

// Relayout boundaries.
//
// A change dirties every owner up to the root, and an owner's pass normally
// runs the whole flex algorithm again, asking every child about its size. An
// owner whose own style, children and config are unchanged, though, would ask
// its children the very questions it asked last time: its pass depends on
// nothing else. If each dirty child still gives the same answers to those
// questions (its cache entries hold them), the owner's pass would come out as
// before, and the owner's own cache entries still hold. Asking a dirty child
// again also lays it out again, so the subtree below is up to date either way.
//
// The child's entries are copied here before the child is asked again, which
// empties its cache: availableWidth, availableHeight, ownerWidth, ownerHeight,
// widthSizingMode, heightSizingMode, computedWidth, computedHeight, baseline,
// flags (see `entryFlags`), mainContentSize.
const REPLAY_FIELDS = 11;
const replayScratch: number[] = [];

const FLAG_HAD_OVERFLOW = 1;
const FLAG_MEASURE_HAD_OVERFLOW = 2;
const FLAG_RELAXABLE = 4;
const FLAG_MAIN_SIZE_INVARIANT = 8;

function entryFlags(entry: CachedMeasurement): number {
  return (
    (entry.hadOverflow ? FLAG_HAD_OVERFLOW : 0) |
    (entry.measureHadOverflow ? FLAG_MEASURE_HAD_OVERFLOW : 0) |
    (entry.relaxable ? FLAG_RELAXABLE : 0) |
    (entry.mainSizeInvariant ? FLAG_MAIN_SIZE_INVARIANT : 0)
  );
}

function pushEntry(entry: CachedMeasurement): void {
  replayScratch.push(
    entry.availableWidth,
    entry.availableHeight,
    entry.ownerWidth,
    entry.ownerHeight,
    entry.widthSizingMode,
    entry.heightSizingMode,
    entry.computedWidth,
    entry.computedHeight,
    entry.baseline,
    entryFlags(entry),
    entry.mainContentSize,
  );
}

function sameNumber(a: number, b: number): boolean {
  return a === b || (a !== a && b !== b);
}

/** Whether `entry` holds the question copied at `at`, with the same flags a later question reads. */
function holdsCopiedEntry(entry: CachedMeasurement, at: number): boolean {
  const s = replayScratch;
  return (
    entry.computedWidth >= 0 &&
    sameNumber(entry.availableWidth, s[at]!) &&
    sameNumber(entry.availableHeight, s[at + 1]!) &&
    sameNumber(entry.ownerWidth, s[at + 2]!) &&
    sameNumber(entry.ownerHeight, s[at + 3]!) &&
    entry.widthSizingMode === s[at + 4] &&
    entry.heightSizingMode === s[at + 5] &&
    ((entryFlags(entry) ^ s[at + 9]!) & (FLAG_RELAXABLE | FLAG_MAIN_SIZE_INVARIANT)) === 0 &&
    sameNumber(entry.mainContentSize, s[at + 10]!)
  );
}

/**
 * Whether the owner can check a dirty child by asking it again: its own
 * inputs are unchanged, it takes part in the owner's flex layout, its cache
 * still holds every question the owner asked (a full cache may have let one
 * go), and the owner's last pass laid it out once, with the question its
 * layout entry holds.
 */
function canReplay(child: Node): boolean {
  const style = child.style;
  const layout = child.layout;
  return (
    child.canRevalidate() &&
    style.display === Display.Flex &&
    style.positionType !== PositionType.Absolute &&
    layout.layoutGeneration > 0 &&
    layout.cachedLayout.computedWidth >= 0 &&
    layout.nextCachedMeasurementsIndex < LayoutResults.MaxCachedMeasurements
  );
}

/**
 * Asks a dirty child, whose own inputs are unchanged, every question its cache
 * holds the answer to, measurements first and its layout last, as its owner's
 * pass does. Returns whether every answer, and every flag its owner reads, is
 * the same as before.
 */
function replayChild(
  child: Node,
  ownerDirection: Direction,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): boolean {
  const layout = child.layout;
  const count = layout.nextCachedMeasurementsIndex;
  const contentSized = layout.contentSized;
  const measureDiffers = layout.measureDiffers;
  const baselineLayout = layout.baselineLayout;
  const base = replayScratch.length;
  for (let i = 0; i < count; i++) {
    pushEntry(layout.cachedMeasurements[i]!);
  }
  // The layout, which the owner asked for last, is asked for last again.
  pushEntry(layout.cachedLayout);

  let same = true;
  const s = replayScratch;
  for (let k = 0; same && k <= count; k++) {
    const at = base + k * REPLAY_FIELDS;
    const performLayout = k === count;
    // Asked again, the child's layout is not one of its owner's passes.
    const layoutGeneration = layout.layoutGeneration;
    calculateLayoutInternal(
      child,
      s[at]!,
      s[at + 1]!,
      ownerDirection,
      s[at + 4]! as SizingMode,
      s[at + 5]! as SizingMode,
      s[at + 2]!,
      s[at + 3]!,
      performLayout,
      performLayout ? LayoutPassReason.FlexLayout : LayoutPassReason.FlexMeasure,
      layoutMarkerData,
      depth,
      generationCount,
    );
    layout.layoutGeneration = layoutGeneration;
    const flags = s[at + 9]!;
    same =
      sameNumber(layout.measuredDimensions[Dimension.Width], s[at + 6]!) &&
      sameNumber(layout.measuredDimensions[Dimension.Height], s[at + 7]!) &&
      sameNumber(layout.baseline, s[at + 8]!) &&
      layout.hadOverflow === ((flags & FLAG_HAD_OVERFLOW) !== 0) &&
      layout.measureHadOverflow === ((flags & FLAG_MEASURE_HAD_OVERFLOW) !== 0);
  }
  // The flags a later question to the child is answered by must hold too: an
  // entry that stopped being relaxable no longer answers the questions it did.
  for (let k = 0; same && k <= count; k++) {
    const at = base + k * REPLAY_FIELDS;
    if ((s[at + 9]! & (FLAG_RELAXABLE | FLAG_MAIN_SIZE_INVARIANT)) === 0) {
      continue;
    }
    let held = holdsCopiedEntry(layout.cachedLayout, at);
    for (let i = 0; !held && i < layout.nextCachedMeasurementsIndex; i++) {
      held = holdsCopiedEntry(layout.cachedMeasurements[i]!, at);
    }
    same = held;
  }
  replayScratch.length = base;
  return (
    same &&
    layout.contentSized === contentSized &&
    layout.measureDiffers === measureDiffers &&
    layout.baselineLayout === baselineLayout
  );
}

/**
 * On the first visit of a pass to a node that is dirty only because something
 * below it changed: asks its dirty children again, and returns whether its
 * cache still holds, in which case the node is clean again. Otherwise the node
 * is laid out as usual, and the children answer from what they just computed.
 */
function revalidate(
  node: Node,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): boolean {
  const layout = node.layout;
  if (
    !node.canRevalidate() ||
    node.hasMeasureFunc() ||
    node.hasContentsChildren() ||
    layout.cachedLayout.computedWidth < 0
  ) {
    return false;
  }
  // A node whose children keep answering otherwise, as when a change changes
  // their size, is asked less often: each miss doubles the passes it waits.
  if (layout.revalidationBackoff >= 8) {
    layout.revalidationBackoff -= 8;
    return false;
  }
  const children = node.getLayoutChildren();
  // The children's passes see what they would under the node's own pass.
  const ownerIsBaselineLayout = gOwnerIsBaselineLayout;
  gOwnerIsBaselineLayout = ownerIsBaselineLayout || layout.baselineLayout;
  // Every dirty child must be one the node can check, before any is asked.
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    if (child.isDirty() && !canReplay(child)) {
      gOwnerIsBaselineLayout = ownerIsBaselineLayout;
      return false;
    }
  }
  let same = true;
  for (let i = 0, length = children.length; same && i < length; i++) {
    const child = children[i]!;
    if (child.isDirty()) {
      same = replayChild(child, layout.direction, layoutMarkerData, depth, generationCount);
    }
  }
  gOwnerIsBaselineLayout = ownerIsBaselineLayout;
  if (!same) {
    const misses = Math.min((layout.revalidationBackoff & 7) + 1, 6);
    layout.revalidationBackoff = (((1 << misses) - 1) << 3) | misses;
    return false;
  }
  layout.revalidationBackoff = 0;
  // As a containing block, the node places its absolute descendants after its
  // flex pass, and where one without insets goes depends on its parent: the
  // node's pass is skipped, but not that step. It works on the size the node
  // was laid out with, which a later measurement may have replaced.
  if (node.style.positionType !== PositionType.Static || depth === 1) {
    layout.measuredDimensions[Dimension.Width] = layout.rawDimensions[Dimension.Width];
    layout.measuredDimensions[Dimension.Height] = layout.rawDimensions[Dimension.Height];
    layoutAbsoluteDescendants(
      node,
      node,
      layout.absoluteWalkSizingMode,
      layout.direction,
      layoutMarkerData,
      depth,
      generationCount,
      0.0,
      0.0,
    );
  }
  node.setDirty(false);
  return true;
}

//
// This is a wrapper around the calculateLayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as calculateLayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
export function calculateLayoutInternal(
  node: Node,
  availableWidth: number,
  availableHeight: number,
  ownerDirection: Direction,
  widthSizingMode: SizingMode,
  heightSizingMode: SizingMode,
  ownerWidth: number,
  ownerHeight: number,
  performLayout: boolean,
  reason: LayoutPassReason,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): boolean {
  const layout = node.layout;

  depth++;

  const dirtyFirstVisit = node.isDirty() && layout.generationCount !== generationCount;
  const contextChanged =
    layout.configVersion !== node.getConfig().version ||
    layout.lastOwnerDirection !== ownerDirection;
  // Whether the node's children were asked again, and its cache held (see
  // `revalidate`): its subtree changed, though not its own results.
  const revalidated =
    dirtyFirstVisit &&
    !contextChanged &&
    revalidate(node, layoutMarkerData, depth, generationCount);
  const needToVisitNode = !revalidated && (dirtyFirstVisit || contextChanged);

  if (needToVisitNode) {
    // Invalidate the cached results, flags included.
    layout.nextCachedMeasurementsIndex = 0;
    layout.hasRelaxableMeasurements = false;
    layout.cachedLayout.reset();
  }

  let cachedResults: CachedMeasurement | null = null;
  // A flex basis measurement promoted to a layout, because the space it is
  // asked in is the one the node ends up with. It takes a measurement it
  // finds cached like a measurement would, and only does the work it has to
  // do anyway as a layout.
  const promoted = performLayout && reason === LayoutPassReason.MeasureChild;
  const ownerIsBaselineLayout = gOwnerIsBaselineLayout;
  // A layout restored with the node's main size set to the one asked for.
  let stretched = false;
  // A layout restored from the layout entry in another space.
  let relaxedLayout = false;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions and dimensions for nodes in the subtree. The algorithm assumes
  // that each node gets laid out a maximum of one time per tree layout, but
  // multiple measurements may be required to resolve all of the flex
  // dimensions. We handle nodes with measure functions specially here because
  // they are the most expensive to measure, so it's worth avoiding redundant
  // measurements if at all possible.
  if (node.hasMeasureFunc()) {
    cachedResults = findCachedMeasurement(
      node,
      widthSizingMode,
      availableWidth,
      heightSizingMode,
      availableHeight,
      ownerWidth,
      ownerHeight,
    );
  } else {
    // A measurement, and a promoted one, look for a measurement first: the
    // exact probe is the cheapest, and it is what a promoted request finds on
    // a node that is laid out already. A layout looks for its layout.
    if (!performLayout || promoted) {
      const keyedOnOwnerSize = node.style.dependsOnOwnerSize;
      const relaxed = !ownerIsBaselineLayout;
      for (let i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
        const cachedMeasurement = layout.cachedMeasurements[i]!;
        // The sizing modes settle about half the entries between them, and
        // cost two integer compares against the two calls a size takes. They
        // go first.
        if (
          cachedMeasurement.widthSizingMode === widthSizingMode &&
          cachedMeasurement.heightSizingMode === heightSizingMode &&
          sameSpace(widthSizingMode, cachedMeasurement.availableWidth, availableWidth) &&
          sameSpace(heightSizingMode, cachedMeasurement.availableHeight, availableHeight) &&
          (!keyedOnOwnerSize || hasSameOwnerSize(cachedMeasurement, ownerWidth, ownerHeight)) &&
          (relaxed || !cachedMeasurement.fromLayout)
        ) {
          cachedResults = cachedMeasurement;
          if (i > 0) {
            layout.promoteCachedMeasurement(i);
          }
          break;
        }
      }
      if (
        cachedResults === null &&
        relaxed &&
        (layout.hasRelaxableMeasurements || layout.cachedLayout.relaxable)
      ) {
        cachedResults = findRelaxedMeasurement(
          node,
          widthSizingMode,
          availableWidth,
          heightSizingMode,
          availableHeight,
          ownerWidth,
          ownerHeight,
        );
      }
      if (cachedResults !== null) {
        // A promoted pass that finds a measurement takes it as one.
        performLayout = false;
      }
    }
    if (cachedResults === null && performLayout) {
      if (
        layout.cachedLayout.widthSizingMode === widthSizingMode &&
        layout.cachedLayout.heightSizingMode === heightSizingMode &&
        sameSpace(widthSizingMode, layout.cachedLayout.availableWidth, availableWidth) &&
        sameSpace(heightSizingMode, layout.cachedLayout.availableHeight, availableHeight) &&
        (!node.style.dependsOnOwnerSize ||
          hasSameOwnerSize(layout.cachedLayout, ownerWidth, ownerHeight))
      ) {
        cachedResults = layout.cachedLayout;
      } else if (!ownerIsBaselineLayout) {
        const fit = relaxedLayoutFits(
          node,
          widthSizingMode,
          availableWidth,
          heightSizingMode,
          availableHeight,
          ownerWidth,
          ownerHeight,
        );
        if (fit !== LAYOUT_MISS) {
          cachedResults = layout.cachedLayout;
          stretched = fit === LAYOUT_STRETCHED;
          relaxedLayout = true;
        }
      }
    }
  }

  // A layout cannot be restored over what a later measurement left behind.
  if (performLayout && layout.measuredSinceLayout) {
    cachedResults = null;
  }

  if (!needToVisitNode && cachedResults !== null) {
    layout.measuredDimensions[Dimension.Width] = cachedResults.computedWidth;
    layout.measuredDimensions[Dimension.Height] = cachedResults.computedHeight;
    if (stretched) {
      setStretchedMainSize(node, availableWidth, availableHeight);
    }
    restoreCachedResults(layout, cachedResults, performLayout);

    if (__EVENTS__ && layoutMarkerData !== null) {
      if (performLayout) {
        layoutMarkerData.cachedLayouts += 1;
      } else {
        layoutMarkerData.cachedMeasures += 1;
      }
    }
  } else {
    const outerMeasurementLeftResults = gMeasurementLeftResults;
    gMeasurementLeftResults = false;
    const hadOverflow = layout.hadOverflow;
    const visitedChildren = calculateLayoutImpl(
      node,
      availableWidth,
      availableHeight,
      ownerDirection,
      widthSizingMode,
      heightSizingMode,
      ownerWidth,
      ownerHeight,
      performLayout,
      reason,
      layoutMarkerData,
      depth,
      generationCount,
    );
    let relaxable = gPassRelaxable;
    let mainSizeInvariant = gPassMainSizeInvariant;
    const mainContentSize = gPassMainContentSize;
    gOwnerIsBaselineLayout = ownerIsBaselineLayout;
    // The subtree was laid out either way; see below.
    const promotedRan = promoted && performLayout;
    if (promotedRan && gPassMeasureDiffers) {
      // The owner asked for a measurement, and a layout in this space found
      // another size than a measurement would have reported. Measure after
      // all, and forget the layout: the subtree holds one that no request of
      // the owner can restore.
      calculateLayoutImpl(
        node,
        availableWidth,
        availableHeight,
        ownerDirection,
        widthSizingMode,
        heightSizingMode,
        ownerWidth,
        ownerHeight,
        false,
        reason,
        layoutMarkerData,
        depth,
        generationCount,
      );
      relaxable = gPassRelaxable;
      mainSizeInvariant = false;
      gOwnerIsBaselineLayout = ownerIsBaselineLayout;
      layout.cachedLayout.reset();
      performLayout = false;
    }

    // A node without children of its own to go by has its bottom edge for a
    // baseline. So has one measured with a definite cross size: that skips the
    // flex step, and leaves the children as they were.
    layout.baseline =
      visitedChildren &&
      (performLayout ||
        (isRow(node.style.flexDirection) ? heightSizingMode : widthSizingMode) !==
          SizingMode.StretchFit)
        ? calculateBaseline(node, performLayout)
        : layout.measuredDimensions[Dimension.Height];
    noteResultsLeftByMeasurement(node, performLayout, hadOverflow, outerMeasurementLeftResults);
    // A promoted measurement lays the subtree out in the space it is asked in,
    // which its owner may yet lay it out in another. Until then, the owner and
    // the passes above it cannot restore a layout over the subtree, no more
    // than over what a measurement leaves behind.
    if (promotedRan) {
      gMeasurementLeftResults = true;
    }
    layout.lastOwnerDirection = ownerDirection;
    layout.configVersion = node.getConfig().version;

    if (cachedResults === null) {
      if (__EVENTS__ && layoutMarkerData !== null) {
        layoutMarkerData.maxMeasureCache = Math.max(
          layoutMarkerData.maxMeasureCache,
          layout.nextCachedMeasurementsIndex + 1,
        );
      }

      let newCacheEntry: CachedMeasurement;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = layout.cachedLayout;
      } else {
        newCacheEntry = layout.takeCachedMeasurement();
      }

      newCacheEntry.availableWidth = availableWidth;
      newCacheEntry.availableHeight = availableHeight;
      newCacheEntry.widthSizingMode = widthSizingMode;
      newCacheEntry.heightSizingMode = heightSizingMode;
      newCacheEntry.ownerWidth = ownerWidth;
      newCacheEntry.ownerHeight = ownerHeight;
      newCacheEntry.computedWidth = layout.measuredDimensions[Dimension.Width];
      newCacheEntry.computedHeight = layout.measuredDimensions[Dimension.Height];
      newCacheEntry.baseline = layout.baseline;
      newCacheEntry.hadOverflow = layout.hadOverflow;
      newCacheEntry.measureHadOverflow = layout.measureHadOverflow;
      newCacheEntry.relaxable = relaxable;
      newCacheEntry.mainSizeInvariant = mainSizeInvariant;
      newCacheEntry.mainContentSize = mainContentSize;
      if (relaxable && !performLayout) {
        layout.hasRelaxableMeasurements = true;
      }
      // The layout cache entry stands for the layout the subtree holds, which
      // the next layout pass replaces. What a promoted measurement found out
      // about the node's size outlives that: keep it with the measurements.
      if (promoted && performLayout) {
        const measurement = layout.takeCachedMeasurement();
        measurement.availableWidth = availableWidth;
        measurement.availableHeight = availableHeight;
        measurement.widthSizingMode = widthSizingMode;
        measurement.heightSizingMode = heightSizingMode;
        measurement.ownerWidth = ownerWidth;
        measurement.ownerHeight = ownerHeight;
        measurement.computedWidth = newCacheEntry.computedWidth;
        measurement.computedHeight = newCacheEntry.computedHeight;
        measurement.baseline = layout.baseline;
        measurement.hadOverflow = layout.measureHadOverflow;
        measurement.measureHadOverflow = layout.measureHadOverflow;
        measurement.relaxable = relaxable;
        measurement.fromLayout = true;
        if (relaxable) {
          layout.hasRelaxableMeasurements = true;
        }
      }
    }
  }

  if (performLayout) {
    // The size as reported is set when the pass rounds its results. A pass that
    // finds nothing to do does not round, and must leave the last one standing.
    layout.rawDimensions[Dimension.Width] = layout.measuredDimensions[Dimension.Width];
    layout.rawDimensions[Dimension.Height] = layout.measuredDimensions[Dimension.Height];

    node.hasNewLayout = true;
    node.setDirty(false);
    // A second layout in the pass, or one restored in another space.
    layout.layoutGeneration =
      relaxedLayout || Math.abs(layout.layoutGeneration) === generationCount
        ? -generationCount
        : generationCount;
  }

  layout.generationCount = generationCount;

  if (__EVENTS__ && Event.hasSubscribers()) {
    let layoutType: LayoutType;
    if (performLayout) {
      layoutType =
        !needToVisitNode && cachedResults === layout.cachedLayout
          ? LayoutType.CachedLayout
          : LayoutType.Layout;
    } else {
      layoutType = cachedResults !== null ? LayoutType.CachedMeasure : LayoutType.Measure;
    }
    Event.publish(node, Event.NodeLayout, { layoutType });
  }

  return needToVisitNode || cachedResults === null || revalidated;
}

export function calculateLayout(
  node: Node,
  ownerWidth: number,
  ownerHeight: number,
  ownerDirection: Direction,
): void {
  // A public layout call normally reaches the root's internal layout cache only
  // after resolving its constraints and setting up a generation. Remember the
  // raw public constraints in the layout cache's owner-size fields as well, so
  // the overwhelmingly common clean call can stop before doing any of that.
  //
  // Keep nested calls on the regular path. Besides preserving the global
  // generation/measurement bookkeeping during callbacks, this means a layout
  // invoked reentrantly cannot observe a half-finished outer pass as final.
  const cachedLayout = node.layout.cachedLayout;
  if (
    gActiveLayoutPasses === 0 &&
    node.owner === null &&
    !node.isDirty() &&
    node.hasNewLayout &&
    !node.layout.measuredSinceLayout &&
    cachedLayout.computedWidth >= 0 &&
    cachedLayout.computedHeight >= 0 &&
    sameLayoutConstraint(cachedLayout.ownerWidth, ownerWidth) &&
    sameLayoutConstraint(cachedLayout.ownerHeight, ownerHeight) &&
    node.layout.lastOwnerDirection === ownerDirection &&
    node.layout.configVersion === node.getConfig().version
  ) {
    if (__EVENTS__) {
      Event.publish(node, Event.LayoutPassStart);
      const markerData = new LayoutData();
      markerData.cachedLayouts = 1;
      if (Event.hasSubscribers()) {
        Event.publish(node, Event.NodeLayout, { layoutType: LayoutType.CachedLayout });
      }
      Event.publish(node, Event.LayoutPassEnd, { layoutData: markerData });
    }
    return;
  }

  if (__EVENTS__) Event.publish(node, Event.LayoutPassStart);
  // Pass statistics are only gathered for `Event.LayoutPassEnd`.
  const markerData = __EVENTS__ ? new LayoutData() : null;

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  const currentGenerationCount = ++gCurrentGenerationCount;
  gMeasurementLeftResults = false;
  const direction = node.resolveDirection(ownerDirection);
  let width: number;
  let widthSizingMode: SizingMode;
  const style = node.style;
  const maxWidth = style.resolvedMaxDimension(direction, Dimension.Width, ownerWidth, ownerWidth);
  if (node.hasDefiniteLength(Dimension.Width, ownerWidth)) {
    width =
      node.getResolvedDimension(direction, dimension(FlexDirection.Row), ownerWidth, ownerWidth) +
      style.computeMarginForAxis(FlexDirection.Row, ownerWidth);
    widthSizingMode = SizingMode.StretchFit;
  } else if (maxWidth === maxWidth) {
    width = maxWidth;
    widthSizingMode = SizingMode.FitContent;
  } else {
    width = ownerWidth;
    widthSizingMode = width !== width ? SizingMode.MaxContent : SizingMode.StretchFit;
  }

  let height: number;
  let heightSizingMode: SizingMode;
  const maxHeight = style.resolvedMaxDimension(
    direction,
    Dimension.Height,
    ownerHeight,
    ownerWidth,
  );
  if (node.hasDefiniteLength(Dimension.Height, ownerHeight)) {
    height =
      node.getResolvedDimension(
        direction,
        dimension(FlexDirection.Column),
        ownerHeight,
        ownerWidth,
      ) + style.computeMarginForAxis(FlexDirection.Column, ownerWidth);
    heightSizingMode = SizingMode.StretchFit;
  } else if (maxHeight === maxHeight) {
    height = maxHeight;
    heightSizingMode = SizingMode.FitContent;
  } else {
    height = ownerHeight;
    heightSizingMode = height !== height ? SizingMode.MaxContent : SizingMode.StretchFit;
  }
  // A measure function may run a nested layout pass, in
  // which case the global count has moved on from `currentGenerationCount`.
  const generationCount = currentGenerationCount;
  // Non-zero when this pass runs inside a measure function of another one.
  const poolDepth = flexLinePoolDepth();
  gActiveLayoutPasses++;
  try {
    if (
      calculateLayoutInternal(
        node,
        width,
        height,
        ownerDirection,
        widthSizingMode,
        heightSizingMode,
        ownerWidth,
        ownerHeight,
        true,
        LayoutPassReason.Initial,
        markerData,
        0, // tree root
        generationCount,
      )
    ) {
      node.setLayoutPositionFromStyle(node.layout.direction, ownerWidth, ownerHeight);
      roundLayoutResultsToPixelGrid(node, generationCount);
    }
  } finally {
    // Only does anything when a measure or baseline function threw.
    restoreFlexLinePool(poolDepth);
    gActiveLayoutPasses--;
  }

  // These fields are already the owner-size part of the root layout-cache key.
  // Updating them after a successful public call also makes them the raw-input
  // fingerprint. A throw never records a pass as complete.
  cachedLayout.ownerWidth = ownerWidth;
  cachedLayout.ownerHeight = ownerHeight;

  if (__EVENTS__) Event.publish(node, Event.LayoutPassEnd, { layoutData: markerData });
}

// `undefined` reaches here as NaN. Treat every NaN as the same unconstrained
// input, while retaining normal numeric equality (including +0/-0).
function sameLayoutConstraint(left: number, right: number): boolean {
  return left === right || (left !== left && right !== right);
}
