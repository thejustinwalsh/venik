// Random style mutations on a 69-node tree. After every layout pass the tree
// is copied style by style and laid out from scratch; the incremental result
// must match it exactly. This is the only test that has found cache bugs.
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

export interface FuzzOptions {
  /** Layout passes per run. */
  steps?: number;
  /** Also toggle `display: contents`. */
  contents?: boolean;
  /** Turn pixel rounding off. */
  noRounding?: boolean;
  /** Largest accepted difference in any computed value. */
  tolerance?: number;
  /** Lay out the incremental tree with relayout boundaries. */
  relayoutBoundaries?: boolean;
}

export interface FuzzMismatch {
  step: number;
  node: number;
  incremental: number[];
  fresh: number[];
  /** The mutations applied right before this pass, as readable strings. */
  mutations: string[];
}

export interface FuzzResult {
  seed: number;
  steps: number;
  badSteps: number;
  badNodes: number;
  first: FuzzMismatch | null;
}

type Length = number | string | undefined;
const LENGTHS: Length[] = [undefined, 0, 3, 7.5, 12, "5%", "12.5%", -4];
const EDGES = ["Left", "Top", "Right", "Bottom", "Start", "End", "Horizontal", "Vertical", "All"] as const;

interface Roll {
  edge: (typeof EDGES)[number];
  len: Length;
  auto: boolean;
  x: number;
}

type Op = { name: string; apply: (n: Node, r: Roll) => unknown };

const key = <T extends object>(obj: T, r: Roll, names: (keyof T)[]) => obj[names[Math.floor(r.x * names.length)]!];
const pickOf = <T>(r: Roll, values: T[]) => values[Math.floor(r.x * values.length)]!;

function ops(contents: boolean): Op[] {
  return [
    { name: "margin", apply: (n, r) => n.setMargin(Edge[r.edge], (r.auto ? "auto" : r.len) as never) },
    { name: "padding", apply: (n, r) => n.setPadding(Edge[r.edge], r.len as never) },
    { name: "border", apply: (n, r) => n.setBorder(Edge[r.edge], (typeof r.len === "string" ? 2 : r.len) as never) },
    { name: "position", apply: (n, r) => n.setPosition(Edge[r.edge], r.len as never) },
    { name: "positionType", apply: (n, r) => n.setPositionType(key(PositionType, r, ["Static", "Relative", "Absolute"])) },
    { name: "minWidth", apply: (n, r) => n.setMinWidth(r.len as never) },
    { name: "maxWidth", apply: (n, r) => n.setMaxWidth((r.len === undefined ? undefined : typeof r.len === "string" ? "40%" : 30 + r.x * 200) as never) },
    { name: "minHeight", apply: (n, r) => n.setMinHeight(r.len as never) },
    { name: "maxHeight", apply: (n, r) => n.setMaxHeight(r.len === undefined ? undefined : 20 + r.x * 150) },
    { name: "width", apply: (n, r) => n.setWidth(pickOf(r, [undefined, "auto", 40, 95.5, "30%", "100%"]) as never) },
    { name: "height", apply: (n, r) => n.setHeight(pickOf(r, [undefined, "auto", 25, 60.25, "50%"]) as never) },
    { name: "flexDirection", apply: (n, r) => n.setFlexDirection(key(FlexDirection, r, ["Row", "Column", "RowReverse", "ColumnReverse"])) },
    { name: "direction", apply: (n, r) => n.setDirection(key(Direction, r, ["Inherit", "LTR", "RTL"])) },
    { name: "flexGrow", apply: (n, r) => n.setFlexGrow(pickOf(r, [undefined, 0, 1, 2])) },
    { name: "flexShrink", apply: (n, r) => n.setFlexShrink(pickOf(r, [undefined, 0, 1])) },
    { name: "flexWrap", apply: (n, r) => n.setFlexWrap(key(Wrap, r, ["NoWrap", "Wrap", "WrapReverse"])) },
    { name: "alignItems", apply: (n, r) => n.setAlignItems(key(Align, r, ["Stretch", "Center", "FlexStart", "FlexEnd", "Baseline"])) },
    { name: "alignSelf", apply: (n, r) => n.setAlignSelf(key(Align, r, ["Auto", "Stretch", "Center", "FlexEnd", "Baseline"])) },
    { name: "justifyContent", apply: (n, r) => n.setJustifyContent(key(Justify, r, ["FlexStart", "Center", "SpaceBetween", "SpaceAround", "FlexEnd"])) },
    { name: "boxSizing", apply: (n, r) => n.setBoxSizing(key(BoxSizing, r, ["BorderBox", "ContentBox"])) },
    { name: "display", apply: (n, r) => n.setDisplay(key(Display, r, ["Flex", "Flex", "None", contents ? "Contents" : "Flex"])) },
    { name: "gap", apply: (n, r) => n.setGap(Gutter.All, pickOf(r, [undefined, 0, 4, 9.5]) as never) },
    { name: "aspectRatio", apply: (n, r) => n.setAspectRatio(pickOf(r, [undefined, 1, 1.5])) },
  ];
}

function flatten(root: Node): Node[] {
  const out: Node[] = [];
  const walk = (n: Node) => {
    out.push(n);
    for (let k = 0; k < n.getChildCount(); k++) walk(n.getChild(k)!);
  };
  walk(root);
  return out;
}

function copy(n: Node, cfg: Config): Node {
  const m = new Node(cfg);
  m.copyStyle(n);
  for (let k = 0; k < n.getChildCount(); k++) m.insertChild(copy(n.getChild(k)!, cfg), k);
  return m;
}

const BOX_EDGES = [Edge.Left, Edge.Top, Edge.Right, Edge.Bottom];

function computed(n: Node): number[] {
  const l = n.getComputedLayout();
  const out = [l.left, l.top, l.width, l.height];
  for (const e of BOX_EDGES) out.push(n.getComputedPadding(e), n.getComputedMargin(e), n.getComputedBorder(e));
  out.push(n.getComputedHadOverflow() ? 1 : 0);
  return out;
}

function sameValue(a: number, b: number, tolerance: number): boolean {
  if (a !== a || b !== b) return a !== a && b !== b;
  return Math.abs(a - b) <= tolerance;
}

export function fuzzIncremental(seed: number, options: FuzzOptions = {}): FuzzResult {
  const {
    steps = 1500,
    contents = false,
    noRounding = false,
    tolerance = 0.0001,
    relayoutBoundaries = false,
  } = options;
  let state = seed >>> 0;
  const rnd = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)]!;

  const cfg = new Config();
  if (noRounding) cfg.setPointScaleFactor(0);
  cfg.setRelayoutBoundaries(relayoutBoundaries);
  const all: Node[] = [];
  const node = () => {
    const n = new Node(cfg);
    all.push(n);
    return n;
  };
  const root = node();
  root.setWidth(800);
  root.setHeight(600);
  for (let i = 0; i < 4; i++) {
    const a = node();
    root.insertChild(a, i);
    for (let j = 0; j < 4; j++) {
      const b = node();
      a.insertChild(b, j);
      for (let k = 0; k < 3; k++) {
        const c = node();
        b.insertChild(c, k);
        if (k) {
          c.setWidth(20 + k * 7);
          c.setHeight(10 + k * 3);
        }
      }
    }
  }

  const OPS = ops(contents);
  const result: FuzzResult = { seed, steps, badSteps: 0, badNodes: 0, first: null };
  for (let step = 0; step < steps; step++) {
    const mutations: string[] = [];
    const count = 1 + Math.floor(rnd() * 4);
    for (let m = 0; m < count; m++) {
      const i = Math.floor(rnd() * all.length);
      const op = pick(OPS);
      const r: Roll = { edge: pick([...EDGES]), len: pick(LENGTHS), auto: rnd() < 0.1, x: rnd() };
      if (i === 0 && op.name === "display") continue;
      op.apply(all[i]!, r);
      mutations.push(`node ${i}: ${op.name} edge=${r.edge} len=${String(r.len)} auto=${r.auto} x=${r.x.toFixed(3)}`);
    }
    const dir = rnd() < 0.2 ? Direction.RTL : Direction.LTR;
    root.calculateLayout(undefined, undefined, dir);
    const truthRoot = copy(root, cfg);
    truthRoot.calculateLayout(undefined, undefined, dir);

    const inc = flatten(root);
    const truth = flatten(truthRoot);
    let bad = 0;
    for (let i = 0; i < inc.length; i++) {
      let hidden = false;
      for (let a: Node | null = inc[i]!; a; a = a.owner) if (a.getDisplay() === Display.None) hidden = true;
      if (hidden) continue;
      const p = computed(inc[i]!);
      const q = computed(truth[i]!);
      if (p.every((v, k) => sameValue(v, q[k]!, tolerance))) continue;
      bad++;
      result.first ??= { step, node: i, incremental: p, fresh: q, mutations };
    }
    if (bad) {
      result.badSteps++;
      result.badNodes += bad;
    }
  }
  return result;
}

export function describeMismatch(r: FuzzResult, contents: boolean): string {
  const m = r.first!;
  return [
    `seed ${r.seed}${contents ? " (contents)" : ""}: ${r.badSteps}/${r.steps} steps differ from a from-scratch layout (${r.badNodes} nodes)`,
    `first at step ${m.step}, node ${m.node} [left, top, width, height, (padding, margin, border) x4 edges, hadOverflow]:`,
    `  incremental ${JSON.stringify(m.incremental)}`,
    `  fresh       ${JSON.stringify(m.fresh)}`,
    `  after: ${m.mutations.join("; ")}`,
  ].join("\n");
}
