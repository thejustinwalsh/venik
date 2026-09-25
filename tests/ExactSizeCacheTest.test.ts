import { expect, test } from "vitest";
import { Config, Direction, Node } from "../src/index.ts";

// The layout cache takes available sizes within 0.0001 of each other for the
// same question. Along an axis the owner asks for exactly, though, a node's
// size is the size asked for, and it must follow a change smaller than that.

test("an exact size follows a change within the cache tolerance", () => {
  const config = new Config();
  config.setPointScaleFactor(0);
  const root = new Node(config);
  root.setWidth(100);
  root.setHeight(10);
  const grow = new Node(config);
  grow.setFlexGrow(1);
  root.insertChild(grow, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(grow.getComputedWidth()).toBe(100);

  root.setWidth(100.00005);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(grow.getComputedWidth()).toBe(100.00005);
});

test("siblings are placed by the size the owner gave", () => {
  const config = new Config();
  config.setPointScaleFactor(0);
  const root = new Node(config);
  root.setWidth(100);
  root.setHeight(10);
  const grow = new Node(config);
  grow.setFlexGrow(1);
  root.insertChild(grow, 0);
  const fixed = new Node(config);
  fixed.setWidth(20);
  root.insertChild(fixed, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  root.setWidth(100.00005);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(fixed.getComputedLeft()).toBe(grow.getComputedWidth());
  expect(fixed.getComputedLeft() + fixed.getComputedWidth()).toBe(100.00005);
});
