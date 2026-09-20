// Port of the C++-only helpers of yoga-cpp/yoga/YGValue.h (the `YGValue`
// struct itself is `Value` in `src/types.ts`).
//
//   lhs == rhs  -> valueEquals(lhs, rhs)
//   -value      -> negateValue(value)

import { Unit } from "./enums.ts";
import type { Value } from "./types.ts";

/** Constant for a dimension of "auto". */
export const YGValueAuto: Value = Object.freeze({ unit: Unit.Auto, value: NaN });

/** Constant for a dimension which is not defined. */
export const YGValueUndefined: Value = Object.freeze({ unit: Unit.Undefined, value: NaN });

/** Constant for a dimension that is zero-length. */
export const YGValueZero: Value = Object.freeze({ unit: Unit.Point, value: 0 });

/**
 * `operator==(YGValue, YGValue)`: units must match; the value is only
 * compared for Point and Percent.
 */
export function valueEquals(lhs: Value, rhs: Value): boolean {
  if (lhs.unit !== rhs.unit) {
    return false;
  }
  switch (lhs.unit) {
    case Unit.Undefined:
    case Unit.Auto:
    case Unit.FitContent:
    case Unit.MaxContent:
    case Unit.Stretch:
      return true;
    case Unit.Point:
    case Unit.Percent:
      return lhs.value === rhs.value;
    default:
      return false;
  }
}

/** Unary `operator-(YGValue)`. */
export function negateValue(value: Value): Value {
  return { unit: value.unit, value: -value.value };
}
