// The layout results of every node, in one buffer: a record per node, laid
// out by how the algorithm reads it. A cache probe reads a node's sizes, its
// edges and its cache entries together, so they sit next to each other.
//
//   record (RECORD_BYTES)
//   ┌───────────────────┬────────────────────────────┬──────────┬──────────────────────┐
//   │ f64 × 32: results │ f64 × 72: 9 cache entries  │ i32 × 8  │ u8 × 64: enums,      │
//   │                   │ (0 = layout, 1-8 measured) │          │ flags, cache order   │
//   └───────────────────┴────────────────────────────┴──────────┴──────────────────────┘
//
// A node holds the index of its record (its slot) and where the record starts
// in each view. Slot 0 is never handed out: it holds the record of a node
// that has never been laid out, which a new slot is copied from.
//
// The views are module bindings the store replaces when it grows, which it
// does only when a node is created. Code that can run a measure function (and
// so create nodes) must read `F`, `I` and `U` afresh after it, not keep them
// in a local.

import { Direction, SizingMode } from "../enums.ts";

// f64: results. Sizes and edges are indexed by `Dimension` and `PhysicalEdge`.
export const MEASURED = 0;
export const DIMENSIONS = 2;
export const RAW_DIMENSIONS = 4;
export const POSITION = 6;
export const ROUNDED_POSITION = 10;
export const MARGIN = 12;
export const BORDER = 16;
export const PADDING = 20;
export const FLEX_BASIS = 24;
export const BASELINE = 25;
export const ROUNDING_ORIGIN_LEFT = 26;
export const ROUNDING_ORIGIN_TOP = 27;
export const ABSOLUTE_WALK_CONTAINING_WIDTH = 28;
export const ABSOLUTE_WALK_CONTAINING_HEIGHT = 29;
export const ABSOLUTE_WALK_LEFT = 30;
export const ABSOLUTE_WALK_TOP = 31;

// f64: cache entries, ENTRY_F64 numbers each, from CACHE.
export const CACHE = 32;
export const ENTRY_F64 = 8;
export const AVAILABLE_WIDTH = 0;
export const AVAILABLE_HEIGHT = 1;
export const OWNER_WIDTH = 2;
export const OWNER_HEIGHT = 3;
export const COMPUTED_WIDTH = 4;
export const COMPUTED_HEIGHT = 5;
export const ENTRY_BASELINE = 6;
export const MAIN_CONTENT_SIZE = 7;
/** Entry 0 holds the last layout; 1 to MAX_CACHED_MEASUREMENTS hold measurements. */
export const LAYOUT_ENTRY = 0;
// This value was chosen based on empirical data:
// 98% of analyzed layouts require less than 8 entries.
export const MAX_CACHED_MEASUREMENTS = 8;
const RECORD_F64 = CACHE + (1 + MAX_CACHED_MEASUREMENTS) * ENTRY_F64;

// i32
export const GENERATION = 0;
export const FLEX_BASIS_GENERATION = 1;
export const CONFIG_VERSION = 2;
export const ABSOLUTE_WALK_GENERATION = 3;
export const NEXT_CACHED_MEASUREMENT = 4;
const RECORD_I32 = 8;

// u8
export const DIRECTION = 0;
export const LAST_OWNER_DIRECTION = 1;
export const ABSOLUTE_WALK_DIRECTION = 2;
export const ABSOLUTE_WALK_SIZING_MODE = 3;
export const HAD_OVERFLOW = 4;
// The overflow flag a measurement in the same space would report. Yoga
// computes it before flexible lengths are resolved when the measurement
// skips that step, and a layout computes it after: the flag a node reports
// depends on the kind of pass that last visited it.
export const MEASURE_HAD_OVERFLOW = 5;
// Whether the node's size in a space that fits its content is that of its
// content alone: no node below depends on the space it is offered. Set by
// every full pass; a dirty node never visited in full is not trusted.
export const CONTENT_SIZED = 6;
// Whether the last layout pass found a size a measurement in the same space
// would not: see `gPassMeasureDiffers` in the layout algorithm. A measurement
// pass leaves it unset.
export const MEASURE_DIFFERS = 7;
// Whether the node aligns its children by their baselines, as of its last
// full pass. Like CONTENT_SIZED, only current while the node is clean.
export const BASELINE_LAYOUT = 8;
// Whether a measurement went through the node after it was last laid out and
// left its own results in the subtree: margins or paddings that are
// percentages of another owner size, or another overflow flag. The subtree
// then no longer holds what the layout entry stands for.
export const MEASURED_SINCE_LAYOUT = 9;
// Whether a measurement entry may be relaxable: set when one is stored,
// cleared with the entries. Saves the relaxed probe on most misses.
export const HAS_RELAXABLE_MEASUREMENTS = 10;
/** The measurement entries in probe order: MAX_CACHED_MEASUREMENTS entry numbers. */
export const CACHE_ORDER = 16;
/** Per cache entry, ENTRY_U8 bytes from ENTRY_U8_START: the two sizing modes and the flag bits. */
export const ENTRY_U8_START = 24;
export const ENTRY_U8 = 4;
export const WIDTH_SIZING_MODE = 0;
export const HEIGHT_SIZING_MODE = 1;
export const ENTRY_FLAGS = 2;
const RECORD_U8 = 64;

// Entry flag bits.
export const ENTRY_HAD_OVERFLOW = 1;
export const ENTRY_MEASURE_HAD_OVERFLOW = 2;
// Whether the result stands for every space that fits it the way a measure
// function's does: the node has no size bounds, does not scroll, did not
// overflow, and no child depends on the space the node offers. Such an entry
// answers questions asked in another space through the same rules as a
// measurement of a measure function.
export const ENTRY_RELAXABLE = 4;
// Whether a layout pass produced the entry. Its baseline is then the one of a
// layout, which an owner aligning its children by their baselines cannot take
// for the baseline of a measurement.
export const ENTRY_FROM_LAYOUT = 8;
// Whether the layout the entry stands for stays as it is when the node is
// given more room along its main axis: the items sit at the start, none can
// grow or take the room through an auto margin, no line wraps, the axis is not
// reversed, and no absolute descendant is placed against the node. The node
// then takes a layout request in any larger exact main size, and only its own
// size changes. MAIN_CONTENT_SIZE is then what it needs, whatever room it was
// given.
export const ENTRY_MAIN_SIZE_INVARIANT = 16;

const I32_BYTES = RECORD_F64 * 8;
const U8_BYTES = I32_BYTES + RECORD_I32 * 4;
export const RECORD_BYTES = U8_BYTES + RECORD_U8;
/** How far apart records are in each view. */
export const F_STRIDE = RECORD_BYTES / 8;
export const I_STRIDE = RECORD_BYTES / 4;
export const U_STRIDE = RECORD_BYTES;
// Where the i32 and u8 parts start within a record, in their views' units.
const I_START = I32_BYTES / 4;
const U_START = U8_BYTES;

/** Where a node's record starts in `F`, `I` and `U`. */
export function recordF(slot: number): number {
  return slot * F_STRIDE;
}
export function recordI(slot: number): number {
  return slot * I_STRIDE + I_START;
}
export function recordU(slot: number): number {
  return slot * U_STRIDE + U_START;
}

export let F: Float64Array;
export let I: Int32Array;
export let U: Uint8Array;

let capacity = 0;
let highWater = 1;
const freeSlots: number[] = [];

function allocate(slots: number): void {
  const buffer = new ArrayBuffer(slots * RECORD_BYTES);
  const bytes = new Uint8Array(buffer);
  if (capacity !== 0) {
    bytes.set(new Uint8Array(F.buffer));
  }
  F = new Float64Array(buffer);
  I = new Int32Array(buffer);
  U = bytes;
  capacity = slots;
}

allocate(64);
writeTemplate();

/** The record of a node that has never been laid out, in slot 0. */
function writeTemplate(): void {
  const f = recordF(0);
  const u = recordU(0);
  F.fill(NaN, f + MEASURED, f + CACHE);
  F.fill(0, f + POSITION, f + FLEX_BASIS);
  for (let e = 0; e <= MAX_CACHED_MEASUREMENTS; e++) {
    const entry = f + CACHE + e * ENTRY_F64;
    F[entry + AVAILABLE_WIDTH] = -1;
    F[entry + AVAILABLE_HEIGHT] = -1;
    F[entry + OWNER_WIDTH] = NaN;
    F[entry + OWNER_HEIGHT] = NaN;
    F[entry + COMPUTED_WIDTH] = -1;
    F[entry + COMPUTED_HEIGHT] = -1;
    F[entry + ENTRY_BASELINE] = NaN;
    F[entry + MAIN_CONTENT_SIZE] = NaN;
    const modes = u + ENTRY_U8_START + e * ENTRY_U8;
    U[modes + WIDTH_SIZING_MODE] = SizingMode.MaxContent;
    U[modes + HEIGHT_SIZING_MODE] = SizingMode.MaxContent;
  }
  U[u + DIRECTION] = Direction.Inherit;
  U[u + LAST_OWNER_DIRECTION] = Direction.Inherit;
  U[u + ABSOLUTE_WALK_DIRECTION] = Direction.Inherit;
  U[u + ABSOLUTE_WALK_SIZING_MODE] = SizingMode.StretchFit;
  for (let i = 0; i < MAX_CACHED_MEASUREMENTS; i++) {
    U[u + CACHE_ORDER + i] = 1 + i;
  }
}

/** Makes room for `count` more nodes, so that creating them does not grow the store. */
export function reserveSlots(count: number): void {
  const needed = highWater + Math.max(0, count - freeSlots.length);
  if (needed > capacity) {
    allocate(Math.max(needed, capacity * 2));
  }
}

/** A slot holding the record of a node never laid out. */
export function takeSlot(): number {
  let slot = freeSlots.pop();
  if (slot === undefined) {
    if (highWater === capacity) {
      allocate(capacity * 2);
    }
    slot = highWater++;
  }
  resetSlot(slot);
  return slot;
}

/** Hands a slot back. Its record is reset when it is taken again. */
export function releaseSlot(slot: number): void {
  freeSlots.push(slot);
}

/** Back to the record of a node never laid out. */
export function resetSlot(slot: number): void {
  U.copyWithin(slot * RECORD_BYTES, 0, RECORD_BYTES);
}

/**
 * The layout results of a node that loses its place in a tree, which are no
 * longer valid. What its passes found out about its content and its absolute
 * descendants stays.
 */
export function resetResults(slot: number): void {
  const f = recordF(slot);
  const i = recordI(slot);
  const u = recordU(slot);
  F.copyWithin(f + CACHE, recordF(0) + CACHE, recordF(0) + RECORD_F64);
  U.copyWithin(
    u + ENTRY_U8_START,
    recordU(0) + ENTRY_U8_START,
    recordU(0) + ENTRY_U8_START + (1 + MAX_CACHED_MEASUREMENTS) * ENTRY_U8,
  );
  I[i + NEXT_CACHED_MEASUREMENT] = 0;
  I[i + GENERATION] = 0;
  I[i + FLEX_BASIS_GENERATION] = 0;
  I[i + CONFIG_VERSION] = 0;
  I[i + ABSOLUTE_WALK_GENERATION] = 0;
  F.fill(NaN, f + MEASURED, f + POSITION);
  F.fill(0, f + POSITION, f + FLEX_BASIS);
  F[f + FLEX_BASIS] = NaN;
  F[f + BASELINE] = NaN;
  F[f + ROUNDING_ORIGIN_LEFT] = NaN;
  F[f + ROUNDING_ORIGIN_TOP] = NaN;
  F[f + ABSOLUTE_WALK_CONTAINING_WIDTH] = NaN;
  U[u + DIRECTION] = Direction.Inherit;
  U[u + LAST_OWNER_DIRECTION] = Direction.Inherit;
  U[u + HAD_OVERFLOW] = 0;
  U[u + MEASURED_SINCE_LAYOUT] = 0;
}

/** Slots held by nodes, for tests. */
export function slotsInUse(): number {
  return highWater - 1 - freeSlots.length;
}
