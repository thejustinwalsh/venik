import { Unit } from "../enums.ts";
import { inexactEquals as inexactEqualsNumber } from "../numeric/Comparison.ts";
import { FloatOptional } from "../numeric/FloatOptional.ts";
import type { Value } from "../types.ts";

/**
 * This class represents a CSS Value for sizes (e.g. width, height, min-width,
 * etc.). It may be one of:
 * 1. Undefined
 * 2. A keyword (e.g. auto)
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

  /** Undefined if `value` is NaN or infinite. */
  static points(value: number): StyleLength {
    return Number.isFinite(value) ? StyleLength.make(value, Unit.Point) : StyleLength.UNDEFINED;
  }

  /** Undefined if `value` is NaN or infinite. */
  static percent(value: number): StyleLength {
    return Number.isFinite(value) ? StyleLength.make(value, Unit.Percent) : StyleLength.UNDEFINED;
  }

  static ofAuto(): StyleLength {
    return StyleLength.AUTO;
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

  value(): FloatOptional {
    return new FloatOptional(this.value_);
  }

  resolve(referenceLength: number): FloatOptional {
    return new FloatOptional(this.resolveValue(referenceLength));
  }

  /** Allocation-free `resolve` for the layout algorithm: NaN when undefined. */
  resolveValue(referenceLength: number): number {
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
      (this.value_ === rhs.value_ || (Number.isNaN(this.value_) && Number.isNaN(rhs.value_)))
    );
  }

  inexactEquals(other: StyleLength): boolean {
    return this.unit_ === other.unit_ && inexactEqualsNumber(this.value_, other.value_);
  }
}
