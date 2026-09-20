// Design: `FloatOptional` is an immutable value class wrapping a number where
// NaN means "undefined". C++ operators become methods on the left operand:
//
//   lhs == rhs   -> lhs.equals(rhs)        (rhs may be a FloatOptional or a plain number)
//   lhs != rhs   -> !lhs.equals(rhs)
//   lhs + rhs    -> lhs.add(rhs)
//   lhs > rhs    -> lhs.greaterThan(rhs)
//   lhs < rhs    -> lhs.lessThan(rhs)
//   lhs >= rhs   -> lhs.greaterThanOrEquals(rhs)
//   lhs <= rhs   -> lhs.lessThanOrEquals(rhs)
//
// `maxOrDefined` for FloatOptional is a free function of the same name in this
// module; the plain-number version lives in `./Comparison.ts`.
//
import { maxOrDefined as maxOrDefinedNumber } from "./Comparison.ts";

export class FloatOptional {
  private readonly value_: number;

  /** `new FloatOptional()` is the undefined optional (NaN). */
  constructor(value: number = NaN) {
    this.value_ = value;
  }

  /** Returns the wrapped value, or NaN if undefined. */
  unwrap(): number {
    return this.value_;
  }

  unwrapOrDefault(defaultValue: number): number {
    return this.isUndefined() ? defaultValue : this.value_;
  }

  isUndefined(): boolean {
    return Number.isNaN(this.value_);
  }

  isDefined(): boolean {
    return !Number.isNaN(this.value_);
  }

  /** `operator==`: equal values, or both undefined. */
  equals(rhs: FloatOptional | number): boolean {
    const other = typeof rhs === "number" ? rhs : rhs.value_;
    return this.value_ === other || (Number.isNaN(this.value_) && Number.isNaN(other));
  }

  /** `operator+`: undefined if either side is undefined. */
  add(rhs: FloatOptional): FloatOptional {
    return new FloatOptional(this.value_ + rhs.value_);
  }

  /** `operator>`: false if either side is undefined. */
  greaterThan(rhs: FloatOptional): boolean {
    return this.value_ > rhs.value_;
  }

  /** `operator<`: false if either side is undefined. */
  lessThan(rhs: FloatOptional): boolean {
    return this.value_ < rhs.value_;
  }

  /** `operator>=`: `greaterThan(rhs) || equals(rhs)`. */
  greaterThanOrEquals(rhs: FloatOptional): boolean {
    return this.greaterThan(rhs) || this.equals(rhs);
  }

  /** `operator<=`: `lessThan(rhs) || equals(rhs)`. */
  lessThanOrEquals(rhs: FloatOptional): boolean {
    return this.lessThan(rhs) || this.equals(rhs);
  }
}

export function maxOrDefined(lhs: FloatOptional, rhs: FloatOptional): FloatOptional {
  return new FloatOptional(maxOrDefinedNumber(lhs.unwrap(), rhs.unwrap()));
}
