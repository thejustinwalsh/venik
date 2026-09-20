import { type Direction, Display, PositionType, Wrap } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { boundAxisWithinMinAndMax } from "./BoundAxis.ts";
import { resolveDirection } from "./FlexDirection.ts";

export type FlexLineRunningLayout = {
  // Total flex grow factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  totalFlexGrowFactors: number;

  // Total flex shrink factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  totalFlexShrinkScaledFactors: number;

  // The amount of available space within inner dimensions of the line which may
  // still be distributed.
  remainingFreeSpace: number;

  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of owner.
  mainDim: number;

  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  crossDim: number;
};

export type FlexLine = {
  // List of children which are part of the line flow. This means they are not
  // positioned absolutely, or with `display: "none"`, and do not overflow the
  // available dimensions.
  readonly itemsInFlow: readonly Node[];

  // Accumulation of the dimensions and margin of all the children on the
  // current line. This will be used in order to either set the dimensions of
  // the node if none already exist or to compute the remaining space left for
  // the flexible children.
  readonly sizeConsumed: number;

  // Number of edges along the line flow with an auto margin.
  readonly numberOfAutoMargins: number;

  // Index into the layout children of the first child after this line. (C++
  // advances an iterator passed by reference instead.)
  readonly endOfLineIndex: number;

  // Layout information about the line computed in steps after line-breaking
  layout: FlexLineRunningLayout;
};

// Calculates where a line starting at a given index should break, returning
// information about the collective children on the liune.
//
// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// computeFlexBasisForChildren function).
export function calculateFlexLine(
  node: Node,
  ownerDirection: Direction,
  ownerWidth: number,
  mainAxisOwnerSize: number,
  availableInnerWidth: number,
  availableInnerMainDim: number,
  layoutChildren: readonly Node[],
  startOfLineIndex: number,
  lineCount: number,
): FlexLine {
  const itemsInFlow: Node[] = [];

  let sizeConsumed = 0.0;
  let totalFlexGrowFactors = 0.0;
  let totalFlexShrinkScaledFactors = 0.0;
  let numberOfAutoMargins = 0;
  let firstElementInLine: Node | null = null;

  let sizeConsumedIncludingMinConstraint = 0;
  const direction = node.resolveDirection(ownerDirection);
  const mainAxis = resolveDirection(node.style().flexDirection, direction);
  const isNodeFlexWrap = node.style().flexWrap !== Wrap.NoWrap;
  const gap = node.style().computeGapForAxis(mainAxis, availableInnerMainDim);

  // Add items to the current line until it's full or we run out of items.
  let index = startOfLineIndex;
  for (; index < layoutChildren.length; index++) {
    const child = layoutChildren[index]!;
    const childStyle = child.style();
    if (
      childStyle.display === Display.None ||
      childStyle.positionType === PositionType.Absolute
    ) {
      continue;
    }

    if (firstElementInLine === null) {
      firstElementInLine = child;
    }

    if (childStyle.flexStartMarginIsAuto(mainAxis, ownerDirection)) {
      numberOfAutoMargins++;
    }
    if (childStyle.flexEndMarginIsAuto(mainAxis, ownerDirection)) {
      numberOfAutoMargins++;
    }

    child.setLineIndex(lineCount);
    const childMarginMainAxis = childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);
    const childLeadingGapMainAxis = child === firstElementInLine ? 0.0 : gap;
    const flexBasisWithMinAndMaxConstraints = boundAxisWithinMinAndMax(
      child,
      direction,
      mainAxis,
      child.getLayout().computedFlexBasis,
      mainAxisOwnerSize,
      ownerWidth,
    );

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    if (
      sizeConsumedIncludingMinConstraint +
        flexBasisWithMinAndMaxConstraints +
        childMarginMainAxis +
        childLeadingGapMainAxis >
        availableInnerMainDim &&
      isNodeFlexWrap &&
      itemsInFlow.length !== 0
    ) {
      break;
    }

    sizeConsumedIncludingMinConstraint +=
      flexBasisWithMinAndMaxConstraints + childMarginMainAxis + childLeadingGapMainAxis;
    sizeConsumed +=
      flexBasisWithMinAndMaxConstraints + childMarginMainAxis + childLeadingGapMainAxis;

    if (child.isNodeFlexible()) {
      totalFlexGrowFactors += child.resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      totalFlexShrinkScaledFactors +=
        -child.resolveFlexShrink() * child.getLayout().computedFlexBasis;
    }

    itemsInFlow.push(child);
  }

  // The total flex factor needs to be floored to 1.
  if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
    totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
    totalFlexShrinkScaledFactors = 1;
  }

  return {
    itemsInFlow,
    sizeConsumed,
    numberOfAutoMargins,
    endOfLineIndex: index,
    layout: {
      totalFlexGrowFactors,
      totalFlexShrinkScaledFactors,
      remainingFreeSpace: 0.0,
      mainDim: 0.0,
      crossDim: 0.0,
    },
  };
}
