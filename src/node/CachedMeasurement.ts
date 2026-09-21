import { SizingMode } from "../algorithm/SizingMode.ts";

export class CachedMeasurement {
  availableWidth: number = -1;
  availableHeight: number = -1;
  widthSizingMode: SizingMode = SizingMode.MaxContent;
  heightSizingMode: SizingMode = SizingMode.MaxContent;

  computedWidth: number = -1;
  computedHeight: number = -1;
}
