import { Direction } from "../enums.ts";
import { inexactEqualsArray } from "../numeric/Comparison.ts";
import { CachedMeasurement } from "./CachedMeasurement.ts";

export class LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static readonly MaxCachedMeasurements = 8;

  computedFlexBasisGeneration: number = 0;
  computedFlexBasis: number = NaN;

  // Per-flex-item floor along the main axis derived from CSS Flexbox §4.5
  // automatic minimum sizing. Set by `resolveFlexibleLength` when the item
  // has no explicit main-axis `min-{width,height}`. Read by the
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

  direction: Direction = Direction.Inherit;
  hadOverflow: boolean = false;

  // Indexed by `Dimension`.
  readonly dimensions: [number, number] = [NaN, NaN];
  readonly measuredDimensions: [number, number] = [NaN, NaN];
  readonly rawDimensions: [number, number] = [NaN, NaN];
  // Indexed by `PhysicalEdge`.
  readonly position: PhysicalEdges = [0, 0, 0, 0];
  readonly margin: PhysicalEdges = [0, 0, 0, 0];
  readonly border: PhysicalEdges = [0, 0, 0, 0];
  readonly padding: PhysicalEdges = [0, 0, 0, 0];

  /** C++ `operator==`. */
  equals(layout: LayoutResults): boolean {
    let isEqual =
      inexactEqualsArray(this.position, layout.position) &&
      inexactEqualsArray(this.dimensions, layout.dimensions) &&
      inexactEqualsArray(this.margin, layout.margin) &&
      inexactEqualsArray(this.border, layout.border) &&
      inexactEqualsArray(this.padding, layout.padding) &&
      this.direction === layout.direction &&
      this.hadOverflow === layout.hadOverflow &&
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
      sameOrBothUndefined(this.measuredDimensions[0]!, layout.measuredDimensions[0]!) &&
      sameOrBothUndefined(this.measuredDimensions[1]!, layout.measuredDimensions[1]!)
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
    copy.direction = this.direction;
    copy.hadOverflow = this.hadOverflow;
    copyInto(copy.dimensions, this.dimensions);
    copyInto(copy.measuredDimensions, this.measuredDimensions);
    copyInto(copy.rawDimensions, this.rawDimensions);
    copyInto(copy.position, this.position);
    copyInto(copy.margin, this.margin);
    copyInto(copy.border, this.border);
    copyInto(copy.padding, this.padding);
    return copy;
  }
}

type PhysicalEdges = [number, number, number, number];

function copyInto(to: number[], from: readonly number[]): void {
  for (let i = 0, length = from.length; i < length; i++) {
    to[i] = from[i]!;
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
