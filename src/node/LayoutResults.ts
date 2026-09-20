// Port of yoga-cpp/yoga/node/LayoutResults.{h,cpp}
//
// `FloatOptional` members are plain numbers here (NaN is undefined).

import type { PhysicalEdge } from "../algorithm/FlexDirection.ts";
import { type Dimension, Direction } from "../enums.ts";
import { inexactEqualsArray } from "../numeric/Comparison.ts";
import { CachedMeasurement } from "./CachedMeasurement.ts";

export class LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static readonly MaxCachedMeasurements = 8;

  computedFlexBasisGeneration: number = 0;
  computedFlexBasis: number = NaN;

  // Per-flex-item floor along the main axis derived from CSS Flexbox §4.5
  // automatic minimum sizing. Set by `resolveFlexibleLength` when the parent's
  // config does NOT carry the `MinSizeUndefinedInsteadOfAuto` errata and the
  // item has no explicit main-axis `min-{width,height}`. Read by the
  // shrink/bound machinery to keep items at least this large. `Undefined`
  // means "no auto-min applies."
  computedAutoMinMainSize: number = NaN;

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  generationCount: number = 0;
  configVersion: number = 0;
  lastOwnerDirection: Direction = Direction.Inherit;

  nextCachedMeasurementsIndex: number = 0;
  cachedMeasurements: CachedMeasurement[] = newCachedMeasurements();

  cachedLayout: CachedMeasurement = new CachedMeasurement();

  private direction_: Direction = Direction.Inherit;
  private hadOverflow_: boolean = false;

  private dimensions_: number[] = [NaN, NaN];
  private measuredDimensions_: number[] = [NaN, NaN];
  private rawDimensions_: number[] = [NaN, NaN];
  private position_: number[] = [0, 0, 0, 0];
  private margin_: number[] = [0, 0, 0, 0];
  private border_: number[] = [0, 0, 0, 0];
  private padding_: number[] = [0, 0, 0, 0];

  direction(): Direction {
    return this.direction_;
  }

  setDirection(direction: Direction): void {
    this.direction_ = direction;
  }

  hadOverflow(): boolean {
    return this.hadOverflow_;
  }

  setHadOverflow(hadOverflow: boolean): void {
    this.hadOverflow_ = hadOverflow;
  }

  dimension(axis: Dimension): number {
    return this.dimensions_[axis]!;
  }

  setDimension(axis: Dimension, dimension: number): void {
    this.dimensions_[axis] = dimension;
  }

  measuredDimension(axis: Dimension): number {
    return this.measuredDimensions_[axis]!;
  }

  rawDimension(axis: Dimension): number {
    return this.rawDimensions_[axis]!;
  }

  setMeasuredDimension(axis: Dimension, dimension: number): void {
    this.measuredDimensions_[axis] = dimension;
  }

  setRawDimension(axis: Dimension, dimension: number): void {
    this.rawDimensions_[axis] = dimension;
  }

  position(physicalEdge: PhysicalEdge): number {
    return this.position_[physicalEdge]!;
  }

  setPosition(physicalEdge: PhysicalEdge, dimension: number): void {
    this.position_[physicalEdge] = dimension;
  }

  margin(physicalEdge: PhysicalEdge): number {
    return this.margin_[physicalEdge]!;
  }

  setMargin(physicalEdge: PhysicalEdge, dimension: number): void {
    this.margin_[physicalEdge] = dimension;
  }

  border(physicalEdge: PhysicalEdge): number {
    return this.border_[physicalEdge]!;
  }

  setBorder(physicalEdge: PhysicalEdge, dimension: number): void {
    this.border_[physicalEdge] = dimension;
  }

  padding(physicalEdge: PhysicalEdge): number {
    return this.padding_[physicalEdge]!;
  }

  setPadding(physicalEdge: PhysicalEdge, dimension: number): void {
    this.padding_[physicalEdge] = dimension;
  }

  /** C++ `operator==`. */
  equals(layout: LayoutResults): boolean {
    let isEqual =
      inexactEqualsArray(this.position_, layout.position_) &&
      inexactEqualsArray(this.dimensions_, layout.dimensions_) &&
      inexactEqualsArray(this.margin_, layout.margin_) &&
      inexactEqualsArray(this.border_, layout.border_) &&
      inexactEqualsArray(this.padding_, layout.padding_) &&
      this.direction() === layout.direction() &&
      this.hadOverflow() === layout.hadOverflow() &&
      this.lastOwnerDirection === layout.lastOwnerDirection &&
      this.configVersion === layout.configVersion &&
      this.nextCachedMeasurementsIndex === layout.nextCachedMeasurementsIndex &&
      this.cachedLayout.equals(layout.cachedLayout) &&
      sameOrBothUndefined(this.computedFlexBasis, layout.computedFlexBasis);

    for (let i = 0; i < LayoutResults.MaxCachedMeasurements && isEqual; ++i) {
      isEqual = this.cachedMeasurements[i]!.equals(layout.cachedMeasurements[i]!);
    }

    return (
      isEqual &&
      sameOrBothUndefined(this.measuredDimensions_[0]!, layout.measuredDimensions_[0]!) &&
      sameOrBothUndefined(this.measuredDimensions_[1]!, layout.measuredDimensions_[1]!)
    );
  }

  /** C++ copy construction. */
  clone(): LayoutResults {
    const copy = new LayoutResults();
    copy.computedFlexBasisGeneration = this.computedFlexBasisGeneration;
    copy.computedFlexBasis = this.computedFlexBasis;
    copy.computedAutoMinMainSize = this.computedAutoMinMainSize;
    copy.generationCount = this.generationCount;
    copy.configVersion = this.configVersion;
    copy.lastOwnerDirection = this.lastOwnerDirection;
    copy.nextCachedMeasurementsIndex = this.nextCachedMeasurementsIndex;
    for (let i = 0; i < LayoutResults.MaxCachedMeasurements; i++) {
      copy.cachedMeasurements[i]!.assign(this.cachedMeasurements[i]!);
    }
    copy.cachedLayout.assign(this.cachedLayout);
    copy.direction_ = this.direction_;
    copy.hadOverflow_ = this.hadOverflow_;
    copy.dimensions_ = this.dimensions_.slice();
    copy.measuredDimensions_ = this.measuredDimensions_.slice();
    copy.rawDimensions_ = this.rawDimensions_.slice();
    copy.position_ = this.position_.slice();
    copy.margin_ = this.margin_.slice();
    copy.border_ = this.border_.slice();
    copy.padding_ = this.padding_.slice();
    return copy;
  }
}

function newCachedMeasurements(): CachedMeasurement[] {
  const measurements: CachedMeasurement[] = [];
  for (let i = 0; i < LayoutResults.MaxCachedMeasurements; i++) {
    measurements.push(new CachedMeasurement());
  }
  return measurements;
}

function sameOrBothUndefined(a: number, b: number): boolean {
  return a === b || (a !== a && b !== b);
}
