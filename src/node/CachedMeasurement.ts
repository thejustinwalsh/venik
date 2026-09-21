import { SizingMode } from "../enums.ts";

export class CachedMeasurement {
  availableWidth: number = -1;
  availableHeight: number = -1;
  widthSizingMode: SizingMode = SizingMode.MaxContent;
  heightSizingMode: SizingMode = SizingMode.MaxContent;

  computedWidth: number = -1;
  computedHeight: number = -1;

  reset(): void {
    this.availableWidth = -1;
    this.availableHeight = -1;
    this.widthSizingMode = SizingMode.MaxContent;
    this.heightSizingMode = SizingMode.MaxContent;
    this.computedWidth = -1;
    this.computedHeight = -1;
  }
}
