import { Align, Dimension, PositionType } from "../enums.ts";
import { Event } from "../event/event.ts";
import type { Node } from "../node/Node.ts";
import { resolveChildAlignment } from "./Align.ts";
import { isColumn, PhysicalEdge } from "./FlexDirection.ts";

// Calculate baseline represented as an offset from the top edge of the node.
export function calculateBaseline(node: Node): number {
  if (node.hasBaselineFunc()) {
    if (__EVENTS__) Event.publish(node, Event.NodeBaselineStart);

    const baseline = node.baseline(
      node.getLayout().measuredDimension(Dimension.Width),
      node.getLayout().measuredDimension(Dimension.Height),
    );

    if (__EVENTS__) Event.publish(node, Event.NodeBaselineEnd);

    if (Number.isNaN(baseline)) {
      throw new Error("Expect custom baseline function to not return NaN");
    }
    return baseline;
  }

  let baselineChild: Node | null = null;
  for (const child of node.getLayoutChildren()) {
    if (child.getLineIndex() > 0) {
      break;
    }
    if (child.style().positionType() === PositionType.Absolute) {
      continue;
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
    return node.getLayout().measuredDimension(Dimension.Height);
  }

  const baseline = calculateBaseline(baselineChild);
  return baseline + baselineChild.getLayout().position(PhysicalEdge.Top);
}

// Whether any of the children of this node participate in baseline alignment
export function isBaselineLayout(node: Node): boolean {
  if (isColumn(node.style().flexDirection())) {
    return false;
  }
  if (node.style().alignItems() === Align.Baseline) {
    return true;
  }
  for (const child of node.getLayoutChildren()) {
    if (
      child.style().positionType() !== PositionType.Absolute &&
      child.style().alignSelf() === Align.Baseline
    ) {
      return true;
    }
  }

  return false;
}
