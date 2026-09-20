import { FlexDirection } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { dimension, flexEndEdge, flexStartEdge } from "./FlexDirection.ts";

// Given an offset to an edge, returns the offset to the opposite edge on the
// same axis. This assumes that the width/height of both nodes is determined at
// this point.
export function getPositionOfOppositeEdge(
  position: number,
  axis: FlexDirection,
  containingNode: Node,
  node: Node,
): number {
  return (
    containingNode.getLayout().measuredDimensions[dimension(axis)] -
    node.getLayout().measuredDimensions[dimension(axis)] -
    position
  );
}

export function setChildTrailingPosition(node: Node, child: Node, axis: FlexDirection): void {
  child
    .getLayout().position[flexEndEdge(axis)] = getPositionOfOppositeEdge(
        child.getLayout().position[flexStartEdge(axis)],
        axis,
        node,
        child,
      );
}

export function needsTrailingPosition(axis: FlexDirection): boolean {
  return axis === FlexDirection.RowReverse || axis === FlexDirection.ColumnReverse;
}
