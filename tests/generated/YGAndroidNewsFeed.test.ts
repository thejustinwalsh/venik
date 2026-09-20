// Originally ported from Yoga's tests/generated/YGAndroidNewsFeed.cpp
// (upstream fixture: gentest/fixtures/YGAndroidNewsFeed.html).

import { expect, test } from "vitest";
import { newFixtureNode } from "../util/testUtil.ts";
import { Align, Config, Direction, Edge, FlexDirection, PositionType } from "../../src/index.ts";

test("android_news_feed", () => {
  const config = new Config();

  const root = newFixtureNode(config);
  root.setPositionType(PositionType.Absolute);
  root.setAlignContent(Align.Stretch);
  root.setWidth(1080);

  const root_child0 = newFixtureNode(config);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = newFixtureNode(config);
  root_child0_child0.setAlignContent(Align.Stretch);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0.insertChild(root_child0_child0_child0, 0);

  const root_child0_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child0_child0.setAlignItems(Align.FlexStart);
  root_child0_child0_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0.setMargin(Edge.Top, 24);
  root_child0_child0_child0_child0.setMargin(Edge.Start, 36);
  root_child0_child0_child0.insertChild(root_child0_child0_child0_child0, 0);

  const root_child0_child0_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0_child0_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child0_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0.insertChild(root_child0_child0_child0_child0_child0, 0);

  const root_child0_child0_child0_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child0_child0_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0_child0_child0.setWidth(120);
  root_child0_child0_child0_child0_child0_child0.setHeight(120);
  root_child0_child0_child0_child0_child0.insertChild(root_child0_child0_child0_child0_child0_child0, 0);

  const root_child0_child0_child0_child0_child1 = newFixtureNode(config);
  root_child0_child0_child0_child0_child1.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0_child1.setFlexShrink(1);
  root_child0_child0_child0_child0_child1.setMargin(Edge.Right, 36);
  root_child0_child0_child0_child0_child1.setPadding(Edge.Left, 36);
  root_child0_child0_child0_child0_child1.setPadding(Edge.Top, 21);
  root_child0_child0_child0_child0_child1.setPadding(Edge.Right, 36);
  root_child0_child0_child0_child0_child1.setPadding(Edge.Bottom, 18);
  root_child0_child0_child0_child0.insertChild(root_child0_child0_child0_child0_child1, 1);

  const root_child0_child0_child0_child0_child1_child0 = newFixtureNode(config);
  root_child0_child0_child0_child0_child1_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child0_child0_child1_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0_child1_child0.setFlexShrink(1);
  root_child0_child0_child0_child0_child1.insertChild(root_child0_child0_child0_child0_child1_child0, 0);

  const root_child0_child0_child0_child0_child1_child1 = newFixtureNode(config);
  root_child0_child0_child0_child0_child1_child1.setAlignContent(Align.Stretch);
  root_child0_child0_child0_child0_child1_child1.setFlexShrink(1);
  root_child0_child0_child0_child0_child1.insertChild(root_child0_child0_child0_child0_child1_child1, 1);

  const root_child0_child0_child1 = newFixtureNode(config);
  root_child0_child0_child1.setAlignContent(Align.Stretch);
  root_child0_child0.insertChild(root_child0_child0_child1, 1);

  const root_child0_child0_child1_child0 = newFixtureNode(config);
  root_child0_child0_child1_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child1_child0.setAlignItems(Align.FlexStart);
  root_child0_child0_child1_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0.setMargin(Edge.Top, 24);
  root_child0_child0_child1_child0.setMargin(Edge.Start, 174);
  root_child0_child0_child1.insertChild(root_child0_child0_child1_child0, 0);

  const root_child0_child0_child1_child0_child0 = newFixtureNode(config);
  root_child0_child0_child1_child0_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child1_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0.insertChild(root_child0_child0_child1_child0_child0, 0);

  const root_child0_child0_child1_child0_child0_child0 = newFixtureNode(config);
  root_child0_child0_child1_child0_child0_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0_child0_child0.setWidth(72);
  root_child0_child0_child1_child0_child0_child0.setHeight(72);
  root_child0_child0_child1_child0_child0.insertChild(root_child0_child0_child1_child0_child0_child0, 0);

  const root_child0_child0_child1_child0_child1 = newFixtureNode(config);
  root_child0_child0_child1_child0_child1.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0_child1.setFlexShrink(1);
  root_child0_child0_child1_child0_child1.setMargin(Edge.Right, 36);
  root_child0_child0_child1_child0_child1.setPadding(Edge.Left, 36);
  root_child0_child0_child1_child0_child1.setPadding(Edge.Top, 21);
  root_child0_child0_child1_child0_child1.setPadding(Edge.Right, 36);
  root_child0_child0_child1_child0_child1.setPadding(Edge.Bottom, 18);
  root_child0_child0_child1_child0.insertChild(root_child0_child0_child1_child0_child1, 1);

  const root_child0_child0_child1_child0_child1_child0 = newFixtureNode(config);
  root_child0_child0_child1_child0_child1_child0.setFlexDirection(FlexDirection.Row);
  root_child0_child0_child1_child0_child1_child0.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0_child1_child0.setFlexShrink(1);
  root_child0_child0_child1_child0_child1.insertChild(root_child0_child0_child1_child0_child1_child0, 0);

  const root_child0_child0_child1_child0_child1_child1 = newFixtureNode(config);
  root_child0_child0_child1_child0_child1_child1.setAlignContent(Align.Stretch);
  root_child0_child0_child1_child0_child1_child1.setFlexShrink(1);
  root_child0_child0_child1_child0_child1.insertChild(root_child0_child0_child1_child0_child1_child1, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(1080);
  expect(root.getComputedHeight()).toBe(240);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(1080);
  expect(root_child0.getComputedHeight()).toBe(240);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(1080);
  expect(root_child0_child0.getComputedHeight()).toBe(240);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(1080);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(144);

  expect(root_child0_child0_child0_child0.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child0_child0.getComputedTop()).toBe(24);
  expect(root_child0_child0_child0_child0.getComputedWidth()).toBe(1044);
  expect(root_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child0.getComputedWidth()).toBe(120);
  expect(root_child0_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedWidth()).toBe(120);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child1.getComputedLeft()).toBe(120);
  expect(root_child0_child0_child0_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child1.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child0_child0_child1.getComputedHeight()).toBe(39);

  expect(root_child0_child0_child0_child0_child1_child0.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child0_child0_child1_child1.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedTop()).toBe(21);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1.getComputedTop()).toBe(144);
  expect(root_child0_child0_child1.getComputedWidth()).toBe(1080);
  expect(root_child0_child0_child1.getComputedHeight()).toBe(96);

  expect(root_child0_child0_child1_child0.getComputedLeft()).toBe(174);
  expect(root_child0_child0_child1_child0.getComputedTop()).toBe(24);
  expect(root_child0_child0_child1_child0.getComputedWidth()).toBe(906);
  expect(root_child0_child0_child1_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child0.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child1.getComputedLeft()).toBe(72);
  expect(root_child0_child0_child1_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child1.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child1.getComputedHeight()).toBe(39);

  expect(root_child0_child0_child1_child0_child1_child0.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child1_child0_child1_child1.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedTop()).toBe(21);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedHeight()).toBe(0);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(1080);
  expect(root.getComputedHeight()).toBe(240);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(1080);
  expect(root_child0.getComputedHeight()).toBe(240);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(1080);
  expect(root_child0_child0.getComputedHeight()).toBe(240);

  expect(root_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0.getComputedWidth()).toBe(1080);
  expect(root_child0_child0_child0.getComputedHeight()).toBe(144);

  expect(root_child0_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0_child0.getComputedTop()).toBe(24);
  expect(root_child0_child0_child0_child0.getComputedWidth()).toBe(1044);
  expect(root_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child0.getComputedLeft()).toBe(924);
  expect(root_child0_child0_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child0.getComputedWidth()).toBe(120);
  expect(root_child0_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedWidth()).toBe(120);
  expect(root_child0_child0_child0_child0_child0_child0.getComputedHeight()).toBe(120);

  expect(root_child0_child0_child0_child0_child1.getComputedLeft()).toBe(816);
  expect(root_child0_child0_child0_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child0_child0_child1.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child0_child0_child1.getComputedHeight()).toBe(39);

  expect(root_child0_child0_child0_child0_child1_child0.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0_child0_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child0_child0_child1_child1.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedTop()).toBe(21);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child0_child0_child1_child1.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1.getComputedTop()).toBe(144);
  expect(root_child0_child0_child1.getComputedWidth()).toBe(1080);
  expect(root_child0_child0_child1.getComputedHeight()).toBe(96);

  expect(root_child0_child0_child1_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1_child0.getComputedTop()).toBe(24);
  expect(root_child0_child0_child1_child0.getComputedWidth()).toBe(906);
  expect(root_child0_child0_child1_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child0.getComputedLeft()).toBe(834);
  expect(root_child0_child0_child1_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child0.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child0_child0.getComputedHeight()).toBe(72);

  expect(root_child0_child0_child1_child0_child1.getComputedLeft()).toBe(726);
  expect(root_child0_child0_child1_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child0_child1_child0_child1.getComputedWidth()).toBe(72);
  expect(root_child0_child0_child1_child0_child1.getComputedHeight()).toBe(39);

  expect(root_child0_child0_child1_child0_child1_child0.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedTop()).toBe(21);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child1_child0_child1_child0.getComputedHeight()).toBe(0);

  expect(root_child0_child0_child1_child0_child1_child1.getComputedLeft()).toBe(36);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedTop()).toBe(21);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedWidth()).toBe(0);
  expect(root_child0_child0_child1_child0_child1_child1.getComputedHeight()).toBe(0);

  root.freeRecursive();

  config.free();
});
