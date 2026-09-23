import {
  Align,
  Dimension,
  type Direction,
  Display,
  FlexDirection,
  Justify,
  PositionType,
  Wrap,
  SizingMode,
} from "../enums.ts";
import { type LayoutData, LayoutPassReason } from "../event/event.ts";
import type { Node } from "../node/Node.ts";
import { resolveChildAlignment } from "./Align.ts";
import { boundAxis } from "./BoundAxis.ts";
import { calculateLayoutInternal, cleanupContentsNodesRecursively } from "./CalculateLayout.ts";
import {
  dimension,
  flexEndEdge,
  flexStartEdge,
  inlineEndEdge,
  inlineStartEdge,
  isRow,
  PhysicalEdge,
  resolveCrossDirection,
  resolveDirection,
} from "./FlexDirection.ts";
import {
  getPositionOfOppositeEdge,
  needsTrailingPosition,
  setChildTrailingPosition,
} from "./TrailingPosition.ts";
import {
  ABSOLUTE_WALK_CONTAINING_HEIGHT,
  ABSOLUTE_WALK_CONTAINING_WIDTH,
  ABSOLUTE_WALK_DIRECTION,
  ABSOLUTE_WALK_GENERATION,
  ABSOLUTE_WALK_LEFT,
  ABSOLUTE_WALK_SIZING_MODE,
  ABSOLUTE_WALK_TOP,
  BORDER,
  F,
  GENERATION,
  I,
  MEASURED,
  PADDING,
  POSITION,
  RAW_DIMENSIONS,
  U,
} from "../node/Store.ts";

function setFlexStartLayoutPosition(
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  containingBlockWidth: number,
): void {
  const position =
    child.style.computeFlexStartMargin(axis, direction, containingBlockWidth) +
    F[parent.rf + BORDER + (flexStartEdge(axis))]! +
    F[parent.rf + PADDING + (flexStartEdge(axis))]!;

  F[child.rf + POSITION + (flexStartEdge(axis))] = position;
}

function setFlexEndLayoutPosition(
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  containingBlockWidth: number,
): void {
  const flexEndPosition =
    F[parent.rf + BORDER + (flexEndEdge(axis))]! +
    F[parent.rf + PADDING + (flexEndEdge(axis))]! +
    child.style.computeFlexEndMargin(axis, direction, containingBlockWidth);

  F[child.rf + POSITION + (flexStartEdge(axis))] = getPositionOfOppositeEdge(
    flexEndPosition,
    axis,
    parent,
    child,
  );
}

function setCenterLayoutPosition(
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  containingBlockWidth: number,
): void {
  const parentLayout = parent;
  const parentContentBoxSize =
    F[parentLayout.rf + MEASURED + (dimension(axis))]! -
    F[parentLayout.rf + BORDER + (flexStartEdge(axis))]! -
    F[parentLayout.rf + BORDER + (flexEndEdge(axis))]! -
    F[parentLayout.rf + PADDING + (flexStartEdge(axis))]! -
    F[parentLayout.rf + PADDING + (flexEndEdge(axis))]!;

  const childOuterSize =
    F[child.rf + MEASURED + (dimension(axis))]! +
    child.style.computeMarginForAxis(axis, containingBlockWidth);

  const position =
    (parentContentBoxSize - childOuterSize) / 2.0 +
    F[parentLayout.rf + BORDER + (flexStartEdge(axis))]! +
    F[parentLayout.rf + PADDING + (flexStartEdge(axis))]! +
    child.style.computeFlexStartMargin(axis, direction, containingBlockWidth);

  F[child.rf + POSITION + (flexStartEdge(axis))] = position;
}

function justifyAbsoluteChild(
  parent: Node,
  child: Node,
  direction: Direction,
  mainAxis: FlexDirection,
  containingBlockWidth: number,
): void {
  switch (parent.style.justifyContent) {
    case Justify.Start:
    case Justify.Auto:
    case Justify.Stretch:
    case Justify.FlexStart:
    case Justify.SpaceBetween:
      setFlexStartLayoutPosition(parent, child, direction, mainAxis, containingBlockWidth);
      break;
    case Justify.End:
    case Justify.FlexEnd:
      setFlexEndLayoutPosition(parent, child, direction, mainAxis, containingBlockWidth);
      break;
    case Justify.Center:
    case Justify.SpaceAround:
    case Justify.SpaceEvenly:
      setCenterLayoutPosition(parent, child, direction, mainAxis, containingBlockWidth);
      break;
  }
}

function alignAbsoluteChild(
  parent: Node,
  child: Node,
  direction: Direction,
  crossAxis: FlexDirection,
  containingBlockWidth: number,
): void {
  let itemAlign = resolveChildAlignment(parent, child);
  const parentWrap = parent.style.flexWrap;
  if (parentWrap === Wrap.WrapReverse) {
    if (itemAlign === Align.FlexEnd) {
      itemAlign = Align.FlexStart;
    } else if (itemAlign !== Align.Center) {
      itemAlign = Align.FlexEnd;
    }
  }

  switch (itemAlign) {
    case Align.Start:
    case Align.Auto:
    case Align.FlexStart:
    case Align.Baseline:
    case Align.SpaceAround:
    case Align.SpaceBetween:
    case Align.Stretch:
    case Align.SpaceEvenly:
      setFlexStartLayoutPosition(parent, child, direction, crossAxis, containingBlockWidth);
      break;
    case Align.End:
    case Align.FlexEnd:
      setFlexEndLayoutPosition(parent, child, direction, crossAxis, containingBlockWidth);
      break;
    case Align.Center:
      setCenterLayoutPosition(parent, child, direction, crossAxis, containingBlockWidth);
      break;
  }
}

/*
 * Absolutely positioned nodes do not participate in flex layout and thus their
 * positions can be determined independently from the rest of their siblings.
 * For each axis there are essentially two cases:
 *
 * 1) The node has insets defined. In this case we can just use these to
 *    determine the position of the node.
 * 2) The node does not have insets defined. In this case we look at the style
 *    of the parent to position the node. Things like justify content and
 *    align content will move absolute children around. If none of these
 *    special properties are defined, the child is positioned at the start
 *    (defined by flex direction) of the leading flex line.
 *
 * This function does that positioning for the given axis. The spec has more
 * information on this topic: https://www.w3.org/TR/css-flexbox-1/#abspos-items
 */
function positionAbsoluteChild(
  containingNode: Node,
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  isMainAxis: boolean,
  containingBlockWidth: number,
  containingBlockHeight: number,
): void {
  const isAxisRow = isRow(axis);
  const containingBlockSize = isAxisRow ? containingBlockWidth : containingBlockHeight;
  const childStyle = child.style;

  // The inline-start position takes priority over the end position in the case
  // that they are both set and the node has a fixed width. Thus we only have 2
  // cases here: if inline-start is defined and if inline-end is defined.
  //
  // Despite checking inline-start to honor prioritization of insets, we write
  // to the flex-start edge because this algorithm works by positioning on the
  // flex-start edge and then filling in the flex-end direction at the end if
  // necessary.
  if (
    childStyle.isInlineStartPositionDefined(axis, direction) &&
    !childStyle.isInlineStartPositionAuto(axis, direction)
  ) {
    const positionRelativeToInlineStart =
      childStyle.computeInlineStartPosition(axis, direction, containingBlockSize) +
      F[containingNode.rf + BORDER + (inlineStartEdge(axis, direction))]! +
      childStyle.computeInlineStartMargin(axis, direction, containingBlockSize);
    const positionRelativeToFlexStart =
      inlineStartEdge(axis, direction) !== flexStartEdge(axis)
        ? getPositionOfOppositeEdge(positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    F[child.rf + POSITION + (flexStartEdge(axis))] = positionRelativeToFlexStart;
  } else if (
    childStyle.isInlineEndPositionDefined(axis, direction) &&
    !childStyle.isInlineEndPositionAuto(axis, direction)
  ) {
    const positionRelativeToInlineStart =
      F[containingNode.rf + MEASURED + (dimension(axis))]! -
      F[child.rf + MEASURED + (dimension(axis))]! -
      F[containingNode.rf + BORDER + (inlineEndEdge(axis, direction))]! -
      childStyle.computeInlineEndMargin(axis, direction, containingBlockSize) -
      childStyle.computeInlineEndPosition(axis, direction, containingBlockSize);
    const positionRelativeToFlexStart =
      inlineStartEdge(axis, direction) !== flexStartEdge(axis)
        ? getPositionOfOppositeEdge(positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    F[child.rf + POSITION + (flexStartEdge(axis))] = positionRelativeToFlexStart;
  } else if (isMainAxis) {
    justifyAbsoluteChild(parent, child, direction, axis, containingBlockWidth);
  } else {
    alignAbsoluteChild(parent, child, direction, axis, containingBlockWidth);
  }
}

function hasBothInsets(child: Node, axis: FlexDirection, direction: Direction): boolean {
  const style = child.style;
  return (
    style.isFlexStartPositionDefined(axis, direction) &&
    style.isFlexEndPositionDefined(axis, direction) &&
    !style.isFlexStartPositionAuto(axis, direction) &&
    !style.isFlexEndPositionAuto(axis, direction)
  );
}

function layoutAbsoluteChild(
  containingNode: Node,
  node: Node,
  child: Node,
  containingBlockWidth: number,
  containingBlockHeight: number,
  widthMode: SizingMode,
  direction: Direction,
  layoutMarkerData: LayoutData | null,
  depth: number,
  generationCount: number,
): void {
  const mainAxis = resolveDirection(node.style.flexDirection, direction);
  const crossAxis = resolveCrossDirection(mainAxis, direction);
  const isMainAxisRow = isRow(mainAxis);

  let childWidth = NaN;
  let childHeight = NaN;
  let childWidthSizingMode: SizingMode;
  let childHeightSizingMode: SizingMode;

  const childStyle = child.style;
  const marginRow = childStyle.computeMarginForAxis(FlexDirection.Row, containingBlockWidth);
  const marginColumn = childStyle.computeMarginForAxis(FlexDirection.Column, containingBlockWidth);

  if (child.hasDefiniteLength(Dimension.Width, containingBlockWidth)) {
    childWidth =
      child.getResolvedDimension(
        direction,
        Dimension.Width,
        containingBlockWidth,
        containingBlockWidth,
      ) + marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (hasBothInsets(child, FlexDirection.Row, direction)) {
      childWidth =
        containingBlockWidth -
        (childStyle.computeFlexStartPosition(FlexDirection.Row, direction, containingBlockWidth) +
          childStyle.computeFlexEndPosition(FlexDirection.Row, direction, containingBlockWidth));
      childWidth = boundAxis(
        child,
        FlexDirection.Row,
        direction,
        childWidth,
        containingBlockWidth,
        containingBlockWidth,
      );
    }
  }

  if (child.hasDefiniteLength(Dimension.Height, containingBlockHeight)) {
    childHeight =
      child.getResolvedDimension(
        direction,
        Dimension.Height,
        containingBlockHeight,
        containingBlockWidth,
      ) + marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based
    // on the top/bottom offsets if they're defined.
    if (hasBothInsets(child, FlexDirection.Column, direction)) {
      childHeight =
        containingBlockHeight -
        (childStyle.computeFlexStartPosition(
          FlexDirection.Column,
          direction,
          containingBlockHeight,
        ) +
          childStyle.computeFlexEndPosition(
            FlexDirection.Column,
            direction,
            containingBlockHeight,
          ));
      childHeight = boundAxis(
        child,
        FlexDirection.Column,
        direction,
        childHeight,
        containingBlockHeight,
        containingBlockWidth,
      );
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const aspectRatio = childStyle.aspectRatio;
  if ((childWidth !== childWidth) !== (childHeight !== childHeight)) {
    if (aspectRatio === aspectRatio) {
      if (childWidth !== childWidth) {
        childWidth = marginRow + (childHeight - marginColumn) * aspectRatio;
      } else if (childHeight !== childHeight) {
        childHeight = marginColumn + (childWidth - marginRow) / aspectRatio;
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (childWidth !== childWidth || childHeight !== childHeight) {
    childWidthSizingMode =
      childWidth !== childWidth ? SizingMode.MaxContent : SizingMode.StretchFit;
    childHeightSizingMode =
      childHeight !== childHeight ? SizingMode.MaxContent : SizingMode.StretchFit;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child
    // to wrap to the size of its owner. This is the same behavior as many
    // browsers implement.
    if (
      !isMainAxisRow &&
      childWidth !== childWidth &&
      widthMode !== SizingMode.MaxContent &&
      containingBlockWidth > 0
    ) {
      childWidth = containingBlockWidth;
      childWidthSizingMode = SizingMode.FitContent;
    }

    calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      childWidthSizingMode,
      childHeightSizingMode,
      containingBlockWidth,
      containingBlockHeight,
      false,
      LayoutPassReason.AbsMeasureChild,
      layoutMarkerData,
      depth,
      generationCount,
    );
    childWidth =
      F[child.rf + MEASURED + Dimension.Width]! +
      childStyle.computeMarginForAxis(FlexDirection.Row, containingBlockWidth);
    childHeight =
      F[child.rf + MEASURED + Dimension.Height]! +
      childStyle.computeMarginForAxis(FlexDirection.Column, containingBlockWidth);
  }

  calculateLayoutInternal(
    child,
    childWidth,
    childHeight,
    direction,
    SizingMode.StretchFit,
    SizingMode.StretchFit,
    containingBlockWidth,
    containingBlockHeight,
    true,
    LayoutPassReason.AbsLayout,
    layoutMarkerData,
    depth,
    generationCount,
  );

  positionAbsoluteChild(
    containingNode,
    node,
    child,
    direction,
    mainAxis,
    true /*isMainAxis*/,
    containingBlockWidth,
    containingBlockHeight,
  );
  positionAbsoluteChild(
    containingNode,
    node,
    child,
    direction,
    crossAxis,
    false /*isMainAxis*/,
    containingBlockWidth,
    containingBlockHeight,
  );
}

// Layout absolute descendants of the containing node, returns whether any
// descendant got a new layout.
export function layoutAbsoluteDescendants(
  containingNode: Node,
  currentNode: Node,
  widthSizingMode: SizingMode,
  currentNodeDirection: Direction,
  layoutMarkerData: LayoutData | null,
  currentDepth: number,
  generationCount: number,
  currentNodeLeftOffsetFromContainingBlock: number,
  currentNodeTopOffsetFromContainingBlock: number,
): boolean {
  let hasNewLayout = false;
  // The containing block is the padding box of the containing node. Its border
  // is read from its layout, where it is resolved for its own direction: the
  // direction at hand is that of the absolute child's parent.
  const containingBorder = containingNode.rf + BORDER;
  const containingBlockWidth =
    F[containingNode.rf + MEASURED + Dimension.Width]! -
    F[containingBorder + PhysicalEdge.Left]! -
    F[containingBorder + PhysicalEdge.Right]!;
  const containingBlockHeight =
    F[containingNode.rf + MEASURED + Dimension.Height]! -
    F[containingBorder + PhysicalEdge.Top]! -
    F[containingBorder + PhysicalEdge.Bottom]!;
  const children = currentNode.getLayoutChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    const childStyle = child.style;
    if (childStyle.display === Display.None) {
      continue;
    } else if (childStyle.positionType === PositionType.Absolute) {
      layoutAbsoluteChild(
        containingNode,
        currentNode,
        child,
        containingBlockWidth,
        containingBlockHeight,
        widthSizingMode,
        currentNodeDirection,
        layoutMarkerData,
        currentDepth,
        generationCount,
      );

      hasNewLayout = hasNewLayout || child.hasNewLayout;

      /*
       * At this point the child has its position set but only on its the
       * parent's flexStart edge. Additionally, this position should be
       * interpreted relative to the containing block of the child if it had
       * insets defined. So we need to adjust the position by subtracting the
       * the parents offset from the containing block. However, getting that
       * offset is complicated since the two nodes can have different main/cross
       * axes.
       */
      const parentMainAxis = resolveDirection(
        currentNode.style.flexDirection,
        currentNodeDirection,
      );
      const parentCrossAxis = resolveCrossDirection(parentMainAxis, currentNodeDirection);

      if (needsTrailingPosition(parentMainAxis)) {
        const mainInsetsDefined = isRow(parentMainAxis)
          ? childStyle.horizontalInsetsDefined()
          : childStyle.verticalInsetsDefined();
        setChildTrailingPosition(
          mainInsetsDefined ? containingNode : currentNode,
          child,
          parentMainAxis,
        );
      }
      if (needsTrailingPosition(parentCrossAxis)) {
        const crossInsetsDefined = isRow(parentCrossAxis)
          ? childStyle.horizontalInsetsDefined()
          : childStyle.verticalInsetsDefined();
        setChildTrailingPosition(
          crossInsetsDefined ? containingNode : currentNode,
          child,
          parentCrossAxis,
        );
      }

      /*
       * At this point we know the left and top physical edges of the child are
       * set with positions that are relative to the containing block if insets
       * are defined
       */
      const childLayout = child;
      const childLeftPosition = F[childLayout.rf + POSITION + PhysicalEdge.Left]!;
      const childTopPosition = F[childLayout.rf + POSITION + PhysicalEdge.Top]!;

      const childLeftOffsetFromParent = childStyle.horizontalInsetsDefined()
        ? childLeftPosition - currentNodeLeftOffsetFromContainingBlock
        : childLeftPosition;
      const childTopOffsetFromParent = childStyle.verticalInsetsDefined()
        ? childTopPosition - currentNodeTopOffsetFromContainingBlock
        : childTopPosition;

      F[childLayout.rf + POSITION + PhysicalEdge.Left] = childLeftOffsetFromParent;
      F[childLayout.rf + POSITION + PhysicalEdge.Top] = childTopOffsetFromParent;
    } else if (childStyle.positionType === PositionType.Static) {
      // Absolute descendants of "child" are positioned relative to the current
      // containing block instead of their parent.
      const childDirection = child.resolveDirection(currentNodeDirection);
      // By now all descendants of the containing block that are not absolute
      // will have their positions set for left and top.
      const childLeftOffsetFromContainingBlock =
        currentNodeLeftOffsetFromContainingBlock + F[child.rf + POSITION + PhysicalEdge.Left]!;
      const childTopOffsetFromContainingBlock =
        currentNodeTopOffsetFromContainingBlock + F[child.rf + POSITION + PhysicalEdge.Top]!;

      // A change anywhere below `child` dirties it, and a dirty node is visited.
      // So when this pass has not visited it, and the walk arrives with what
      // it came with last time, the absolute descendants are laid out already.
      // What places them is the size of the containing block and where `child`
      // is in it, so the offsets of the key are taken from its padding box.
      const childLayout = child;
      const walkLeft =
        childLeftOffsetFromContainingBlock - F[containingNode.rf + BORDER + PhysicalEdge.Left]!;
      const walkTop =
        childTopOffsetFromContainingBlock - F[containingNode.rf + BORDER + PhysicalEdge.Top]!;
      if (
        I[childLayout.ri + GENERATION]! !== generationCount &&
        (U[childLayout.ru + ABSOLUTE_WALK_DIRECTION]! as Direction) === childDirection &&
        (U[childLayout.ru + ABSOLUTE_WALK_SIZING_MODE]! as SizingMode) === widthSizingMode &&
        F[childLayout.rf + ABSOLUTE_WALK_CONTAINING_WIDTH]! === containingBlockWidth &&
        F[childLayout.rf + ABSOLUTE_WALK_CONTAINING_HEIGHT]! === containingBlockHeight &&
        F[childLayout.rf + ABSOLUTE_WALK_LEFT]! === walkLeft &&
        F[childLayout.rf + ABSOLUTE_WALK_TOP]! === walkTop
      ) {
        continue;
      }
      // The walk reads the size `child` was laid out with. When a measurement
      // came after that layout, the measured dimensions are its result instead.
      F[childLayout.rf + MEASURED + Dimension.Width] = F[childLayout.rf + RAW_DIMENSIONS + Dimension.Width]!;
      F[childLayout.rf + MEASURED + Dimension.Height] =
        F[childLayout.rf + RAW_DIMENSIONS + Dimension.Height]!;

      I[childLayout.ri + ABSOLUTE_WALK_GENERATION] = generationCount;
      U[childLayout.ru + ABSOLUTE_WALK_DIRECTION] = childDirection;
      U[childLayout.ru + ABSOLUTE_WALK_SIZING_MODE] = widthSizingMode;
      F[childLayout.rf + ABSOLUTE_WALK_CONTAINING_WIDTH] = containingBlockWidth;
      F[childLayout.rf + ABSOLUTE_WALK_CONTAINING_HEIGHT] = containingBlockHeight;
      F[childLayout.rf + ABSOLUTE_WALK_LEFT] = walkLeft;
      F[childLayout.rf + ABSOLUTE_WALK_TOP] = walkTop;

      hasNewLayout =
        layoutAbsoluteDescendants(
          containingNode,
          child,
          widthSizingMode,
          childDirection,
          layoutMarkerData,
          currentDepth + 1,
          generationCount,
          childLeftOffsetFromContainingBlock,
          childTopOffsetFromContainingBlock,
        ) || hasNewLayout;

      cleanupContentsNodesRecursively(child, /* didPerformLayout */ hasNewLayout);

      if (hasNewLayout) {
        child.hasNewLayout = hasNewLayout;
      }
    }
  }
  return hasNewLayout;
}
