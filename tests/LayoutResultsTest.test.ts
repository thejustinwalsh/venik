import { describe, expect, test } from "vitest";
import { LayoutResults } from "../src/node/LayoutResults.ts";

describe("LayoutResults", () => {
  test("allocates measurement cache entries only as they are needed", () => {
    const layout = new LayoutResults();

    expect(layout.cachedMeasurements).toHaveLength(0);
    expect(layout.nextCachedMeasurementsIndex).toBe(0);

    const first = layout.takeCachedMeasurement();
    expect(layout.cachedMeasurements).toEqual([first]);
    expect(layout.nextCachedMeasurementsIndex).toBe(1);

    const second = layout.takeCachedMeasurement();
    expect(layout.cachedMeasurements).toHaveLength(2);
    expect(layout.cachedMeasurements).toEqual([second, first]);
    expect(layout.nextCachedMeasurementsIndex).toBe(2);
  });

  test("recycles the least recently used entry once the cache is full", () => {
    const layout = new LayoutResults();
    const entries = Array.from(
      { length: LayoutResults.MaxCachedMeasurements },
      () => layout.takeCachedMeasurement(),
    );

    expect(layout.cachedMeasurements).toHaveLength(LayoutResults.MaxCachedMeasurements);
    expect(layout.nextCachedMeasurementsIndex).toBe(LayoutResults.MaxCachedMeasurements);

    const recycled = layout.takeCachedMeasurement();
    expect(recycled).toBe(entries[0]);
    expect(layout.cachedMeasurements[0]).toBe(recycled);
    expect(layout.cachedMeasurements).toHaveLength(LayoutResults.MaxCachedMeasurements);
    expect(layout.nextCachedMeasurementsIndex).toBe(LayoutResults.MaxCachedMeasurements);
  });

  test("reset keeps allocated entries for reuse and clears their values", () => {
    const layout = new LayoutResults();
    const first = layout.takeCachedMeasurement();
    first.availableWidth = 100;
    first.computedWidth = 80;

    layout.takeCachedMeasurement();
    layout.reset();

    expect(layout.cachedMeasurements).toHaveLength(2);
    expect(layout.nextCachedMeasurementsIndex).toBe(0);
    expect(first.availableWidth).toBe(-1);
    expect(first.computedWidth).toBe(-1);
    expect(layout.takeCachedMeasurement()).toBe(layout.cachedMeasurements[0]);
    expect(layout.cachedMeasurements).toHaveLength(2);
  });
});
