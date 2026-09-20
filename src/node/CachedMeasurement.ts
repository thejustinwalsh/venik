// Port of yoga-cpp/yoga/node/CachedMeasurement.h

import { SizingMode } from "../algorithm/SizingMode.ts";

export class CachedMeasurement {
  availableWidth: number = -1;
  availableHeight: number = -1;
  widthSizingMode: SizingMode = SizingMode.MaxContent;
  heightSizingMode: SizingMode = SizingMode.MaxContent;

  computedWidth: number = -1;
  computedHeight: number = -1;

  /** C++ `operator==`: NaN fields compare equal to each other. */
  equals(measurement: CachedMeasurement): boolean {
    return (
      this.widthSizingMode === measurement.widthSizingMode &&
      this.heightSizingMode === measurement.heightSizingMode &&
      sameOrBothUndefined(this.availableWidth, measurement.availableWidth) &&
      sameOrBothUndefined(this.availableHeight, measurement.availableHeight) &&
      sameOrBothUndefined(this.computedWidth, measurement.computedWidth) &&
      sameOrBothUndefined(this.computedHeight, measurement.computedHeight)
    );
  }

  /** C++ copy assignment. */
  assign(other: CachedMeasurement): void {
    this.availableWidth = other.availableWidth;
    this.availableHeight = other.availableHeight;
    this.widthSizingMode = other.widthSizingMode;
    this.heightSizingMode = other.heightSizingMode;
    this.computedWidth = other.computedWidth;
    this.computedHeight = other.computedHeight;
  }
}

function sameOrBothUndefined(a: number, b: number): boolean {
  return a === b || (a !== a && b !== b);
}
