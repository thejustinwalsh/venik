import { describe, expect, test } from "vitest";
import { configUpdateInvalidatesLayout } from "../src/config/Config.ts";
import { Config } from "../src/index.ts";

describe("YogaTest", () => {
  test("config_point_scale_factor_negative_throws", () => {
    const config = new Config();

    // Zero is explicitly allowed per the API contract
    config.setPointScaleFactor(0.0);
    expect(config.getPointScaleFactor()).toBe(0);

    // Negative values should trigger a fatal assertion (throws std::logic_error)
    expect(() => config.setPointScaleFactor(-1.0)).toThrow();

    // Verify the value was not changed after the failed set
    expect(config.getPointScaleFactor()).toBe(0);

    config.free();
  });

  test("config_version_increments_only_on_actual_changes", () => {
    const config = new Config();

    const initialVersion = config.getVersion();

    // Changing point scale factor should increment version
    config.setPointScaleFactor(2.0);
    expect(config.getVersion()).toBe(initialVersion + 1);

    // Setting the same value again should NOT increment version
    config.setPointScaleFactor(2.0);
    expect(config.getVersion()).toBe(initialVersion + 1);

    config.free();
  });

  test("config_update_invalidates_layout_detects_each_property", () => {
    const config1 = new Config();
    const config2 = new Config();

    // Two identical configs should not invalidate layout
    expect(configUpdateInvalidatesLayout(config1, config2)).toBe(false);

    // Changing point scale factor should invalidate
    config2.setPointScaleFactor(3.0);
    expect(configUpdateInvalidatesLayout(config1, config2)).toBe(true);

    // Make them match again
    config1.setPointScaleFactor(3.0);
    expect(configUpdateInvalidatesLayout(config1, config2)).toBe(false);

    config1.free();
    config2.free();
  });
});
