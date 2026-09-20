// Originally ported from Yoga's tests/generated/YGIntrinsicSizeTest.cpp
// (upstream fixture: gentest/fixtures/YGIntrinsicSizeTest.html).

import { expect, test } from "vitest";
import { Align, Config, Direction, FlexDirection, Node, PositionType, Wrap } from "../../src/index.ts";
import { intrinsicSizeMeasure } from "../util/testUtil.ts";

test("contains_inner_text_long_word", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);
  root_child0.setContext("LoremipsumdolorsitametconsecteturadipiscingelitSedeleifasdfettortoracauctorFuscerhoncusipsumtemporerosaliquamconsequatPraesentsoda");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(1300);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(700);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(1300);
  expect(root_child0.getComputedHeight()).toBe(10);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_no_width_no_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(70);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(70);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_no_width_no_height_long_word_in_paragraph", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus loremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumloremipsumlorem Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(70);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(70);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_fixed_width", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setWidth(100);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(1290);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1900);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(1290);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_no_width_fixed_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_fixed_width_fixed_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setWidth(50);
  root_child0.setHeight(20);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1950);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_max_width_max_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setMaxWidth(50);
  root_child0.setMaxHeight(20);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1950);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_max_width_max_height_column", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setMaxWidth(50);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(1890);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(1890);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(1890);

  expect(root_child0.getComputedLeft()).toBe(1950);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(1890);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_max_width", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setMaxWidth(100);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(1290);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1900);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(1290);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_fixed_width_shorter_text", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setWidth(100);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1900);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(100);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_fixed_height_shorter_text", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setHeight(100);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(110);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(1890);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(110);
  expect(root_child0.getComputedHeight()).toBe(100);

  root.freeRecursive();

  config.free();
});

test("contains_inner_text_max_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(2000);
  root.setHeight(2000);
  root.setAlignItems(Align.FlexStart);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setMaxHeight(20);
  root.insertChild(root_child0, 0);
  root_child0.setContext("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eleifasd et tortor ac auctor. Integer at volutpat libero, sed elementum dui interdum id. Aliquam consectetur massa vel neque aliquet, quis consequat risus fringilla. Fusce rhoncus ipsum tempor eros aliquam, vel tempus metus ullamcorper. Nam at nulla sed tellus vestibulum fringilla vel sit amet ligula. Proin velit lectus, euismod sit amet quam vel ultricies dolor, vitae finibus lorem ipsum. Pellentesque molestie at mi sit amet dictum. Donec vehicula lacinia felis sit amet consectetur. Praesent sodales enim sapien, sed varius ipsum pellentesque vel. Aenean eu mi eu justo tincidunt finibus vel sit amet ipsum. Sed bibasdum purus vel ipsum sagittis, quis fermentum dolor lobortis. Etiam vulputate eleifasd lectus vel varius. Phasellus imperdiet lectus sit amet ipsum egestas, ut bibasdum ipsum malesuada. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed mollis eros sit amet elit porttitor, vel venenatis turpis venenatis. Nulla tempus tortor at eros efficitur, sit amet dapibus ipsum malesuada. Ut at mauris sed nunc malesuada convallis. Duis id sem vel magna varius eleifasd vel at est. Donec eget orci a ipsum tempor lobortis. Sed at consectetur ipsum.");
  root_child0.setMeasureFunc(intrinsicSizeMeasure);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(2000);
  expect(root.getComputedHeight()).toBe(2000);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(2000);
  expect(root_child0.getComputedHeight()).toBe(20);

  root.freeRecursive();

  config.free();
});

test("max_content_width", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidthMaxContent();
  root.setFlexWrap(Wrap.Wrap);

  const root_child0 = new Node(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setWidth(100);
  root_child1.setHeight(50);
  root.insertChild(root_child1, 1);

  const root_child2 = new Node(config);
  root_child2.setWidth(25);
  root_child2.setHeight(50);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(175);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(50);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(150);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(25);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(175);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(125);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(25);
  expect(root_child1.getComputedTop()).toBe(0);
  expect(root_child1.getComputedWidth()).toBe(100);
  expect(root_child1.getComputedHeight()).toBe(50);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(0);
  expect(root_child2.getComputedWidth()).toBe(25);
  expect(root_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("stretch_width", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setWidth(500);

  const root_child0 = new Node(config);
  root_child0.setFlexDirection(FlexDirection.Row);
  root_child0.setWidthStretch();
  root_child0.setFlexWrap(Wrap.Wrap);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setWidth(50);
  root_child0_child0.setHeight(50);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = new Node(config);
  root_child0_child1.setWidth(100);
  root_child0_child1.setHeight(50);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = new Node(config);
  root_child0_child2.setWidth(25);
  root_child0_child2.setHeight(50);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(50);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(100);
  expect(root_child0_child1.getComputedHeight()).toBe(50);

  expect(root_child0_child2.getComputedLeft()).toBe(150);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(25);
  expect(root_child0_child2.getComputedHeight()).toBe(50);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(500);
  expect(root.getComputedHeight()).toBe(50);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(500);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child0.getComputedLeft()).toBe(450);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(350);
  expect(root_child0_child1.getComputedTop()).toBe(0);
  expect(root_child0_child1.getComputedWidth()).toBe(100);
  expect(root_child0_child1.getComputedHeight()).toBe(50);

  expect(root_child0_child2.getComputedLeft()).toBe(325);
  expect(root_child0_child2.getComputedTop()).toBe(0);
  expect(root_child0_child2.getComputedWidth()).toBe(25);
  expect(root_child0_child2.getComputedHeight()).toBe(50);

  root.freeRecursive();

  config.free();
});

test("max_content_height", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeightMaxContent();
  root.setFlexWrap(Wrap.Wrap);

  const root_child0 = new Node(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setWidth(50);
  root_child1.setHeight(100);
  root.insertChild(root_child1, 1);

  const root_child2 = new Node(config);
  root_child2.setWidth(50);
  root_child2.setHeight(25);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(175);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(25);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(175);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(25);

  root.freeRecursive();

  config.free();
});

test("max_content_flex_basis_column", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setFlexBasisMaxContent();
  root.setFlexWrap(Wrap.Wrap);

  const root_child0 = new Node(config);
  root_child0.setWidth(50);
  root_child0.setHeight(50);
  root.insertChild(root_child0, 0);

  const root_child1 = new Node(config);
  root_child1.setWidth(50);
  root_child1.setHeight(100);
  root.insertChild(root_child1, 1);

  const root_child2 = new Node(config);
  root_child2.setWidth(50);
  root_child2.setHeight(25);
  root.insertChild(root_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(175);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(25);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(175);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(50);

  expect(root_child1.getComputedLeft()).toBe(0);
  expect(root_child1.getComputedTop()).toBe(50);
  expect(root_child1.getComputedWidth()).toBe(50);
  expect(root_child1.getComputedHeight()).toBe(100);

  expect(root_child2.getComputedLeft()).toBe(0);
  expect(root_child2.getComputedTop()).toBe(150);
  expect(root_child2.getComputedWidth()).toBe(50);
  expect(root_child2.getComputedHeight()).toBe(25);

  root.freeRecursive();

  config.free();
});

test("stretch_flex_basis_column", () => {
  const config = new Config();

  const root = new Node(config);
  root.setPositionType(PositionType.Absolute);
  root.setHeight(500);

  const root_child0 = new Node(config);
  root_child0.setFlexBasisStretch();
  root_child0.setFlexWrap(Wrap.Wrap);
  root.insertChild(root_child0, 0);

  const root_child0_child0 = new Node(config);
  root_child0_child0.setWidth(50);
  root_child0_child0.setHeight(50);
  root_child0.insertChild(root_child0_child0, 0);

  const root_child0_child1 = new Node(config);
  root_child0_child1.setWidth(50);
  root_child0_child1.setHeight(100);
  root_child0.insertChild(root_child0_child1, 1);

  const root_child0_child2 = new Node(config);
  root_child0_child2.setWidth(50);
  root_child0_child2.setHeight(25);
  root_child0.insertChild(root_child0_child2, 2);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(175);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(50);
  expect(root_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(150);
  expect(root_child0_child2.getComputedWidth()).toBe(50);
  expect(root_child0_child2.getComputedHeight()).toBe(25);

  root.calculateLayout(undefined, undefined, Direction.RTL);

  expect(root.getComputedLeft()).toBe(0);
  expect(root.getComputedTop()).toBe(0);
  expect(root.getComputedWidth()).toBe(50);
  expect(root.getComputedHeight()).toBe(500);

  expect(root_child0.getComputedLeft()).toBe(0);
  expect(root_child0.getComputedTop()).toBe(0);
  expect(root_child0.getComputedWidth()).toBe(50);
  expect(root_child0.getComputedHeight()).toBe(175);

  expect(root_child0_child0.getComputedLeft()).toBe(0);
  expect(root_child0_child0.getComputedTop()).toBe(0);
  expect(root_child0_child0.getComputedWidth()).toBe(50);
  expect(root_child0_child0.getComputedHeight()).toBe(50);

  expect(root_child0_child1.getComputedLeft()).toBe(0);
  expect(root_child0_child1.getComputedTop()).toBe(50);
  expect(root_child0_child1.getComputedWidth()).toBe(50);
  expect(root_child0_child1.getComputedHeight()).toBe(100);

  expect(root_child0_child2.getComputedLeft()).toBe(0);
  expect(root_child0_child2.getComputedTop()).toBe(150);
  expect(root_child0_child2.getComputedWidth()).toBe(50);
  expect(root_child0_child2.getComputedHeight()).toBe(25);

  root.freeRecursive();

  config.free();
});
