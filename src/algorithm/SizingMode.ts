import { fatalWithMessage } from "../debug/AssertFatal.ts";
import { MeasureMode } from "../enums.ts";

/**
 * Corresponds to a CSS auto box size. Missing "min-content" since Yoga doesn't
 * support automatic minimum sizes.
 * https://www.w3.org/TR/css-sizing-3/#auto-box-sizes
 * https://www.w3.org/TR/css-flexbox-1/#min-size-auto
 */
export const SizingMode = {
  /**
   * The size a box would take if its outer size filled the available space in
   * the given axis; in other words, the stretch fit into the available space,
   * if that is definite. Undefined if the available space is indefinite.
   */
  StretchFit: 0,
  /**
   * A box's "ideal" size in a given axis when given infinite available space.
   * Usually this is the smallest size the box could take in that axis while
   * still fitting around its contents, i.e. minimizing unfilled space while
   * avoiding overflow.
   */
  MaxContent: 1,
  /**
   * If the available space in a given axis is definite, equal to
   * clamp(min-content size, stretch-fit size, max-content size) (i.e.
   * max(min-content size, min(max-content size, stretch-fit size))). When
   * sizing under a min-content constraint, equal to the min-content size.
   * Otherwise, equal to the max-content size in that axis.
   */
  FitContent: 2,
} as const;
export type SizingMode = (typeof SizingMode)[keyof typeof SizingMode];

export function measureMode(mode: SizingMode): MeasureMode {
  switch (mode) {
    case SizingMode.StretchFit:
      return MeasureMode.Exactly;
    case SizingMode.MaxContent:
      return MeasureMode.Undefined;
    case SizingMode.FitContent:
      return MeasureMode.AtMost;
    default:
      fatalWithMessage("Invalid SizingMode");
  }
}
