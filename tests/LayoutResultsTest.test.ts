import { describe, expect, test } from "vitest";
import {
  entryF,
  measurementAt,
  NO_ENTRY,
  takeMeasurement,
} from "../src/algorithm/Cache.ts";
import { Node } from "../src/index.ts";
import {
  AVAILABLE_WIDTH,
  COMPUTED_WIDTH,
  F,
  F_STRIDE,
  I,
  MAX_CACHED_MEASUREMENTS,
  NEXT_CACHED_MEASUREMENT,
  RECORD_BYTES,
  reserveSlots,
  resetResults,
  slotsInUse,
} from "../src/node/Store.ts";

const count = (node: Node) => I[node.ri + NEXT_CACHED_MEASUREMENT];
const order = (node: Node) =>
  Array.from({ length: count(node)! }, (_, i) => measurementAt(node, i));

describe("layout results store", () => {
  test("hands out measurement cache entries in use order, newest first", () => {
    const node = new Node();
    expect(count(node)).toBe(0);

    const first = takeMeasurement(node);
    expect(order(node)).toEqual([first]);

    const second = takeMeasurement(node);
    expect(second).not.toBe(first);
    expect(order(node)).toEqual([second, first]);
  });

  test("recycles the least recently used entry once the cache is full", () => {
    const node = new Node();
    const entries = Array.from({ length: MAX_CACHED_MEASUREMENTS }, () => takeMeasurement(node));
    expect(new Set(entries).size).toBe(MAX_CACHED_MEASUREMENTS);
    expect(entries).not.toContain(NO_ENTRY);

    const recycled = takeMeasurement(node);
    expect(recycled).toBe(entries[0]);
    expect(measurementAt(node, 0)).toBe(recycled);
    expect(count(node)).toBe(MAX_CACHED_MEASUREMENTS);
  });

  test("a reset clears the entries and the count", () => {
    const node = new Node();
    const first = takeMeasurement(node);
    F[entryF(node, first) + AVAILABLE_WIDTH] = 100;
    F[entryF(node, first) + COMPUTED_WIDTH] = 80;
    takeMeasurement(node);

    resetResults(node.rf / F_STRIDE);

    expect(count(node)).toBe(0);
    expect(F[entryF(node, first) + AVAILABLE_WIDTH]).toBe(-1);
    expect(F[entryF(node, first) + COMPUTED_WIDTH]).toBe(-1);
  });

  test("keeps every node's record when it grows", () => {
    const node = new Node();
    node.setWidth(37);
    node.calculateLayout();
    const records = RECORD_BYTES;
    reserveSlots(slotsInUse() + 5000);
    const others = Array.from({ length: 5000 }, () => new Node());
    expect(others).toHaveLength(5000);
    expect(records).toBe(RECORD_BYTES);
    expect(node.getComputedWidth()).toBe(37);
  });
});
