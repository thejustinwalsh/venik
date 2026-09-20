// Port of yoga-cpp/tests/YGDefaultValuesTest.cpp

import { expect, test } from "vitest";
import {
  Align,
  BoxSizing,
  Config,
  Direction,
  Edge,
  Errata,
  FlexDirection,
  Justify,
  Node,
  Overflow,
  PositionType,
  Unit,
  Wrap,
} from "../src/index.ts";

test("assert_default_values", () => {
  const root = new Node();

  expect(root.getChildCount()).toBe(0);
  expect(root.getChild(1)).toBe(null);

  expect(root.getDirection()).toBe(Direction.Inherit);
  expect(root.getFlexDirection()).toBe(FlexDirection.Column);
  expect(root.getJustifyContent()).toBe(Justify.FlexStart);
  expect(root.getAlignContent()).toBe(Align.FlexStart);
  expect(root.getAlignItems()).toBe(Align.Stretch);
  expect(root.getAlignSelf()).toBe(Align.Auto);
  expect(root.getPositionType()).toBe(PositionType.Relative);
  expect(root.getFlexWrap()).toBe(Wrap.NoWrap);
  expect(root.getOverflow()).toBe(Overflow.Visible);
  expect(root.getFlexGrow()).toBe(0);
  expect(root.getFlexShrink()).toBe(0);
  expect(root.getFlexBasis().unit).toBe(Unit.Auto);

  expect(root.getPosition(Edge.Left).unit).toBe(Unit.Undefined);
  expect(root.getPosition(Edge.Top).unit).toBe(Unit.Undefined);
  expect(root.getPosition(Edge.Right).unit).toBe(Unit.Undefined);
  expect(root.getPosition(Edge.Bottom).unit).toBe(Unit.Undefined);
  expect(root.getPosition(Edge.Start).unit).toBe(Unit.Undefined);
  expect(root.getPosition(Edge.End).unit).toBe(Unit.Undefined);

  expect(root.getMargin(Edge.Left).unit).toBe(Unit.Undefined);
  expect(root.getMargin(Edge.Top).unit).toBe(Unit.Undefined);
  expect(root.getMargin(Edge.Right).unit).toBe(Unit.Undefined);
  expect(root.getMargin(Edge.Bottom).unit).toBe(Unit.Undefined);
  expect(root.getMargin(Edge.Start).unit).toBe(Unit.Undefined);
  expect(root.getMargin(Edge.End).unit).toBe(Unit.Undefined);

  expect(root.getPadding(Edge.Left).unit).toBe(Unit.Undefined);
  expect(root.getPadding(Edge.Top).unit).toBe(Unit.Undefined);
  expect(root.getPadding(Edge.Right).unit).toBe(Unit.Undefined);
  expect(root.getPadding(Edge.Bottom).unit).toBe(Unit.Undefined);
  expect(root.getPadding(Edge.Start).unit).toBe(Unit.Undefined);
  expect(root.getPadding(Edge.End).unit).toBe(Unit.Undefined);

  expect(root.getBorder(Edge.Left)).toBeNaN();
  expect(root.getBorder(Edge.Top)).toBeNaN();
  expect(root.getBorder(Edge.Right)).toBeNaN();
  expect(root.getBorder(Edge.Bottom)).toBeNaN();
  expect(root.getBorder(Edge.Start)).toBeNaN();
  expect(root.getBorder(Edge.End)).toBeNaN();

  expect(root.getWidth().unit).toBe(Unit.Auto);
  expect(root.getHeight().unit).toBe(Unit.Auto);
  expect(root.getMinWidth().unit).toBe(Unit.Undefined);
  expect(root.getMinHeight().unit).toBe(Unit.Undefined);
  expect(root.getMaxWidth().unit).toBe(Unit.Undefined);
  expect(root.getMaxHeight().unit).toBe(Unit.Undefined);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedRight()).toBe(0);
  expect(root.getComputedBottom()).toBe(0);

  expect(root.getComputedMargin(Edge.Left)).toBe(0);
  expect(root.getComputedMargin(Edge.Top)).toBe(0);
  expect(root.getComputedMargin(Edge.Right)).toBe(0);
  expect(root.getComputedMargin(Edge.Bottom)).toBe(0);

  expect(root.getComputedPadding(Edge.Left)).toBe(0);
  expect(root.getComputedPadding(Edge.Top)).toBe(0);
  expect(root.getComputedPadding(Edge.Right)).toBe(0);
  expect(root.getComputedPadding(Edge.Bottom)).toBe(0);

  expect(root.getComputedBorder(Edge.Left)).toBe(0);
  expect(root.getComputedBorder(Edge.Top)).toBe(0);
  expect(root.getComputedBorder(Edge.Right)).toBe(0);
  expect(root.getComputedBorder(Edge.Bottom)).toBe(0);

  expect(root.getComputedWidth()).toBeNaN();
  expect(root.getComputedHeight()).toBeNaN();
  expect(root.getComputedDirection()).toBe(Direction.Inherit);

  root.freeRecursive();
});

test("assert_webdefault_values", () => {
  const config = new Config();
  config.setUseWebDefaults(true);
  const root = new Node(config);

  expect(root.getFlexDirection()).toBe(FlexDirection.Row);
  expect(root.getAlignContent()).toBe(Align.Stretch);
  expect(root.getFlexShrink()).toBe(1);

  root.freeRecursive();
  config.free();
});

test("assert_webdefault_values_reset", () => {
  const config = new Config();
  config.setUseWebDefaults(true);
  const root = new Node(config);
  root.reset();

  expect(root.getFlexDirection()).toBe(FlexDirection.Row);
  expect(root.getAlignContent()).toBe(Align.Stretch);
  expect(root.getFlexShrink()).toBe(1);

  root.freeRecursive();
  config.free();
});

test("assert_legacy_stretch_behaviour", () => {
  const config = new Config();
  config.setErrata(Errata.StretchFlexBasis);
  const root = new Node(config);
  root.setWidth(500);
  root.setHeight(500);

  const root_child0 = new Node(config);
  root_child0.setAlignItems(Align.FlexStart);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setFlexGrow(1);
  root_child0_child0.setFlexShrink(1);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = new Node(config);
  root_child0_child0_child0.setFlexGrow(1);
  root_child0_child0_child0.setFlexShrink(1);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0.getComputedHeight()).toBe(500);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(500);

  root.freeRecursive();

  config.free();
});

test("assert_box_sizing_border_box", () => {
  const config = new Config();
  const root = new Node(config);

  expect(root.getBoxSizing()).toBe(BoxSizing.BorderBox);

  root.freeRecursive();

  config.free();
});
