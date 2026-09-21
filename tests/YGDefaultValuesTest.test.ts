import { expect, test } from "vitest";
import {
  Align,
  BoxSizing,
  Config,
  Direction,
  Edge,
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
  expect(root.getFlexDirection()).toBe(FlexDirection.Row);
  expect(root.getJustifyContent()).toBe(Justify.FlexStart);
  expect(root.getAlignContent()).toBe(Align.Stretch);
  expect(root.getAlignItems()).toBe(Align.Stretch);
  expect(root.getAlignSelf()).toBe(Align.Auto);
  expect(root.getPositionType()).toBe(PositionType.Static);
  expect(root.getFlexWrap()).toBe(Wrap.NoWrap);
  expect(root.getOverflow()).toBe(Overflow.Visible);
  expect(root.getFlexGrow()).toBe(0);
  expect(root.getFlexShrink()).toBe(1);
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
});

test("assert_box_sizing_border_box", () => {
  const config = new Config();
  const root = new Node(config);

  expect(root.getBoxSizing()).toBe(BoxSizing.BorderBox);
});

test("default_position_is_static", () => {
  const root = new Node();
  root.setPositionType(PositionType.Relative);
  root.setWidth(100);
  root.setHeight(100);

  // Insets do not apply to a statically positioned node.
  const child = new Node();
  child.setWidth(50);
  child.setHeight(50);
  child.setPosition(Edge.Left, 10);
  child.setPosition(Edge.Top, 10);
  root.insertChild(child, 0);

  // A static node is not a containing block: the absolute grandchild resolves
  // its insets against `root`.
  const grandchild = new Node();
  grandchild.setPositionType(PositionType.Absolute);
  grandchild.setPosition(Edge.Right, 0);
  grandchild.setPosition(Edge.Bottom, 0);
  grandchild.setWidth(10);
  grandchild.setHeight(10);
  child.insertChild(grandchild, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child.getComputedLeft()).toBe(0);
  expect(child.getComputedTop()).toBe(0);
  expect(grandchild.getComputedLeft()).toBe(90);
  expect(grandchild.getComputedTop()).toBe(90);
});
