import { Dimension, type Direction, type FlexDirection } from "../enums.ts";
import type { Node } from "../node/Node.ts";
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
  if (!style.hasSizeBounds) {
    return value;
  }
  const dim = isColumn(axis) ? Dimension.Height : Dimension.Width;
  const min = style.resolvedMinDimension(direction, dim, axisSize, widthSize);
  const max = style.resolvedMaxDimension(direction, dim, axisSize, widthSize);

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
//
// Written so that the usual case returns the `value` argument itself: V8 boxes
// a computed double on return (unless the call is inlined), which made this
// function one of the largest sources of garbage in a layout pass.
export function boundAxis(
  node: Node,
  axis: FlexDirection,
  direction: Direction,
  value: number,
  axisSize: number,
  widthSize: number,
): number {
  const style = node.style;
  const dim = isColumn(axis) ? Dimension.Height : Dimension.Width;
  // Never NaN.
  const paddingAndBorder = paddingAndBorderForAxis(node, axis, direction, widthSize);
  if (!style.hasSizeBounds) {
    return value >= paddingAndBorder ? value : paddingAndBorder;
  }

  const max = style.resolvedMaxDimension(direction, dim, axisSize, widthSize);
  if (max >= 0 && value > max) {
    return max > paddingAndBorder ? max : paddingAndBorder;
  }

  const min = style.resolvedMinDimension(direction, dim, axisSize, widthSize);
  if (min >= 0 && value < min) {
    return min > paddingAndBorder ? min : paddingAndBorder;
  }

  if (value >= paddingAndBorder) {
    return value;
  }
  return paddingAndBorder;
}

// Operand and result of `boundAxisInPlace`.
export const boundAxisValue = new Float64Array(1);

// `boundAxis` for a freshly computed value: it takes the value from
// `boundAxisValue[0]` and leaves the result there, so that no double crosses
// the call. The flex distribution loops use it, as they bound a fractional
// share of the free space for every flexible item.
export function boundAxisInPlace(
  node: Node,
  axis: FlexDirection,
  direction: Direction,
  axisSize: number,
  widthSize: number,
): void {
  const style = node.style;
  const dim = isColumn(axis) ? Dimension.Height : Dimension.Width;
  const value = boundAxisValue[0]!;
  let bounded = value;

  if (style.hasSizeBounds) {
    const max = style.resolvedMaxDimension(direction, dim, axisSize, widthSize);
    if (max >= 0 && value > max) {
      bounded = max;
    } else {
      const min = style.resolvedMinDimension(direction, dim, axisSize, widthSize);
      if (min >= 0 && value < min) {
        bounded = min;
      }
    }
  }

  // Never NaN.
  const paddingAndBorder = paddingAndBorderForAxis(node, axis, direction, widthSize);
  boundAxisValue[0] = bounded >= paddingAndBorder ? bounded : paddingAndBorder;
}
