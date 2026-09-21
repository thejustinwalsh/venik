import type { Config } from "../config/Config.ts";
import { inexactEquals } from "../math.ts";
import { roundValueToPixelGrid } from "./PixelGrid.ts";
import { SizingMode } from "../enums.ts";

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

/**
 * Whether two available sizes land on the same physical pixel. Sizes that are
 * already equal skip the rounding, which is most cache probes.
 */
function isSameAvailableSize(lastSize: number, size: number, pointScaleFactor: number): boolean {
  if (inexactEquals(lastSize, size)) {
    return true;
  }
  return (
    pointScaleFactor !== 0 &&
    inexactEquals(
      roundValueToPixelGrid(lastSize, pointScaleFactor, false, false),
      roundValueToPixelGrid(size, pointScaleFactor, false, false),
    )
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

  const hasSameWidthSpec =
    lastWidthMode === widthMode &&
    isSameAvailableSize(lastAvailableWidth, availableWidth, pointScaleFactor);
  const hasSameHeightSpec =
    lastHeightMode === heightMode &&
    isSameAvailableSize(lastAvailableHeight, availableHeight, pointScaleFactor);

  const widthIsCompatible =
    hasSameWidthSpec ||
    sizeIsExactAndMatchesOldMeasuredSize(
      widthMode,
      availableWidth - marginRow,
      lastComputedWidth,
    ) ||
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
