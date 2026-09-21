import { Direction, SizingMode } from "../enums.ts";
import { CachedMeasurement } from "./CachedMeasurement.ts";

export class LayoutResults {
  // This value was chosen based on empirical data:
  // 98% of analyzed layouts require less than 8 entries.
  static readonly MaxCachedMeasurements = 8;

  computedFlexBasisGeneration: number = 0;
  computedFlexBasis: number = NaN;

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

  // The pass that last walked through this node looking for absolute
  // descendants of a containing block further up, and what it came with.
  // While those stay the same and the node goes unvisited, its absolute
  // descendants cannot change either.
  absoluteWalkGeneration: number = 0;
  absoluteWalkDirection: Direction = Direction.Inherit;
  absoluteWalkSizingMode: SizingMode = SizingMode.StretchFit;
  absoluteWalkContainingWidth: number = NaN;
  absoluteWalkContainingHeight: number = NaN;
  absoluteWalkLeft: number = NaN;
  absoluteWalkTop: number = NaN;

  // Indexed by `Dimension`.
  readonly dimensions: [number, number] = [NaN, NaN];
  readonly measuredDimensions: [number, number] = [NaN, NaN];
  readonly rawDimensions: [number, number] = [NaN, NaN];
  // Indexed by `PhysicalEdge`.
  readonly position: PhysicalEdges = [0, 0, 0, 0];
  readonly margin: PhysicalEdges = [0, 0, 0, 0];
  readonly border: PhysicalEdges = [0, 0, 0, 0];
  readonly padding: PhysicalEdges = [0, 0, 0, 0];

  /**
   * Moves a cached measurement to the front, where probes look first. A node is
   * asked the same few questions on every pass, so the entries that answer
   * them gather at the front and the rest age out at the back.
   */
  promoteCachedMeasurement(index: number): void {
    const measurements = this.cachedMeasurements;
    const promoted = measurements[index]!;
    for (let i = index; i > 0; i--) {
      measurements[i] = measurements[i - 1]!;
    }
    measurements[0] = promoted;
  }

  /** Back to the state of a new `LayoutResults`, without allocating. */
  reset(): void {
    this.computedFlexBasisGeneration = 0;
    this.computedFlexBasis = NaN;
    this.generationCount = 0;
    this.configVersion = 0;
    this.lastOwnerDirection = Direction.Inherit;
    this.nextCachedMeasurementsIndex = 0;
    for (let i = 0; i < LayoutResults.MaxCachedMeasurements; i++) {
      this.cachedMeasurements[i]!.reset();
    }
    this.cachedLayout.reset();
    this.direction = Direction.Inherit;
    this.hadOverflow = false;
    this.absoluteWalkGeneration = 0;
    this.absoluteWalkContainingWidth = NaN;
    this.dimensions.fill(NaN);
    this.measuredDimensions.fill(NaN);
    this.rawDimensions.fill(NaN);
    this.position.fill(0);
    this.margin.fill(0);
    this.border.fill(0);
    this.padding.fill(0);
  }
}

type PhysicalEdges = [number, number, number, number];

function newCachedMeasurements(): CachedMeasurement[] {
  const measurements: CachedMeasurement[] = [];
  for (let i = 0; i < LayoutResults.MaxCachedMeasurements; i++) {
    measurements.push(new CachedMeasurement());
  }
  return measurements;
}
