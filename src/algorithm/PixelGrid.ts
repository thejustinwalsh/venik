import { Dimension } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { inexactEquals } from "../numeric/Comparison.ts";
import { PhysicalEdge } from "./FlexDirection.ts";

/**
 * Rounds a point value to the nearest physical pixel given the scale factor.
 * Equivalent of `YGRoundValueToPixelGrid`.
 */
export function roundValueToPixelGrid(
  value: number,
  pointScaleFactor: number,
  forceCeil: boolean,
  forceFloor: boolean,
): number {
  let scaledValue = value * pointScaleFactor;
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
      (!Number.isNaN(fractial) && (fractial > 0.5 || inexactEquals(fractial, 0.5)) ? 1.0 : 0.0);
  }
  return Number.isNaN(scaledValue) || Number.isNaN(pointScaleFactor)
    ? NaN
    : scaledValue / pointScaleFactor;
}

/**
 * Round the layout results of a node and its subtree to the pixel grid.
 */
export function roundLayoutResultsToPixelGrid(
  node: Node,
  absoluteLeft: number,
  absoluteTop: number,
): void {
  const pointScaleFactor = node.getConfig().getPointScaleFactor();
  const layout = node.getLayout();

  const nodeLeft = layout.position(PhysicalEdge.Left);
  const nodeTop = layout.position(PhysicalEdge.Top);

  const nodeWidth = layout.dimension(Dimension.Width);
  const nodeHeight = layout.dimension(Dimension.Height);

  const absoluteNodeLeft = absoluteLeft + nodeLeft;
  const absoluteNodeTop = absoluteTop + nodeTop;

  const absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  if (pointScaleFactor !== 0.0) {
    // If a node has a custom measure function we never want to round down its
    // size as this could lead to unwanted text truncation.
    const textRounding = node.hasMeasureFunc();

    layout.setPosition(
      PhysicalEdge.Left,
      roundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
    );

    layout.setPosition(
      PhysicalEdge.Top,
      roundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
    );

    // We multiply dimension by scale factor and if the result is close to the
    // whole number, we don't have any fraction To verify if the result is close
    // to whole number we want to check both floor and ceil numbers

    const scaledNodeWith = nodeWidth * pointScaleFactor;
    const hasFractionalWidth = !inexactEquals(Math.round(scaledNodeWith), scaledNodeWith);

    const scaledNodeHeight = nodeHeight * pointScaleFactor;
    const hasFractionalHeight = !inexactEquals(Math.round(scaledNodeHeight), scaledNodeHeight);

    layout.setDimension(
      Dimension.Width,
      roundValueToPixelGrid(
        absoluteNodeRight,
        pointScaleFactor,
        textRounding && hasFractionalWidth,
        textRounding && !hasFractionalWidth,
      ) - roundValueToPixelGrid(absoluteNodeLeft, pointScaleFactor, false, textRounding),
    );

    layout.setDimension(
      Dimension.Height,
      roundValueToPixelGrid(
        absoluteNodeBottom,
        pointScaleFactor,
        textRounding && hasFractionalHeight,
        textRounding && !hasFractionalHeight,
      ) - roundValueToPixelGrid(absoluteNodeTop, pointScaleFactor, false, textRounding),
    );
  }

  for (const child of node.getChildren()) {
    if (child.getOwner() !== node) {
      continue;
    }
    roundLayoutResultsToPixelGrid(child, absoluteNodeLeft, absoluteNodeTop);
  }
}
