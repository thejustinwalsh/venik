// Port of yoga-cpp/tests/YGComputedPaddingTest.cpp

import { expect, test } from "vitest";
import { Direction, Edge, Node } from "../src/index.ts";

test("computed_layout_padding", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(100);
  root.setPaddingPercent(Edge.Start, 10);

  root.calculateLayout(100, 100, Direction.LTR);

  expect(root.getComputedPadding(Edge.Left)).toBe(10);
  expect(root.getComputedPadding(Edge.Right)).toBe(0);

  root.calculateLayout(100, 100, Direction.RTL);

  expect(root.getComputedPadding(Edge.Left)).toBe(0);
  expect(root.getComputedPadding(Edge.Right)).toBe(10);

  root.freeRecursive();
});

test("padding_side_overrides_horizontal_and_vertical", () => {
  const edges = [Edge.Top, Edge.Bottom, Edge.Start, Edge.End, Edge.Left, Edge.Right];

  for (let edgeValue = 0; edgeValue < 2; ++edgeValue) {
    for (const edge of edges) {
      const horizontalOrVertical =
        edge === Edge.Top || edge === Edge.Bottom ? Edge.Vertical : Edge.Horizontal;

      const root = new Node();
      root.setWidth(100);
      root.setHeight(100);
      root.setPadding(horizontalOrVertical, 10);
      root.setPadding(edge, edgeValue);

      root.calculateLayout(100, 100, Direction.LTR);

      expect(root.getComputedPadding(edge)).toBe(edgeValue);

      root.freeRecursive();
    }
  }
});

test("padding_side_overrides_all", () => {
  const edges = [Edge.Top, Edge.Bottom, Edge.Start, Edge.End, Edge.Left, Edge.Right];

  for (let edgeValue = 0; edgeValue < 2; ++edgeValue) {
    for (const edge of edges) {
      const root = new Node();
      root.setWidth(100);
      root.setHeight(100);
      root.setPadding(Edge.All, 10);
      root.setPadding(edge, edgeValue);

      root.calculateLayout(100, 100, Direction.LTR);

      expect(root.getComputedPadding(edge)).toBe(edgeValue);

      root.freeRecursive();
    }
  }
});

test("padding_horizontal_and_vertical_overrides_all", () => {
  const directions = [Edge.Horizontal, Edge.Vertical];

  for (let directionValue = 0; directionValue < 2; ++directionValue) {
    for (const direction of directions) {
      const root = new Node();
      root.setWidth(100);
      root.setHeight(100);
      root.setPadding(Edge.All, 10);
      root.setPadding(direction, directionValue);

      root.calculateLayout(100, 100, Direction.LTR);

      if (direction === Edge.Vertical) {
        expect(root.getComputedPadding(Edge.Top)).toBe(directionValue);
        expect(root.getComputedPadding(Edge.Bottom)).toBe(directionValue);
      } else {
        expect(root.getComputedPadding(Edge.Start)).toBe(directionValue);
        expect(root.getComputedPadding(Edge.End)).toBe(directionValue);
        expect(root.getComputedPadding(Edge.Left)).toBe(directionValue);
        expect(root.getComputedPadding(Edge.Right)).toBe(directionValue);
      }

      root.freeRecursive();
    }
  }
});
