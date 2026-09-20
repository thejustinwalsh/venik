// Port of yoga-cpp/yoga/algorithm/Cache.{h,cpp}

import type { Config } from "../config/Config.ts";
import { inexactEquals } from "../numeric/Comparison.ts";
import { roundValueToPixelGrid } from "./PixelGrid.ts";
import { SizingMode } from "./SizingMode.ts";

function sizeIsExactAndMatchesOldMeasuredSize(
  sizeMode: SizingMode,
  size: number,
  lastComputedSize: number,
): boolean {
  return sizeMode === SizingMode.StretchFit && inexactEquals(size, lastComputedSize);
}

function oldSizeIsMaxContentAndStillFits(
  sizeMode: SizingMode,
  size: number,
  lastSizeMode: SizingMode,
  lastComputedSize: number,
): boolean {
  return (
    sizeMode === SizingMode.FitContent &&
    lastSizeMode === SizingMode.MaxContent &&
    (size >= lastComputedSize || inexactEquals(size, lastComputedSize))
  );
}

function newSizeIsStricterAndStillValid(
  sizeMode: SizingMode,
  size: number,
  lastSizeMode: SizingMode,
  lastSize: number,
  lastComputedSize: number,
): boolean {
  return (
    lastSizeMode === SizingMode.FitContent &&
    sizeMode === SizingMode.FitContent &&
    lastSize === lastSize &&
    size === size &&
    lastComputedSize === lastComputedSize &&
    lastSize > size &&
    (lastComputedSize <= size || inexactEquals(size, lastComputedSize))
  );
}

export function canUseCachedMeasurement(
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  lastWidthMode: SizingMode,
  lastAvailableWidth: number,
  lastHeightMode: SizingMode,
  lastAvailableHeight: number,
  lastComputedWidth: number,
  lastComputedHeight: number,
  marginRow: number,
  marginColumn: number,
  config: Config | null,
): boolean {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }

  const pointScaleFactor = config === null ? 0 : config.getPointScaleFactor();

  const useRoundedComparison = config !== null && pointScaleFactor !== 0;
  const effectiveWidth = useRoundedComparison
    ? roundValueToPixelGrid(availableWidth, pointScaleFactor, false, false)
    : availableWidth;
  const effectiveHeight = useRoundedComparison
    ? roundValueToPixelGrid(availableHeight, pointScaleFactor, false, false)
    : availableHeight;
  const effectiveLastWidth = useRoundedComparison
    ? roundValueToPixelGrid(lastAvailableWidth, pointScaleFactor, false, false)
    : lastAvailableWidth;
  const effectiveLastHeight = useRoundedComparison
    ? roundValueToPixelGrid(lastAvailableHeight, pointScaleFactor, false, false)
    : lastAvailableHeight;

  const hasSameWidthSpec =
    lastWidthMode === widthMode && inexactEquals(effectiveLastWidth, effectiveWidth);
  const hasSameHeightSpec =
    lastHeightMode === heightMode && inexactEquals(effectiveLastHeight, effectiveHeight);

  const widthIsCompatible =
    hasSameWidthSpec ||
    sizeIsExactAndMatchesOldMeasuredSize(widthMode, availableWidth - marginRow, lastComputedWidth) ||
    oldSizeIsMaxContentAndStillFits(
      widthMode,
      availableWidth - marginRow,
      lastWidthMode,
      lastComputedWidth,
    ) ||
    newSizeIsStricterAndStillValid(
      widthMode,
      availableWidth - marginRow,
      lastWidthMode,
      lastAvailableWidth,
      lastComputedWidth,
    );

  const heightIsCompatible =
    hasSameHeightSpec ||
    sizeIsExactAndMatchesOldMeasuredSize(
      heightMode,
      availableHeight - marginColumn,
      lastComputedHeight,
    ) ||
    oldSizeIsMaxContentAndStillFits(
      heightMode,
      availableHeight - marginColumn,
      lastHeightMode,
      lastComputedHeight,
    ) ||
    newSizeIsStricterAndStillValid(
      heightMode,
      availableHeight - marginColumn,
      lastHeightMode,
      lastAvailableHeight,
      lastComputedHeight,
    );

  return widthIsCompatible && heightIsCompatible;
}
