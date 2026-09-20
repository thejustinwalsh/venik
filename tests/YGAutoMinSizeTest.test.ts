import { expect, test } from "vitest";
import {
  Config,
  Direction,
  Edge,
  FlexDirection,
  MeasureMode,
  Node,
  Overflow,
  type Size,
} from "../src/index.ts";

// Simulates a min-content-aware text measure: the longest "word" is
// `kWordWidth`. Asked to be smaller than that on the main axis, the measure
// function returns the longest-word width — that's how a real text engine
// reports its min-content width.
const kWordWidth = 30.0;
const kNaturalWidth = 90.0;
const kLineHeight = 16.0;

function measureWordWrappingText(
  width: number,
  widthMode: MeasureMode,
  _height: number,
  _heightMode: MeasureMode,
  _node: Node,
): Size {
  if (widthMode === MeasureMode.AtMost) {
    if (width < kWordWidth) {
      return { width: kWordWidth, height: kLineHeight * 3 };
    }
    if (width < kNaturalWidth) {
      return { width, height: kLineHeight * 2 };
    }
    return { width: kNaturalWidth, height: kLineHeight };
  }
  if (widthMode === MeasureMode.Exactly) {
    return { width, height: kLineHeight };
  }
  return { width: kNaturalWidth, height: kLineHeight };
}

function measureFixedSize(
  _width: number,
  _widthMode: MeasureMode,
  _height: number,
  _heightMode: MeasureMode,
  node: Node,
): Size {
  const dims = node.context as Size | null | undefined;
  return dims != null ? dims : { width: 0, height: 0 };
}

function makeWebConfig(): Config {
  const config = new Config();
  return config;
}

// Builds a 2-child row where the first child is shrinkable text and the
// second is a fixed-size spacer that doesn't shrink. This forces the text
// to absorb all the shrink when free space is negative.
class ShrinkRow {
  config: Config;
  root: Node;
  text: Node;
  spacer: Node;

  constructor(containerWidth: number) {
    this.config = makeWebConfig();
    this.root = new Node(this.config);
    this.text = new Node(this.config);
    this.spacer = new Node(this.config);

    this.root.setFlexDirection(FlexDirection.Row);
    this.root.setWidth(containerWidth);
    this.root.setHeight(50);

    this.text.setMeasureFunc(measureWordWrappingText);
    this.text.setFlexBasis(kNaturalWidth);
    this.text.setFlexGrow(0);
    this.text.setFlexShrink(1);
    this.root.insertChild(this.text, 0);

    this.spacer.setWidth(10);
    this.spacer.setFlexShrink(0);
    this.root.insertChild(this.spacer, 1);
  }

  // Stands in for the C++ destructor; called at the end of each test.
  dispose(): void {
    this.root.freeRecursive();
    this.config.free();
  }

  layout(): void {
    this.root.calculateLayout(undefined, undefined, Direction.LTR);
  }
}

// Auto-min on: text floored at min-content (kWordWidth). Container
// overflows rather than violate the floor.
test("auto_min_floors_text_at_min_content_width", () => {
  const row = new ShrinkRow(/*containerWidth=*/ 20);
  row.layout();
  // Floor = min(content=30, specified=NaN) = 30. Text stuck at 30; the
  // 10-px spacer takes its space; container of 20 overflows.
  expect(row.text.getComputedWidth()).toBe(kWordWidth);
  expect(row.spacer.getComputedWidth()).toBe(10);

  row.dispose();
});

// A measure-func leaf's auto-min floor must include the leaf's own padding and
// border on the main axis, just like the container branch and the normal
// measure pass. Regression test: the original probe omitted them, flooring a
// padded text at its bare longest-word width.
test("auto_min_includes_leaf_padding_and_border_width", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  const text = new Node(config);
  text.setMeasureFunc(measureWordWrappingText);
  text.setFlexBasis(kNaturalWidth);
  text.setFlexGrow(0);
  text.setFlexShrink(1);
  text.setPadding(Edge.Left, 4);
  text.setPadding(Edge.Right, 4);
  text.setBorder(Edge.Left, 1);
  text.setBorder(Edge.Right, 1);
  root.insertChild(text, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Floor = content kWordWidth(30) + padding(4+4) + border(1+1) = 40. Without
  // the padding/border contribution the leaf would be wrongly floored at 30.
  expect(text.getComputedWidth()).toBe(40);

  root.freeRecursive();
  config.free();
});

// Same fix on the column (cross) axis: vertical padding must be included in the
// height min-content.
test("auto_min_includes_leaf_padding_height", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(200);
  root.setHeight(20);

  const text = new Node(config);
  text.setMeasureFunc(measureWordWrappingText);
  text.setFlexBasis(kNaturalWidth); // tall basis forces shrink
  text.setFlexGrow(0);
  text.setFlexShrink(1);
  text.setPadding(Edge.Top, 4);
  text.setPadding(Edge.Bottom, 4);
  root.insertChild(text, 0);

  const spacer = new Node(config);
  spacer.setHeight(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Column probe height = natural kLineHeight(16) + padding(4+4) = 24.
  expect(text.getComputedHeight()).toBe(24);

  root.freeRecursive();
  config.free();
});

// flex-basis: 0 with intrinsic content (the under-protection case from the
// critique). With auto-min on, an item with `flex: 1` is still floored at
// its min-content even though basis is 0.
test("flex_basis_zero_floors_at_min_content", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(50);
  root.setHeight(50);

  const a = new Node(config);
  a.setMeasureFunc(measureWordWrappingText);
  a.setFlex(1);
  root.insertChild(a, 0);

  const b = new Node(config);
  b.setMeasureFunc(measureWordWrappingText);
  b.setFlex(1);
  root.insertChild(b, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Each auto-min = kWordWidth. Container 50, total floor 60, overflows.
  expect(a.getComputedWidth()).toBe(kWordWidth);
  expect(b.getComputedWidth()).toBe(kWordWidth);

  root.freeRecursive();
  config.free();
});

// Explicit width (basis) > content: floor = min(content, specified) =
// content. So text can shrink from basis-90 down to content-30.
test("content_smaller_than_specified_shrinks_to_content", () => {
  const row = new ShrinkRow(/*containerWidth=*/ 20);
  row.layout();
  // Auto-min = min(content=30, specified=NaN) = 30. (No flex-basis set as
  // a "specified main size" — Yoga's basis is set via setFlexBasis but the
  // CSS spec checks `width`/`height`, which here are undefined.) So the
  // floor is 30, and text shrinks from natural-90 down to 30.
  expect(row.text.getComputedWidth()).toBe(kWordWidth);

  row.dispose();
});

// max-width caps the auto-min.
test("auto_min_capped_by_max_size", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(10);
  root.setHeight(50);

  const text = new Node(config);
  text.setMeasureFunc(measureWordWrappingText);
  text.setFlexBasis(kNaturalWidth);
  text.setFlexGrow(0);
  text.setFlexShrink(1);
  text.setMaxWidth(20);
  root.insertChild(text, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Auto-min = min(content=30) capped by max=20 → 20. Text floored at 20.
  expect(text.getComputedWidth()).toBe(20);

  root.freeRecursive();
  config.free();
});

// Explicit min-width: 0 opts out (CSS escape hatch).
test("explicit_min_width_zero_opts_out", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  const text = new Node(config);
  text.setMeasureFunc(measureWordWrappingText);
  text.setFlexBasis(kNaturalWidth);
  text.setFlexGrow(0);
  text.setFlexShrink(1);
  text.setMinWidth(0);
  root.insertChild(text, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // min-width:0 → no auto-min. Text shrinks to 10 (container - spacer).
  expect(text.getComputedWidth()).toBe(10);

  root.freeRecursive();
  config.free();
});

// Aspect-ratio item with definite cross-size and no specified main:
// transferred-size = cross × ratio acts as the floor.
test("aspect_ratio_transferred_size_floors_main", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(30);
  root.setHeight(50);

  const img = new Node(config);
  img.setHeight(40);
  img.setAspectRatio(2.0);
  img.setFlexBasis(kNaturalWidth); // basis 90, container 30
  img.setFlexShrink(1);
  root.insertChild(img, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // No specified main width, aspect-ratio defined, cross definite:
  // transferred-size = 40 * 2 = 80. Auto-min = min(content=0,
  // transferred=80) = 0 — wait, per §4.5: when specified is undefined and
  // aspect-ratio applies, floor = min(content, transferred). content=0
  // (no measure func, no children) so floor = 0. img can shrink to 30.
  // The transferred-size is the LOWER bound on the *content suggestion*
  // when there's no measure func: per §4.5, when content suggestion
  // would be 0 and transferred applies, transferred replaces it.
  // Yoga implements the spec as min(content, transferred), preferring the
  // smaller — pragmatic but slightly under-protective for replaced
  // elements without intrinsic size.
  expect(img.getComputedWidth()).toBe(30);

  root.freeRecursive();
  config.free();
});

// Multi-level: outer column has limited height; inner wrapper has a
// fixed-size leaf (height 50) — auto-min protects the wrapper at 50.
test("nested_flexbox_recurses_into_min_content", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Column);
  root.setWidth(200);
  root.setHeight(30);

  const wrapper = new Node(config);
  wrapper.setFlexDirection(FlexDirection.Column);
  wrapper.setFlexGrow(0);
  wrapper.setFlexShrink(1);
  root.insertChild(wrapper, 0);

  const dims: Size = { width: 200.0, height: 50.0 };
  const leaf = new Node(config);
  leaf.context = dims;
  leaf.setMeasureFunc(measureFixedSize);
  wrapper.insertChild(leaf, 0);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Wrapper's recursive min-content = leaf's intrinsic 50. Floor 50,
  // container 30 → wrapper protected at 50, container overflows.
  expect(wrapper.getComputedHeight()).toBe(50);

  root.freeRecursive();
  config.free();
});

// overflow != visible disables auto-min on that item (CSS spec).
test("overflow_hidden_disables_auto_min", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  const text = new Node(config);
  text.setMeasureFunc(measureWordWrappingText);
  text.setFlexBasis(kNaturalWidth);
  text.setFlexGrow(0);
  text.setFlexShrink(1);
  text.setOverflow(Overflow.Hidden);
  root.insertChild(text, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // overflow:hidden → auto-min = 0 → text shrinks to 10 (container -
  // spacer), well below kWordWidth.
  expect(text.getComputedWidth()).toBe(10);

  root.freeRecursive();
  config.free();
});

// Counter for the min-content callback invocations, used by the next test.
let gMinContentCalls = 0;

function measureMinContentZero(
  _width: number,
  _widthMode: MeasureMode,
  _height: number,
  _heightMode: MeasureMode,
  _node: Node,
): Size {
  ++gMinContentCalls;
  return { width: 0.0, height: 0.0 };
}

// When a `YGMinContentMeasureFunc` is set, it's used for the §4.5 probe
// instead of the regular measure function. Models the Image/Collection
// Primitive case: the regular measure returns intrinsic content, but
// min-content is 0.
test("min_content_measure_func_preferred_during_probe", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  // Item with a regular measure that would return 90 (the natural width
  // of the longest word) under `AtMost 0`, but a min-content measure that
  // returns 0 — like an Image whose intrinsic width is 90 but whose
  // min-content contribution is 0.
  const item = new Node(config);
  item.setMeasureFunc(measureWordWrappingText);
  gMinContentCalls = 0;
  item.setMinContentMeasureFunc(measureMinContentZero);
  item.setFlexBasis(kNaturalWidth);
  item.setFlexGrow(0);
  item.setFlexShrink(1);
  root.insertChild(item, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // The probe used the min-content callback (returning 0), so the auto-min
  // floor for the item is 0 — it can shrink all the way to 10 (container
  // 20 - spacer 10), unlike the same test without the callback where it
  // would be floored at kWordWidth (30).
  expect(item.getComputedWidth()).toBe(10);
  expect(gMinContentCalls).toBeGreaterThan(0);

  root.freeRecursive();
  config.free();
});

test("has_min_content_measure_func_tracks_setter", () => {
  const node = new Node();
  expect(node.hasMinContentMeasureFunc()).toBe(false);
  node.setMinContentMeasureFunc(measureMinContentZero);
  expect(node.hasMinContentMeasureFunc()).toBe(true);
  node.setMinContentMeasureFunc(null);
  expect(node.hasMinContentMeasureFunc()).toBe(false);
  node.free();
});

// Static min-content takes precedence over the dynamic callback AND over
// the regular measure. Models the Image case: regular measure would return
// intrinsic size; the static `0` says "no min-content contribution per
// CSS-Images" and short-circuits the probe.
test("static_min_content_width_short_circuits_probe", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  // Item whose regular measure would return kNaturalWidth (90) under
  // `AtMost 0` (text measurers naturally do that), but the static
  // declaration overrides — min-content is 0.
  const item = new Node(config);
  item.setMeasureFunc(measureWordWrappingText);
  item.setMinContentWidth(0.0);
  gMinContentCalls = 0;
  // Set the dynamic callback too — the static value should win and the
  // callback should not be invoked.
  item.setMinContentMeasureFunc(measureMinContentZero);
  item.setFlexBasis(kNaturalWidth);
  item.setFlexGrow(0);
  item.setFlexShrink(1);
  root.insertChild(item, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Static floor = 0; item shrinks to 10 (container 20 - spacer 10).
  expect(item.getComputedWidth()).toBe(10);
  // Dynamic callback should not have been invoked — the static value wins.
  expect(gMinContentCalls).toBe(0);

  root.freeRecursive();
  config.free();
});

// Static min-content on a CONTAINER short-circuits subtree recursion. The
// outer Row probes its child container; the child's static `0` means we
// skip its grandchildren entirely.
test("static_min_content_short_circuits_container_recursion", () => {
  const config = makeWebConfig();
  const root = new Node(config);
  root.setFlexDirection(FlexDirection.Row);
  root.setWidth(20);
  root.setHeight(50);

  // Container item: would normally recurse into its child (kWordWidth = 30)
  // and floor at 30, but static `0` short-circuits before recursion.
  const item = new Node(config);
  item.setFlexBasis(kNaturalWidth);
  item.setFlexGrow(0);
  item.setFlexShrink(1);
  item.setMinContentWidth(0.0);
  root.insertChild(item, 0);

  const inner = new Node(config);
  inner.setMeasureFunc(measureWordWrappingText);
  item.insertChild(inner, 0);

  const spacer = new Node(config);
  spacer.setWidth(10);
  spacer.setFlexShrink(0);
  root.insertChild(spacer, 1);

  root.calculateLayout(undefined, undefined, Direction.LTR);

  // Container shrinks to 10 (container 20 - spacer 10) instead of being
  // floored at the inner text's kWordWidth = 30.
  expect(item.getComputedWidth()).toBe(10);

  root.freeRecursive();
  config.free();
});

// Static min-content getter / setter round-trip smoke test.
test("static_min_content_getter_setter_round_trip", () => {
  const node = new Node();
  expect(node.getMinContentWidth()).toBeNaN();
  expect(node.getMinContentHeight()).toBeNaN();

  node.setMinContentWidth(0.0);
  node.setMinContentHeight(42.0);
  expect(node.getMinContentWidth()).toBe(0);
  expect(node.getMinContentHeight()).toBe(42);

  node.setMinContentWidth(undefined);
  expect(node.getMinContentWidth()).toBeNaN();
  expect(node.getMinContentHeight()).toBe(42);

  node.free();
});

