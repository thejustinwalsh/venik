// Scenarios beyond the README's: fractional resizes, very wide containers and
// text-heavy trees. Shared by suites/stress.bench.ts and the layout check.
import { buildTree } from "./engines.mjs";

const WORD = { width: 0, height: 0 };
// A word 20-60 wide by its index, that wraps to more lines when squeezed.
function wordMeasure(i) {
  const natural = 20 + ((i * 37) % 41);
  return (width) => {
    const w = width === width && width < natural ? Math.max(1, width) : natural;
    WORD.width = w;
    WORD.height = 14 * Math.ceil(natural / w);
    return WORD;
  };
}

// 1 row-wrapping root with `count` children: grow boxes and measured words.
export function buildWide(api, count) {
  const C = api.C;
  const root = api.node();
  root.setWidth(1920);
  root.setFlexDirection(C.row);
  root.setFlexWrap(C.wrap);
  root.setGap(C.gutterAll, 2);
  const kids = [];
  for (let i = 0; i < count; i++) {
    const n = api.node();
    if (i % 3 === 0) n.setMeasureFunc(wordMeasure(i));
    else { n.setWidth(24 + (i % 17)); n.setHeight(16); n.setFlexGrow(i % 2); }
    root.insertChild(n, i);
    kids.push(n);
  }
  return { root, kids };
}

// A column of `paragraphs`, each a wrapping row of `words` measured words.
export function buildText(api, paragraphs, words) {
  const C = api.C;
  const root = api.node();
  root.setWidth(800);
  root.setFlexDirection(C.column);
  root.setPadding(C.edgeAll, 8);
  root.setGap(C.gutterAll, 6);
  for (let p = 0; p < paragraphs; p++) {
    const para = api.node();
    para.setFlexDirection(C.row);
    para.setFlexWrap(C.wrap);
    para.setGap(C.gutterColumn, 4);
    for (let w = 0; w < words; w++) {
      const word = api.node();
      word.setMeasureFunc(wordMeasure(p * words + w));
      para.insertChild(word, w);
    }
    root.insertChild(para, p);
  }
  return { root };
}

// Fractional widths that keep changing, like a window being dragged: the
// case where float drift and pixel-rounding jitter show up.
export const sweep = (f) => 1440 + 480 * Math.sin(f * 0.05);

// name -> (api) => frame
export const stressScenarios = {
  "hud: resize drag sweep (fractional widths)": (api) => {
    const t = buildTree(api);
    let f = 0;
    return () => { t.root.setWidth(sweep(f++)); api.layout(t.root); };
  },
  "wide 10k: one child changes": (api) => {
    const t = buildWide(api, 10000);
    api.layout(t.root);
    let f = 0;
    return () => { t.kids[5001].setWidth(20 + (f++ % 30)); api.layout(t.root); };
  },
  "wide 10k: root resized": (api) => {
    const t = buildWide(api, 10000);
    let f = 0;
    return () => { t.root.setWidth(1800 + (f++ % 100)); api.layout(t.root); };
  },
  "text 100×20: root resized": (api) => {
    const t = buildText(api, 100, 20);
    let f = 0;
    return () => { t.root.setWidth(sweep(f++) / 2); api.layout(t.root); };
  },
  "text 100×20: build and lay out": (api) => {
    // A live, laid-out tree keeps the engine's hidden classes alive (see
    // suites/hud.bench.ts); one never laid out keeps only some of them.
    const live = buildText(api, 100, 20);
    api.layout(live.root);
    return () => { api.layout(buildText(api, 100, 20).root); live.root.getChildCount(); };
  },
};

export function stressSnapshot(api) {
  const walk = (n, out) => { out.push(n.getComputedLeft(), n.getComputedTop(), n.getComputedWidth(), n.getComputedHeight()); for (let i = 0; i < n.getChildCount(); i++) walk(n.getChild(i), out); return out; };
  const w = buildWide(api, 2000); w.root.setWidth(1333.3); api.layout(w.root);
  const t = buildText(api, 20, 20); t.root.setWidth(517.7); api.layout(t.root);
  return walk(w.root, []).concat(walk(t.root, []));
}
