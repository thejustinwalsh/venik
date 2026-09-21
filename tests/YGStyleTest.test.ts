import { expect, test } from "vitest";
import { Direction, FlexDirection, Node, Unit } from "../src/index.ts";

test("copy_style_same", () => {
  const node0 = new Node();
  const node1 = new Node();

  node0.copyStyle(node1);
});

test("copy_style_modified", () => {
  const node0 = new Node();
  expect(node0.getFlexDirection()).toBe(FlexDirection.Row);
  expect(node0.getMaxHeight().unit !== Unit.Undefined).toBe(false);

  const node1 = new Node();
  node1.setFlexDirection(FlexDirection.Column);
  node1.setMaxHeight(10);

  node0.copyStyle(node1);
  expect(node0.getFlexDirection()).toBe(FlexDirection.Column);
  expect(node0.getMaxHeight().value).toBe(10);
});

test("copy_style_modified_same", () => {
  const node0 = new Node();
  node0.setFlexDirection(FlexDirection.Row);
  node0.setMaxHeight(10);
  node0.calculateLayout(undefined, undefined, Direction.LTR);

  const node1 = new Node();
  node1.setFlexDirection(FlexDirection.Row);
  node1.setMaxHeight(10);

  node0.copyStyle(node1);
});

test("initialise_flexShrink_flexGrow", () => {
  const node0 = new Node();
  node0.setFlexShrink(1);
  expect(node0.getFlexShrink()).toBe(1);

  node0.setFlexShrink(undefined);
  node0.setFlexGrow(3);
  expect(node0.getFlexShrink()).toBe(1); // Default value is One, if flex shrink is not defined
  expect(node0.getFlexGrow()).toBe(3);

  node0.setFlexGrow(undefined);
  node0.setFlexShrink(3);
  expect(node0.getFlexGrow()).toBe(0); // Default value is Zero, if flex grow is not defined
  expect(node0.getFlexShrink()).toBe(3);
});
