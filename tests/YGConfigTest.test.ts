// Port of yoga-cpp/tests/YGConfigTest.cpp

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { configUpdateInvalidatesLayout } from "../src/config/Config.ts";
import { Config, Direction, Node } from "../src/index.ts";
import type { Logger } from "../src/index.ts";

describe("ConfigCloningTest", () => {
  let config: Config;

  // A static member of the fixture in C++; created in beforeEach here so that
  // the module can be loaded without constructing a node.
  let clonedNode: Node;
  const cloneNode = (): Node | null => {
    return clonedNode;
  };
  const doNotClone = (): Node | null => {
    return null;
  };

  beforeEach(() => {
    config = new Config();
    clonedNode = new Node();
  });

  afterEach(() => {
    config.free();
  });

  test("uses_values_provided_by_cloning_callback", () => {
    config.setCloneNodeFunc(cloneNode);

    const node = new Node();
    const owner = new Node();
    const clone = config.cloneNode(node, owner, 0);

    expect(clone).toBe(clonedNode);
  });

  test("falls_back_to_regular_cloning_if_callback_returns_null", () => {
    config.setCloneNodeFunc(doNotClone);

    const node = new Node();
    const owner = new Node();
    const clone = config.cloneNode(node, owner, 0);

    expect(clone).not.toBe(null);
    clone.free();
  });
});

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

  test("config_set_logger_null_resets_to_default_logger", () => {
    const config = new Config();

    // Track whether our custom logger was called
    // (C++ stores a `bool*` in the config context; here it is a flag object.)
    const state = { customLoggerCalled: false };
    config.setContext(state);

    const customLogger: Logger = (cfg, _node, _level, _message) => {
      const called = cfg?.getContext() as typeof state;
      called.customLoggerCalled = true;
    };

    // Set custom logger and verify it's invoked via layout warning
    config.setLogger(customLogger);
    const node = new Node(config);
    node.calculateLayout(undefined, undefined, Direction.LTR);
    // Trigger a log by setting a negative point scale factor (which logs before
    // throwing)
    state.customLoggerCalled = false;
    expect(() => config.setPointScaleFactor(-1.0)).toThrow();
    expect(state.customLoggerCalled).toBe(true);

    // Reset logger to null — should fall back to default logger
    config.setLogger(null);
    state.customLoggerCalled = false;
    expect(() => config.setPointScaleFactor(-2.0)).toThrow();
    // Custom logger should NOT have been called since we reset to default
    expect(state.customLoggerCalled).toBe(false);

    node.free();
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

    // Changing useWebDefaults should invalidate
    config2.setUseWebDefaults(true);
    expect(configUpdateInvalidatesLayout(config1, config2)).toBe(true);

    // Make them match again
    config1.setUseWebDefaults(true);
    expect(configUpdateInvalidatesLayout(config1, config2)).toBe(false);

    config1.free();
    config2.free();
  });

});
