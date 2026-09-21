import {
  Align,
  Dimension,
  type Direction,
  Display,
  FlexDirection,
  Justify,
  PositionType,
  Wrap,
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
  inlineStartEdge,
  isRow,
  PhysicalEdge,
  resolveCrossDirection,
  resolveDirection,
} from "./FlexDirection.ts";
import { SizingMode } from "./SizingMode.ts";
import {
  getPositionOfOppositeEdge,
  needsTrailingPosition,
  setChildTrailingPosition,
} from "./TrailingPosition.ts";

function setFlexStartLayoutPosition(
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  containingBlockWidth: number,
): void {
  const position =
    child.style.computeFlexStartMargin(axis, direction, containingBlockWidth) +
    parent.layout.border[flexStartEdge(axis)] +
    parent.layout.padding[flexStartEdge(axis)];

  child.layout.position[flexStartEdge(axis)] = position;
}

function setFlexEndLayoutPosition(
  parent: Node,
  child: Node,
  direction: Direction,
  axis: FlexDirection,
  containingBlockWidth: number,
): void {
  const flexEndPosition =
    parent.layout.border[flexEndEdge(axis)] +
    parent.layout.padding[flexEndEdge(axis)] +
    child.style.computeFlexEndMargin(axis, direction, containingBlockWidth);

  child.layout.position[flexStartEdge(axis)] = getPositionOfOppositeEdge(
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
  const parentLayout = parent.layout;
  const parentContentBoxSize =
    parentLayout.measuredDimensions[dimension(axis)] -
    parentLayout.border[flexStartEdge(axis)] -
    parentLayout.border[flexEndEdge(axis)] -
    parentLayout.padding[flexStartEdge(axis)] -
    parentLayout.padding[flexEndEdge(axis)];

  const childOuterSize =
    child.layout.measuredDimensions[dimension(axis)] +
    child.style.computeMarginForAxis(axis, containingBlockWidth);

  const position =
    (parentContentBoxSize - childOuterSize) / 2.0 +
    parentLayout.border[flexStartEdge(axis)] +
    parentLayout.padding[flexStartEdge(axis)] +
    child.style.computeFlexStartMargin(axis, direction, containingBlockWidth);

  child.layout.position[flexStartEdge(axis)] = position;
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
      containingNode.style.computeInlineStartBorder(axis, direction) +
      childStyle.computeInlineStartMargin(axis, direction, containingBlockSize);
    const positionRelativeToFlexStart =
      inlineStartEdge(axis, direction) !== flexStartEdge(axis)
        ? getPositionOfOppositeEdge(positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    child.layout.position[flexStartEdge(axis)] = positionRelativeToFlexStart;
  } else if (
    childStyle.isInlineEndPositionDefined(axis, direction) &&
    !childStyle.isInlineEndPositionAuto(axis, direction)
  ) {
    const positionRelativeToInlineStart =
      containingNode.layout.measuredDimensions[dimension(axis)] -
      child.layout.measuredDimensions[dimension(axis)] -
      containingNode.style.computeInlineEndBorder(axis, direction) -
      childStyle.computeInlineEndMargin(axis, direction, containingBlockSize) -
      childStyle.computeInlineEndPosition(axis, direction, containingBlockSize);
    const positionRelativeToFlexStart =
      inlineStartEdge(axis, direction) !== flexStartEdge(axis)
        ? getPositionOfOppositeEdge(positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    child.layout.position[flexStartEdge(axis)] = positionRelativeToFlexStart;
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
        containingNode.layout.measuredDimensions[Dimension.Width] -
        (containingNode.style.computeFlexStartBorder(FlexDirection.Row, direction) +
          containingNode.style.computeFlexEndBorder(FlexDirection.Row, direction)) -
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
        containingNode.layout.measuredDimensions[Dimension.Height] -
        (containingNode.style.computeFlexStartBorder(FlexDirection.Column, direction) +
          containingNode.style.computeFlexEndBorder(FlexDirection.Column, direction)) -
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
      child.layout.measuredDimensions[Dimension.Width] +
      childStyle.computeMarginForAxis(FlexDirection.Row, containingBlockWidth);
    childHeight =
      child.layout.measuredDimensions[Dimension.Height] +
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
  const children = currentNode.getLayoutChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    const childStyle = child.style;
    if (childStyle.display === Display.None) {
      continue;
    } else if (childStyle.positionType === PositionType.Absolute) {
      const containingBlockWidth =
        containingNode.layout.measuredDimensions[Dimension.Width] -
        containingNode.style.computeBorderForAxis(FlexDirection.Row);
      const containingBlockHeight =
        containingNode.layout.measuredDimensions[Dimension.Height] -
        containingNode.style.computeBorderForAxis(FlexDirection.Column);

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
      const childLayout = child.layout;
      const childLeftPosition = childLayout.position[PhysicalEdge.Left];
      const childTopPosition = childLayout.position[PhysicalEdge.Top];

      const childLeftOffsetFromParent = childStyle.horizontalInsetsDefined()
        ? childLeftPosition - currentNodeLeftOffsetFromContainingBlock
        : childLeftPosition;
      const childTopOffsetFromParent = childStyle.verticalInsetsDefined()
        ? childTopPosition - currentNodeTopOffsetFromContainingBlock
        : childTopPosition;

      childLayout.position[PhysicalEdge.Left] = childLeftOffsetFromParent;
      childLayout.position[PhysicalEdge.Top] = childTopOffsetFromParent;
    } else if (childStyle.positionType === PositionType.Static) {
      // Absolute descendants of "child" are positioned relative to the current
      // containing block instead of their parent.
      const childDirection = child.resolveDirection(currentNodeDirection);
      // By now all descendants of the containing block that are not absolute
      // will have their positions set for left and top.
      const childLeftOffsetFromContainingBlock =
        currentNodeLeftOffsetFromContainingBlock + child.layout.position[PhysicalEdge.Left];
      const childTopOffsetFromContainingBlock =
        currentNodeTopOffsetFromContainingBlock + child.layout.position[PhysicalEdge.Top];

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
