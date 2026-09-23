import type { Config } from "../config/Config.ts";
import { type Direction, FlexDirection, SizingMode, Wrap } from "../enums.ts";
import { inexactEquals, sameAvailableSize } from "../math.ts";
import type { Node } from "../node/Node.ts";
import {
  AVAILABLE_HEIGHT,
  AVAILABLE_WIDTH,
  CACHE,
  CACHE_ORDER,
  COMPUTED_HEIGHT,
  COMPUTED_WIDTH,
  DIRECTION,
  ENTRY_BASELINE,
  ENTRY_F64,
  ENTRY_FLAGS,
  ENTRY_HAD_OVERFLOW,
  ENTRY_MAIN_SIZE_INVARIANT,
  ENTRY_MEASURE_HAD_OVERFLOW,
  ENTRY_RELAXABLE,
  ENTRY_U8,
  ENTRY_U8_START,
  F,
  HEIGHT_SIZING_MODE,
  I,
  LAYOUT_ENTRY,
  MAIN_CONTENT_SIZE,
  MARGIN,
  MAX_CACHED_MEASUREMENTS,
  NEXT_CACHED_MEASUREMENT,
  OWNER_HEIGHT,
  OWNER_WIDTH,
  U,
  WIDTH_SIZING_MODE,
} from "../node/Store.ts";
import { isRow, PhysicalEdge, resolveDirection } from "./FlexDirection.ts";
import { roundValueToPixelGrid } from "./PixelGrid.ts";

// A cache entry is referred to by its number in the node's record:
// LAYOUT_ENTRY for the last layout, 1 to MAX_CACHED_MEASUREMENTS for
// measurements, and NO_ENTRY for none. `entryF` and `entryU` are where its
// numbers, and its modes and flags, start.

export const NO_ENTRY = -1;

export function entryF(node: Node, entry: number): number {
  return node.rf + CACHE + entry * ENTRY_F64;
}

export function entryU(node: Node, entry: number): number {
  return node.ru + ENTRY_U8_START + entry * ENTRY_U8;
}

/** Whether the entry at `u` (see `entryU`) has the flag. */
export function entryHas(u: number, flag: number): boolean {
  return (U[u + ENTRY_FLAGS]! & flag) !== 0;
}

/** Sets or clears a flag of the entry at `u` (see `entryU`). */
export function setEntryFlag(u: number, flag: number, value: boolean): void {
  const flags = U[u + ENTRY_FLAGS]!;
  U[u + ENTRY_FLAGS] = value ? flags | flag : flags & ~flag;
}

/** The measurement entry probed `index`th. */
export function measurementAt(node: Node, index: number): number {
  return U[node.ru + CACHE_ORDER + index]!;
}

/**
 * Moves a measurement entry to the front, where probes look first. A node is
 * asked the same few questions on every pass, so the entries that answer them
 * gather at the front and the rest age out at the back.
 */
export function promoteMeasurement(node: Node, index: number): void {
  const order = node.ru + CACHE_ORDER;
  const promoted = U[order + index]!;
  U.copyWithin(order + 1, order, order + index);
  U[order] = promoted;
}

/**
 * Takes an unused measurement entry, or recycles the least recently used one
 * once all are in use, and puts it first for the next probe. Its numbers and
 * flags are those it last held.
 */
export function takeMeasurement(node: Node): number {
  const i = node.ri + NEXT_CACHED_MEASUREMENT;
  const count = I[i]!;
  if (count < MAX_CACHED_MEASUREMENTS) {
    I[i] = count + 1;
  }
  const last = I[i]! - 1;
  const entry = U[node.ru + CACHE_ORDER + last]!;
  promoteMeasurement(node, last);
  return entry;
}

/** Back to the entry of a node never laid out. */
export function resetEntry(node: Node, entry: number): void {
  const f = entryF(node, entry);
  F[f + AVAILABLE_WIDTH] = -1;
  F[f + AVAILABLE_HEIGHT] = -1;
  F[f + OWNER_WIDTH] = NaN;
  F[f + OWNER_HEIGHT] = NaN;
  F[f + COMPUTED_WIDTH] = -1;
  F[f + COMPUTED_HEIGHT] = -1;
  F[f + ENTRY_BASELINE] = NaN;
  F[f + MAIN_CONTENT_SIZE] = NaN;
  const u = entryU(node, entry);
  U[u + WIDTH_SIZING_MODE] = SizingMode.MaxContent;
  U[u + HEIGHT_SIZING_MODE] = SizingMode.MaxContent;
  U[u + ENTRY_FLAGS] = 0;
}

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
 * Whether a cache entry (at `f`, see `entryF`) was computed against the same
 * owner size. That is part of the key for a node whose style
 * `dependsOnOwnerSize`. The results of other nodes depend on the owner only
 * through the available size.
 */
export function hasSameOwnerSize(f: number, ownerWidth: number, ownerHeight: number): boolean {
  return (
    inexactEquals(F[f + OWNER_WIDTH]!, ownerWidth) &&
    inexactEquals(F[f + OWNER_HEIGHT]!, ownerHeight)
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
 * The cache entry a node with a measure function can reuse under the given
 * constraints: its layout entry, else the first measurement entry that fits,
 * else NO_ENTRY.
 */
export function findCachedMeasurement(
  node: Node,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  ownerWidth: number,
  ownerHeight: number,
): number {
  const config = node.getConfig();
  const marginRow = node.style.computeMarginForAxis(FlexDirection.Row, ownerWidth);
  const marginColumn = node.style.computeMarginForAxis(FlexDirection.Column, ownerWidth);

  const keyedOnOwnerSize = node.style.dependsOnOwnerSize;
  const count = I[node.ri + NEXT_CACHED_MEASUREMENT]!;

  let entry = LAYOUT_ENTRY;
  for (let i = 0; ; i++) {
    const f = entryF(node, entry);
    const u = entryU(node, entry);
    if (
      (!keyedOnOwnerSize || hasSameOwnerSize(f, ownerWidth, ownerHeight)) &&
      canUseCachedMeasurement(
        widthMode,
        availableWidth,
        heightMode,
        availableHeight,
        U[u + WIDTH_SIZING_MODE]! as SizingMode,
        F[f + AVAILABLE_WIDTH]!,
        U[u + HEIGHT_SIZING_MODE]! as SizingMode,
        F[f + AVAILABLE_HEIGHT]!,
        F[f + COMPUTED_WIDTH]!,
        F[f + COMPUTED_HEIGHT]!,
        marginRow,
        marginColumn,
        config,
      )
    ) {
      if (i > 1) {
        promoteMeasurement(node, i - 1);
      }
      return entry;
    }
    if (i === count) {
      return NO_ENTRY;
    }
    entry = measurementAt(node, i);
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
  node: Node,
  entry: number,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
): boolean {
  const f = entryF(node, entry);
  const u = entryU(node, entry);
  if (
    (U[u + ENTRY_FLAGS]! & (ENTRY_RELAXABLE | ENTRY_HAD_OVERFLOW | ENTRY_MEASURE_HAD_OVERFLOW)) !==
      ENTRY_RELAXABLE ||
    F[f + COMPUTED_WIDTH]! < 0
  ) {
    return false;
  }
  const lastWidthMode = U[u + WIDTH_SIZING_MODE]! as SizingMode;
  const lastHeightMode = U[u + HEIGHT_SIZING_MODE]! as SizingMode;
  const width = relaxedAxisWithoutMargin(
    widthMode,
    availableWidth,
    lastWidthMode,
    F[f + AVAILABLE_WIDTH]!,
  );
  if (width === AXIS_DIFFERENT) {
    return false;
  }
  const height = relaxedAxisWithoutMargin(
    heightMode,
    availableHeight,
    lastHeightMode,
    F[f + AVAILABLE_HEIGHT]!,
  );
  if (height === AXIS_DIFFERENT) {
    return false;
  }
  const margin = node.rf + MARGIN;
  if (
    width === AXIS_UNDECIDED &&
    !relaxedAxisFits(
      widthMode,
      availableWidth,
      F[margin + PhysicalEdge.Left]! + F[margin + PhysicalEdge.Right]!,
      lastWidthMode,
      F[f + AVAILABLE_WIDTH]!,
      F[f + COMPUTED_WIDTH]!,
    )
  ) {
    return false;
  }
  return (
    height === AXIS_SAME ||
    relaxedAxisFits(
      heightMode,
      availableHeight,
      F[margin + PhysicalEdge.Top]! + F[margin + PhysicalEdge.Bottom]!,
      lastHeightMode,
      F[f + AVAILABLE_HEIGHT]!,
      F[f + COMPUTED_HEIGHT]!,
    )
  );
}

/**
 * The cache entry a container can reuse for a measurement after its exact
 * probes missed: a relaxable measurement or layout entry that fits the given
 * space, else NO_ENTRY. A layout is as good a measurement as any.
 */
export function findRelaxedMeasurement(
  node: Node,
  widthMode: SizingMode,
  availableWidth: number,
  heightMode: SizingMode,
  availableHeight: number,
  ownerWidth: number,
  ownerHeight: number,
): number {
  const keyedOnOwnerSize = node.style.dependsOnOwnerSize;
  const count = I[node.ri + NEXT_CACHED_MEASUREMENT]!;

  for (let i = 0; i < count; i++) {
    const entry = measurementAt(node, i);
    if (
      (!keyedOnOwnerSize || hasSameOwnerSize(entryF(node, entry), ownerWidth, ownerHeight)) &&
      relaxableEntryFits(node, entry, widthMode, availableWidth, heightMode, availableHeight)
    ) {
      if (i > 0) {
        promoteMeasurement(node, i);
      }
      return entry;
    }
  }

  // A layout answers for a measurement only where the two agree on the size,
  // which is what makes an entry relaxable: a layout shrinks content that
  // overflows, where a measurement reports it as it is, and a percentage
  // below resolves against another reference in each.
  const f = entryF(node, LAYOUT_ENTRY);
  const u = entryU(node, LAYOUT_ENTRY);
  if (
    entryHas(u, ENTRY_RELAXABLE) &&
    F[f + COMPUTED_WIDTH]! >= 0 &&
    (!keyedOnOwnerSize || hasSameOwnerSize(f, ownerWidth, ownerHeight)) &&
    ((U[u + WIDTH_SIZING_MODE] === widthMode &&
      U[u + HEIGHT_SIZING_MODE] === heightMode &&
      inexactEquals(F[f + AVAILABLE_WIDTH]!, availableWidth) &&
      inexactEquals(F[f + AVAILABLE_HEIGHT]!, availableHeight)) ||
      relaxableEntryFits(
        node,
        LAYOUT_ENTRY,
        widthMode,
        availableWidth,
        heightMode,
        availableHeight,
      ))
  ) {
    return LAYOUT_ENTRY;
  }
  return NO_ENTRY;
}

/** What `relaxedLayoutFits` answers. */
export const LAYOUT_MISS = 0;
/** The cached layout holds as it is. */
const LAYOUT_SAME = 1;
/** The cached layout holds, with the node's main size set to the one asked for. */
export const LAYOUT_STRETCHED = 2;

// Whether an exact size along the main axis of a main-size-invariant layout
// entry holds the entry's layout: it is at least the content it laid out.
function stretchesInvariantMain(
  f: number,
  u: number,
  sizeMode: SizingMode,
  size: number,
  margin: number,
): boolean {
  return (
    entryHas(u, ENTRY_MAIN_SIZE_INVARIANT) &&
    sizeMode === SizingMode.StretchFit &&
    size - margin >= F[f + MAIN_CONTENT_SIZE]! - 0.0001
  );
}

/**
 * Whether the layout entry of a container that does not wrap holds the layout
 * it would compute in the given space. Without wrapping, the lines of a
 * container that fits its space are laid out the same in any space that fits
 * them, and a space of exactly the computed size leaves nothing to distribute
 * either way. A main-size-invariant entry holds in any larger exact main size
 * as well (`LAYOUT_STRETCHED`).
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
  const f = entryF(node, LAYOUT_ENTRY);
  const u = entryU(node, LAYOUT_ENTRY);
  const style = node.style;
  if (!entryHas(u, ENTRY_RELAXABLE) || style.flexWrap !== Wrap.NoWrap) {
    return LAYOUT_MISS;
  }
  if (style.dependsOnOwnerSize && !hasSameOwnerSize(f, ownerWidth, ownerHeight)) {
    return LAYOUT_MISS;
  }
  if (
    relaxableEntryFits(node, LAYOUT_ENTRY, widthMode, availableWidth, heightMode, availableHeight)
  ) {
    return LAYOUT_SAME;
  }
  if (
    (U[u + ENTRY_FLAGS]! &
      (ENTRY_MAIN_SIZE_INVARIANT | ENTRY_HAD_OVERFLOW | ENTRY_MEASURE_HAD_OVERFLOW)) !==
    ENTRY_MAIN_SIZE_INVARIANT
  ) {
    return LAYOUT_MISS;
  }
  // The main axis stretched, the cross axis the same question.
  const margin = node.rf + MARGIN;
  const marginRow = F[margin + PhysicalEdge.Left]! + F[margin + PhysicalEdge.Right]!;
  const marginColumn = F[margin + PhysicalEdge.Top]! + F[margin + PhysicalEdge.Bottom]!;
  const lastWidthMode = U[u + WIDTH_SIZING_MODE]! as SizingMode;
  const lastHeightMode = U[u + HEIGHT_SIZING_MODE]! as SizingMode;
  if (isRow(resolveDirection(style.flexDirection, U[node.ru + DIRECTION]! as Direction))) {
    return stretchesInvariantMain(f, u, widthMode, availableWidth, marginRow) &&
      (relaxedAxisWithoutMargin(
        heightMode,
        availableHeight,
        lastHeightMode,
        F[f + AVAILABLE_HEIGHT]!,
      ) === AXIS_SAME ||
        relaxedAxisFits(
          heightMode,
          availableHeight,
          marginColumn,
          lastHeightMode,
          F[f + AVAILABLE_HEIGHT]!,
          F[f + COMPUTED_HEIGHT]!,
        ))
      ? LAYOUT_STRETCHED
      : LAYOUT_MISS;
  }
  return stretchesInvariantMain(f, u, heightMode, availableHeight, marginColumn) &&
    (relaxedAxisWithoutMargin(
      widthMode,
      availableWidth,
      lastWidthMode,
      F[f + AVAILABLE_WIDTH]!,
    ) === AXIS_SAME ||
      relaxedAxisFits(
        widthMode,
        availableWidth,
        marginRow,
        lastWidthMode,
        F[f + AVAILABLE_WIDTH]!,
        F[f + COMPUTED_WIDTH]!,
      ))
    ? LAYOUT_STRETCHED
    : LAYOUT_MISS;
}
