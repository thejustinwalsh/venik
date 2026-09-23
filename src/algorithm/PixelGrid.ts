import { Dimension, Display } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { inexactEquals } from "../math.ts";
import { PhysicalEdge } from "./FlexDirection.ts";
import {
  ABSOLUTE_WALK_GENERATION,
  DIMENSIONS,
  F,
  GENERATION,
  I,
  POSITION,
  RAW_DIMENSIONS,
  ROUNDED_POSITION,
  ROUNDING_ORIGIN_LEFT,
  ROUNDING_ORIGIN_TOP,
} from "../node/Store.ts";

// Operand and result of `roundScratchToPixelGrid`: [value, pointScaleFactor].
// V8 boxes fractional doubles that cross a call it doesn't inline, both as
// arguments and as return value, so the tree walk below rounds through here.
const roundingScratch = new Float64Array(2);

/**
 * Rounds a point value to the nearest physical pixel given the scale factor.
 */
export function roundValueToPixelGrid(
  value: number,
  pointScaleFactor: number,
  forceCeil: boolean,
  forceFloor: boolean,
): number {
  roundingScratch[0] = value;
  roundingScratch[1] = pointScaleFactor;
  roundScratchToPixelGrid(forceCeil, forceFloor);
  return roundingScratch[0]!;
}

/** Rounds `roundingScratch[0]` in place, using the scale factor in `roundingScratch[1]`. */
function roundScratchToPixelGrid(forceCeil: boolean, forceFloor: boolean): void {
  const pointScaleFactor = roundingScratch[1]!;
  const scaledValue = roundingScratch[0]! * pointScaleFactor;
  // `fractial` is the number such that `floor(scaledValue) = scaledValue -
  // fractial`, for negative values too: -2.2 gives 0.8, and -2.2 - 0.8 = -3.
  // Not `scaledValue % 1`: V8 compiles a floating-point `%` to a call into the
  // C library, which made this the slowest line of the rounding pass.
  const floored = Math.floor(scaledValue);
  const fractial = scaledValue - floored;
  // A value within 0.0001 of a whole pixel is that pixel, whatever is forced.
  let roundUp: boolean;
  if (forceCeil) {
    roundUp = fractial >= 0.0001;
  } else if (forceFloor) {
    roundUp = fractial > 0.9999;
  } else {
    roundUp = fractial > 0.4999;
  }
  // NaN and infinite values have a NaN `fractial` and stay undefined.
  roundingScratch[0] =
    fractial === fractial ? (roundUp ? floored + 1.0 : floored) / pointScaleFactor : NaN;
}

// Absolute left/top of the ancestors being rounded, two entries per tree
// depth. The recursion hands these down through here instead of as arguments,
// because V8 boxes every fractional double passed to a call it doesn't inline.
let absolutePositions = new Float64Array(64);

/**
 * Round the layout results of a node and its subtree to the pixel grid.
 */
export function roundLayoutResultsToPixelGrid(node: Node, generationCount: number): void {
  absolutePositions[0] = 0;
  absolutePositions[1] = 0;
  roundSubtreeToPixelGrid(node, 0, generationCount);
}

/** `offset` is where the absolute position of the node's parent is in `absolutePositions`. */
function roundSubtreeToPixelGrid(node: Node, offset: number, generationCount: number): void {
  if (offset + 4 > absolutePositions.length) {
    const grown = new Float64Array(absolutePositions.length * 2);
    grown.set(absolutePositions);
    absolutePositions = grown;
  }
  const absoluteLeft = absolutePositions[offset]!;
  const absoluteTop = absolutePositions[offset + 1]!;

  const pointScaleFactor = node.getConfig().getPointScaleFactor();
  const layout = node;

  const nodeLeft = F[layout.rf + POSITION + PhysicalEdge.Left]!;
  const nodeTop = F[layout.rf + POSITION + PhysicalEdge.Top]!;

  const nodeWidth = F[layout.rf + RAW_DIMENSIONS + Dimension.Width]!;
  const nodeHeight = F[layout.rf + RAW_DIMENSIONS + Dimension.Height]!;

  F[layout.rf + ROUNDING_ORIGIN_LEFT] = absoluteLeft;
  F[layout.rf + ROUNDING_ORIGIN_TOP] = absoluteTop;

  const absoluteNodeLeft = absoluteLeft + nodeLeft;
  const absoluteNodeTop = absoluteTop + nodeTop;

  const absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  if (pointScaleFactor !== 0.0) {
    // If a node has a custom measure function we never want to round down its
    // size as this could lead to unwanted text truncation.
    const textRounding = node.hasMeasureFunc();

    const scratch = roundingScratch;
    scratch[1] = pointScaleFactor;

    scratch[0] = nodeLeft;
    roundScratchToPixelGrid(false, textRounding);
    F[layout.rf + ROUNDED_POSITION + PhysicalEdge.Left] = scratch[0];

    scratch[0] = nodeTop;
    roundScratchToPixelGrid(false, textRounding);
    F[layout.rf + ROUNDED_POSITION + PhysicalEdge.Top] = scratch[0];

    // We multiply dimension by scale factor and if the result is close to the
    // whole number, we don't have any fraction To verify if the result is close
    // to whole number we want to check both floor and ceil numbers

    const scaledNodeWith = nodeWidth * pointScaleFactor;
    const hasFractionalWidth = !inexactEquals(Math.round(scaledNodeWith), scaledNodeWith);

    const scaledNodeHeight = nodeHeight * pointScaleFactor;
    const hasFractionalHeight = !inexactEquals(Math.round(scaledNodeHeight), scaledNodeHeight);

    scratch[0] = absoluteNodeLeft;
    roundScratchToPixelGrid(false, textRounding);
    const roundedAbsoluteLeft = scratch[0];
    scratch[0] = absoluteNodeRight;
    roundScratchToPixelGrid(
      textRounding && hasFractionalWidth,
      textRounding && !hasFractionalWidth,
    );
    F[layout.rf + DIMENSIONS + Dimension.Width] = scratch[0] - roundedAbsoluteLeft;

    scratch[0] = absoluteNodeTop;
    roundScratchToPixelGrid(false, textRounding);
    const roundedAbsoluteTop = scratch[0];
    scratch[0] = absoluteNodeBottom;
    roundScratchToPixelGrid(
      textRounding && hasFractionalHeight,
      textRounding && !hasFractionalHeight,
    );
    F[layout.rf + DIMENSIONS + Dimension.Height] = scratch[0] - roundedAbsoluteTop;
  } else {
    F[layout.rf + ROUNDED_POSITION + PhysicalEdge.Left] = nodeLeft;
    F[layout.rf + ROUNDED_POSITION + PhysicalEdge.Top] = nodeTop;
    F[layout.rf + DIMENSIONS + Dimension.Width] = nodeWidth;
    F[layout.rf + DIMENSIONS + Dimension.Height] = nodeHeight;
  }

  const children = node.getChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    // A subtree this pass neither visited nor walked for absolute descendants
    // holds the positions and sizes of an earlier pass. Where it has not moved
    // either, rounding gives what it gave then: a node is rounded by where its
    // edges are on the grid, so a subtree that moves is rounded again.
    // A `display: contents` node is never visited itself, but its children are.
    const childLayout = children[i]!;
    if (
      I[childLayout.ri + GENERATION]! !== generationCount &&
      I[childLayout.ri + ABSOLUTE_WALK_GENERATION]! !== generationCount &&
      F[childLayout.rf + ROUNDING_ORIGIN_LEFT]! === absoluteNodeLeft &&
      F[childLayout.rf + ROUNDING_ORIGIN_TOP]! === absoluteNodeTop &&
      children[i]!.style.display !== Display.Contents
    ) {
      continue;
    }
    // Written on every iteration: the child's subtree may have replaced the array.
    absolutePositions[offset + 2] = absoluteNodeLeft;
    absolutePositions[offset + 3] = absoluteNodeTop;
    roundSubtreeToPixelGrid(children[i]!, offset + 2, generationCount);
  }
}
