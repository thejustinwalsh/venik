import { Dimension } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { inexactEquals } from "../math.ts";
import { PhysicalEdge } from "./FlexDirection.ts";

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
  let scaledValue = roundingScratch[0]! * pointScaleFactor;
  // `fractial` is the number such that `floor(scaledValue) = scaledValue -
  // fractial`, for negative values too: -2.2 gives 0.8, and -2.2 - 0.8 = -3.
  // Not `scaledValue % 1`: V8 compiles a floating-point `%` to a call into the
  // C library, which made this the slowest line of the rounding pass.
  const fractial = scaledValue - Math.floor(scaledValue);
  if (inexactEquals(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (inexactEquals(fractial, 1.0)) {
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue =
      scaledValue -
      fractial +
      (fractial === fractial && (fractial > 0.5 || inexactEquals(fractial, 0.5)) ? 1.0 : 0.0);
  }
  roundingScratch[0] =
    scaledValue !== scaledValue || pointScaleFactor !== pointScaleFactor
      ? NaN
      : scaledValue / pointScaleFactor;
}

// Absolute left/top of the ancestors being rounded, two entries per tree
// depth. The recursion hands these down through here instead of as arguments,
// because V8 boxes every fractional double passed to a call it doesn't inline.
let absolutePositions = new Float64Array(64);

/**
 * Round the layout results of a node and its subtree to the pixel grid.
 */
export function roundLayoutResultsToPixelGrid(node: Node): void {
  absolutePositions[0] = 0;
  absolutePositions[1] = 0;
  roundSubtreeToPixelGrid(node, 0);
}

/** `offset` is where the absolute position of the node's parent is in `absolutePositions`. */
function roundSubtreeToPixelGrid(node: Node, offset: number): void {
  if (offset + 4 > absolutePositions.length) {
    const grown = new Float64Array(absolutePositions.length * 2);
    grown.set(absolutePositions);
    absolutePositions = grown;
  }
  const absoluteLeft = absolutePositions[offset]!;
  const absoluteTop = absolutePositions[offset + 1]!;

  const pointScaleFactor = node.getConfig().getPointScaleFactor();
  const layout = node.layout;

  const nodeLeft = layout.position[PhysicalEdge.Left];
  const nodeTop = layout.position[PhysicalEdge.Top];

  const nodeWidth = layout.dimensions[Dimension.Width];
  const nodeHeight = layout.dimensions[Dimension.Height];

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
    layout.position[PhysicalEdge.Left] = scratch[0];

    scratch[0] = nodeTop;
    roundScratchToPixelGrid(false, textRounding);
    layout.position[PhysicalEdge.Top] = scratch[0];

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
    layout.dimensions[Dimension.Width] = scratch[0] - roundedAbsoluteLeft;

    scratch[0] = absoluteNodeTop;
    roundScratchToPixelGrid(false, textRounding);
    const roundedAbsoluteTop = scratch[0];
    scratch[0] = absoluteNodeBottom;
    roundScratchToPixelGrid(
      textRounding && hasFractionalHeight,
      textRounding && !hasFractionalHeight,
    );
    layout.dimensions[Dimension.Height] = scratch[0] - roundedAbsoluteTop;
  }

  const children = node.getChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    // Written on every iteration: the child's subtree may have replaced the array.
    absolutePositions[offset + 2] = absoluteNodeLeft;
    absolutePositions[offset + 3] = absoluteNodeTop;
    roundSubtreeToPixelGrid(children[i]!, offset + 2);
  }
}
