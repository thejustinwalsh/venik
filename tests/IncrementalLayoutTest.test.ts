import { afterEach, expect, test } from "vitest";
import {
  Align,
  BoxSizing,
  Config,
  Direction,
  Display,
  Edge,
  FlexDirection,
  Gutter,
  Justify,
  Node,
  PositionType,
  Wrap,
} from "../src/index.ts";

// The random tests below turn relayout boundaries off and on for the default config.
afterEach(() => Config.getDefault().setRelayoutBoundaries(true));

// A layout that reuses what earlier passes cached must equal the layout of a
// new tree with the same styles. Every test below changes styles between
// passes and compares the two, down to the rounded pixel.

function copyTree(node: Node): Node {
  const copy = new Node();
  copy.copyStyle(node);
  for (let i = 0; i < node.getChildCount(); i++) {
    copy.insertChild(copyTree(node.getChild(i)!), i);
  }
  return copy;
}

const EDGES = [Edge.Left, Edge.Top, Edge.Right, Edge.Bottom];

// The numbers of a node that layout reports. Margins, paddings and borders are
// not rounded, so they are compared with the tolerance layout itself works to.
function reportedNumbers(node: Node): number[] {
  return [
    node.getComputedLeft(),
    node.getComputedTop(),
    node.getComputedWidth(),
    node.getComputedHeight(),
    ...EDGES.map((edge) => node.getComputedMargin(edge)),
    ...EDGES.map((edge) => node.getComputedPadding(edge)),
    ...EDGES.map((edge) => node.getComputedBorder(edge)),
  ];
}

// Describes the first node that differs, or returns "". One assertion per
// comparison: the random tests compare some 20000 nodes each.
function firstDifference(actual: Node, expected: Node, path: string, hidden: boolean): string {
  hidden = hidden || actual.getDisplay() !== Display.Flex;
  if (!hidden) {
    const found = reportedNumbers(actual);
    const wanted = reportedNumbers(expected);
    for (let i = 0; i < found.length; i++) {
      if (!Number.isFinite(found[i]) || !(Math.abs(found[i]! - wanted[i]!) < 0.0001)) {
        return `node ${path}: [${found}] instead of [${wanted}]`;
      }
    }
    if (actual.getComputedHadOverflow() !== expected.getComputedHadOverflow()) {
      return `node ${path}: hadOverflow is ${actual.getComputedHadOverflow()}`;
    }
  }
  for (let i = 0; i < actual.getChildCount(); i++) {
    const difference = firstDifference(
      actual.getChild(i)!,
      expected.getChild(i)!,
      `${path}/${i}`,
      hidden,
    );
    if (difference !== "") {
      return difference;
    }
  }
  return "";
}

function expectSameAsFromScratch(root: Node, direction: Direction = Direction.LTR): void {
  root.calculateLayout(undefined, undefined, direction);
  const fresh = copyTree(root);
  fresh.calculateLayout(undefined, undefined, direction);
  expect(firstDifference(root, fresh, "root", false)).toBe("");
}

// An 800x600 root over three levels of 4, 4 and 3 children, the last of which
// have sizes. `all` lists the nodes in document order.
function buildTree(): Node[] {
  const all: Node[] = [];
  const newNode = (): Node => {
    const node = new Node();
    all.push(node);
    return node;
  };
  const root = newNode();
  root.setWidth(800);
  root.setHeight(600);
  for (let i = 0; i < 4; i++) {
    const a = newNode();
    root.insertChild(a, i);
    for (let j = 0; j < 4; j++) {
      const b = newNode();
      a.insertChild(b, j);
      for (let k = 0; k < 3; k++) {
        const c = newNode();
        b.insertChild(c, k);
        if (k > 0) {
          c.setWidth(20 + k * 7);
          c.setHeight(10 + k * 3);
        }
      }
    }
  }
  return all;
}

test("percentage_padding_follows_the_containing_block", () => {
  const all = buildTree();
  all[0]!.setWidth("100%");
  all[5]!.setPadding(Edge.Top, "5%");
  all[5]!.setPositionType(PositionType.Absolute);
  expectSameAsFromScratch(all[0]!);

  // Shrinks the root, which the padding of the absolute node is a percentage of.
  all[61]!.setPositionType(PositionType.Absolute);
  expectSameAsFromScratch(all[0]!);
});

test("percentage_min_width_resolves_against_the_parent", () => {
  const all = buildTree();
  all[41]!.setMinWidth("12.5%");
  all[40]!.setWidth(40);
  all[40]!.setFlexShrink(0);
  expectSameAsFromScratch(all[0]!);
  expect(all[41]!.getComputedWidth()).toBeLessThan(40);

  all[44]!.setWidth("100%");
  expectSameAsFromScratch(all[0]!);
  expect(all[41]!.getComputedWidth()).toBeLessThan(40);
});

test("baseline_survives_a_cached_layout", () => {
  const all = buildTree();
  all[44]!.setFlexShrink(0);
  all[35]!.setAlignItems(Align.Baseline);
  expectSameAsFromScratch(all[0]!);

  all[48]!.setBorder(Edge.Horizontal, 7.5);
  expectSameAsFromScratch(all[0]!);
});

test("absolute_child_of_a_node_measured_after_its_layout", () => {
  const all = buildTree();
  all[18]!.setFlexShrink(0);
  all[10]!.setJustifyContent(Justify.FlexEnd);
  all[10]!.setPadding(Edge.All, "5%");
  all[11]!.setPositionType(PositionType.Absolute);
  all[0]!.setMaxWidth(154);
  expectSameAsFromScratch(all[0]!);

  all[0]!.setMaxWidth(95.5);
  expectSameAsFromScratch(all[0]!);
});

test("absolute_child_follows_the_border_of_a_content_box", () => {
  const all = buildTree();
  all[0]!.setDirection(Direction.RTL);
  all[0]!.setBoxSizing(BoxSizing.ContentBox);
  all[31]!.setDirection(Direction.LTR);
  all[32]!.setPositionType(PositionType.Absolute);
  all[32]!.setPosition(Edge.Start, "5%");
  expectSameAsFromScratch(all[0]!);

  all[0]!.setBorder(Edge.Start, 12);
  expectSameAsFromScratch(all[0]!);
});

test("percentage_width_of_a_wrapping_node_follows_its_owner", () => {
  const all = buildTree();
  all[0]!.setFlexDirection(FlexDirection.ColumnReverse);
  all[0]!.setAlignItems(Align.FlexEnd);
  all[18]!.setFlexDirection(FlexDirection.ColumnReverse);
  all[23]!.setMaxWidth(158);
  all[23]!.setHeight(25);
  all[23]!.setFlexDirection(FlexDirection.Column);
  all[23]!.setFlexWrap(Wrap.WrapReverse);
  all[23]!.setWidth("100%");
  expectSameAsFromScratch(all[0]!);

  all[18]!.setMaxWidth(63.5);
  expectSameAsFromScratch(all[0]!);
});

test("unchanged_tree_keeps_its_rounded_size", () => {
  const root = new Node();
  root.setWidth(95.5);
  root.setHeight(10.25);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root.getComputedWidth()).toBe(96);

  root.calculateLayout(undefined, undefined, Direction.LTR);
  expect(root.getComputedWidth()).toBe(96);
  expect(root.getComputedHeight()).toBe(10);
});

test("untouched_nodes_round_like_new_ones_when_their_owner_moves", () => {
  const root = new Node();
  root.setWidth(200);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);
  const spacer = new Node();
  spacer.setWidth(10.4);
  root.insertChild(spacer, 0);
  const panel = new Node();
  panel.setFlexDirection(FlexDirection.Row);
  panel.setFlexShrink(0);
  root.insertChild(panel, 1);
  for (let i = 0; i < 4; i++) {
    const item = new Node();
    item.setWidth(10.4);
    item.setHeight(10.4);
    panel.insertChild(item, i);
  }
  expectSameAsFromScratch(root);

  for (const width of [10.7, 11.2, 11.5, 12.9]) {
    spacer.setWidth(width);
    expectSameAsFromScratch(root);
  }
});

test("growing_item_below_its_min_size_next_to_one_at_its_max_size", () => {
  const root = new Node();
  root.setWidth(100);
  root.setHeight(600);
  root.setFlexDirection(FlexDirection.Column);

  const growsFromBelowMin = new Node();
  growsFromBelowMin.setFlexGrow(1);
  growsFromBelowMin.setHeight(25);
  growsFromBelowMin.setMinHeight("12.5%");
  root.insertChild(growsFromBelowMin, 0);

  const fixed = new Node();
  fixed.setHeight(404);
  fixed.setFlexShrink(0);
  root.insertChild(fixed, 1);

  const stopsAtMax = new Node();
  stopsAtMax.setFlexGrow(2);
  stopsAtMax.setHeight(40);
  stopsAtMax.setMaxHeight(41);
  root.insertChild(stopsAtMax, 2);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(stopsAtMax.getComputedHeight()).toBe(41);
  expect(growsFromBelowMin.getComputedHeight()).toBe(155);
});

test("min_width_in_points_flexes_like_one_in_percent", () => {
  for (const [min0, min1] of [
    ["60%", "20%"],
    [120, 40],
  ] as const) {
    const root = new Node();
    root.setWidth(200);
    root.setHeight(200);
    root.setFlexDirection(FlexDirection.Row);
    const child0 = new Node();
    child0.setFlexGrow(1);
    child0.setFlexBasis("15%");
    child0.setMinWidth(min0);
    root.insertChild(child0, 0);
    const child1 = new Node();
    child1.setFlexGrow(4);
    child1.setFlexBasis("10%");
    child1.setMinWidth(min1);
    root.insertChild(child1, 1);
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(child0.getComputedWidth()).toBe(120);
    expect(child1.getComputedWidth()).toBe(80);
  }
});

test("space_around_with_no_child_in_the_flow", () => {
  const root = new Node();
  root.setWidth(200);
  root.setHeight(100);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.FlexStart);
  // Sized by its content along the main axis, of which there is none.
  const container = new Node();
  container.setFlexDirection(FlexDirection.Column);
  container.setMinHeight(50);
  container.setJustifyContent(Justify.SpaceAround);
  root.insertChild(container, 0);
  const hidden = new Node();
  hidden.setDisplay(Display.None);
  container.insertChild(hidden, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(container.getComputedHeight()).toBe(50);
});

test("auto_margin_under_a_direction_of_its_own", () => {
  const root = new Node();
  root.setWidth(800);
  root.setHeight(600);
  root.setFlexDirection(FlexDirection.Row);
  root.setDirection(Direction.RTL);
  const child = new Node();
  child.setMargin(Edge.End, "12.5%");
  child.setMargin(Edge.Right, "auto");
  child.setWidth(30);
  root.insertChild(child, 0);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(child.getComputedWidth()).toBe(30);
  expect(child.getComputedLeft()).toBe(100);
});

test("hidden_first_child_is_not_the_baseline", () => {
  const root = new Node();
  root.setWidth(200);
  root.setFlexDirection(FlexDirection.Row);
  root.setAlignItems(Align.Baseline);
  const row = new Node();
  row.setFlexDirection(FlexDirection.Row);
  root.insertChild(row, 0);
  const hidden = new Node();
  hidden.setDisplay(Display.None);
  row.insertChild(hidden, 0);
  const shown = new Node();
  shown.setWidth(20);
  shown.setHeight(10);
  row.insertChild(shown, 1);
  const tall = new Node();
  tall.setWidth(20);
  tall.setHeight(30);
  root.insertChild(tall, 1);
  root.calculateLayout(undefined, undefined, Direction.LTR);

  expect(row.getComputedTop()).toBe(20);
  expect(row.getComputedHeight()).toBe(10);
});

// Random style changes, a few per pass. The seeds are fixed, so a failure names
// a step that fails again on the next run.
test.each([
  [1, false],
  [2, false],
  [3, false],
  [4, false],
  [1, true],
  [2, true],
  [3, true],
  [4, true],
])("random_style_changes_seed_%i, relayout boundaries %s", (startSeed, relayoutBoundaries) => {
  Config.getDefault().setRelayoutBoundaries(relayoutBoundaries);
  let seed = startSeed;
  const random = (): number => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const pick = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]!;

  const lengths = [undefined, 0, 3, 7.5, 12, "5%", "12.5%", -4] as const;
  const points = [undefined, 0, 3, 7.5, 12] as const;
  const edges = [
    Edge.Left,
    Edge.Top,
    Edge.Right,
    Edge.Bottom,
    Edge.Start,
    Edge.End,
    Edge.Horizontal,
    Edge.Vertical,
    Edge.All,
  ];
  const changes: ((node: Node) => void)[] = [
    (node) => node.setMargin(pick(edges), random() < 0.1 ? "auto" : pick(lengths)),
    (node) => node.setPadding(pick(edges), pick(lengths)),
    (node) => node.setBorder(pick(edges), pick(points)),
    (node) => node.setPosition(pick(edges), pick(lengths)),
    (node) =>
      node.setPositionType(
        pick([PositionType.Static, PositionType.Relative, PositionType.Absolute]),
      ),
    (node) => node.setMinWidth(pick(lengths)),
    (node) => node.setMaxWidth(pick([undefined, "40%", 30 + random() * 200])),
    (node) => node.setMinHeight(pick(lengths)),
    (node) => node.setMaxHeight(pick([undefined, 20 + random() * 150])),
    (node) => node.setWidth(pick([undefined, "auto", 40, 95.5, "30%", "100%"])),
    (node) => node.setHeight(pick([undefined, "auto", 25, 60.25, "50%"])),
    (node) =>
      node.setFlexDirection(
        pick([
          FlexDirection.Row,
          FlexDirection.Column,
          FlexDirection.RowReverse,
          FlexDirection.ColumnReverse,
        ]),
      ),
    (node) => node.setDirection(pick([Direction.Inherit, Direction.LTR, Direction.RTL])),
    (node) => node.setFlexGrow(pick([undefined, 0, 1, 2])),
    (node) => node.setFlexShrink(pick([undefined, 0, 1])),
    (node) => node.setFlexWrap(pick([Wrap.NoWrap, Wrap.Wrap, Wrap.WrapReverse])),
    (node) =>
      node.setAlignItems(
        pick([Align.Stretch, Align.Center, Align.FlexStart, Align.FlexEnd, Align.Baseline]),
      ),
    (node) => node.setAlignSelf(pick([Align.Auto, Align.Stretch, Align.Center, Align.FlexEnd])),
    (node) =>
      node.setJustifyContent(
        pick([
          Justify.FlexStart,
          Justify.Center,
          Justify.SpaceBetween,
          Justify.SpaceAround,
          Justify.FlexEnd,
        ]),
      ),
    (node) => node.setBoxSizing(pick([BoxSizing.BorderBox, BoxSizing.ContentBox])),
    (node) => node.setDisplay(pick([Display.Flex, Display.Flex, Display.None, Display.Contents])),
    (node) => node.setGap(Gutter.All, pick([undefined, 0, 4, 9.5])),
    (node) => node.setAspectRatio(pick([undefined, 1, 1.5])),
  ];

  const all = buildTree();
  for (let step = 0; step < 250; step++) {
    const count = 1 + Math.floor(random() * 4);
    for (let i = 0; i < count; i++) {
      // The root stays displayed.
      const node = all[Math.floor(random() * all.length)]!;
      const change = pick(changes);
      if (node !== all[0] || change !== changes[20]) {
        change(node);
      }
    }
    expectSameAsFromScratch(all[0]!, random() < 0.2 ? Direction.RTL : Direction.LTR);
  }
});
