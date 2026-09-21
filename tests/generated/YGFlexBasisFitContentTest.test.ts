import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Config, Direction, FlexDirection, Overflow, PositionType } from "../../src/index.ts";

test("container_child_overflows_definite_parent_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(300);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setHeight(500);
  root_child0_child0.setWidth(50);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(500);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(150);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(500);


});

test("container_child_overflows_definite_parent_row", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(300);
  root.setHeight(200);
  root.setFlexDirection(FlexDirection.Row);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setWidth(500);
  root_child0_child0.setHeight(50);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(300);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(500);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(300);
  expect(root.getComputedHeight()).toBe(200);

  expect(root_child0.getComputedLeft()).toBe(-200);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(200);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(500);
  expect(root_child0_child0.getComputedHeight()).toBe(50);


});

test("container_child_within_bounds_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(300);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setHeight(100);
  root_child0_child0.setWidth(50);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child0_child0.getComputedLeft()).toBe(150);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(100);


});

test("multiple_container_children_overflow_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(300);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setHeight(400);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child1 = newFixtureNode(config);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = newFixtureNode(config);
  root_child1_child0.setHeight(500);
  root_child1.insertChild(root_child1_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(400);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(400);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(400);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(200);
  expect(root_child1_child0.getComputedHeight()).toBe(500);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(400);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(400);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(400);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(200);
  expect(root_child1_child0.getComputedHeight()).toBe(500);


});

test("scroll_container_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(300);
  root.setOverflow(Overflow.Scroll);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setHeight(500);
  root_child0.insertChild(root_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(500);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(200);
  expect(root_child0_child0.getComputedHeight()).toBe(500);


});

test("explicit_and_container_children_column", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(200);
  root.setHeight(300);

  const root_child0 = newFixtureNode(config);
  root_child0.setHeight(100);
  root.insertChild(root_child0, 0);

  const root_child1 = newFixtureNode(config);
  root.insertChild(root_child1, 1);

  const root_child1_child0 = newFixtureNode(config);
  root_child1_child0.setHeight(500);
  root_child1.insertChild(root_child1_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(200);
  expect(root_child1_child0.getComputedHeight()).toBe(500);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(200);
  expect(root.getComputedHeight()).toBe(300);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(200);
  expect(root_child0.getComputedHeight()).toBe(100);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(100);
  expect(root_child1.getComputedWidth()).toBe(200);
  expect(root_child1.getComputedHeight()).toBe(500);

  expect(root_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child1_child0.getComputedTop()).toBe(0);
  expect(root_child1_child0.getComputedWidth()).toBe(200);
  expect(root_child1_child0.getComputedHeight()).toBe(500);


});
