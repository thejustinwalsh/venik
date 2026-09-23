import { expect, test } from "vitest";
import { Config, Direction, Node } from "../src/index.ts";
import { GENERATION, I } from "../src/node/Store.ts";

function generation(node: Node): number {
  return I[node.ri + GENERATION]!;
}

test("an identical clean root layout returns before starting a generation", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(50);
  root.calculateLayout(100, 50, Direction.LTR);
  const firstGeneration = generation(root);

  root.calculateLayout(100, 50, Direction.LTR);

  expect(generation(root)).toBe(firstGeneration);
});

test("changed root constraints and direction bypass the clean fingerprint", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(50);
  root.calculateLayout(100, 50, Direction.LTR);

  let previousGeneration = generation(root);
  root.calculateLayout(101, 50, Direction.LTR);
  expect(generation(root)).not.toBe(previousGeneration);

  previousGeneration = generation(root);
  root.calculateLayout(101, 51, Direction.LTR);
  expect(generation(root)).not.toBe(previousGeneration);

  previousGeneration = generation(root);
  root.calculateLayout(101, 51, Direction.RTL);
  expect(generation(root)).not.toBe(previousGeneration);
});

test("a changed config version bypasses the clean fingerprint", () => {
  const config = new Config();
  const root = new Node(config);
  root.setWidth(10.25);
  root.setHeight(10.25);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  const previousGeneration = generation(root);

  config.setPointScaleFactor(2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(generation(root)).not.toBe(previousGeneration);
  expect(root.getComputedWidth()).toBe(10.5);
});

test("a dirtied descendant propagates past the clean fingerprint", () => {
  const root = new Node();
  const child = new Node();
  root.insertChild(child, 0);
  root.calculateLayout(100, 100, Direction.LTR);
  const previousGeneration = generation(root);

  child.setWidth(25);
  root.calculateLayout(100, 100, Direction.LTR);

  expect(generation(root)).not.toBe(previousGeneration);
  expect(child.getComputedWidth()).toBe(25);
});

test("undefined, auto and NaN share the unconstrained fingerprint", () => {
  const root = new Node();
  root.setWidth(30);
  root.setHeight(20);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  const firstGeneration = generation(root);

  root.calculateLayout(Number.NaN, Number.NaN, Direction.LTR);
  expect(generation(root)).toBe(firstGeneration);

  root.calculateLayout("auto", "auto", Direction.LTR);
  expect(generation(root)).toBe(firstGeneration);

  root.calculateLayout(30, undefined, Direction.LTR);
  expect(generation(root)).not.toBe(firstGeneration);
});

test("a cleared hasNewLayout flag retains the existing cache-hit behavior", () => {
  const root = new Node();
  root.calculateLayout(100, 100, Direction.LTR);
  const previousGeneration = generation(root);
  root.hasNewLayout = false;

  root.calculateLayout(100, 100, Direction.LTR);

  expect(generation(root)).not.toBe(previousGeneration);
  expect(root.hasNewLayout).toBe(true);
});

test("a clean layout called inside a measure callback uses the regular path", () => {
  const nestedRoot = new Node();
  nestedRoot.setWidth(20);
  nestedRoot.setHeight(20);
  nestedRoot.calculateLayout(undefined, undefined, Direction.LTR);
  const previousGeneration = generation(nestedRoot);

  const outerRoot = new Node();
  outerRoot.setMeasureFunc(() => {
    nestedRoot.calculateLayout(undefined, undefined, Direction.LTR);
    return { width: 10, height: 10 };
  });
  outerRoot.calculateLayout(undefined, undefined, Direction.LTR);

  expect(generation(nestedRoot)).not.toBe(previousGeneration);
});
