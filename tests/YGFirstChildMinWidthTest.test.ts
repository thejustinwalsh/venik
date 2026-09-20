// Port of yoga-cpp/tests/YGFirstChildMinWidthTest.cpp

// Regression test for https://github.com/react/yoga/issues/2006
// A row of three growable children (flexGrow/flexShrink 1, maxWidth 180) inside
// a 540px container. When the *first* child has a larger minWidth than the
// rest, the first free-space pass used to freeze every item at its max while
// also draining the remaining free space to exactly zero, leaving the second
// pass with nothing to distribute. The children then collapsed to their
// minWidths (60/30/30) instead of growing to fill the row (180/180/180).
//
// The fix is gated on clearing YGErrataFlexFirstPassUsesRunningTotals, which
// new configs set by default, so both behaviors are pinned here.

import { expect, test } from "vitest";
import { Config, Direction, Errata, FlexDirection, Node } from "../src/index.ts";

// A config opted into the spec-correct single distribution.
function makeFixedConfig(): Config {
  const config = new Config();
  const errata = config.getErrata();
  config.setErrata(errata & ~Errata.FlexFirstPassUsesRunningTotals);
  return config;
}

// Lay out a 540px row containing three children, each with flexGrow/
// flexShrink of 1, maxWidth of 180 and the given minWidths, and return the
// resolved width of each child.
function layoutRow(
  config: Config,
  minWidth0: number,
  minWidth1: number,
  minWidth2: number,
): [number, number, number] {
  const root = new Node(config);
  root.setWidth(540.0);
  root.setFlexDirection(FlexDirection.Row);

  const minWidths = [minWidth0, minWidth1, minWidth2];
  for (let i = 0; i < 3; i++) {
    const child = new Node(config);
    child.setFlexGrow(1.0);
    child.setFlexShrink(1.0);
    child.setMaxWidth(180.0);
    child.setHeight(30.0);
    child.setMinWidth(minWidths[i]);
    root.insertChild(child, i);
  }

  root.calculateLayout(540.0, 30.0, Direction.LTR);

  const widths: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    widths[i] = root.getChild(i)!.getComputedWidth();
  }

  root.freeRecursive();
  return widths;
}

// Assert every child grows to maxWidth (the row exactly fills the container).
function expectAllGrowToMax(minWidth0: number, minWidth1: number, minWidth2: number): void {
  const config = makeFixedConfig();
  const widths = layoutRow(config, minWidth0, minWidth1, minWidth2);

  for (let i = 0; i < 3; i++) {
    // EXPECT_NEAR(180.0f, widths[i], 1e-3f)
    expect(
      widths[i],
      `child[${i}] should grow to maxWidth, not collapse to its minWidth`,
    ).toBeCloseTo(180.0, 3);
  }

  config.free();
}

test("first_child_larger_minwidth_row", () => {
  // The originally reported case: the first child has a larger minWidth than
  // the other two, which used to break the whole row.
  expectAllGrowToMax(60.0, 30.0, 30.0);
});

test("other_positions_still_work", () => {
  // Sanity: placing the outlier minWidth on the second or third child already
  // worked and must keep working.
  expectAllGrowToMax(30.0, 60.0, 30.0);
  expectAllGrowToMax(30.0, 30.0, 60.0);
});

test("uniform_minwidth_row", () => {
  // All children share the same minWidth: no issue either way.
  expectAllGrowToMax(30.0, 30.0, 30.0);
});

test("errata_preserves_prefix_geometry_by_default", () => {
  // A default config keeps the pre-fix collapse, so existing layouts do not
  // shift when this change lands. Removing the errata bit from the defaults is
  // what makes this test fail.
  const config = new Config();
  expect(config.getErrata() & Errata.FlexFirstPassUsesRunningTotals).not.toBe(0);

  const widths = layoutRow(config, 60.0, 30.0, 30.0);
  expect(widths[0]).toBeCloseTo(60.0, 3);
  expect(widths[1]).toBeCloseTo(30.0, 3);
  expect(widths[2]).toBeCloseTo(30.0, 3);

  config.free();
});

test("errata_bit_round_trips", () => {
  const config = new Config();
  expect(config.getErrata() & Errata.FlexFirstPassUsesRunningTotals).not.toBe(0);

  config.setErrata(config.getErrata() & ~Errata.FlexFirstPassUsesRunningTotals);
  expect(config.getErrata() & Errata.FlexFirstPassUsesRunningTotals).toBe(0);

  config.free();
});
