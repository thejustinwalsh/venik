import { afterEach, expect, test } from "vitest";
import { Event, LayoutType } from "../src/event/event.ts";
import { Config, Direction, FlexDirection, Node, type Size } from "../src/index.ts";
import { ScopedEventSubscription } from "./util/testUtil.ts";

// Relayout boundaries (`Config.setRelayoutBoundaries`) let a pass skip the
// nodes above a change whose sizes the change leaves as they were. The layout
// must be the same either way; only the work differs.

let subscription: ScopedEventSubscription | null = null;
afterEach(() => {
  subscription?.dispose();
  subscription = null;
});

const size: Size = { width: 0, height: 0 };
// Monospace text of 6x10 per character on one line, from the node's context.
function measureText(width: number, _wm: unknown, _h: number, _hm: unknown, node: Node): Size {
  const natural = String(node.context).length * 6;
  size.width = width === width ? Math.min(natural, width) : natural;
  size.height = 10;
  return size;
}

// A board: 3 columns of 5 cards, each an icon next to a line of text.
function buildBoard(config: Config): { root: Node; texts: Node[] } {
  const root = new Node(config);
  root.setWidth(300);
  root.setHeight(200);
  const texts: Node[] = [];
  for (let c = 0; c < 3; c++) {
    const column = new Node(config);
    column.setFlexDirection(FlexDirection.Column);
    column.setFlexGrow(1);
    root.insertChild(column, c);
    for (let r = 0; r < 5; r++) {
      const card = new Node(config);
      const icon = new Node(config);
      icon.setWidth(8);
      icon.setHeight(8);
      card.insertChild(icon, 0);
      const text = new Node(config);
      text.context = `card ${c}.${r}`;
      text.setMeasureFunc(measureText);
      card.insertChild(text, 1);
      column.insertChild(card, r);
      texts.push(text);
    }
  }
  return { root, texts };
}

function copyTree(node: Node): Node {
  const copy = new Node();
  copy.copyStyle(node);
  copy.context = node.context;
  if (node.hasMeasureFunc()) {
    copy.setMeasureFunc(measureText);
  }
  for (let i = 0; i < node.getChildCount(); i++) {
    copy.insertChild(copyTree(node.getChild(i)!), i);
  }
  return copy;
}

/** The nodes laid out again (not restored from their cache) by the next pass. */
function nodesLaidOut(root: Node, change: () => void): Node[] {
  const laidOut: Node[] = [];
  subscription = new ScopedEventSubscription((node, type, data) => {
    if (type === Event.NodeLayout && data.layoutType === LayoutType.Layout && node !== null) {
      laidOut.push(node);
    }
  });
  change();
  root.calculateLayout(undefined, undefined, Direction.LTR);
  subscription.dispose();
  subscription = null;
  return laidOut;
}

function expectSameAsFromScratch(root: Node): void {
  const fresh = copyTree(root);
  fresh.calculateLayout(undefined, undefined, Direction.LTR);
  const walk = (a: Node, b: Node, path: string) => {
    expect(
      [a.getComputedLeft(), a.getComputedTop(), a.getComputedWidth(), a.getComputedHeight()],
      path,
    ).toEqual([b.getComputedLeft(), b.getComputedTop(), b.getComputedWidth(), b.getComputedHeight()]);
    for (let i = 0; i < a.getChildCount(); i++) walk(a.getChild(i)!, b.getChild(i)!, `${path}/${i}`);
  };
  walk(root, fresh, "root");
}

test("relayout boundaries are off by default", () => {
  expect(new Config().getRelayoutBoundaries()).toBe(false);
});

test("a change that keeps sizes lays out only the changed node", () => {
  for (const enabled of [false, true]) {
    const config = new Config();
    config.setRelayoutBoundaries(enabled);
    const { root, texts } = buildBoard(config);
    root.calculateLayout(undefined, undefined, Direction.LTR);
    const text = texts[7]!;
    const card = text.owner!;
    const column = card.owner!;
    // Same length, so the same size: nothing above the text moves.
    const laidOut = nodesLaidOut(root, () => {
      text.context = "CARD 1.2";
      text.markDirty();
    });
    expect(laidOut).toContain(text);
    if (enabled) {
      // The card, the column and the root find their children unchanged.
      expect(laidOut).toEqual([text]);
    } else {
      expect(laidOut).toContain(card);
      expect(laidOut).toContain(column);
      expect(laidOut).toContain(root);
    }
    expectSameAsFromScratch(root);
  }
});

test("a change that resizes its ancestors still lays them out", () => {
  const config = new Config();
  config.setRelayoutBoundaries(true);
  const { root, texts } = buildBoard(config);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  const text = texts[3]!;
  text.context = "a much longer line of text than before";
  text.markDirty();
  expect(nodesLaidOut(root, () => {}).length).toBeGreaterThan(1);
  expectSameAsFromScratch(root);
});

test("turning boundaries on and off needs no relayout", () => {
  const config = new Config();
  const { root, texts } = buildBoard(config);
  root.calculateLayout(undefined, undefined, Direction.LTR);
  config.setRelayoutBoundaries(true);
  expect(root.isDirty()).toBe(false);
  texts[0]!.context = "CARD 0.0";
  texts[0]!.markDirty();
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expectSameAsFromScratch(root);
  config.setRelayoutBoundaries(false);
  texts[0]!.context = "a longer card 0.0";
  texts[0]!.markDirty();
  root.calculateLayout(undefined, undefined, Direction.LTR);
  expectSameAsFromScratch(root);
});
