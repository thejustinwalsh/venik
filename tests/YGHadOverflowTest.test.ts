import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { newFixtureNode } from "./util/testUtil.ts";
import { Config, Direction, Edge, FlexDirection, Node, Wrap } from "../src/index.ts";

describe("YogaTest_HadOverflowTests", () => {
  let root: Node;
  let config: Config;

  beforeEach(() => {
    config = new Config();
    root = newFixtureNode(config);
    root.setWidth(200);
    root.setHeight(100);
    root.setFlexDirection(FlexDirection.Column);
    root.setFlexWrap(Wrap.NoWrap);
  });

  afterEach(() => {
    root.freeRecursive();
    config.free();
  });

  test("children_overflow_no_wrap_and_no_flex_children", () => {
    const child0 = newFixtureNode(config);
    child0.setWidth(80);
    child0.setHeight(40);
    child0.setMargin(Edge.Top, 10);
    child0.setMargin(Edge.Bottom, 15);
    root.insertChild(child0, 0);
    const child1 = newFixtureNode(config);
    child1.setWidth(80);
    child1.setHeight(40);
    child1.setMargin(Edge.Bottom, 5);
    root.insertChild(child1, 1);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(true);
  });

  test("spacing_overflow_no_wrap_and_no_flex_children", () => {
    const child0 = newFixtureNode(config);
    child0.setWidth(80);
    child0.setHeight(40);
    child0.setMargin(Edge.Top, 10);
    child0.setMargin(Edge.Bottom, 10);
    root.insertChild(child0, 0);
    const child1 = newFixtureNode(config);
    child1.setWidth(80);
    child1.setHeight(40);
    child1.setMargin(Edge.Bottom, 5);
    root.insertChild(child1, 1);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(true);
  });

  test("no_overflow_no_wrap_and_flex_children", () => {
    const child0 = newFixtureNode(config);
    child0.setWidth(80);
    child0.setHeight(40);
    child0.setMargin(Edge.Top, 10);
    child0.setMargin(Edge.Bottom, 10);
    root.insertChild(child0, 0);
    const child1 = newFixtureNode(config);
    child1.setWidth(80);
    child1.setHeight(40);
    child1.setMargin(Edge.Bottom, 5);
    child1.setFlexShrink(1);
    root.insertChild(child1, 1);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(false);
  });

  test("hadOverflow_gets_reset_if_not_logger_valid", () => {
    const child0 = newFixtureNode(config);
    child0.setWidth(80);
    child0.setHeight(40);
    child0.setMargin(Edge.Top, 10);
    child0.setMargin(Edge.Bottom, 10);
    root.insertChild(child0, 0);
    const child1 = newFixtureNode(config);
    child1.setWidth(80);
    child1.setHeight(40);
    child1.setMargin(Edge.Bottom, 5);
    root.insertChild(child1, 1);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(true);

    child1.setFlexShrink(1);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(false);
  });

  test("spacing_overflow_in_nested_nodes", () => {
    const child0 = newFixtureNode(config);
    child0.setWidth(80);
    child0.setHeight(40);
    child0.setMargin(Edge.Top, 10);
    child0.setMargin(Edge.Bottom, 10);
    root.insertChild(child0, 0);
    const child1 = newFixtureNode(config);
    child1.setWidth(80);
    child1.setHeight(40);
    root.insertChild(child1, 1);
    const child1_1 = newFixtureNode(config);
    child1_1.setWidth(80);
    child1_1.setHeight(40);
    child1_1.setMargin(Edge.Bottom, 5);
    child1.insertChild(child1_1, 0);

    root.calculateLayout(200, 100, Direction.LTR);

    expect(root.getComputedHadOverflow()).toBe(true);
  });
});
