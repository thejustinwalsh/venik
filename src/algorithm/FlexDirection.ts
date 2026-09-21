import { Dimension, Direction, Edge, FlexDirection } from "../enums.ts";

/** The four physical edges, as a subset of `Edge`. */
export const PhysicalEdge = {
  Left: Edge.Left,
  Top: Edge.Top,
  Right: Edge.Right,
  Bottom: Edge.Bottom,
} as const;
export type PhysicalEdge = (typeof PhysicalEdge)[keyof typeof PhysicalEdge];

// The helpers below run dozens of times per node and pass, from functions too
// large for V8 to inline much into: a callee's bytecode size decides whether it
// is inlined. Hence comparisons and tables that lean on the enum order (columns
// 0-1, rows 2-3, reverse = forward + 1) rather than switches.

export function isRow(flexDirection: FlexDirection): boolean {
  return flexDirection >= FlexDirection.Row;
}

export function isColumn(flexDirection: FlexDirection): boolean {
  return flexDirection < FlexDirection.Row;
}

export function resolveDirection(
  flexDirection: FlexDirection,
  direction: Direction,
): FlexDirection {
  // RTL swaps Row and RowReverse.
  return direction === Direction.RTL && flexDirection >= FlexDirection.Row
    ? ((flexDirection ^ 1) as FlexDirection)
    : flexDirection;
}

export function resolveCrossDirection(
  flexDirection: FlexDirection,
  direction: Direction,
): FlexDirection {
  return flexDirection < FlexDirection.Row
    ? resolveDirection(FlexDirection.Row, direction)
    : FlexDirection.Column;
}

// Indexed by `FlexDirection`.
const FLEX_START_EDGES = [
  PhysicalEdge.Top,
  PhysicalEdge.Bottom,
  PhysicalEdge.Left,
  PhysicalEdge.Right,
] as const;
const FLEX_END_EDGES = [
  PhysicalEdge.Bottom,
  PhysicalEdge.Top,
  PhysicalEdge.Right,
  PhysicalEdge.Left,
] as const;

export function flexStartEdge(flexDirection: FlexDirection): PhysicalEdge {
  return FLEX_START_EDGES[flexDirection];
}

export function flexEndEdge(flexDirection: FlexDirection): PhysicalEdge {
  return FLEX_END_EDGES[flexDirection];
}

export function inlineStartEdge(flexDirection: FlexDirection, direction: Direction): PhysicalEdge {
  if (flexDirection >= FlexDirection.Row) {
    return direction === Direction.RTL ? PhysicalEdge.Right : PhysicalEdge.Left;
  }
  return PhysicalEdge.Top;
}

export function inlineEndEdge(flexDirection: FlexDirection, direction: Direction): PhysicalEdge {
  if (flexDirection >= FlexDirection.Row) {
    return direction === Direction.RTL ? PhysicalEdge.Left : PhysicalEdge.Right;
  }
  return PhysicalEdge.Bottom;
}

export function dimension(flexDirection: FlexDirection): Dimension {
  return flexDirection >= FlexDirection.Row ? Dimension.Width : Dimension.Height;
}
