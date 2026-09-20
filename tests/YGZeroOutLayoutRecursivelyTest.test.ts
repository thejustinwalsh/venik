// Port of yoga-cpp/tests/YGZeroOutLayoutRecursivelyTest.cpp

import { expect, test } from "vitest";
import { Direction, Display, Edge, FlexDirection, Node } from "../src/index.ts";

test("zero_out_layout", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(200);
  root.setHeight(200);

  const child = new Node();
  root.insertChild(child, 0);
  child.setWidth(100);
  child.setHeight(100);
  child.setMargin(Edge.Top, 10);
  child.setPadding(Edge.Top, 10);

  root.calculateLayout(100, 100, Direction.LTR);

  expect(child.getComputedMargin(Edge.Top)).toBe(10);
  expect(child.getComputedPadding(Edge.Top)).toBe(10);

  child.setDisplay(Display.None);

  root.calculateLayout(100, 100, Direction.LTR);

  expect(child.getComputedMargin(Edge.Top)).toBe(0);
  expect(child.getComputedPadding(Edge.Top)).toBe(0);

  root.freeRecursive();
});
