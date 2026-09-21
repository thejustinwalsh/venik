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
  // We want to calculate `fractial` such that `floor(scaledValue) = scaledValue
  // - fractial`.
  let fractial = scaledValue % 1.0;
  if (fractial < 0) {
    // This branch is for handling negative numbers for `value`.
    //
    // Regarding `floor` and `ceil`. Note that for a number x, `floor(x) <= x <=
    // ceil(x)` even for negative numbers. Here are a couple of examples:
    //   - x =  2.2: floor( 2.2) =  2, ceil( 2.2) =  3
    //   - x = -2.2: floor(-2.2) = -3, ceil(-2.2) = -2
    //
    // Regarding `%`. For fractional negative numbers, `%` returns a
    // negative number. For example, `-2.2 % 1 = -0.2`. However, we want
    // `fractial` to be the number such that subtracting it from `value` will
    // give us `floor(value)`. In the case of negative numbers, adding 1 to
    // `value % 1` gives us this. Let's continue the example from above:
    //   - fractial = -2.2 % 1 = -0.2
    //   - Add 1 to the fraction: fractial2 = fractial + 1 = -0.2 + 1 = 0.8
    //   - Finding the `floor`: -2.2 - fractial2 = -2.2 - 0.8 = -3
    ++fractial;
  }
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
