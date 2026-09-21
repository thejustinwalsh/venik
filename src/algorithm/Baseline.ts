import { Align, Dimension, Display, FlexDirection, PositionType } from "../enums.ts";
import { Event } from "../event/event.ts";
import type { Node } from "../node/Node.ts";
import { resolveChildAlignment } from "./Align.ts";
import { isColumn, PhysicalEdge } from "./FlexDirection.ts";

// A node's baseline as an offset from its top edge, for the measurement or
// layout it just went through. Only valid right after that, while the node's
// measured dimensions are still the ones of that result.
export function baselineOf(node: Node): number {
  if (!node.hasBaselineFunc()) {
    return node.layout.baseline;
  }

  if (__EVENTS__) Event.publish(node, Event.NodeBaselineStart);

  const baseline = node.baseline(
    node.layout.measuredDimensions[Dimension.Width],
    node.layout.measuredDimensions[Dimension.Height],
  );

  if (__EVENTS__) Event.publish(node, Event.NodeBaselineEnd);

  if (baseline !== baseline) {
    throw new Error("Expect custom baseline function to not return NaN");
  }
  return baseline;
}

// Calculates the baseline that `baselineOf` reports for a node without a
// baseline function.
//
// The baseline is part of the node's result: it is stored in `layout.baseline`
// and in the cache entry. Walking down the tree when the owner asks would read
// descendants in whatever state their last measurement left them, which is not
// the state behind a result restored from the cache.
//
// The pass must have given the children their sizes. `performLayout` tells
// whether it positioned them too. Without positions the baseline child is taken
// to sit at the top of the content box.
export function calculateBaseline(node: Node, performLayout: boolean): number {
  let baselineChild: Node | null = null;
  const children = node.getLayoutChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    // Children out of the flow are on no line: their line index is left over
    // from when they were in it.
    if (
      child.style.positionType === PositionType.Absolute ||
      child.style.display === Display.None
    ) {
      continue;
    }
    if (child.lineIndex > 0) {
      break;
    }
    if (resolveChildAlignment(node, child) === Align.Baseline || child.isReferenceBaseline()) {
      baselineChild = child;
      break;
    }

    if (baselineChild === null) {
      baselineChild = child;
    }
  }

  if (baselineChild === null) {
    return node.layout.measuredDimensions[Dimension.Height];
  }

  if (performLayout) {
    return baselineOf(baselineChild) + baselineChild.layout.position[PhysicalEdge.Top];
  }

  // Taken from the node's own results and the child's style: the edges in the
  // child's layout are those of its last visit, which a cached measurement
  // does not bring back.
  const layout = node.layout;
  const innerWidth =
    layout.measuredDimensions[Dimension.Width] -
    layout.border[PhysicalEdge.Left] -
    layout.border[PhysicalEdge.Right] -
    layout.padding[PhysicalEdge.Left] -
    layout.padding[PhysicalEdge.Right];
  return (
    baselineOf(baselineChild) +
    layout.border[PhysicalEdge.Top] +
    layout.padding[PhysicalEdge.Top] +
    baselineChild.style.computeFlexStartMargin(FlexDirection.Column, layout.direction, innerWidth)
  );
}

// Whether any of the children of this node participate in baseline alignment
export function isBaselineLayout(node: Node): boolean {
  if (isColumn(node.style.flexDirection)) {
    return false;
  }
  if (node.style.alignItems === Align.Baseline) {
    return true;
  }
  const children = node.getLayoutChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    if (
      child.style.positionType !== PositionType.Absolute &&
      child.style.alignSelf === Align.Baseline
    ) {
      return true;
    }
  }

  return false;
}
