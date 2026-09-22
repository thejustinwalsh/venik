import { SizingMode } from "../enums.ts";

export class CachedMeasurement {
  availableWidth: number = -1;
  availableHeight: number = -1;
  widthSizingMode: SizingMode = SizingMode.MaxContent;
  heightSizingMode: SizingMode = SizingMode.MaxContent;

  // The size percentages of the node's own style resolved against. Part of the
  // key only for a node whose style has such percentages.
  ownerWidth: number = NaN;
  ownerHeight: number = NaN;

  computedWidth: number = -1;
  computedHeight: number = -1;
  baseline: number = NaN;
  hadOverflow: boolean = false;
  measureHadOverflow: boolean = false;
  // Whether the result stands for every space that fits it the way a measure
  // function's does: the node has no size bounds, does not scroll, did not
  // overflow, and no child depends on the space the node offers. Such an
  // entry answers questions asked in another space through the same rules as
  // a measurement of a measure function.
  relaxable: boolean = false;
  // Whether a layout pass produced the entry. Its baseline is then the one of
  // a layout, which an owner aligning its children by their baselines cannot
  // take for the baseline of a measurement.
  fromLayout: boolean = false;

  reset(): void {
    this.availableWidth = -1;
    this.availableHeight = -1;
    this.widthSizingMode = SizingMode.MaxContent;
    this.heightSizingMode = SizingMode.MaxContent;
    this.ownerWidth = NaN;
    this.ownerHeight = NaN;
    this.computedWidth = -1;
    this.computedHeight = -1;
    this.baseline = NaN;
    this.hadOverflow = false;
    this.measureHadOverflow = false;
    this.relaxable = false;
    this.fromLayout = false;
  }
}
