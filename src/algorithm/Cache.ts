import type { Config } from "../config/Config.ts";
import { FlexDirection } from "../enums.ts";
import type { CachedMeasurement } from "../node/CachedMeasurement.ts";
import type { Node } from "../node/Node.ts";
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
  // Rounding moves a size by half a pixel at most, so sizes two pixels apart
  // cannot meet. That settles most misses, which are entries of earlier passes.
  if (Math.abs(lastSize - size) >= 2 / pointScaleFactor + 0.0001) {
    return false;
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

/**
 * The cached result a node with a measure function can reuse under the given
 * constraints: its layout cache entry, else the first measurement cache entry
 * that fits, else null.
 */
export function findCachedMeasurement(
  node: Node,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  ownerWidth: number,
): CachedMeasurement | null {
  const layout = node.layout;
  const config = node.getConfig();
  const marginRow = node.style.computeMarginForAxis(FlexDirection.Row, ownerWidth);
  const marginColumn = node.style.computeMarginForAxis(FlexDirection.Column, ownerWidth);

  let cached = layout.cachedLayout;
  for (let i = 0; ; i++) {
    if (
      canUseCachedMeasurement(
        widthMode,
        availableWidth,
        heightMode,
        availableHeight,
        cached.widthSizingMode,
        cached.availableWidth,
        cached.heightSizingMode,
        cached.availableHeight,
        cached.computedWidth,
        cached.computedHeight,
        marginRow,
        marginColumn,
        config,
      )
    ) {
      if (i > 1) {
        layout.promoteCachedMeasurement(i - 1);
      }
      return cached;
    }
    if (i === layout.nextCachedMeasurementsIndex) {
      return null;
    }
    cached = layout.cachedMeasurements[i]!;
  }
}
