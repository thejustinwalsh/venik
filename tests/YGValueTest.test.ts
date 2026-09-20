// Port of yoga-cpp/tests/YGValueTest.cpp
//
// The C++ test exercises `operator==(YGValue, YGValue)`, which is
// `valueEquals` in src/YGValue.ts (ASSERT_EQ -> true, ASSERT_NE -> false).

import { expect, test } from "vitest";
import { Undefined, Unit } from "../src/index.ts";
import { valueEquals } from "../src/YGValue.ts";

test("supports_equality", () => {
  expect(
    valueEquals({ value: 12.5, unit: Unit.Percent }, { value: 12.5, unit: Unit.Percent }),
  ).toBe(true);
  expect(
    valueEquals({ value: 12.5, unit: Unit.Percent }, { value: 56.7, unit: Unit.Percent }),
  ).toBe(false);
  expect(valueEquals({ value: 12.5, unit: Unit.Percent }, { value: 12.5, unit: Unit.Point })).toBe(
    false,
  );
  expect(valueEquals({ value: 12.5, unit: Unit.Percent }, { value: 12.5, unit: Unit.Auto })).toBe(
    false,
  );
  expect(
    valueEquals({ value: 12.5, unit: Unit.Percent }, { value: 12.5, unit: Unit.Undefined }),
  ).toBe(false);

  expect(
    valueEquals(
      { value: 12.5, unit: Unit.Undefined },
      { value: Undefined, unit: Unit.Undefined },
    ),
  ).toBe(true);
  expect(valueEquals({ value: 0, unit: Unit.Auto }, { value: -1, unit: Unit.Auto })).toBe(true);
});
