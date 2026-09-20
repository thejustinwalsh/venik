// C++ operators map to FloatOptional methods (see src/numeric/FloatOptional.ts):
// `a == b` -> `a.equals(b)`, `a != b` -> `!a.equals(b)`, `a > b` -> `a.greaterThan(b)`,
// `a + b` -> `a.add(b)`, ... `ASSERT_EQ` on FloatOptionals uses `operator==`, hence `equals`.

import { describe, expect, test } from "vitest";
import { Undefined } from "../src/index.ts";
import { FloatOptional, maxOrDefined } from "../src/numeric/FloatOptional.ts";

const empty = new FloatOptional();
const zero = new FloatOptional(0);
const one = new FloatOptional(1);
const positive = new FloatOptional(1234.5);
const negative = new FloatOptional(-9876.5);

describe("FloatOptional", () => {
  test("value", () => {
    expect(empty.unwrap()).toBeNaN();
    expect(zero.unwrap()).toBe(0);
    expect(one.unwrap()).toBe(1);
    expect(positive.unwrap()).toBe(1234.5);
    expect(negative.unwrap()).toBe(-9876.5);

    expect(empty.isUndefined()).toBe(true);
    expect(zero.isUndefined()).toBe(false);
    expect(one.isUndefined()).toBe(false);
    expect(positive.isUndefined()).toBe(false);
    expect(negative.isUndefined()).toBe(false);
  });

  test("equality", () => {
    expect(empty.equals(empty)).toBe(true);
    expect(empty.equals(Undefined)).toBe(true);
    expect(empty.equals(zero)).toBe(false);
    expect(empty.equals(negative)).toBe(false);
    expect(empty.equals(12.3)).toBe(false);

    expect(zero.equals(zero)).toBe(true);
    expect(zero.equals(0)).toBe(true);
    expect(zero.equals(positive)).toBe(false);
    expect(zero.equals(-5555.5)).toBe(false);

    expect(one.equals(one)).toBe(true);
    expect(one.equals(1)).toBe(true);
    expect(one.equals(positive)).toBe(false);

    expect(positive.equals(positive)).toBe(true);
    expect(positive.equals(positive.unwrap())).toBe(true);
    expect(positive.equals(one)).toBe(false);

    expect(negative.equals(negative)).toBe(true);
    expect(negative.equals(negative.unwrap())).toBe(true);
    expect(negative.equals(zero)).toBe(false);
  });

  test("inequality", () => {
    expect(!empty.equals(empty)).toBe(false);
    expect(!empty.equals(Undefined)).toBe(false);
    expect(!empty.equals(zero)).toBe(true);
    expect(!empty.equals(negative)).toBe(true);
    expect(!empty.equals(12.3)).toBe(true);

    expect(!zero.equals(zero)).toBe(false);
    expect(!zero.equals(0)).toBe(false);
    expect(!zero.equals(positive)).toBe(true);
    expect(!zero.equals(-5555.5)).toBe(true);

    expect(!one.equals(one)).toBe(false);
    expect(!one.equals(1)).toBe(false);
    expect(!one.equals(positive)).toBe(true);

    expect(!positive.equals(positive)).toBe(false);
    expect(!positive.equals(positive.unwrap())).toBe(false);
    expect(!positive.equals(one)).toBe(true);

    expect(!negative.equals(negative)).toBe(false);
    expect(!negative.equals(negative.unwrap())).toBe(false);
    expect(!negative.equals(zero)).toBe(true);
  });

  test("greater_than_with_undefined", () => {
    expect(empty.greaterThan(empty)).toBe(false);
    expect(empty.greaterThan(zero)).toBe(false);
    expect(empty.greaterThan(one)).toBe(false);
    expect(empty.greaterThan(positive)).toBe(false);
    expect(empty.greaterThan(negative)).toBe(false);
    expect(zero.greaterThan(empty)).toBe(false);
    expect(one.greaterThan(empty)).toBe(false);
    expect(positive.greaterThan(empty)).toBe(false);
    expect(negative.greaterThan(empty)).toBe(false);
  });

  test("greater_than", () => {
    expect(zero.greaterThan(negative)).toBe(true);
    expect(zero.greaterThan(zero)).toBe(false);
    expect(zero.greaterThan(positive)).toBe(false);
    expect(zero.greaterThan(one)).toBe(false);

    expect(one.greaterThan(negative)).toBe(true);
    expect(one.greaterThan(zero)).toBe(true);
    expect(one.greaterThan(positive)).toBe(false);

    expect(negative.greaterThan(new FloatOptional(-Infinity))).toBe(true);
  });

  test("less_than_with_undefined", () => {
    expect(empty.lessThan(empty)).toBe(false);
    expect(zero.lessThan(empty)).toBe(false);
    expect(one.lessThan(empty)).toBe(false);
    expect(positive.lessThan(empty)).toBe(false);
    expect(negative.lessThan(empty)).toBe(false);
    expect(empty.lessThan(zero)).toBe(false);
    expect(empty.lessThan(one)).toBe(false);
    expect(empty.lessThan(positive)).toBe(false);
    expect(empty.lessThan(negative)).toBe(false);
  });

  test("less_than", () => {
    expect(negative.lessThan(zero)).toBe(true);
    expect(zero.lessThan(zero)).toBe(false);
    expect(positive.lessThan(zero)).toBe(false);
    expect(one.lessThan(zero)).toBe(false);

    expect(negative.lessThan(one)).toBe(true);
    expect(zero.lessThan(one)).toBe(true);
    expect(positive.lessThan(one)).toBe(false);

    expect(new FloatOptional(-Infinity).lessThan(negative)).toBe(true);
  });

  test("greater_than_equals_with_undefined", () => {
    expect(empty.greaterThanOrEquals(empty)).toBe(true);
    expect(empty.greaterThanOrEquals(zero)).toBe(false);
    expect(empty.greaterThanOrEquals(one)).toBe(false);
    expect(empty.greaterThanOrEquals(positive)).toBe(false);
    expect(empty.greaterThanOrEquals(negative)).toBe(false);
    expect(zero.greaterThanOrEquals(empty)).toBe(false);
    expect(one.greaterThanOrEquals(empty)).toBe(false);
    expect(positive.greaterThanOrEquals(empty)).toBe(false);
    expect(negative.greaterThanOrEquals(empty)).toBe(false);
  });

  test("greater_than_equals", () => {
    expect(zero.greaterThanOrEquals(negative)).toBe(true);
    expect(zero.greaterThanOrEquals(zero)).toBe(true);
    expect(zero.greaterThanOrEquals(positive)).toBe(false);
    expect(zero.greaterThanOrEquals(one)).toBe(false);

    expect(one.greaterThanOrEquals(negative)).toBe(true);
    expect(one.greaterThanOrEquals(zero)).toBe(true);
    expect(one.greaterThanOrEquals(positive)).toBe(false);

    expect(negative.greaterThanOrEquals(new FloatOptional(-Infinity))).toBe(true);
  });

  test("less_than_equals_with_undefined", () => {
    expect(empty.lessThanOrEquals(empty)).toBe(true);
    expect(zero.lessThanOrEquals(empty)).toBe(false);
    expect(one.lessThanOrEquals(empty)).toBe(false);
    expect(positive.lessThanOrEquals(empty)).toBe(false);
    expect(negative.lessThanOrEquals(empty)).toBe(false);
    expect(empty.lessThanOrEquals(zero)).toBe(false);
    expect(empty.lessThanOrEquals(one)).toBe(false);
    expect(empty.lessThanOrEquals(positive)).toBe(false);
    expect(empty.lessThanOrEquals(negative)).toBe(false);
  });

  test("less_than_equals", () => {
    expect(negative.lessThanOrEquals(zero)).toBe(true);
    expect(zero.lessThanOrEquals(zero)).toBe(true);
    expect(positive.lessThanOrEquals(zero)).toBe(false);
    expect(one.lessThanOrEquals(zero)).toBe(false);

    expect(negative.lessThanOrEquals(one)).toBe(true);
    expect(zero.lessThanOrEquals(one)).toBe(true);
    expect(positive.lessThanOrEquals(one)).toBe(false);

    expect(new FloatOptional(-Infinity).lessThanOrEquals(negative)).toBe(true);
  });

  test("addition", () => {
    const n = negative.unwrap();
    const p = positive.unwrap();

    expect(zero.add(one).equals(one)).toBe(true);
    expect(negative.add(positive).equals(new FloatOptional(n + p))).toBe(true);
    expect(empty.add(zero).equals(empty)).toBe(true);
    expect(empty.add(empty).equals(empty)).toBe(true);
    expect(negative.add(empty).equals(empty)).toBe(true);
  });
});

describe("YGFloatOptiona", () => {
  test("maxOrDefined", () => {
    expect(maxOrDefined(empty, empty).equals(empty)).toBe(true);
    expect(maxOrDefined(empty, positive).equals(positive)).toBe(true);
    expect(maxOrDefined(negative, empty).equals(negative)).toBe(true);
    expect(maxOrDefined(negative, new FloatOptional(-Infinity)).equals(negative)).toBe(true);
    expect(
      maxOrDefined(new FloatOptional(1), new FloatOptional(1.125)).equals(new FloatOptional(1.125)),
    ).toBe(true);
  });
});

describe("FloatOptional", () => {
  test("unwrap", () => {
    expect(empty.unwrap()).toBeNaN();
    expect(zero.unwrap()).toBe(0);
    // C++: FloatOptional{123456.78f}. 123456.78125 is that float32 value exactly, so the
    // round trip holds whether or not the implementation rounds to float32.
    expect(new FloatOptional(123456.78125).unwrap()).toBe(123456.78125);
  });
});
