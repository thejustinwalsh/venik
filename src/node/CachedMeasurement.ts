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
  }
}
