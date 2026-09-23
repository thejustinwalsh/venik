import { FlexDirection } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { dimension, flexEndEdge, flexStartEdge } from "./FlexDirection.ts";
import {
  F,
  MEASURED,
  POSITION,
} from "../node/Store.ts";

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
    F[containingNode.rf + MEASURED + (dimension(axis))]! -
    F[node.rf + MEASURED + (dimension(axis))]! -
    position
  );
}

export function setChildTrailingPosition(node: Node, child: Node, axis: FlexDirection): void {
  F[child.rf + POSITION + (flexEndEdge(axis))] = getPositionOfOppositeEdge(
    F[child.rf + POSITION + (flexStartEdge(axis))]!,
    axis,
    node,
    child,
  );
}

export function needsTrailingPosition(axis: FlexDirection): boolean {
  return axis === FlexDirection.RowReverse || axis === FlexDirection.ColumnReverse;
}
