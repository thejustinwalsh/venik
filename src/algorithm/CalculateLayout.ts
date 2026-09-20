// Port of yoga-cpp/yoga/algorithm/CalculateLayout.{h,cpp}
//
// `FloatOptional` values are plain numbers here (NaN is undefined). C++
// in/out pointer parameters are replaced by return values.

import { assertFatalWithNode } from "../debug/AssertFatal.ts";
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
  MeasureMode,
  Overflow,
  PositionType,
  Wrap,
} from "../enums.ts";
import { Event, LayoutData, LayoutPassReason, LayoutType } from "../event/event.ts";
import type { CachedMeasurement } from "../node/CachedMeasurement.ts";
import { LayoutResults } from "../node/LayoutResults.ts";
import type { Node } from "../node/Node.ts";
import { inexactEquals, maxOrDefined, minOrDefined } from "../numeric/Comparison.ts";
import type { Style } from "../style/Style.ts";
import type { StyleLength } from "../style/StyleLength.ts";
import { layoutAbsoluteDescendants } from "./AbsoluteLayout.ts";
import {
  fallbackAlignment,
  fallbackJustification,
  resolveChildAlignment,
} from "./Align.ts";
import { calculateBaseline, isBaselineLayout } from "./Baseline.ts";
import { boundAxis, boundAxisWithinMinAndMax, paddingAndBorderForAxis } from "./BoundAxis.ts";
import { canUseCachedMeasurement } from "./Cache.ts";
import {
  dimension,
  flexStartEdge,
  isColumn,
  isRow,
  PhysicalEdge,
  resolveCrossDirection,
  resolveDirection,
} from "./FlexDirection.ts";
import { calculateFlexLine, type FlexLine } from "./FlexLine.ts";
import { roundLayoutResultsToPixelGrid } from "./PixelGrid.ts";
import { measureMode, SizingMode } from "./SizingMode.ts";
import { needsTrailingPosition, setChildTrailingPosition } from "./TrailingPosition.ts";

let gCurrentGenerationCount = 0;

const DIRECTIONS = [Direction.LTR, Direction.RTL] as const;

function hasAutoHorizontalMargin(style: Style): boolean {
  for (const direction of DIRECTIONS) {
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

  const ownerStyle = owner.style();
  const childStyle = child.style();
  const childWidth = child.getProcessedDimension(Dimension.Width);
  return (
    ownerStyle.display() === Display.Flex &&
    isColumn(ownerStyle.flexDirection()) &&
    ownerStyle.flexWrap() === Wrap.NoWrap &&
    childStyle.positionType() !== PositionType.Absolute &&
    !childStyle.aspectRatio().isDefined() &&
    (childWidth.isAuto() || childWidth.isUndefined()) &&
    !hasAutoHorizontalMargin(childStyle) &&
    resolveChildAlignment(owner, child) === Align.Stretch
  );
}

function isInColumnStretchScrollSubtree(node: Node): boolean {
  let current: Node | null = node;
  while (current !== null) {
    let owner = current.getOwner();
    while (owner !== null && owner.style().display() === Display.Contents) {
      owner = owner.getOwner();
    }
    if (owner === null || !isColumnStretchEdge(owner, current)) {
      return false;
    }
    if (owner.style().overflow() === Overflow.Scroll) {
      return true;
    }
    current = owner;
  }
  return false;
}

function isNonZeroLength(length: StyleLength): boolean {
  const value = length.toValue().value;
  return length.isAuto() || (value === value && value !== 0.0);
}

const VERTICAL_EDGES = [Edge.Top, Edge.Bottom, Edge.Vertical, Edge.All] as const;

function hasNonZeroVerticalSpacing(style: Style): boolean {
  for (const edge of VERTICAL_EDGES) {
    if (
      isNonZeroLength(style.margin(edge)) ||
      isNonZeroLength(style.padding(edge)) ||
      isNonZeroLength(style.border(edge))
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
  for (const edge of ALL_EDGES) {
    if (
      style.margin(edge).isPercent() ||
      style.position(edge).isPercent() ||
      style.padding(edge).isPercent() ||
      style.border(edge).isPercent()
    ) {
      return true;
    }
  }

  for (const dim of DIMENSIONS) {
    if (
      style.dimension(dim).isPercent() ||
      style.minDimension(dim).isPercent() ||
      style.maxDimension(dim).isPercent()
    ) {
      return true;
    }
  }

  return (
    style.flexBasis().isPercent() ||
    style.gap(Gutter.Column).isPercent() ||
    style.gap(Gutter.Row).isPercent() ||
    style.gap(Gutter.All).isPercent()
  );
}

function hasNonZeroFlex(node: Node): boolean {
  const style = node.style();
  const flex = style.flex().unwrap();
  const flexGrow = style.flexGrow().unwrap();
  const flexShrink = style.flexShrink().unwrap();

  const canGrow = flexGrow === flexGrow ? flexGrow !== 0.0 : flex > 0.0;
  // An unset flex-shrink is the CSS default of 1.
  const canShrink = flexShrink === flexShrink ? flexShrink !== 0.0 : true;
  return canGrow || canShrink;
}

function isHeightFitContentIndependent(node: Node): boolean {
  const style = node.style();
  const height = style.dimension(Dimension.Height);
  const flexBasis = style.flexBasis();
  const hasRelativePercentPosition =
    style.position(Edge.Top).isPercent() ||
    style.position(Edge.Bottom).isPercent() ||
    style.position(Edge.Vertical).isPercent() ||
    style.position(Edge.All).isPercent();

  return (
    !node.hasMeasureFunc() &&
    !node.hasMinContentMeasureFunc() &&
    !node.hasBaselineFunc() &&
    !node.isReferenceBaseline() &&
    (height.isAuto() || height.isUndefined()) &&
    style.minDimension(Dimension.Height).isUndefined() &&
    style.maxDimension(Dimension.Height).isUndefined() &&
    (flexBasis.isAuto() || flexBasis.isUndefined()) &&
    !hasNonZeroFlex(node) &&
    style.boxSizing() === BoxSizing.BorderBox &&
    !style.aspectRatio().isDefined() &&
    style.positionType() !== PositionType.Absolute &&
    style.overflow() !== Overflow.Scroll &&
    style.display() === Display.Flex &&
    isColumn(style.flexDirection()) &&
    style.alignItems() === Align.Stretch &&
    (style.alignSelf() === Align.Auto || style.alignSelf() === Align.Stretch) &&
    style.justifyContent() === Justify.FlexStart &&
    style.flexWrap() === Wrap.NoWrap &&
    !style.gap(Gutter.All).isDefined() &&
    !style.gap(Gutter.Row).isDefined() &&
    !hasRelativePercentPosition &&
    !hasNonZeroVerticalSpacing(style) &&
    !hasPercentageLength(style)
  );
}

function canSkipHeightFitContent(root: Node | null): boolean {
  if (root === null) {
    return false;
  }

  const maxPendingNodes = 64;
  const stack: Node[] = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (!isHeightFitContentIndependent(node)) {
      return false;
    }

    for (const child of node.getLayoutChildren()) {
      if (stack.length === maxPendingNodes) {
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
  return (
    node.style().resolvedMaxDimensionValue(direction, dimension(axis), ownerAxisSize, ownerWidth) +
    node.style().computeMarginForAxis(axis, ownerWidth)
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
  const mainAxis = resolveDirection(node.style().flexDirection(), direction);
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
    const childLayout = child.getLayout();
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

    child.getLayout().computedFlexBasis = maxOrDefined(
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
    child.getLayout().computedFlexBasis = maxOrDefined(
      child.getResolvedDimension(direction, Dimension.Height, ownerHeight, ownerWidth),
      paddingAndBorder,
    );
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped flex
    // basis).
    childWidthSizingMode = SizingMode.MaxContent;
    childHeightSizingMode = SizingMode.MaxContent;

    const marginRow = child.style().computeMarginForAxis(FlexDirection.Row, ownerWidth);
    const marginColumn = child.style().computeMarginForAxis(FlexDirection.Column, ownerWidth);

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
      (!isMainAxisRow && node.style().overflow() === Overflow.Scroll) ||
      node.style().overflow() !== Overflow.Scroll
    ) {
      if (childWidth !== childWidth && width === width) {
        childWidth = width;
        childWidthSizingMode = SizingMode.FitContent;
      }
    }

    // A zero-intrinsic-height column subtree has the same layout with an
    // unbounded height, allowing its measurement cache to survive unrelated
    // size changes elsewhere in a vertical scroll subtree.
    const parentDoesNotScroll = node.style().overflow() !== Overflow.Scroll;
    let applyHeightFitContent = isMainAxisRow || parentDoesNotScroll;
    const childHadOverflow = child.isDirty() && child.getLayout().hadOverflow();
    const hasHeightIndependentSubtree =
      !isMainAxisRow &&
      parentDoesNotScroll &&
      childHeight !== childHeight &&
      height === height &&
      isColumnStretchEdge(node, child) &&
      isInColumnStretchScrollSubtree(node) &&
      canSkipHeightFitContent(child);
    if (hasHeightIndependentSubtree && childHadOverflow) {
      child.getLayout().setHadOverflow(false);
    }
    if (hasHeightIndependentSubtree) {
      applyHeightFitContent = false;
    }

    if (applyHeightFitContent && childHeight !== childHeight && height === height) {
      childHeight = height;
      childHeightSizingMode = SizingMode.FitContent;
    }

    const aspectRatio = child.style().aspectRatio().unwrap();
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

    child.getLayout().computedFlexBasis = maxOrDefined(
      child.getLayout().measuredDimension(dimension(mainAxis)),
      paddingAndBorderForAxis(child, mainAxis, direction, ownerWidth),
    );
  }
  child.getLayout().computedFlexBasisGeneration = generationCount;
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
  assertFatalWithNode(node, node.hasMeasureFunc(), "Expected node to have custom measure function");

  if (widthSizingMode === SizingMode.MaxContent) {
    availableWidth = NaN;
  }
  if (heightSizingMode === SizingMode.MaxContent) {
    availableHeight = NaN;
  }

  const layout = node.getLayout();
  const paddingAndBorderAxisRow =
    layout.padding(PhysicalEdge.Left) +
    layout.padding(PhysicalEdge.Right) +
    layout.border(PhysicalEdge.Left) +
    layout.border(PhysicalEdge.Right);
  const paddingAndBorderAxisColumn =
    layout.padding(PhysicalEdge.Top) +
    layout.padding(PhysicalEdge.Bottom) +
    layout.border(PhysicalEdge.Top) +
    layout.border(PhysicalEdge.Bottom);

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
    layout.setMeasuredDimension(
      Dimension.Width,
      boundAxis(node, FlexDirection.Row, direction, availableWidth, ownerWidth, ownerWidth),
    );
    layout.setMeasuredDimension(
      Dimension.Height,
      boundAxis(node, FlexDirection.Column, direction, availableHeight, ownerHeight, ownerWidth),
    );
  } else {
    if (__EVENTS__) Event.publish(node, Event.MeasureCallbackStart);

    // Measure the text under the current constraints.
    const measuredSize = node.measure(
      innerWidth,
      measureMode(widthSizingMode),
      innerHeight,
      measureMode(heightSizingMode),
    );

    if (__EVENTS__ && layoutMarkerData !== null) {
      layoutMarkerData.measureCallbacks += 1;
      layoutMarkerData.measureCallbackReasonsCount[reason]! += 1;
    }

    if (__EVENTS__ && Event.hasSubscribers()) {
      Event.publish(node, Event.MeasureCallbackEnd, {
        width: innerWidth,
        widthMeasureMode: measureMode(widthSizingMode),
        height: innerHeight,
        heightMeasureMode: measureMode(heightSizingMode),
        measuredWidth: measuredSize.width,
        measuredHeight: measuredSize.height,
        reason,
      });
    }

    layout.setMeasuredDimension(
      Dimension.Width,
      boundAxis(
        node,
        FlexDirection.Row,
        direction,
        widthSizingMode === SizingMode.MaxContent || widthSizingMode === SizingMode.FitContent
          ? measuredSize.width + paddingAndBorderAxisRow
          : availableWidth,
        ownerWidth,
        ownerWidth,
      ),
    );

    layout.setMeasuredDimension(
      Dimension.Height,
      boundAxis(
        node,
        FlexDirection.Column,
        direction,
        heightSizingMode === SizingMode.MaxContent || heightSizingMode === SizingMode.FitContent
          ? measuredSize.height + paddingAndBorderAxisColumn
          : availableHeight,
        ownerHeight,
        ownerWidth,
      ),
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
  const layout = node.getLayout();

  let width = availableWidth;
  if (widthSizingMode === SizingMode.MaxContent || widthSizingMode === SizingMode.FitContent) {
    width =
      layout.padding(PhysicalEdge.Left) +
      layout.padding(PhysicalEdge.Right) +
      layout.border(PhysicalEdge.Left) +
      layout.border(PhysicalEdge.Right);
  }
  layout.setMeasuredDimension(
    Dimension.Width,
    boundAxis(node, FlexDirection.Row, direction, width, ownerWidth, ownerWidth),
  );

  let height = availableHeight;
  if (heightSizingMode === SizingMode.MaxContent || heightSizingMode === SizingMode.FitContent) {
    height =
      layout.padding(PhysicalEdge.Top) +
      layout.padding(PhysicalEdge.Bottom) +
      layout.border(PhysicalEdge.Top) +
      layout.border(PhysicalEdge.Bottom);
  }
  layout.setMeasuredDimension(
    Dimension.Height,
    boundAxis(node, FlexDirection.Column, direction, height, ownerHeight, ownerWidth),
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
    const layout = node.getLayout();
    layout.setMeasuredDimension(
      Dimension.Width,
      boundAxis(
        node,
        FlexDirection.Row,
        direction,
        availableWidth !== availableWidth ||
          (widthSizingMode === SizingMode.FitContent && availableWidth < 0.0)
          ? 0.0
          : availableWidth,
        ownerWidth,
        ownerWidth,
      ),
    );

    layout.setMeasuredDimension(
      Dimension.Height,
      boundAxis(
        node,
        FlexDirection.Column,
        direction,
        availableHeight !== availableHeight ||
          (heightSizingMode === SizingMode.FitContent && availableHeight < 0.0)
          ? 0.0
          : availableHeight,
        ownerHeight,
        ownerWidth,
      ),
    );
    return true;
  }

  return false;
}

function resetLayout(node: Node): void {
  node.setLayout(new LayoutResults());
  node.setLayoutDimension(0, Dimension.Width);
  node.setLayoutDimension(0, Dimension.Height);
}

function zeroOutLayoutRecursively(node: Node): void {
  resetLayout(node);
  node.setHasNewLayout(true);

  node.cloneChildrenIfNeeded();
  for (const child of node.getChildren()) {
    zeroOutLayoutRecursively(child);
  }
}

export function cleanupContentsNodesRecursively(node: Node, didPerformLayout: boolean): void {
  if (node.hasContentsChildren()) {
    node.cloneContentsChildrenIfNeeded();
    for (const child of node.getChildren()) {
      if (child.style().display() === Display.Contents) {
        resetLayout(child);
        if (didPerformLayout) {
          child.setHasNewLayout(true);
        }
        child.setDirty(false);
        child.cloneChildrenIfNeeded();

        cleanupContentsNodesRecursively(child, didPerformLayout);
      }
    }
  }
}

/** Largest finite float32, kept so results match C++. */
const FLT_MAX = 3.4028234663852886e38;

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
    const minDimension = node
      .style()
      .resolvedMinDimensionValue(direction, dimension, ownerDim, ownerWidth);
    const minInnerDim = minDimension !== minDimension ? 0.0 : minDimension - paddingAndBorder;

    const maxDimension = node
      .style()
      .resolvedMaxDimensionValue(direction, dimension, ownerDim, ownerWidth);

    const maxInnerDim = maxDimension !== maxDimension ? FLT_MAX : maxDimension - paddingAndBorder;
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
    for (const child of children) {
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

  for (const child of children) {
    child.processDimensions();
    if (child.style().display() === Display.None) {
      // Only mutate display: none children during layout passes. Zeroing them
      // out during measure-only passes contributes nothing to the measurement,
      // but sets `hasNewLayout` on nodes the parent's layout pass may never
      // visit (e.g. when its layout is restored from cache, skipping
      // `cloneChildrenIfNeeded()`). Such a leaked flag survives the commit and
      // is copied into lazily-shared clones, later tripping the ownership
      // assertion in `YogaLayoutableShadowNode::layout`.
      if (performLayout) {
        zeroOutLayoutRecursively(child);
        child.setHasNewLayout(true);
        child.setDirty(false);
      }
      continue;
    }
    if (performLayout) {
      // Set the initial position (relative to the owner).
      const childDirection = child.resolveDirection(direction);
      child.setLayoutPositionFromStyle(childDirection, availableInnerWidth, availableInnerHeight);
    }

    if (child.style().positionType() === PositionType.Absolute) {
      continue;
    }
    if (child === singleFlexChild) {
      child.getLayout().computedFlexBasisGeneration = generationCount;
      child.getLayout().computedFlexBasis = 0;
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
      child.getLayout().computedFlexBasis +
      child.style().computeMarginForAxis(mainAxis, availableInnerWidth);
  }

  return totalOuterFlexBasis;
}

// Returns the min-content size of `node` along `requestedAxis`, used by CSS
// Flexbox §4.5 automatic minimum sizing.
//
// Mirrors RenderCore FlexLayout's `AlgorithmBase::computeMinContentSize` /
// `measureMinContentMainSize` pair (see `xplat/flexlayout/flexlayout/
// FlexboxAlgorithm.h`). Unlike FlexLayout, which crosses a JNI/bridge
// boundary for nested flex containers via thread-local min-content markers,
// Yoga's flex containers are native nodes — so this function recurses
// directly into containers rather than going through a measure callback.
//
// Algorithm:
//   * Leaf with measure function: invoke it with `AtMost 0` on the
//     requested axis and `Undefined` on the other. Text measure-funcs
//     respond with longest-word width; image/collection-like measures
//     respond with 0 along their scroll axis.
//   * Empty leaf: return 0.
//   * Container: iterate in-flow children. For each, take its
//     min-content along the container's own main axis (sum into
//     `mainTotal`) and along its cross axis (max into `crossMax`),
//     plus the child's margins. Add the container's own padding and
//     border on both ends of each axis. Project onto `requestedAxis`.
//
// Container-level recursion does no layout writes (no positions, no
// alignment, no flex distribution); only the descendant leaf measure
// callbacks observe state changes (the same ones a normal layout pass
// would invoke). Roughly equivalent to FlexLayout's dedicated
// `computeMinContentSize` cost: one measure call per leaf + linear walk
// per container.
function computeMinContentMainSize(
  node: Node,
  requestedAxis: FlexDirection,
  ownerDirection: Direction,
  ownerWidth: number,
  ownerHeight: number,
): number {
  const wantRow = isRow(requestedAxis);

  // 1. Static value wins for any node (leaf or container). Short-circuits
  // both the measure callback path AND any container recursion. The most
  // common use is `YGNodeSetMinContentWidth(node, 0)` declaring no
  // contribution per CSS-Images (Image) or CSS-Overflow (scroll
  // containers along their scroll axis).
  const staticMin = wantRow ? node.getMinContentWidth() : node.getMinContentHeight();
  if (staticMin === staticMin) {
    return staticMin;
  }

  if (node.hasMeasureFunc()) {
    // 2. Dynamic min-content callback if set (for Primitives whose
    // min-content depends on state). Otherwise fall back to the regular
    // measure function with `AtMost 0`, which text measurers naturally
    // answer with longest-word width.
    const size = node.hasMinContentMeasureFunc()
      ? node.measureMinContent(
          wantRow ? 0.0 : NaN,
          wantRow ? MeasureMode.AtMost : MeasureMode.Undefined,
          wantRow ? NaN : 0.0,
          wantRow ? MeasureMode.Undefined : MeasureMode.AtMost,
        )
      : node.measure(
          wantRow ? 0.0 : NaN,
          wantRow ? MeasureMode.AtMost : MeasureMode.Undefined,
          wantRow ? NaN : 0.0,
          wantRow ? MeasureMode.Undefined : MeasureMode.AtMost,
        );
    // Add the leaf's own padding and border, like the container branch below.
    const leafDirection = node.resolveDirection(ownerDirection);
    const paddingAndBorder =
      node.style().computeFlexStartPaddingAndBorder(requestedAxis, leafDirection, ownerWidth) +
      node.style().computeFlexEndPaddingAndBorder(requestedAxis, leafDirection, ownerWidth);
    return (wantRow ? size.width : size.height) + paddingAndBorder;
  }

  if (node.getChildCount() === 0) {
    return 0.0;
  }

  const direction = node.resolveDirection(ownerDirection);
  const nodeMainAxis = resolveDirection(node.style().flexDirection(), direction);
  const nodeCrossAxis = resolveCrossDirection(nodeMainAxis, direction);

  let mainTotal = 0.0;
  let crossMax = 0.0;
  for (const child of node.getChildren()) {
    if (
      child.style().display() === Display.None ||
      child.style().positionType() === PositionType.Absolute
    ) {
      continue;
    }
    let childMain = computeMinContentMainSize(
      child,
      nodeMainAxis,
      direction,
      ownerWidth,
      ownerHeight,
    );
    childMain += child.style().computeMarginForAxis(nodeMainAxis, ownerWidth);

    let childCross = computeMinContentMainSize(
      child,
      nodeCrossAxis,
      direction,
      ownerWidth,
      ownerHeight,
    );
    childCross += child.style().computeMarginForAxis(nodeCrossAxis, ownerWidth);

    mainTotal += childMain;
    // std::max(crossMax, childCross): keeps crossMax when childCross is NaN.
    crossMax = crossMax < childCross ? childCross : crossMax;
  }

  mainTotal +=
    node.style().computeFlexStartPaddingAndBorder(nodeMainAxis, direction, ownerWidth) +
    node.style().computeFlexEndPaddingAndBorder(nodeMainAxis, direction, ownerWidth);
  crossMax +=
    node.style().computeFlexStartPaddingAndBorder(nodeCrossAxis, direction, ownerWidth) +
    node.style().computeFlexEndPaddingAndBorder(nodeCrossAxis, direction, ownerWidth);

  const nodeMainIsRow = isRow(nodeMainAxis);
  const widthMin = nodeMainIsRow ? mainTotal : crossMax;
  const heightMin = nodeMainIsRow ? crossMax : mainTotal;
  return wantRow ? widthMin : heightMin;
}

// Computes the CSS Flexbox §4.5 automatic minimum main-axis size for
// `child`. Returns Undefined when no auto-min applies (explicit
// `min-{w,h}` already set, or `display:none`); 0 when the item's own
// `overflow != visible` (the spec's per-item escape hatch); or a concrete
// floor otherwise.
//
// Floor = min(content-size, specified-size) capped by max-size, with the
// transferred (aspect-ratio × cross-size) suggestion replacing the
// specified-size leg when the item has an aspect ratio but no specified
// main size. See https://www.w3.org/TR/css-flexbox-1/#min-size-auto.
function computeAutoMinMainSize(
  child: Node,
  mainAxis: FlexDirection,
  direction: Direction,
  ownerMainAxisSize: number,
  ownerWidth: number,
  ownerHeight: number,
): number {
  if (child.style().display() === Display.None) {
    return NaN;
  }
  // Explicit `min-{w,h}` (including `0`) wins over auto. This is the
  // CSS-spec opt-out (§4.5).
  if (child.style().minDimension(dimension(mainAxis)).isDefined()) {
    return NaN;
  }
  // Per CSS §4.5: a flex item whose own `overflow` is not `visible` gets
  // auto-min = 0 (let scroll/clip handle overflow rather than enforce a
  // content-based minimum).
  if (child.style().overflow() !== Overflow.Visible) {
    return 0.0;
  }

  const mainDim = dimension(mainAxis);
  const crossDim = isRow(mainAxis) ? Dimension.Height : Dimension.Width;
  const isMainAxisRow = isRow(mainAxis);

  // Specified size suggestion: the resolved main-axis style dimension.
  const specifiedMain = child.getResolvedDimension(
    direction,
    mainDim,
    ownerMainAxisSize,
    ownerWidth,
  );

  // Transferred size suggestion: cross × aspect-ratio, if both are definite.
  let transferredMain = NaN;
  const ratio = child.style().aspectRatio().unwrap();
  if (ratio === ratio) {
    const crossOwner = isMainAxisRow ? ownerHeight : ownerWidth;
    const crossValue = child.getResolvedDimension(direction, crossDim, crossOwner, ownerWidth);
    if (crossValue === crossValue) {
      transferredMain = isMainAxisRow ? crossValue * ratio : crossValue / ratio;
    }
  }

  // Content size suggestion: probe via min-content recursion.
  const contentMain = computeMinContentMainSize(
    child,
    mainAxis,
    direction,
    ownerWidth,
    ownerHeight,
  );

  // Combine per §4.5: floor = min(content, specified) when specified is
  // definite; otherwise floor = min(content, transferred) when transferred
  // applies (item has aspect-ratio + definite cross + no specified main);
  // else floor = content.
  let floor = contentMain;
  if (specifiedMain === specifiedMain) {
    if (floor !== floor || specifiedMain < floor) {
      floor = specifiedMain;
    }
  } else if (transferredMain === transferredMain) {
    if (floor !== floor || transferredMain < floor) {
      floor = transferredMain;
    }
  }

  // §4.5: cap by the max main size.
  const maxMain = child
    .style()
    .resolvedMaxDimensionValue(direction, mainDim, ownerMainAxisSize, ownerWidth);
  if (floor > maxMain) {
    floor = maxMain;
  }

  if (floor !== floor || floor < 0.0) {
    floor = 0.0;
  }
  return floor;
}

// boundAxis with an additional lower bound from `child`'s cached
// `computedAutoMinMainSize`, applied on the main axis only. Used inside
// the flex-shrink distribution to honor CSS §4.5 auto-min while preserving
// the existing min/max/padding-and-border clamping.
function boundAxisWithAutoMin(
  child: Node,
  axis: FlexDirection,
  direction: Direction,
  value: number,
  axisSize: number,
  widthSize: number,
): number {
  let bounded = boundAxis(child, axis, direction, value, axisSize, widthSize);
  const autoMin = child.getLayout().computedAutoMinMainSize;
  if (bounded < autoMin) {
    bounded = autoMin;
  }
  return bounded;
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
  const isNodeFlexWrap = node.style().flexWrap() !== Wrap.NoWrap;

  for (const currentLineChild of flexLine.itemsInFlow) {
    childFlexBasis = boundAxisWithinMinAndMax(
      currentLineChild,
      direction,
      mainAxis,
      currentLineChild.getLayout().computedFlexBasis,
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

        updatedMainSize = boundAxisWithAutoMin(
          currentLineChild,
          mainAxis,
          direction,
          childSize,
          availableInnerMainDim,
          availableInnerWidth,
        );
      }
    } else if (flexLine.layout.remainingFreeSpace > 0) {
      flexGrowFactor = currentLineChild.resolveFlexGrow();

      // Is this child able to grow?
      if (flexGrowFactor === flexGrowFactor && flexGrowFactor !== 0) {
        updatedMainSize = boundAxisWithAutoMin(
          currentLineChild,
          mainAxis,
          direction,
          childFlexBasis +
            (flexLine.layout.remainingFreeSpace / flexLine.layout.totalFlexGrowFactors) *
              flexGrowFactor,
          availableInnerMainDim,
          availableInnerWidth,
        );
      }
    }

    deltaFreeSpace += updatedMainSize - childFlexBasis;

    const childStyle = currentLineChild.style();
    const marginMain = childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);
    const marginCross = childStyle.computeMarginForAxis(crossAxis, availableInnerWidth);

    let childCrossSize: number;
    let childMainSize = updatedMainSize + marginMain;
    let childCrossSizingMode: SizingMode;
    let childMainSizingMode: SizingMode = SizingMode.StretchFit;

    const aspectRatio = childStyle.aspectRatio().unwrap();
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
      node.getLayout().direction(),
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
    node
      .getLayout()
      .setHadOverflow(
        node.getLayout().hadOverflow() || currentLineChild.getLayout().hadOverflow(),
      );
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

  for (const currentLineChild of flexLine.itemsInFlow) {
    const childFlexBasis = boundAxisWithinMinAndMax(
      currentLineChild,
      direction,
      mainAxis,
      currentLineChild.getLayout().computedFlexBasis,
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
        boundMainSize = boundAxisWithAutoMin(
          currentLineChild,
          mainAxis,
          direction,
          baseMainSize,
          availableInnerMainDim,
          availableInnerWidth,
        );
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
            -currentLineChild.resolveFlexShrink() * currentLineChild.getLayout().computedFlexBasis;
        }
      }
    } else if (flexLine.layout.remainingFreeSpace > 0) {
      flexGrowFactor = currentLineChild.resolveFlexGrow();

      // Is this child able to grow?
      if (flexGrowFactor === flexGrowFactor && flexGrowFactor !== 0) {
        baseMainSize =
          childFlexBasis +
          (flexLine.layout.remainingFreeSpace / originalTotalFlexGrowFactors) * flexGrowFactor;
        boundMainSize = boundAxis(
          currentLineChild,
          mainAxis,
          direction,
          baseMainSize,
          availableInnerMainDim,
          availableInnerWidth,
        );

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

  // CSS Flexbox §4.5: compute each item's automatic minimum main-axis size
  // up front so the bounding helpers below can floor shrunk values.
  // computeAutoMinMainSize returns Undefined when an explicit `min-{w,h}`
  // already pins the floor, in which case the cached value is also Undefined
  // and `boundAxisWithAutoMin` reduces to `boundAxis`.
  //
  // The floor is only ever read for items that flex, and probing the content
  // size can mean an extra measure call, so inflexible items skip it.
  for (const currentLineChild of flexLine.itemsInFlow) {
    currentLineChild.getLayout().computedAutoMinMainSize = currentLineChild.isNodeFlexible()
      ? computeAutoMinMainSize(
          currentLineChild,
          mainAxis,
          direction,
          mainAxisOwnerSize,
          availableInnerWidth,
          availableInnerHeight,
        )
      : NaN;
  }

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
  const style = node.style();

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
    const minMainDim = style.resolvedMinDimensionValue(
      direction,
      dimension(mainAxis),
      mainAxisOwnerSize,
      ownerWidth,
    );
    if (style.minDimension(dimension(mainAxis)).isDefined() && minMainDim === minMainDim) {
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
      ? style.justifyContent()
      : fallbackJustification(style.justifyContent());

  const itemCount = flexLine.itemsInFlow.length;
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
  for (const child of flexLine.itemsInFlow) {
    const childLayout = child.getLayout();
    const childStyle = child.style();
    if (
      childStyle.flexStartMarginIsAuto(mainAxis, direction) &&
      flexLine.layout.remainingFreeSpace > 0.0
    ) {
      flexLine.layout.mainDim += flexLine.layout.remainingFreeSpace / flexLine.numberOfAutoMargins;
    }

    if (performLayout) {
      childLayout.setPosition(
        flexStartEdge(mainAxis),
        childLayout.position(flexStartEdge(mainAxis)) + flexLine.layout.mainDim,
      );
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
          childLayout.measuredDimension(Dimension.Height) +
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
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//    but the algorithm below assumes a default of 'column'.
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
//    measure mode of SizingMode.MaxContent in that dimension.
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
  assertFatalWithNode(
    node,
    availableWidth !== availableWidth ? widthSizingMode === SizingMode.MaxContent : true,
    "availableWidth is indefinite so widthSizingMode must be SizingMode::MaxContent",
  );
  assertFatalWithNode(
    node,
    availableHeight !== availableHeight ? heightSizingMode === SizingMode.MaxContent : true,
    "availableHeight is indefinite so heightSizingMode must be SizingMode::MaxContent",
  );

  if (__EVENTS__ && layoutMarkerData !== null) {
    if (performLayout) {
      layoutMarkerData.layouts += 1;
    } else {
      layoutMarkerData.measures += 1;
    }
  }

  const style = node.style();
  const layout = node.getLayout();

  // Set the resolved resolution in the node's layout.
  const direction = node.resolveDirection(ownerDirection);
  layout.setDirection(direction);

  if (performLayout) {
    layout.setHadOverflow(false);
  }

  const flexRowDirection = resolveDirection(FlexDirection.Row, direction);
  const flexColumnDirection = resolveDirection(FlexDirection.Column, direction);

  const startEdge = direction === Direction.LTR ? PhysicalEdge.Left : PhysicalEdge.Right;
  const endEdge = direction === Direction.LTR ? PhysicalEdge.Right : PhysicalEdge.Left;

  const marginRowLeading = style.computeInlineStartMargin(flexRowDirection, direction, ownerWidth);
  layout.setMargin(startEdge, marginRowLeading);
  const marginRowTrailing = style.computeInlineEndMargin(flexRowDirection, direction, ownerWidth);
  layout.setMargin(endEdge, marginRowTrailing);
  const marginColumnLeading = style.computeInlineStartMargin(
    flexColumnDirection,
    direction,
    ownerWidth,
  );
  layout.setMargin(PhysicalEdge.Top, marginColumnLeading);
  const marginColumnTrailing = style.computeInlineEndMargin(
    flexColumnDirection,
    direction,
    ownerWidth,
  );
  layout.setMargin(PhysicalEdge.Bottom, marginColumnTrailing);

  const marginAxisRow = marginRowLeading + marginRowTrailing;
  const marginAxisColumn = marginColumnLeading + marginColumnTrailing;

  layout.setBorder(startEdge, style.computeInlineStartBorder(flexRowDirection, direction));
  layout.setBorder(endEdge, style.computeInlineEndBorder(flexRowDirection, direction));
  layout.setBorder(
    PhysicalEdge.Top,
    style.computeInlineStartBorder(flexColumnDirection, direction),
  );
  layout.setBorder(
    PhysicalEdge.Bottom,
    style.computeInlineEndBorder(flexColumnDirection, direction),
  );

  layout.setPadding(
    startEdge,
    style.computeInlineStartPadding(flexRowDirection, direction, ownerWidth),
  );
  layout.setPadding(endEdge, style.computeInlineEndPadding(flexRowDirection, direction, ownerWidth));
  layout.setPadding(
    PhysicalEdge.Top,
    style.computeInlineStartPadding(flexColumnDirection, direction, ownerWidth),
  );
  layout.setPadding(
    PhysicalEdge.Bottom,
    style.computeInlineEndPadding(flexColumnDirection, direction, ownerWidth),
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

  // At this point we know we're going to perform work. Ensure that each child
  // has a mutable copy.
  node.cloneChildrenIfNeeded();
  if (!performLayout) {
    layout.setHadOverflow(false);
  }

  // Clean and update all display: contents nodes with a direct path to the
  // current node as they will not be traversed
  cleanupContentsNodesRecursively(node, performLayout);

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const mainAxis = resolveDirection(style.flexDirection(), direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);
  const isNodeFlexWrap = style.flexWrap() !== Wrap.NoWrap;

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
  for (; startOfLineIndex < layoutChildren.length; lineCount++) {
    const flexLine = calculateFlexLine(
      node,
      ownerDirection,
      ownerWidth,
      mainAxisOwnerSize,
      availableInnerWidth,
      availableInnerMainDim,
      layoutChildren,
      startOfLineIndex,
      lineCount,
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
        ? style.resolvedMinDimensionValue(direction, Dimension.Width, ownerWidth, ownerWidth) -
          paddingAndBorderAxisRow
        : style.resolvedMinDimensionValue(direction, Dimension.Height, ownerHeight, ownerWidth) -
          paddingAndBorderAxisColumn;
      const maxInnerMainDim = isMainAxisRow
        ? style.resolvedMaxDimensionValue(direction, Dimension.Width, ownerWidth, ownerWidth) -
          paddingAndBorderAxisRow
        : style.resolvedMaxDimensionValue(direction, Dimension.Height, ownerHeight, ownerWidth) -
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

    layout.setHadOverflow(layout.hadOverflow() || flexLine.layout.remainingFreeSpace < 0);

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
      for (const child of flexLine.itemsInFlow) {
        const childStyle = child.style();
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
            let childMainSize = child.getLayout().measuredDimension(dimension(mainAxis));
            const aspectRatio = childStyle.aspectRatio().unwrap();
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

            const alignContent = style.alignContent();
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
        child
          .getLayout()
          .setPosition(
            flexStartEdge(crossAxis),
            child.getLayout().position(flexStartEdge(crossAxis)) +
              totalLineCrossDim +
              leadingCrossDim,
          );
      }
    }

    const appliedCrossGap = lineCount !== 0 ? crossAxisGap : 0.0;
    totalLineCrossDim += flexLine.layout.crossDim + appliedCrossGap;
    maxLineMainDim = maxOrDefined(maxLineMainDim, flexLine.layout.mainDim);
  }

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
      remainingAlignContentDim >= 0
        ? style.alignContent()
        : fallbackAlignment(style.alignContent());

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
        const childStyle = child.style();
        if (childStyle.display() === Display.None) {
          continue;
        }
        if (childStyle.positionType() !== PositionType.Absolute) {
          if (child.getLineIndex() !== i) {
            break;
          }
          if (child.isLayoutDimensionDefined(crossAxis)) {
            lineHeight = maxOrDefined(
              lineHeight,
              child.getLayout().measuredDimension(dimension(crossAxis)) +
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
              child.getLayout().measuredDimension(Dimension.Height) +
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
        const childStyle = child.style();
        const childLayout = child.getLayout();
        if (childStyle.display() === Display.None) {
          continue;
        }
        if (childStyle.positionType() !== PositionType.Absolute) {
          switch (resolveChildAlignment(node, child)) {
            case Align.Start:
            case Align.End:
              // Not yet implemented
              break;
            case Align.FlexStart: {
              childLayout.setPosition(
                flexStartEdge(crossAxis),
                currentLead +
                  childStyle.computeFlexStartPosition(crossAxis, direction, availableInnerWidth),
              );
              break;
            }
            case Align.FlexEnd: {
              childLayout.setPosition(
                flexStartEdge(crossAxis),
                currentLead +
                  lineHeight -
                  childStyle.computeFlexEndMargin(crossAxis, direction, availableInnerWidth) -
                  childLayout.measuredDimension(dimension(crossAxis)),
              );
              break;
            }
            case Align.Center: {
              const childHeight = childLayout.measuredDimension(dimension(crossAxis));

              childLayout.setPosition(
                flexStartEdge(crossAxis),
                currentLead + (lineHeight - childHeight) / 2,
              );
              break;
            }
            case Align.Stretch: {
              childLayout.setPosition(
                flexStartEdge(crossAxis),
                currentLead +
                  childStyle.computeFlexStartMargin(crossAxis, direction, availableInnerWidth),
              );

              // Remeasure child with the line height as it as been only
              // measured with the owners height yet.
              if (!child.hasDefiniteLength(dimension(crossAxis), availableInnerCrossDim)) {
                const childWidth = isMainAxisRow
                  ? childLayout.measuredDimension(Dimension.Width) +
                    childStyle.computeMarginForAxis(mainAxis, availableInnerWidth)
                  : leadPerLine + lineHeight;

                const childHeight = !isMainAxisRow
                  ? childLayout.measuredDimension(Dimension.Height) +
                    childStyle.computeMarginForAxis(crossAxis, availableInnerWidth)
                  : leadPerLine + lineHeight;

                if (
                  !(
                    inexactEquals(childWidth, childLayout.measuredDimension(Dimension.Width)) &&
                    inexactEquals(childHeight, childLayout.measuredDimension(Dimension.Height))
                  )
                ) {
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
              childLayout.setPosition(
                PhysicalEdge.Top,
                currentLead +
                  maxAscentForCurrentLine -
                  calculateBaseline(child) +
                  childStyle.computeFlexStartPosition(
                    FlexDirection.Column,
                    direction,
                    availableInnerCrossDim,
                  ),
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

  layout.setMeasuredDimension(
    Dimension.Width,
    boundAxis(
      node,
      FlexDirection.Row,
      direction,
      availableWidth - marginAxisRow,
      ownerWidth,
      ownerWidth,
    ),
  );

  layout.setMeasuredDimension(
    Dimension.Height,
    boundAxis(
      node,
      FlexDirection.Column,
      direction,
      availableHeight - marginAxisColumn,
      ownerHeight,
      ownerWidth,
    ),
  );

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (
    sizingModeMainDim === SizingMode.MaxContent ||
    (style.overflow() !== Overflow.Scroll && sizingModeMainDim === SizingMode.FitContent)
  ) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    layout.setMeasuredDimension(
      dimension(mainAxis),
      boundAxis(node, mainAxis, direction, maxLineMainDim, mainAxisOwnerSize, ownerWidth),
    );
  } else if (sizingModeMainDim === SizingMode.FitContent && style.overflow() === Overflow.Scroll) {
    layout.setMeasuredDimension(
      dimension(mainAxis),
      maxOrDefined(
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
      ),
    );
  }

  if (
    sizingModeCrossDim === SizingMode.MaxContent ||
    (style.overflow() !== Overflow.Scroll && sizingModeCrossDim === SizingMode.FitContent)
  ) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    layout.setMeasuredDimension(
      dimension(crossAxis),
      boundAxis(
        node,
        crossAxis,
        direction,
        totalLineCrossDim + paddingAndBorderAxisCross,
        crossAxisOwnerSize,
        ownerWidth,
      ),
    );
  } else if (sizingModeCrossDim === SizingMode.FitContent && style.overflow() === Overflow.Scroll) {
    layout.setMeasuredDimension(
      dimension(crossAxis),
      maxOrDefined(
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
      ),
    );
  }

  // As we only wrapped in normal direction yet, we need to reverse the
  // positions on wrap-reverse.
  if (performLayout && style.flexWrap() === Wrap.WrapReverse) {
    for (const child of layoutChildren) {
      if (child.style().positionType() !== PositionType.Absolute) {
        const childLayout = child.getLayout();
        childLayout.setPosition(
          flexStartEdge(crossAxis),
          layout.measuredDimension(dimension(crossAxis)) -
            childLayout.position(flexStartEdge(crossAxis)) -
            childLayout.measuredDimension(dimension(crossAxis)),
        );
      }
    }
  }

  if (performLayout) {
    // STEP 10: SETTING TRAILING POSITIONS FOR CHILDREN
    const needsMainTrailingPos = needsTrailingPosition(mainAxis);
    const needsCrossTrailingPos = needsTrailingPosition(crossAxis);

    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (const child of layoutChildren) {
        // Absolute children will be handled by their containing block since we
        // cannot guarantee that their positions are set when their parents are
        // done with layout.
        if (
          child.style().display() === Display.None ||
          child.style().positionType() === PositionType.Absolute
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
    if (style.positionType() !== PositionType.Static || depth === 1) {
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
  const layout = node.getLayout();

  depth++;

  const needToVisitNode =
    (node.isDirty() && layout.generationCount !== generationCount) ||
    layout.configVersion !== node.getConfig().getVersion() ||
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
    const marginAxisRow = node.style().computeMarginForAxis(FlexDirection.Row, ownerWidth);
    const marginAxisColumn = node.style().computeMarginForAxis(FlexDirection.Column, ownerWidth);

    // First, try to use the layout cache.
    if (
      canUseCachedMeasurement(
        widthSizingMode,
        availableWidth,
        heightSizingMode,
        availableHeight,
        layout.cachedLayout.widthSizingMode,
        layout.cachedLayout.availableWidth,
        layout.cachedLayout.heightSizingMode,
        layout.cachedLayout.availableHeight,
        layout.cachedLayout.computedWidth,
        layout.cachedLayout.computedHeight,
        marginAxisRow,
        marginAxisColumn,
        node.getConfig(),
      )
    ) {
      cachedResults = layout.cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (let i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
        const cachedMeasurement = layout.cachedMeasurements[i]!;
        if (
          canUseCachedMeasurement(
            widthSizingMode,
            availableWidth,
            heightSizingMode,
            availableHeight,
            cachedMeasurement.widthSizingMode,
            cachedMeasurement.availableWidth,
            cachedMeasurement.heightSizingMode,
            cachedMeasurement.availableHeight,
            cachedMeasurement.computedWidth,
            cachedMeasurement.computedHeight,
            marginAxisRow,
            marginAxisColumn,
            node.getConfig(),
          )
        ) {
          cachedResults = cachedMeasurement;
          break;
        }
      }
    }
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
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults !== null) {
    layout.setMeasuredDimension(Dimension.Width, cachedResults.computedWidth);
    layout.setMeasuredDimension(Dimension.Height, cachedResults.computedHeight);

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
    layout.configVersion = node.getConfig().getVersion();

    if (cachedResults === null) {
      if (__EVENTS__ && layoutMarkerData !== null) {
        layoutMarkerData.maxMeasureCache = Math.max(
          layoutMarkerData.maxMeasureCache,
          layout.nextCachedMeasurementsIndex + 1,
        );
      }

      if (layout.nextCachedMeasurementsIndex === LayoutResults.MaxCachedMeasurements) {
        layout.nextCachedMeasurementsIndex = 0;
      }

      let newCacheEntry: CachedMeasurement;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = layout.cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = layout.cachedMeasurements[layout.nextCachedMeasurementsIndex]!;
        layout.nextCachedMeasurementsIndex++;
      }

      newCacheEntry.availableWidth = availableWidth;
      newCacheEntry.availableHeight = availableHeight;
      newCacheEntry.widthSizingMode = widthSizingMode;
      newCacheEntry.heightSizingMode = heightSizingMode;
      newCacheEntry.computedWidth = layout.measuredDimension(Dimension.Width);
      newCacheEntry.computedHeight = layout.measuredDimension(Dimension.Height);
    }
  }

  if (performLayout) {
    node.setLayoutDimension(layout.measuredDimension(Dimension.Width), Dimension.Width);
    node.setLayoutDimension(layout.measuredDimension(Dimension.Height), Dimension.Height);

    node.setHasNewLayout(true);
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
  node.processDimensions();
  const direction = node.resolveDirection(ownerDirection);
  let width: number;
  let widthSizingMode: SizingMode;
  const style = node.style();
  const maxWidth = style.resolvedMaxDimensionValue(
    direction,
    Dimension.Width,
    ownerWidth,
    ownerWidth,
  );
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
  const maxHeight = style.resolvedMaxDimensionValue(
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
  // A measure function or clone callback may run a nested layout pass, in
  // which case the global count has moved on from `currentGenerationCount`.
  const generationCount = currentGenerationCount;
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
    node.setLayoutPositionFromStyle(node.getLayout().direction(), ownerWidth, ownerHeight);
    roundLayoutResultsToPixelGrid(node, 0.0, 0.0);
  }

  if (__EVENTS__) Event.publish(node, Event.LayoutPassEnd, { layoutData: markerData });
}
