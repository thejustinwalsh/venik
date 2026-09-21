import { type Direction, Display, PositionType, Wrap } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { boundAxisWithinMinAndMax } from "./BoundAxis.ts";
import { resolveDirection } from "./FlexDirection.ts";

export class FlexLineRunningLayout {
  // Total flex grow factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  totalFlexGrowFactors: number = 0;

  // Total flex shrink factors of flex items which are to be laid in the current
  // line. This is decremented as free space is distributed.
  totalFlexShrinkScaledFactors: number = 0;

  // The amount of available space within inner dimensions of the line which may
  // still be distributed.
  remainingFreeSpace: number = 0;

  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of owner.
  mainDim: number = 0;

  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  crossDim: number = 0;
}

// Flex lines are pooled: a container needs one at a time, so a layout pass
// takes them from a stack that is as deep as the tree and allocates nothing
// once the stack has grown.
export class FlexLine {
  // List of children which are part of the line flow. This means they are not
  // positioned absolutely, or with `display: "none"`, and do not overflow the
  // available dimensions.
  // Only the first `itemCount` entries are part of the line: the array is
  // never truncated, because V8 drops an array's storage with its length.
  readonly itemsInFlow: (Node | null)[] = [];
  itemCount: number = 0;

  // Accumulation of the dimensions and margin of all the children on the
  // current line. This will be used in order to either set the dimensions of
  // the node if none already exist or to compute the remaining space left for
  // the flexible children.
  sizeConsumed: number = 0;

  // For resolving the flexible lengths: the size each item starts from, and the
  // size of each item that is frozen at its min or max size, NaN for the
  // others. As long as the longest line so far.
  readonly startingSizes: number[] = [];
  readonly frozenSizes: number[] = [];

  // Number of edges along the line flow with an auto margin.
  numberOfAutoMargins: number = 0;

  // Index into the layout children of the first child after this line.
  endOfLineIndex: number = 0;

  // Layout information about the line computed in steps after line-breaking
  readonly layout: FlexLineRunningLayout = new FlexLineRunningLayout();

  /** Empties the line, so that a pooled line doesn't keep nodes alive. */
  clear(): void {
    const items = this.itemsInFlow;
    for (let i = 0; i < this.itemCount; i++) {
      items[i] = null;
    }
    this.itemCount = 0;
  }
}

const flexLinePool: FlexLine[] = [];
let flexLinePoolTop = 0;

/** Takes a flex line off the pool. Pair with `releaseFlexLine`. */
export function acquireFlexLine(): FlexLine {
  if (flexLinePoolTop === flexLinePool.length) {
    flexLinePool.push(new FlexLine());
  }
  return flexLinePool[flexLinePoolTop++]!;
}

/** Returns the most recently acquired flex line to the pool. */
export function releaseFlexLine(flexLine: FlexLine): void {
  flexLine.clear();
  flexLinePoolTop--;
}

/** The pool depth, to hand to `restoreFlexLinePool` if a layout pass throws. */
export function flexLinePoolDepth(): number {
  return flexLinePoolTop;
}

export function restoreFlexLinePool(depth: number): void {
  while (flexLinePoolTop > depth) {
    flexLinePool[--flexLinePoolTop]!.clear();
  }
}

// Calculates where a line starting at a given index should break, filling
// `flexLine` with information about the collective children on the line.
//
// This function assumes that all the children of node have their
// computedFlexBasis properly computed(To do this use
// computeFlexBasisForChildren function).
export function calculateFlexLine(
  node: Node,
  ownerDirection: Direction,
  availableInnerWidth: number,
  availableInnerMainDim: number,
  layoutChildren: readonly Node[],
  startOfLineIndex: number,
  lineCount: number,
  flexLine: FlexLine,
): void {
  flexLine.clear();
  const itemsInFlow = flexLine.itemsInFlow;
  let itemCount = 0;

  let sizeConsumed = 0.0;
  let totalFlexGrowFactors = 0.0;
  let totalFlexShrinkScaledFactors = 0.0;
  let numberOfAutoMargins = 0;
  let firstElementInLine: Node | null = null;

  let sizeConsumedIncludingMinConstraint = 0;
  const direction = node.resolveDirection(ownerDirection);
  const mainAxis = resolveDirection(node.style.flexDirection, direction);
  const isNodeFlexWrap = node.style.flexWrap !== Wrap.NoWrap;
  const gap = node.style.computeGapForAxis(mainAxis, availableInnerMainDim);

  // Add items to the current line until it's full or we run out of items.
  let index = startOfLineIndex;
  for (; index < layoutChildren.length; index++) {
    const child = layoutChildren[index]!;
    const childStyle = child.style;
    if (childStyle.display === Display.None || childStyle.positionType === PositionType.Absolute) {
      continue;
    }

    if (firstElementInLine === null) {
      firstElementInLine = child;
    }

    if (childStyle.flexStartMarginIsAuto(mainAxis, direction)) {
      numberOfAutoMargins++;
    }
    if (childStyle.flexEndMarginIsAuto(mainAxis, direction)) {
      numberOfAutoMargins++;
    }

    child.lineIndex = lineCount;
    const childMarginMainAxis = childStyle.computeMarginForAxis(mainAxis, availableInnerWidth);
    const childLeadingGapMainAxis = child === firstElementInLine ? 0.0 : gap;
    const flexBasisWithMinAndMaxConstraints = childStyle.hasSizeBounds
      ? boundAxisWithinMinAndMax(
          child,
          direction,
          mainAxis,
          child.layout.computedFlexBasis,
          availableInnerMainDim,
          availableInnerWidth,
        )
      : child.layout.computedFlexBasis;

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    //
    // Items that fill the line exactly stay on it, whatever rounding errors the
    // sizes carry. The tolerance is the one the layout cache compares available
    // sizes with: a smaller difference must not change the result.
    if (
      sizeConsumedIncludingMinConstraint +
        flexBasisWithMinAndMaxConstraints +
        childMarginMainAxis +
        childLeadingGapMainAxis >
        availableInnerMainDim + 0.0001 &&
      isNodeFlexWrap &&
      itemCount !== 0
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
      totalFlexShrinkScaledFactors += -child.resolveFlexShrink() * child.layout.computedFlexBasis;
    }

    if (itemCount === itemsInFlow.length) {
      itemsInFlow.push(child);
    } else {
      itemsInFlow[itemCount] = child;
    }
    itemCount++;
  }

  // The total flex factor needs to be floored to 1.
  if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
    totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
    totalFlexShrinkScaledFactors = 1;
  }

  flexLine.itemCount = itemCount;
  flexLine.sizeConsumed = sizeConsumed;
  flexLine.numberOfAutoMargins = numberOfAutoMargins;
  flexLine.endOfLineIndex = index;
  const layout = flexLine.layout;
  layout.totalFlexGrowFactors = totalFlexGrowFactors;
  layout.totalFlexShrinkScaledFactors = totalFlexShrinkScaledFactors;
  layout.remainingFreeSpace = 0.0;
  layout.mainDim = 0.0;
  layout.crossDim = 0.0;
}
