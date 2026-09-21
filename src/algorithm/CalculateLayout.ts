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
import { inexactEquals, maxOrDefined, minOrDefined } from "../math.ts";
import type { Style } from "../style/Style.ts";
import type { StyleLength } from "../style/StyleLength.ts";
import { layoutAbsoluteDescendants } from "./AbsoluteLayout.ts";
import { fallbackAlignment, fallbackJustification, resolveChildAlignment } from "./Align.ts";
import { calculateBaseline, isBaselineLayout } from "./Baseline.ts";
import {
  boundAxis,
  boundAxisInPlace,
  boundAxisValue,
  boundAxisWithinMinAndMax,
  paddingAndBorderForAxis,
} from "./BoundAxis.ts";
import { findCachedMeasurement } from "./Cache.ts";
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
  switch (mode) {
    case SizingMode.StretchFit:
    case SizingMode.FitContent:
      return maxSize !== maxSize || size < maxSize ? size : maxSize;
    case SizingMode.MaxContent:
      return maxSize === maxSize ? maxSize : size;
  }
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

    const hasExactWidth = width === width && widthMode === SizingMode.StretchFit;
    const childWidthStretch =
      resolveChildAlignment(node, child) === Align.Stretch &&
      childWidthSizingMode !== SizingMode.StretchFit;
    if (!isMainAxisRow && !isRowStyleDimDefined && hasExactWidth && childWidthStretch) {
      childWidth = width;
      childWidthSizingMode = SizingMode.StretchFit;
      if (hasAspectRatio) {
        childHeight = (childWidth - marginRow) / aspectRatio;
        childHeightSizingMode = SizingMode.StretchFit;
      }
    }

    const hasExactHeight = height === height && heightMode === SizingMode.StretchFit;
    const childHeightStretch =
      resolveChildAlignment(node, child) === Align.Stretch &&
      childHeightSizingMode !== SizingMode.StretchFit;
    if (isMainAxisRow && !isColumnStyleDimDefined && hasExactHeight && childHeightStretch) {
      childHeight = height;
      childHeightSizingMode = SizingMode.StretchFit;

      if (hasAspectRatio) {
        childWidth = (childHeight - marginColumn) * aspectRatio;
        childWidthSizingMode = SizingMode.StretchFit;
      }
    }

    const maxWidth = maxSizeForMode(child, direction, FlexDirection.Row, ownerWidth, ownerWidth);
    childWidth = constrainMaxSizeForMode(childWidthSizingMode, childWidth, maxWidth);
    childWidthSizingMode = constrainMaxSizeModeForMode(childWidthSizingMode, maxWidth);
    const maxHeight = maxSizeForMode(
      child,
      direction,
      FlexDirection.Column,
      ownerHeight,
      ownerWidth,
    );
    childHeight = constrainMaxSizeForMode(childHeightSizingMode, childHeight, maxHeight);
    childHeightSizingMode = constrainMaxSizeModeForMode(childHeightSizingMode, maxHeight);

    // Measure the child
    calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      childWidthSizingMode,
      childHeightSizingMode,
      ownerWidth,
      ownerHeight,
      false,
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

  let width = availableWidth;
  if (widthSizingMode === SizingMode.MaxContent || widthSizingMode === SizingMode.FitContent) {
    width =
      layout.padding[PhysicalEdge.Left] +
      layout.padding[PhysicalEdge.Right] +
      layout.border[PhysicalEdge.Left] +
      layout.border[PhysicalEdge.Right];
  }
  layout.measuredDimensions[Dimension.Width] = boundAxis(
    node,
    FlexDirection.Row,
    direction,
    width,
    ownerWidth,
    ownerWidth,
  );

  let height = availableHeight;
  if (heightSizingMode === SizingMode.MaxContent || heightSizingMode === SizingMode.FitContent) {
    height =
      layout.padding[PhysicalEdge.Top] +
      layout.padding[PhysicalEdge.Bottom] +
      layout.border[PhysicalEdge.Top] +
      layout.border[PhysicalEdge.Bottom];
  }
  layout.measuredDimensions[Dimension.Height] = boundAxis(
    node,
    FlexDirection.Column,
    direction,
    height,
    ownerHeight,
    ownerWidth,
  );
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
  ownerWidth: number,
  mainAxisOwnerSize: number,
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
): number {
  let childFlexBasis = 0;
  let flexShrinkScaledFactor = 0;
  let flexGrowFactor = 0;
  let deltaFreeSpace = 0;
  const isMainAxisRow = isRow(mainAxis);
  const isNodeFlexWrap = node.style.flexWrap !== Wrap.NoWrap;

  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const currentLineChild = flexLine.itemsInFlow[i]!;
    childFlexBasis = boundAxisWithinMinAndMax(
      currentLineChild,
      direction,
      mainAxis,
      currentLineChild.layout.computedFlexBasis,
      mainAxisOwnerSize,
      ownerWidth,
    );
    let updatedMainSize = childFlexBasis;

    if (flexLine.layout.remainingFreeSpace < 0) {
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
    } else if (flexLine.layout.remainingFreeSpace > 0) {
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

    const childStyle = currentLineChild.style;
    const marginMain = childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);
    const marginCross = childStyle.computeMarginForAxis(crossAxis, availableInnerWidth);

    let childCrossSize: number;
    let childMainSize = updatedMainSize + marginMain;
    let childCrossSizingMode: SizingMode;
    let childMainSizingMode: SizingMode = SizingMode.StretchFit;

    const aspectRatio = childStyle.aspectRatio;
    if (aspectRatio === aspectRatio) {
      childCrossSize = isMainAxisRow
        ? (childMainSize - marginMain) / aspectRatio
        : (childMainSize - marginMain) * aspectRatio;
      childCrossSizingMode = SizingMode.StretchFit;

      childCrossSize += marginCross;
    } else if (
      availableInnerCrossDim === availableInnerCrossDim &&
      !currentLineChild.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim) &&
      sizingModeCrossDim === SizingMode.StretchFit &&
      !(isNodeFlexWrap && mainAxisOverflows) &&
      resolveChildAlignment(node, currentLineChild) === Align.Stretch &&
      !childStyle.flexStartMarginIsAuto(crossAxis, direction) &&
      !childStyle.flexEndMarginIsAuto(crossAxis, direction)
    ) {
      childCrossSize = availableInnerCrossDim;
      childCrossSizingMode = SizingMode.StretchFit;
    } else if (!currentLineChild.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim)) {
      childCrossSize = availableInnerCrossDim;
      childCrossSizingMode =
        childCrossSize !== childCrossSize ? SizingMode.MaxContent : SizingMode.FitContent;
    } else {
      childCrossSize =
        currentLineChild.getResolvedDimension(
          direction,
          dimension(crossAxis),
          availableInnerCrossDim,
          availableInnerWidth,
        ) + marginCross;
      const isLoosePercentageMeasurement =
        currentLineChild.getProcessedDimension(dimension(crossAxis)).isPercent() &&
        sizingModeCrossDim !== SizingMode.StretchFit;
      childCrossSizingMode =
        childCrossSize !== childCrossSize || isLoosePercentageMeasurement
          ? SizingMode.MaxContent
          : SizingMode.StretchFit;
    }

    const maxMainSize = maxSizeForMode(
      currentLineChild,
      direction,
      mainAxis,
      availableInnerMainDim,
      availableInnerWidth,
    );
    childMainSize = constrainMaxSizeForMode(childMainSizingMode, childMainSize, maxMainSize);
    childMainSizingMode = constrainMaxSizeModeForMode(childMainSizingMode, maxMainSize);
    const maxCrossSize = maxSizeForMode(
      currentLineChild,
      direction,
      crossAxis,
      availableInnerCrossDim,
      availableInnerWidth,
    );
    childCrossSize = constrainMaxSizeForMode(childCrossSizingMode, childCrossSize, maxCrossSize);
    childCrossSizingMode = constrainMaxSizeModeForMode(childCrossSizingMode, maxCrossSize);

    const requiresStretchLayout =
      !currentLineChild.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim) &&
      resolveChildAlignment(node, currentLineChild) === Align.Stretch &&
      !childStyle.flexStartMarginIsAuto(crossAxis, direction) &&
      !childStyle.flexEndMarginIsAuto(crossAxis, direction);

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
  }
  return deltaFreeSpace;
}

// It distributes the free space to the flexible items.For those flexible items
// whose min and max constraints are triggered, those flex item's clamped size
// is removed from the remaingfreespace.
function distributeFreeSpaceFirstPass(
  flexLine: FlexLine,
  direction: Direction,
  mainAxis: FlexDirection,
  ownerWidth: number,
  mainAxisOwnerSize: number,
  availableInnerMainDim: number,
  availableInnerWidth: number,
): void {
  let flexShrinkScaledFactor = 0;
  let flexGrowFactor = 0;
  let baseMainSize = 0;
  let boundMainSize = 0;
  let deltaFreeSpace = 0;

  // The first pass performs a single distribution of the free space over all
  // of the line's flexible items, so every item's tentative size must be
  // computed against the *original* totals. The totals are still reduced as
  // items get frozen below (so the second pass can redistribute), but those
  // reduced values must not feed back into the fair-share calculation for the
  // remaining items: doing so inflates their tentative size and can freeze
  // items that should still be able to grow/shrink (see
  // https://github.com/react/yoga/issues/2006).
  const originalTotalFlexGrowFactors = flexLine.layout.totalFlexGrowFactors;
  const originalTotalFlexShrinkScaledFactors = flexLine.layout.totalFlexShrinkScaledFactors;

  for (let i = 0, length = flexLine.itemCount; i < length; i++) {
    const currentLineChild = flexLine.itemsInFlow[i]!;
    const childFlexBasis = boundAxisWithinMinAndMax(
      currentLineChild,
      direction,
      mainAxis,
      currentLineChild.layout.computedFlexBasis,
      mainAxisOwnerSize,
      ownerWidth,
    );

    if (flexLine.layout.remainingFreeSpace < 0) {
      flexShrinkScaledFactor = -currentLineChild.resolveFlexShrink() * childFlexBasis;

      // Is this child able to shrink?
      if (flexShrinkScaledFactor === flexShrinkScaledFactor && flexShrinkScaledFactor !== 0) {
        baseMainSize =
          childFlexBasis +
          (flexLine.layout.remainingFreeSpace / originalTotalFlexShrinkScaledFactors) *
            flexShrinkScaledFactor;
        boundAxisValue[0] = baseMainSize;
        boundAxisInPlace(
          currentLineChild,
          mainAxis,
          direction,
          availableInnerMainDim,
          availableInnerWidth,
        );
        boundMainSize = boundAxisValue[0];
        if (
          baseMainSize === baseMainSize &&
          boundMainSize === boundMainSize &&
          baseMainSize !== boundMainSize
        ) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          flexLine.layout.totalFlexShrinkScaledFactors -=
            -currentLineChild.resolveFlexShrink() * currentLineChild.layout.computedFlexBasis;
        }
      }
    } else if (flexLine.layout.remainingFreeSpace > 0) {
      flexGrowFactor = currentLineChild.resolveFlexGrow();

      // Is this child able to grow?
      if (flexGrowFactor === flexGrowFactor && flexGrowFactor !== 0) {
        baseMainSize =
          childFlexBasis +
          (flexLine.layout.remainingFreeSpace / originalTotalFlexGrowFactors) * flexGrowFactor;
        boundAxisValue[0] = baseMainSize;
        boundAxisInPlace(
          currentLineChild,
          mainAxis,
          direction,
          availableInnerMainDim,
          availableInnerWidth,
        );
        boundMainSize = boundAxisValue[0];

        if (
          baseMainSize === baseMainSize &&
          boundMainSize === boundMainSize &&
          baseMainSize !== boundMainSize
        ) {
          // By excluding this item's size and flex factor from remaining, this
          // item's min/max constraints should also trigger in the second pass
          // resulting in the item's size calculation being identical in the
          // first and second passes.
          deltaFreeSpace += boundMainSize - childFlexBasis;
          flexLine.layout.totalFlexGrowFactors -= flexGrowFactor;
        }
      }
    }
  }
  flexLine.layout.remainingFreeSpace -= deltaFreeSpace;
}

// Do two passes over the flex items to figure out how to distribute the
// remaining space.
//
// The first pass finds the items whose min/max constraints trigger, freezes
// them at those sizes, and excludes those sizes from the remaining space.
//
// The second pass sets the size of each flexible item. It distributes the
// remaining space amongst the items whose min/max constraints didn't trigger in
// the first pass. For the other items, it sets their sizes by forcing their
// min/max constraints to trigger again.
//
// This two pass approach for resolving min/max constraints deviates from the
// spec. The spec
// (https://www.w3.org/TR/CSS-flexbox-1/#resolve-flexible-lengths) describes a
// process that needs to be repeated a variable number of times. The algorithm
// implemented here won't handle all cases but it was simpler to implement and
// it mitigates performance concerns because we know exactly how many passes
// it'll do.
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
  ownerWidth: number,
  mainAxisOwnerSize: number,
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
  const originalFreeSpace = flexLine.layout.remainingFreeSpace;

  // First pass: detect the flex items whose min/max constraints trigger
  distributeFreeSpaceFirstPass(
    flexLine,
    direction,
    mainAxis,
    ownerWidth,
    mainAxisOwnerSize,
    availableInnerMainDim,
    availableInnerWidth,
  );

  // Second pass: resolve the sizes of the flexible items
  const distributedFreeSpace = distributeFreeSpaceSecondPass(
    flexLine,
    node,
    mainAxis,
    crossAxis,
    direction,
    ownerWidth,
    mainAxisOwnerSize,
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
        // Space on the edges is half of the space between elements
        leadingMainDim = (0.5 * flexLine.layout.remainingFreeSpace) / itemCount;
        betweenMainDim += leadingMainDim * 2;
        break;
      case Justify.FlexStart:
        break;
    }
  }

  flexLine.layout.mainDim = leadingPaddingAndBorderMain + leadingMainDim;
  flexLine.layout.crossDim = 0;

  let maxAscentForCurrentLine = 0;
  let maxDescentForCurrentLine = 0;
  const isNodeBaselineLayout = isBaselineLayout(node);
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
          mainAxisOwnerSize,
          ownerWidth,
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
          calculateBaseline(child) +
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
): void {
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

  // Set the resolved resolution in the node's layout.
  const direction = node.resolveDirection(ownerDirection);
  layout.direction = direction;

  if (performLayout) {
    layout.hadOverflow = false;
  }

  const flexRowDirection = resolveDirection(FlexDirection.Row, direction);
  const flexColumnDirection = resolveDirection(FlexDirection.Column, direction);

  const startEdge = direction === Direction.LTR ? PhysicalEdge.Left : PhysicalEdge.Right;
  const endEdge = direction === Direction.LTR ? PhysicalEdge.Right : PhysicalEdge.Left;

  const marginRowLeading = style.computeInlineStartMargin(flexRowDirection, direction, ownerWidth);
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

  const marginAxisRow = marginRowLeading + marginRowTrailing;
  const marginAxisColumn = marginColumnLeading + marginColumnTrailing;

  layout.border[startEdge] = style.computeInlineStartBorder(flexRowDirection, direction);
  layout.border[endEdge] = style.computeInlineEndBorder(flexRowDirection, direction);
  layout.border[PhysicalEdge.Top] = style.computeInlineStartBorder(flexColumnDirection, direction);
  layout.border[PhysicalEdge.Bottom] = style.computeInlineEndBorder(flexColumnDirection, direction);

  layout.padding[startEdge] = style.computeInlineStartPadding(
    flexRowDirection,
    direction,
    ownerWidth,
  );
  layout.padding[endEdge] = style.computeInlineEndPadding(flexRowDirection, direction, ownerWidth);
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

    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    cleanupContentsNodesRecursively(node, performLayout);
    return;
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

    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    cleanupContentsNodesRecursively(node, performLayout);
    return;
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
    // Clean and update all display: contents nodes with a direct path to the
    // current node as they will not be traversed
    cleanupContentsNodesRecursively(node, /* didPerformLayout */ false);
    return;
  }

  if (!performLayout) {
    layout.hadOverflow = false;
  }

  // Clean and update all display: contents nodes with a direct path to the
  // current node as they will not be traversed
  cleanupContentsNodesRecursively(node, performLayout);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const mainAxis = resolveDirection(style.flexDirection, direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);
  const isNodeFlexWrap = style.flexWrap !== Wrap.NoWrap;

  const mainAxisOwnerSize = isMainAxisRow ? ownerWidth : ownerHeight;
  const crossAxisOwnerSize = isMainAxisRow ? ownerHeight : ownerWidth;

  const paddingAndBorderAxisMain = paddingAndBorderForAxis(node, mainAxis, direction, ownerWidth);
  const paddingAndBorderAxisCross = paddingAndBorderForAxis(node, crossAxis, direction, ownerWidth);
  const leadingPaddingAndBorderCross = style.computeFlexStartPaddingAndBorder(
    crossAxis,
    direction,
    ownerWidth,
  );

  let sizingModeMainDim = isMainAxisRow ? widthSizingMode : heightSizingMode;
  const sizingModeCrossDim = isMainAxisRow ? heightSizingMode : widthSizingMode;

  const paddingAndBorderAxisRow = isMainAxisRow
    ? paddingAndBorderAxisMain
    : paddingAndBorderAxisCross;
  const paddingAndBorderAxisColumn = isMainAxisRow
    ? paddingAndBorderAxisCross
    : paddingAndBorderAxisMain;

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
  const flexLine = acquireFlexLine();
  for (; startOfLineIndex < layoutChildren.length; lineCount++) {
    calculateFlexLine(
      node,
      ownerDirection,
      ownerWidth,
      mainAxisOwnerSize,
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

    if (!canSkipFlex) {
      resolveFlexibleLength(
        node,
        flexLine,
        mainAxis,
        crossAxis,
        direction,
        ownerWidth,
        mainAxisOwnerSize,
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
    }

    layout.hadOverflow = layout.hadOverflow || flexLine.layout.remainingFreeSpace < 0;

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
    );

    let containerCrossAxis = availableInnerCrossDim;
    if (
      sizingModeCrossDim === SizingMode.MaxContent ||
      sizingModeCrossDim === SizingMode.FitContent
    ) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis =
        boundAxis(
          node,
          crossAxis,
          direction,
          flexLine.layout.crossDim + paddingAndBorderAxisCross,
          crossAxisOwnerSize,
          ownerWidth,
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
        boundAxis(
          node,
          crossAxis,
          direction,
          flexLine.layout.crossDim + paddingAndBorderAxisCross,
          crossAxisOwnerSize,
          ownerWidth,
        ) - paddingAndBorderAxisCross;
    }

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
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
          if (!child.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim)) {
            let childMainSize = child.layout.measuredDimensions[dimension(mainAxis)];
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
              maxSizeForMode(
                child,
                direction,
                mainAxis,
                availableInnerMainDim,
                availableInnerWidth,
              ),
            );
            childCrossSize = constrainMaxSizeForMode(
              SizingMode.StretchFit,
              childCrossSize,
              maxSizeForMode(
                child,
                direction,
                crossAxis,
                availableInnerCrossDim,
                availableInnerWidth,
              ),
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

    const appliedCrossGap = lineCount !== 0 ? crossAxisGap : 0.0;
    totalLineCrossDim += flexLine.layout.crossDim + appliedCrossGap;
    maxLineMainDim = maxOrDefined(maxLineMainDim, flexLine.layout.mainDim);
  }
  releaseFlexLine(flexLine);

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  // currentLead stores the size of the cross dim
  if (performLayout && (isNodeFlexWrap || isBaselineLayout(node))) {
    let leadPerLine = 0;
    let currentLead = leadingPaddingAndBorderCross;
    let extraSpacePerLine = 0;

    const unclampedCrossDim =
      sizingModeCrossDim === SizingMode.StretchFit
        ? availableInnerCrossDim + paddingAndBorderAxisCross
        : node.hasDefiniteLength(dimension(crossAxis), crossAxisOwnerSize)
          ? node.getResolvedDimension(
              direction,
              dimension(crossAxis),
              crossAxisOwnerSize,
              ownerWidth,
            )
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
              child.layout.measuredDimensions[dimension(crossAxis)] +
                childStyle.computeMarginForAxis(crossAxis, availableInnerWidth),
            );
          }
          if (resolveChildAlignment(node, child) === Align.Baseline) {
            const ascent =
              calculateBaseline(child) +
              childStyle.computeFlexStartMargin(
                FlexDirection.Column,
                direction,
                availableInnerWidth,
              );
            const descent =
              child.layout.measuredDimensions[Dimension.Height] +
              childStyle.computeMarginForAxis(FlexDirection.Column, availableInnerWidth) -
              ascent;
            maxAscentForCurrentLine = maxOrDefined(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine = maxOrDefined(maxDescentForCurrentLine, descent);
            lineHeight = maxOrDefined(
              lineHeight,
              maxAscentForCurrentLine + maxDescentForCurrentLine,
            );
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
                childLayout.measuredDimensions[dimension(crossAxis)];
              break;
            }
            case Align.Center: {
              const childHeight = childLayout.measuredDimensions[dimension(crossAxis)];

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
              if (!child.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim)) {
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
                calculateBaseline(child) +
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

  // STEP 9: COMPUTING FINAL DIMENSIONS

  layout.measuredDimensions[Dimension.Width] = boundAxis(
    node,
    FlexDirection.Row,
    direction,
    availableWidth - marginAxisRow,
    ownerWidth,
    ownerWidth,
  );

  layout.measuredDimensions[Dimension.Height] = boundAxis(
    node,
    FlexDirection.Column,
    direction,
    availableHeight - marginAxisColumn,
    ownerHeight,
    ownerWidth,
  );

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (
    sizingModeMainDim === SizingMode.MaxContent ||
    (style.overflow !== Overflow.Scroll && sizingModeMainDim === SizingMode.FitContent)
  ) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    layout.measuredDimensions[dimension(mainAxis)] = boundAxis(
      node,
      mainAxis,
      direction,
      maxLineMainDim,
      mainAxisOwnerSize,
      ownerWidth,
    );
  } else if (sizingModeMainDim === SizingMode.FitContent && style.overflow === Overflow.Scroll) {
    layout.measuredDimensions[dimension(mainAxis)] = maxOrDefined(
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
    layout.measuredDimensions[dimension(crossAxis)] = boundAxis(
      node,
      crossAxis,
      direction,
      totalLineCrossDim + paddingAndBorderAxisCross,
      crossAxisOwnerSize,
      ownerWidth,
    );
  } else if (sizingModeCrossDim === SizingMode.FitContent && style.overflow === Overflow.Scroll) {
    layout.measuredDimensions[dimension(crossAxis)] = maxOrDefined(
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
          layout.measuredDimensions[dimension(crossAxis)] -
          childLayout.position[flexStartEdge(crossAxis)] -
          childLayout.measuredDimensions[dimension(crossAxis)];
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
      layoutAbsoluteDescendants(
        node,
        node,
        isMainAxisRow ? sizingModeMainDim : sizingModeCrossDim,
        direction,
        layoutMarkerData,
        depth,
        generationCount,
        0.0,
        0.0,
      );
    }
  }
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

  const needToVisitNode =
    (node.isDirty() && layout.generationCount !== generationCount) ||
    layout.configVersion !== node.getConfig().version ||
    layout.lastOwnerDirection !== ownerDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout.nextCachedMeasurementsIndex = 0;
    layout.cachedLayout.availableWidth = -1;
    layout.cachedLayout.availableHeight = -1;
    layout.cachedLayout.widthSizingMode = SizingMode.MaxContent;
    layout.cachedLayout.heightSizingMode = SizingMode.MaxContent;
    layout.cachedLayout.computedWidth = -1;
    layout.cachedLayout.computedHeight = -1;
  }

  let cachedResults: CachedMeasurement | null = null;

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
    );
  } else if (performLayout) {
    if (
      inexactEquals(layout.cachedLayout.availableWidth, availableWidth) &&
      inexactEquals(layout.cachedLayout.availableHeight, availableHeight) &&
      layout.cachedLayout.widthSizingMode === widthSizingMode &&
      layout.cachedLayout.heightSizingMode === heightSizingMode
    ) {
      cachedResults = layout.cachedLayout;
    }
  } else {
    for (let i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
      const cachedMeasurement = layout.cachedMeasurements[i]!;
      if (
        inexactEquals(cachedMeasurement.availableWidth, availableWidth) &&
        inexactEquals(cachedMeasurement.availableHeight, availableHeight) &&
        cachedMeasurement.widthSizingMode === widthSizingMode &&
        cachedMeasurement.heightSizingMode === heightSizingMode
      ) {
        cachedResults = cachedMeasurement;
        if (i > 0) {
          layout.promoteCachedMeasurement(i);
        }
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults !== null) {
    layout.measuredDimensions[Dimension.Width] = cachedResults.computedWidth;
    layout.measuredDimensions[Dimension.Height] = cachedResults.computedHeight;

    if (__EVENTS__ && layoutMarkerData !== null) {
      if (performLayout) {
        layoutMarkerData.cachedLayouts += 1;
      } else {
        layoutMarkerData.cachedMeasures += 1;
      }
    }
  } else {
    calculateLayoutImpl(
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
        // Take an unused measurement cache entry, or the one that went unused
        // the longest, and put it first.
        if (layout.nextCachedMeasurementsIndex < LayoutResults.MaxCachedMeasurements) {
          layout.nextCachedMeasurementsIndex++;
        }
        const last = layout.nextCachedMeasurementsIndex - 1;
        newCacheEntry = layout.cachedMeasurements[last]!;
        layout.promoteCachedMeasurement(last);
      }

      newCacheEntry.availableWidth = availableWidth;
      newCacheEntry.availableHeight = availableHeight;
      newCacheEntry.widthSizingMode = widthSizingMode;
      newCacheEntry.heightSizingMode = heightSizingMode;
      newCacheEntry.computedWidth = layout.measuredDimensions[Dimension.Width];
      newCacheEntry.computedHeight = layout.measuredDimensions[Dimension.Height];
    }
  }

  if (performLayout) {
    node.setLayoutDimension(layout.measuredDimensions[Dimension.Width], Dimension.Width);
    node.setLayoutDimension(layout.measuredDimensions[Dimension.Height], Dimension.Height);

    node.hasNewLayout = true;
    node.setDirty(false);
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

  return needToVisitNode || cachedResults === null;
}

export function calculateLayout(
  node: Node,
  ownerWidth: number,
  ownerHeight: number,
  ownerDirection: Direction,
): void {
  if (__EVENTS__) Event.publish(node, Event.LayoutPassStart);
  // Pass statistics are only gathered for `Event.LayoutPassEnd`.
  const markerData = __EVENTS__ ? new LayoutData() : null;

  // Increment the generation count. This will force the recursive routine to
  // visit all dirty nodes at least once. Subsequent visits will be skipped if
  // the input parameters don't change.
  const currentGenerationCount = ++gCurrentGenerationCount;
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
      roundLayoutResultsToPixelGrid(node);
    }
  } finally {
    // Only does anything when a measure or baseline function threw.
    restoreFlexLinePool(poolDepth);
  }

  if (__EVENTS__) Event.publish(node, Event.LayoutPassEnd, { layoutData: markerData });
}
