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
      node.layout.measuredDimensions[Dimension.Width],
      node.layout.measuredDimensions[Dimension.Height],
    );

    if (__EVENTS__) Event.publish(node, Event.NodeBaselineEnd);

    if (baseline !== baseline) {
      throw new Error("Expect custom baseline function to not return NaN");
    }
    return baseline;
  }

  let baselineChild: Node | null = null;
  const children = node.getLayoutChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    if (child.lineIndex > 0) {
      break;
    }
    if (child.style.positionType === PositionType.Absolute) {
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
    return node.layout.measuredDimensions[Dimension.Height];
  }

  const baseline = calculateBaseline(baselineChild);
  return baseline + baselineChild.layout.position[PhysicalEdge.Top];
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
