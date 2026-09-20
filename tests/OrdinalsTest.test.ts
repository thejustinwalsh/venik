// Port of yoga-cpp/tests/OrdinalsTest.cpp

import { expect, test } from "vitest";
import { ordinals } from "../src/enums/YogaEnums.ts";
import { Edge } from "../src/index.ts";

test("iteration", () => {
  const expectedEdges: Edge[] = [
    Edge.Left,
    Edge.Top,
    Edge.Right,
    Edge.Bottom,
    Edge.Start,
    Edge.End,
    Edge.Horizontal,
    Edge.Vertical,
    Edge.All,
  ];

  for (const edge of ordinals(Edge)) {
    expect(edge).toBe(expectedEdges[0]);
    expectedEdges.shift();
  }

  expect(expectedEdges.length === 0).toBe(true);
});
