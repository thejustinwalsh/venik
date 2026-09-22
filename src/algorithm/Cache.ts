import type { Config } from "../config/Config.ts";
import { FlexDirection, Wrap } from "../enums.ts";
import type { CachedMeasurement } from "../node/CachedMeasurement.ts";
import type { Node } from "../node/Node.ts";
import type { LayoutResults } from "../node/LayoutResults.ts";
import { isRow, PhysicalEdge, resolveDirection } from "./FlexDirection.ts";
import { inexactEquals, sameAvailableSize } from "../math.ts";
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
  // A size of zero or less and a positive one are never the same question,
  // however close: `isFixedSize` answers them differently.
  if (lastSize <= 0 !== size <= 0) {
    return false;
  }
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

/**
 * Whether a cached result was computed against the same owner size. That is
 * part of the key for a node whose style `dependsOnOwnerSize`. The results of
 * other nodes depend on the owner only through the available size.
 */
export function hasSameOwnerSize(
  cached: CachedMeasurement,
  ownerWidth: number,
  ownerHeight: number,
): boolean {
  return (
    inexactEquals(cached.ownerWidth, ownerWidth) && inexactEquals(cached.ownerHeight, ownerHeight)
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
  ownerHeight: number,
): CachedMeasurement | null {
  const layout = node.layout;
  const config = node.getConfig();
  const marginRow = node.style.computeMarginForAxis(FlexDirection.Row, ownerWidth);
  const marginColumn = node.style.computeMarginForAxis(FlexDirection.Column, ownerWidth);

  const keyedOnOwnerSize = node.style.dependsOnOwnerSize;

  let cached = layout.cachedLayout;
  for (let i = 0; ; i++) {
    if (
      (!keyedOnOwnerSize || hasSameOwnerSize(cached, ownerWidth, ownerHeight)) &&
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

// One axis of a relaxable entry against the question asked. The rules are
// those of `canUseCachedMeasurement`, except that a space the same to within
// a pixel is not the same question: a container given an exact size answers
// with that size, where a measure function answers with its content. The
// caller settles what it can without the margin first.
function relaxedAxisFits(
  sizeMode: SizingMode,
  size: number,
  margin: number,
  lastSizeMode: SizingMode,
  lastSize: number,
  lastComputedSize: number,
): boolean {
  // Both spaces without the margin: the stricter-space rule compares them,
  // and a wrapping container packs its lines by the space it is given.
  return (
    sizeIsExactAndMatchesOldMeasuredSize(sizeMode, size - margin, lastComputedSize) ||
    oldSizeIsMaxContentAndStillFits(sizeMode, size - margin, lastSizeMode, lastComputedSize) ||
    newSizeIsStricterAndStillValid(
      sizeMode,
      size - margin,
      lastSizeMode,
      lastSize - margin,
      lastComputedSize,
    )
  );
}

// Whether an axis is settled without the margin: the same question, or two
// exact sizes that differ, which no rule reconciles.
const AXIS_SAME = 1;
const AXIS_DIFFERENT = 2;
const AXIS_UNDECIDED = 0;
function relaxedAxisWithoutMargin(
  sizeMode: SizingMode,
  size: number,
  lastSizeMode: SizingMode,
  lastSize: number,
): number {
  if (lastSizeMode === sizeMode && sameAvailableSize(lastSize, size)) {
    return AXIS_SAME;
  }
  if (sizeMode === SizingMode.StretchFit && lastSizeMode === SizingMode.StretchFit) {
    return AXIS_DIFFERENT;
  }
  return AXIS_UNDECIDED;
}

// A relaxable entry stands in for the size of a container the way a
// measurement stands in for a measure function's, as long as it did not
// overflow: the flag is restored with the entry.
//
// The margins are those the pass that stored the entry resolved for its
// direction, which is the direction of every entry the node still holds: a
// `start` margin lands on another physical edge under RTL, which summing the
// style's edges without a direction cannot tell.
function relaxableEntryFits(
  cached: CachedMeasurement,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  layout: LayoutResults,
): boolean {
  if (
    !cached.relaxable ||
    cached.hadOverflow ||
    cached.measureHadOverflow ||
    cached.computedWidth < 0
  ) {
    return false;
  }
  const width = relaxedAxisWithoutMargin(
    widthMode,
    availableWidth,
    cached.widthSizingMode,
    cached.availableWidth,
  );
  if (width === AXIS_DIFFERENT) {
    return false;
  }
  const height = relaxedAxisWithoutMargin(
    heightMode,
    availableHeight,
    cached.heightSizingMode,
    cached.availableHeight,
  );
  if (height === AXIS_DIFFERENT) {
    return false;
  }
  if (
    width === AXIS_UNDECIDED &&
    !relaxedAxisFits(
      widthMode,
      availableWidth,
      layout.margin[PhysicalEdge.Left] + layout.margin[PhysicalEdge.Right],
      cached.widthSizingMode,
      cached.availableWidth,
      cached.computedWidth,
    )
  ) {
    return false;
  }
  return (
    height === AXIS_SAME ||
    relaxedAxisFits(
      heightMode,
      availableHeight,
      layout.margin[PhysicalEdge.Top] + layout.margin[PhysicalEdge.Bottom],
      cached.heightSizingMode,
      cached.availableHeight,
      cached.computedHeight,
    )
  );
}

/**
 * The cached result a container can reuse for a measurement after its exact
 * probes missed: a relaxable measurement or layout entry that fits the given
 * space, else null. A layout is as good a measurement as any.
 */
export function findRelaxedMeasurement(
  node: Node,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  ownerWidth: number,
  ownerHeight: number,
): CachedMeasurement | null {
  const layout = node.layout;
  const style = node.style;
  const keyedOnOwnerSize = style.dependsOnOwnerSize;

  for (let i = 0; i < layout.nextCachedMeasurementsIndex; i++) {
    const cached = layout.cachedMeasurements[i]!;
    if (
      (!keyedOnOwnerSize || hasSameOwnerSize(cached, ownerWidth, ownerHeight)) &&
      relaxableEntryFits(
        cached,
        widthMode,
        availableWidth,
        heightMode,
        availableHeight,
        layout,
      )
    ) {
      if (i > 0) {
        layout.promoteCachedMeasurement(i);
      }
      return cached;
    }
  }

  // A layout answers for a measurement only where the two agree on the size,
  // which is what makes an entry relaxable: a layout shrinks content that
  // overflows, where a measurement reports it as it is, and a percentage
  // below resolves against another reference in each.
  const cachedLayout = layout.cachedLayout;
  if (
    cachedLayout.relaxable &&
    cachedLayout.computedWidth >= 0 &&
    (!keyedOnOwnerSize || hasSameOwnerSize(cachedLayout, ownerWidth, ownerHeight)) &&
    ((cachedLayout.widthSizingMode === widthMode &&
      cachedLayout.heightSizingMode === heightMode &&
      inexactEquals(cachedLayout.availableWidth, availableWidth) &&
      inexactEquals(cachedLayout.availableHeight, availableHeight)) ||
      relaxableEntryFits(
        cachedLayout,
        widthMode,
        availableWidth,
        heightMode,
        availableHeight,
        layout,
      ))
  ) {
    return cachedLayout;
  }
  return null;
}

/** What `relaxedLayoutFits` answers. */
export const LAYOUT_MISS = 0;
/** The cached layout holds as it is. */
const LAYOUT_SAME = 1;
/** The cached layout holds, with the node's main size set to the one asked for. */
export const LAYOUT_STRETCHED = 2;

// Whether an exact size along the main axis of a `mainSizeInvariant` entry
// holds the entry's layout: it is at least the content the entry laid out.
function stretchesInvariantMain(
  cached: CachedMeasurement,
  sizeMode: SizingMode,
  size: number,
  margin: number,
): boolean {
  return (
    cached.mainSizeInvariant &&
    sizeMode === SizingMode.StretchFit &&
    size - margin >= cached.mainContentSize - 0.0001
  );
}

/**
 * Whether the layout cache entry of a container that does not wrap holds the
 * layout it would compute in the given space. Without wrapping, the lines of
 * a container that fits its space are laid out the same in any space that
 * fits them, and a space of exactly the computed size leaves nothing to
 * distribute either way. An entry that is `mainSizeInvariant` holds in any
 * larger exact main size as well (`LAYOUT_STRETCHED`).
 */
export function relaxedLayoutFits(
  node: Node,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  ownerWidth: number,
  ownerHeight: number,
): number {
  const layout = node.layout;
  const cachedLayout = layout.cachedLayout;
  const style = node.style;
  if (!cachedLayout.relaxable || style.flexWrap !== Wrap.NoWrap) {
    return LAYOUT_MISS;
  }
  if (style.dependsOnOwnerSize && !hasSameOwnerSize(cachedLayout, ownerWidth, ownerHeight)) {
    return LAYOUT_MISS;
  }
  if (
    relaxableEntryFits(cachedLayout, widthMode, availableWidth, heightMode, availableHeight, layout)
  ) {
    return LAYOUT_SAME;
  }
  if (!cachedLayout.mainSizeInvariant || cachedLayout.hadOverflow || cachedLayout.measureHadOverflow) {
    return LAYOUT_MISS;
  }
  // The main axis stretched, the cross axis the same question.
  const marginRow = layout.margin[PhysicalEdge.Left] + layout.margin[PhysicalEdge.Right];
  const marginColumn = layout.margin[PhysicalEdge.Top] + layout.margin[PhysicalEdge.Bottom];
  if (isRow(resolveDirection(style.flexDirection, layout.direction))) {
    return stretchesInvariantMain(cachedLayout, widthMode, availableWidth, marginRow) &&
      (relaxedAxisWithoutMargin(
        heightMode,
        availableHeight,
        cachedLayout.heightSizingMode,
        cachedLayout.availableHeight,
      ) === AXIS_SAME ||
        relaxedAxisFits(
          heightMode,
          availableHeight,
          marginColumn,
          cachedLayout.heightSizingMode,
          cachedLayout.availableHeight,
          cachedLayout.computedHeight,
        ))
      ? LAYOUT_STRETCHED
      : LAYOUT_MISS;
  }
  return stretchesInvariantMain(cachedLayout, heightMode, availableHeight, marginColumn) &&
    (relaxedAxisWithoutMargin(
      widthMode,
      availableWidth,
      cachedLayout.widthSizingMode,
      cachedLayout.availableWidth,
    ) === AXIS_SAME ||
      relaxedAxisFits(
        widthMode,
        availableWidth,
        marginRow,
        cachedLayout.widthSizingMode,
        cachedLayout.availableWidth,
        cachedLayout.computedWidth,
      ))
    ? LAYOUT_STRETCHED
    : LAYOUT_MISS;
}
