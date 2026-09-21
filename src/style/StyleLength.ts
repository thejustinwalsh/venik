import { Unit } from "../enums.ts";
import { inexactEquals as inexactEqualsNumber } from "../math.ts";
import type { Value } from "../types.ts";

/**
 * A CSS value for lengths and sizes (e.g. margin, gap, width, min-height,
 * flex-basis). It may be one of:
 * 1. Undefined
 * 2. The `auto` keyword
 * 3. A CSS <length-percentage> value:
 *    a. <length> value (e.g. 10px)
 *    b. <percentage> value of a reference <length>
 *
 * References:
 * 1. https://www.w3.org/TR/css-values-4/#lengths
 * 2. https://www.w3.org/TR/css-values-4/#percentage-value
 * 3. https://www.w3.org/TR/css-values-4/#mixed-percentages
 *
 * Instances are immutable. Direct construction using value and unit is
 * intentionally not part of the API, to avoid invalid or redundant
 * combinations; `new StyleLength()` is the undefined length.
 */
export class StyleLength {
  private value_: number = NaN;
  private unit_: Unit = Unit.Undefined;

  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  private static make(value: number, unit: Unit): StyleLength {
    const length = new StyleLength();
    length.value_ = value;
    length.unit_ = unit;
    return length;
  }

  private static readonly UNDEFINED = new StyleLength();
  private static readonly AUTO = StyleLength.make(NaN, Unit.Auto);
  private static readonly ZERO = StyleLength.make(0, Unit.Point);

  /**
   * Undefined if `value` is NaN or infinite. Returns `reuse` instead of a new
   * instance if that already is this length, which keeps a style setter called
   * with an unchanged value (every frame, say) from allocating.
   */
  static points(value: number, reuse?: StyleLength): StyleLength {
    if (!Number.isFinite(value)) {
      return StyleLength.UNDEFINED;
    }
    return reuse !== undefined && reuse.unit_ === Unit.Point && reuse.value_ === value
      ? reuse
      : StyleLength.make(value, Unit.Point);
  }

  /** Like `points`, for a percentage. */
  static percent(value: number, reuse?: StyleLength): StyleLength {
    if (!Number.isFinite(value)) {
      return StyleLength.UNDEFINED;
    }
    return reuse !== undefined && reuse.unit_ === Unit.Percent && reuse.value_ === value
      ? reuse
      : StyleLength.make(value, Unit.Percent);
  }

  static ofAuto(): StyleLength {
    return StyleLength.AUTO;
  }

  static zero(): StyleLength {
    return StyleLength.ZERO;
  }

  static undefined(): StyleLength {
    return StyleLength.UNDEFINED;
  }

  isAuto(): boolean {
    return this.unit_ === Unit.Auto;
  }

  isUndefined(): boolean {
    return this.unit_ === Unit.Undefined;
  }

  isDefined(): boolean {
    return this.unit_ !== Unit.Undefined;
  }

  isPercent(): boolean {
    return this.unit_ === Unit.Percent;
  }

  /** The length in points, or NaN when it is undefined or auto. */
  resolve(referenceLength: number): number {
    switch (this.unit_) {
      case Unit.Point:
        return this.value_;
      case Unit.Percent:
        return this.value_ * referenceLength * 0.01;
      default:
        return NaN;
    }
  }

  /** C++ `explicit operator YGValue()`. */
  toValue(): Value {
    return { unit: this.unit_, value: this.value_ };
  }

  /** C++ `operator==`. */
  equals(rhs: StyleLength): boolean {
    return (
      this.unit_ === rhs.unit_ &&
      (this.value_ === rhs.value_ || (this.value_ !== this.value_ && rhs.value_ !== rhs.value_))
    );
  }

  inexactEquals(other: StyleLength): boolean {
    return this.unit_ === other.unit_ && inexactEqualsNumber(this.value_, other.value_);
  }
}
