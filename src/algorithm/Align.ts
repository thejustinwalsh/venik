import { Align, Display, Justify } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { isColumn } from "./FlexDirection.ts";

export function resolveChildAlignment(node: Node, child: Node): Align {
  const align =
    child.style().alignSelf === Align.Auto ? node.style().alignItems : child.style().alignSelf;
  if (
    node.style().display === Display.Flex &&
    align === Align.Baseline &&
    isColumn(node.style().flexDirection)
  ) {
    return Align.FlexStart;
  }
  return align;
}

/**
 * Fallback alignment to use on overflow
 * https://www.w3.org/TR/css-align-3/#distribution-values
 */
export function fallbackAlignment(align: Align): Align {
  switch (align) {
    // Fallback to flex-start
    case Align.SpaceBetween:
    case Align.Stretch:
      return Align.FlexStart;

    // Fallback to safe center. TODO (T208209388): This should be aligned to
    // Start instead of FlexStart (for row-reverse containers)
    case Align.SpaceAround:
    case Align.SpaceEvenly:
      return Align.FlexStart;
    default:
      return align;
  }
}

/**
 * Fallback alignment to use on overflow
 * https://www.w3.org/TR/css-align-3/#distribution-values
 */
export function fallbackJustification(align: Justify): Justify {
  switch (align) {
    // Fallback to flex-start
    case Justify.SpaceBetween:
      // TODO: Support `justify-content: stretch`
      // case Justify.Stretch:
      return Justify.FlexStart;

    // Fallback to safe center. TODO (T208209388): This should be aligned to
    // Start instead of FlexStart (for row-reverse containers)
    case Justify.SpaceAround:
    case Justify.SpaceEvenly:
      return Justify.FlexStart;
    default:
      return align;
  }
}
