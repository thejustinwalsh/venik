import { Dimension, Direction, Edge, FlexDirection } from "../enums.ts";

/** The four physical edges, as a subset of `Edge`. */
export const PhysicalEdge = {
  Left: Edge.Left,
  Top: Edge.Top,
  Right: Edge.Right,
  Bottom: Edge.Bottom,
} as const;
export type PhysicalEdge = (typeof PhysicalEdge)[keyof typeof PhysicalEdge];

export function isRow(flexDirection: FlexDirection): boolean {
  return flexDirection === FlexDirection.Row || flexDirection === FlexDirection.RowReverse;
}

export function isColumn(flexDirection: FlexDirection): boolean {
  return flexDirection === FlexDirection.Column || flexDirection === FlexDirection.ColumnReverse;
}

export function resolveDirection(
  flexDirection: FlexDirection,
  direction: Direction,
): FlexDirection {
  if (direction === Direction.RTL) {
    if (flexDirection === FlexDirection.Row) {
      return FlexDirection.RowReverse;
    } else if (flexDirection === FlexDirection.RowReverse) {
      return FlexDirection.Row;
    }
  }

  return flexDirection;
}

export function resolveCrossDirection(
  flexDirection: FlexDirection,
  direction: Direction,
): FlexDirection {
  return isColumn(flexDirection)
    ? resolveDirection(FlexDirection.Row, direction)
    : FlexDirection.Column;
}

export function flexStartEdge(flexDirection: FlexDirection): PhysicalEdge {
  switch (flexDirection) {
    case FlexDirection.Column:
      return PhysicalEdge.Top;
    case FlexDirection.ColumnReverse:
      return PhysicalEdge.Bottom;
    case FlexDirection.Row:
      return PhysicalEdge.Left;
    case FlexDirection.RowReverse:
      return PhysicalEdge.Right;
  }
}

export function flexEndEdge(flexDirection: FlexDirection): PhysicalEdge {
  switch (flexDirection) {
    case FlexDirection.Column:
      return PhysicalEdge.Bottom;
    case FlexDirection.ColumnReverse:
      return PhysicalEdge.Top;
    case FlexDirection.Row:
      return PhysicalEdge.Right;
    case FlexDirection.RowReverse:
      return PhysicalEdge.Left;
  }
}

export function inlineStartEdge(flexDirection: FlexDirection, direction: Direction): PhysicalEdge {
  if (isRow(flexDirection)) {
    return direction === Direction.RTL ? PhysicalEdge.Right : PhysicalEdge.Left;
  }

  return PhysicalEdge.Top;
}

export function inlineEndEdge(flexDirection: FlexDirection, direction: Direction): PhysicalEdge {
  if (isRow(flexDirection)) {
    return direction === Direction.RTL ? PhysicalEdge.Left : PhysicalEdge.Right;
  }

  return PhysicalEdge.Bottom;
}

export function dimension(flexDirection: FlexDirection): Dimension {
  return isRow(flexDirection) ? Dimension.Width : Dimension.Height;
}
