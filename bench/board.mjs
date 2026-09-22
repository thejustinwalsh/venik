// flexily's own benchmark (bench/incremental.bench.ts in its repository): a TUI
// kanban board of text cards, plus its 50-level deep tree. Ported to the three
// adapters so all engines lay out the same nodes.

function textMeasure(textLen) {
  return (width) => {
    const maxW = Number.isNaN(width) ? Infinity : width;
    return { width: Math.min(textLen, maxW), height: Math.ceil(textLen / Math.max(1, maxW)) };
  };
}

export function buildBoard(api, cols, cards) {
  const C = api.C;
  const N = (shrink) => { const n = api.node(); n.setFlexShrink(shrink); return n; };
  const root = N(0);
  root.setWidth(120); root.setHeight(40); root.setFlexDirection(C.row); root.setGap(C.gutterAll, 1);
  for (let c = 0; c < cols; c++) {
    const col = N(1); col.setFlexGrow(1); col.setFlexDirection(C.column);
    const header = N(0); header.setHeight(1); col.insertChild(header, 0);
    for (let i = 0; i < cards; i++) {
      const card = N(0); card.setFlexDirection(C.column); card.setBorder(C.edgeAll, 1); card.setPadding(C.edgeRight, 1);
      const row = N(0); row.setFlexDirection(C.row);
      const icon = N(0); icon.setWidth(3); row.insertChild(icon, 0);
      const text = N(1); text.setFlexGrow(1); text.setMeasureFunc(textMeasure(15 + (i % 20))); row.insertChild(text, 1);
      card.insertChild(row, 0);
      col.insertChild(card, i + 1);
    }
    root.insertChild(col, c);
  }
  return root;
}

export function buildDeep(api, depth) {
  const C = api.C;
  const root = api.node(); root.setFlexShrink(0);
  root.setWidth(1000); root.setHeight(1000); root.setFlexDirection(C.column);
  let cur = root;
  for (let i = 0; i < depth; i++) {
    const child = api.node(); child.setFlexShrink(1); child.setFlexGrow(1); child.setFlexDirection(C.column); child.setPadding(C.edgeLeft, 1);
    cur.insertChild(child, 0);
    cur = child;
  }
  return { root, leaf: cur };
}

const leafOf = (board, col, card) => board.getChild(col).getChild(card).getChild(0).getChild(1);

// name -> { setup, op, iters }
export function boardScenarios(api) {
  const L = api.layout;
  const laidOut = (cols, cards) => { const b = buildBoard(api, cols, cards); L(b, 120, 40); return b; };
  return {
    "5×20, one text leaf dirty": {
      setup: () => { const b = laidOut(5, 20); return { b, l: leafOf(b, 2, 10) }; },
      op: ({ b, l }) => { l.markDirty(); L(b, 120, 40); }, iters: 500,
    },
    "8×30, one text leaf dirty": {
      setup: () => { const b = laidOut(8, 30); return { b, l: leafOf(b, 4, 15) }; },
      op: ({ b, l }) => { l.markDirty(); L(b, 120, 40); }, iters: 500,
    },
    "8×30, 50 leaves dirty": {
      setup: () => { const b = laidOut(8, 30); const ls = []; for (let i = 0; i < 50; i++) ls.push(leafOf(b, i % 8, 1 + (i * 7) % 30)); return { b, ls }; },
      op: ({ b, ls }) => { for (const l of ls) l.markDirty(); L(b, 120, 40); }, iters: 200,
    },
    "5×20, resize cycle 120→80→120": {
      setup: () => laidOut(5, 20),
      op: (b) => { b.setWidth(80); L(b, 80, 40); b.setWidth(120); L(b, 120, 40); }, iters: 200,
    },
    "5×20, build and lay out": {
      setup: () => null,
      op: () => { const b = buildBoard(api, 5, 20); L(b, 120, 40); b.freeRecursive?.(); }, iters: 200,
    },
    "50 levels deep, one change": {
      setup: () => { const d = buildDeep(api, 50); L(d.root, 1000, 1000); d.k = 0; return d; },
      op: (d) => { d.k++; d.leaf.setPadding(api.C.edgeLeft, 1 + (d.k & 1)); L(d.root, 1000, 1000); }, iters: 500,
    },
  };
}

export function boardSnapshot(api) {
  const walk = (n, out) => { out.push(n.getComputedLeft(), n.getComputedTop(), n.getComputedWidth(), n.getComputedHeight()); for (let i = 0; i < n.getChildCount(); i++) walk(n.getChild(i), out); return out; };
  const b = buildBoard(api, 5, 20); api.layout(b, 120, 40);
  const d = buildDeep(api, 50); api.layout(d.root, 1000, 1000);
  return walk(b, []).concat(walk(d.root, []));
}
