import { Direction } from "../enums.ts";
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
}

type PhysicalEdges = [number, number, number, number];

function newCachedMeasurements(): CachedMeasurement[] {
  const measurements: CachedMeasurement[] = [];
  for (let i = 0; i < LayoutResults.MaxCachedMeasurements; i++) {
    measurements.push(new CachedMeasurement());
  }
  return measurements;
}
