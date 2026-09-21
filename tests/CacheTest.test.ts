import { beforeEach, describe, expect, test } from "vitest";
import { canUseCachedMeasurement } from "../src/algorithm/Cache.ts";
import { SizingMode } from "../src/algorithm/SizingMode.ts";
import { Config } from "../src/index.ts";

describe("CacheTest", () => {
  let config_: Config;

  beforeEach(() => {
    config_ = new Config();
  });

  test("negativeCachedMeasurementDisablesCache", () => {
    // Cached values with defined-but-negative extents are treated as invalid;
    // both axes must independently invalidate the cache.
    const negativeWidth = canUseCachedMeasurement(
      SizingMode.StretchFit,
      100,
      SizingMode.StretchFit,
      50,
      SizingMode.StretchFit,
      100,
      SizingMode.StretchFit,
      50,
      /*lastComputedWidth=*/-1,
      /*lastComputedHeight=*/50,
      0,
      0,
      config_,
    );
    expect(negativeWidth).toBe(false);

    const negativeHeight = canUseCachedMeasurement(
      SizingMode.StretchFit,
      100,
      SizingMode.StretchFit,
      50,
      SizingMode.StretchFit,
      100,
      SizingMode.StretchFit,
      50,
      /*lastComputedWidth=*/100,
      /*lastComputedHeight=*/-0.5,
      0,
      0,
      config_,
    );
    expect(negativeHeight).toBe(false);
  });

  test("identicalSpecsAllowCacheReuse", () => {
    // Primary cache-hit path: identical mode + available size on both axes
    // means the previously computed measurement can be reused verbatim.
    const canUse = canUseCachedMeasurement(
      SizingMode.StretchFit,
      100,
      SizingMode.FitContent,
      50,
      SizingMode.StretchFit,
      100,
      SizingMode.FitContent,
      50,
      /*lastComputedWidth=*/95,
      /*lastComputedHeight=*/45,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(true);
  });

  test("incompatibleSpecsDisableCache", () => {
    // Previous run used MaxContent with a computed size of 95; the new run
    // stretches to 200. StretchFit only reuses a cached size when the new
    // inner extent equals the last computed size, which does not hold here,
    // so no compatibility branch applies.
    const canUse = canUseCachedMeasurement(
      SizingMode.StretchFit,
      200,
      SizingMode.StretchFit,
      200,
      SizingMode.MaxContent,
      NaN,
      SizingMode.MaxContent,
      NaN,
      /*lastComputedWidth=*/95,
      /*lastComputedHeight=*/95,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(false);
  });

  test("stretchFitMatchingComputedSizeReusesCacheAccountingForMargin", () => {
    // Under StretchFit, the requested content size is (availableWidth -
    // marginRow) = 90, which matches the last computed width of 90. This
    // hits the sizeIsExactAndMatchesOldMeasuredSize branch and also verifies
    // that marginRow is subtracted before the comparison (a bare 100 would
    // not match 90).
    const canUse = canUseCachedMeasurement(
      SizingMode.StretchFit,
      /*availableWidth=*/100,
      SizingMode.StretchFit,
      /*availableHeight=*/60,
      SizingMode.FitContent,
      /*lastAvailableWidth=*/90,
      SizingMode.StretchFit,
      /*lastAvailableHeight=*/60,
      /*lastComputedWidth=*/90,
      /*lastComputedHeight=*/60,
      /*marginRow=*/10,
      /*marginColumn=*/0,
      config_,
    );

    expect(canUse).toBe(true);
  });

  test("maxContentResultStillFitsFitContentRequest", () => {
    // Cached MaxContent width of 80 fits inside a FitContent request with 120
    // available space, so the previous result remains valid (the max-content
    // size cannot overflow the looser constraint).
    const canUse = canUseCachedMeasurement(
      SizingMode.FitContent,
      /*availableWidth=*/120,
      SizingMode.StretchFit,
      /*availableHeight=*/50,
      SizingMode.MaxContent,
      /*lastAvailableWidth=*/NaN,
      SizingMode.StretchFit,
      /*lastAvailableHeight=*/50,
      /*lastComputedWidth=*/80,
      /*lastComputedHeight=*/50,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(true);
  });

  test("tighterFitContentReusesCacheWhenPreviousResultStillFits", () => {
    // Both runs use FitContent. The new available width (100) is stricter than
    // the previous one (150), but the previously computed width (80) still
    // fits inside the new constraint, so the cached measurement is reusable.
    const canUse = canUseCachedMeasurement(
      SizingMode.FitContent,
      /*availableWidth=*/100,
      SizingMode.StretchFit,
      /*availableHeight=*/50,
      SizingMode.FitContent,
      /*lastAvailableWidth=*/150,
      SizingMode.StretchFit,
      /*lastAvailableHeight=*/50,
      /*lastComputedWidth=*/80,
      /*lastComputedHeight=*/50,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(true);
  });

  test("tighterFitContentInvalidatesCacheWhenPreviousResultOverflows", () => {
    // Same shape as the previous test but the cached width (120) is larger
    // than the tightened constraint (100). Reusing the measurement would
    // silently overflow the container, so the cache must be discarded.
    const canUse = canUseCachedMeasurement(
      SizingMode.FitContent,
      /*availableWidth=*/100,
      SizingMode.StretchFit,
      /*availableHeight=*/50,
      SizingMode.FitContent,
      /*lastAvailableWidth=*/150,
      SizingMode.StretchFit,
      /*lastAvailableHeight=*/50,
      /*lastComputedWidth=*/120,
      /*lastComputedHeight=*/50,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(false);
  });

  test("pixelGridRoundingMakesSubPixelSpecsEquivalent", () => {
    // At a point scale factor of 2, both 10.25 and 10.5 snap to 10.5 on the
    // physical pixel grid. Specs that differ by less than one device pixel
    // must be treated as identical so we can reuse the cache; without grid
    // rounding, inexactEquals(10.25, 10.5) is false and the cache would miss.
    config_.setPointScaleFactor(2);

    const canUse = canUseCachedMeasurement(
      SizingMode.StretchFit,
      /*availableWidth=*/10.25,
      SizingMode.StretchFit,
      /*availableHeight=*/20,
      SizingMode.StretchFit,
      /*lastAvailableWidth=*/10.5,
      SizingMode.StretchFit,
      /*lastAvailableHeight=*/20,
      /*lastComputedWidth=*/10.5,
      /*lastComputedHeight=*/20,
      0,
      0,
      config_,
    );

    expect(canUse).toBe(true);
  });
});
