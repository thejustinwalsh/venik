// `FloatOptional` values are plain numbers here (NaN is undefined).

import { Dimension, type Direction, type FlexDirection } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { maxOrDefined } from "../numeric/Comparison.ts";
import { isColumn } from "./FlexDirection.ts";

export function paddingAndBorderForAxis(
  node: Node,
  axis: FlexDirection,
  direction: Direction,
  widthSize: number,
): number {
  const style = node.style;
  return (
    style.computeInlineStartPaddingAndBorder(axis, direction, widthSize) +
    style.computeInlineEndPaddingAndBorder(axis, direction, widthSize)
  );
}

export function boundAxisWithinMinAndMax(
  node: Node,
  direction: Direction,
  axis: FlexDirection,
  value: number,
  axisSize: number,
  widthSize: number,
): number {
  const style = node.style;
  const dim = isColumn(axis) ? Dimension.Height : Dimension.Width;
  const min = style.resolvedMinDimensionValue(direction, dim, axisSize, widthSize);
  const max = style.resolvedMaxDimensionValue(direction, dim, axisSize, widthSize);

  if (max >= 0 && value > max) {
    return max;
  }

  if (min >= 0 && value < min) {
    return min;
  }

  return value;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't
// go below the padding and border amount.
export function boundAxis(
  node: Node,
  axis: FlexDirection,
  direction: Direction,
  value: number,
  axisSize: number,
  widthSize: number,
): number {
  return maxOrDefined(
    boundAxisWithinMinAndMax(node, direction, axis, value, axisSize, widthSize),
    paddingAndBorderForAxis(node, axis, direction, widthSize),
  );
}
