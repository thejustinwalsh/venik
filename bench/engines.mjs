// One adapter per engine, so the same tree and the same mutations run on all three.
// Every default the engines disagree on is set explicitly in buildTree.

export const ENGINES = ["baba-yaga", "flexily", "yoga-layout"];

export async function loadEngine(which) {
  if (which === "baba-yaga") {
    const Y = await import("../dist/index.js");
    return {
      node: () => new Y.Node(),
      setWidthPercent: (n, v) => n.setWidth(`${v}%`),
      C: {
        row: Y.FlexDirection.Row, column: Y.FlexDirection.Column, wrap: Y.Wrap.Wrap,
        center: Y.Align.Center, stretch: Y.Align.Stretch,
        edgeAll: Y.Edge.All, edgeH: Y.Edge.Horizontal, edgeLeft: Y.Edge.Left, edgeRight: Y.Edge.Right,
        absolute: Y.PositionType.Absolute, relative: Y.PositionType.Relative, gutterColumn: Y.Gutter.Column, gutterAll: Y.Gutter.All,
      },
      layout: (root, w, h) => root.calculateLayout(w, h, Y.Direction.LTR),
    };
  }
  if (which === "flexily") {
    const F = await import("flexily");
    return {
      node: () => F.Node.create({ defaults: "css" }),
      setWidthPercent: (n, v) => n.setWidthPercent(v),
      C: {
        row: F.FLEX_DIRECTION_ROW, column: F.FLEX_DIRECTION_COLUMN, wrap: F.WRAP_WRAP,
        center: F.ALIGN_CENTER, stretch: F.ALIGN_STRETCH,
        edgeAll: F.EDGE_ALL, edgeH: F.EDGE_HORIZONTAL, edgeLeft: F.EDGE_LEFT, edgeRight: F.EDGE_RIGHT,
        absolute: F.POSITION_TYPE_ABSOLUTE, relative: F.POSITION_TYPE_RELATIVE, gutterColumn: F.GUTTER_COLUMN, gutterAll: F.GUTTER_ALL,
      },
      layout: (root, w, h) => root.calculateLayout(w, h, F.DIRECTION_LTR),
    };
  }
  if (which === "yoga-layout") {
    const Y = (await import("yoga-layout")).default;
    const cfg = Y.Config.create();
    cfg.setUseWebDefaults(true);
    return {
      node: () => Y.Node.create(cfg),
      setWidthPercent: (n, v) => n.setWidthPercent(v),
      C: {
        row: Y.FLEX_DIRECTION_ROW, column: Y.FLEX_DIRECTION_COLUMN, wrap: Y.WRAP_WRAP,
        center: Y.ALIGN_CENTER, stretch: Y.ALIGN_STRETCH,
        edgeAll: Y.EDGE_ALL, edgeH: Y.EDGE_HORIZONTAL, edgeLeft: Y.EDGE_LEFT, edgeRight: Y.EDGE_RIGHT,
        absolute: Y.POSITION_TYPE_ABSOLUTE, relative: Y.POSITION_TYPE_RELATIVE, gutterColumn: Y.GUTTER_COLUMN, gutterAll: Y.GUTTER_ALL,
      },
      layout: (root, w, h) => root.calculateLayout(w, h, Y.DIRECTION_LTR),
    };
  }
  throw new Error(`unknown engine ${which}`);
}

const SIZE = { width: 0, height: 0 };
function measureText(width) {
  SIZE.width = Math.min(40, width === width ? width : 40);
  SIZE.height = 14;
  return SIZE;
}

// ~900-node HUD: root wraps 10 panels (20% wide) of 10 rows of 8 cells.
// Cells alternate between measured text, growing boxes and one absolute badge per row.
export function buildTree(api) {
  const leaves = [];
  const root = api.node();
  root.setWidth(1920);
  root.setHeight(1080);
  root.setFlexDirection(api.C.row);
  root.setFlexWrap(api.C.wrap);
  for (let p = 0; p < 10; p++) {
    const panel = api.node();
    panel.setFlexDirection(api.C.column);
    api.setWidthPercent(panel, 20);
    panel.setPadding(api.C.edgeAll, 4);
    panel.setGap(api.C.gutterColumn, 2);
    root.insertChild(panel, p);
    for (let r = 0; r < 10; r++) {
      const row = api.node();
      row.setFlexDirection(api.C.row);
      row.setPositionType(api.C.relative);
      row.setAlignItems(p % 2 ? api.C.center : api.C.stretch);
      if (r % 3 === 0) row.setFlexWrap(api.C.wrap);
      panel.insertChild(row, r);
      for (let c = 0; c < 8; c++) {
        const cell = api.node();
        if (c === 7) {
          cell.setPositionType(api.C.absolute);
          cell.setPosition(api.C.edgeRight, 0);
          cell.setWidth(8);
          cell.setHeight(8);
        } else if (c % 2) {
          cell.setFlexGrow(1);
          cell.setMargin(api.C.edgeH, 1);
          cell.setMinWidth(10);
          cell.setHeight(12);
        } else {
          cell.setMeasureFunc(measureText);
        }
        row.insertChild(cell, c);
        leaves.push(cell);
      }
    }
  }
  return { root, leaves, nodeCount: 1 + 10 + 100 + 800 };
}

export const scenarios = {
  "One leaf changes": ({ leaves }, f) => leaves[101].setWidth(10 + (f % 50)),
  "50 leaves change": ({ leaves }, f) => {
    for (let i = 0; i < 50; i++) leaves[i * 16 + 1].setWidth(10 + ((f + i) % 50));
  },
  "Root resized (full relayout)": ({ root }, f) => root.setWidth(1800 + (f % 100)),
};

export function snapshot({ leaves }) {
  return leaves.map((l) => [l.getComputedLeft(), l.getComputedTop(), l.getComputedWidth(), l.getComputedHeight()]);
}
