import { expect, test } from "vitest";
import { Align, Direction, FlexDirection, Node } from "../src/index.ts";

function _baseline(_width: number, _height: number, node: Node): number {
  const baseline = node.context as { value: number };
  return baseline.value;
}

test("align_baseline_customer_func", () => {
  const root = new Node();
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  root.setWidth(100);
  root.setHeight(100);

  const root_child0 = new Node();
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node();
  root_child1.setWidth(50);
  root_child1.setHeight(20);
  root.insertChild(root_child1, 1);

  // C++ passes a pointer to a float through the context; a boxed value is the equivalent.
  const baselineValue = { value: 10 };
  const root_child1_child0 = new Node();
  root_child1_child0.context = baselineValue;
  root_child1_child0.setWidth(50);
  root_child1_child0.setBaselineFunc(_baseline);
  root_child1_child0.setHeight(20);
  root_child1.insertChild(root_child1_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(100);
  expect(root.getComputedHeight()).toBe(100);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(40);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(20);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(50);
  expect(root_child1_child0.getComputedHeight()).toBe(20);
});
