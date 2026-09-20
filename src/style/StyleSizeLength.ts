import { Unit } from "../enums.ts";
import { inexactEquals as inexactEqualsNumber } from "../numeric/Comparison.ts";
import { FloatOptional } from "../numeric/FloatOptional.ts";
import type { Value } from "../types.ts";

/**
 * This class represents a CSS Value for sizes (e.g. width, height, min-width,
 * etc.). It may be one of:
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
 * combinations; `new StyleSizeLength()` is the undefined length.
 */
export class StyleSizeLength {
  private value_: number = NaN;
  private unit_: Unit = Unit.Undefined;

  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  private static make(value: number, unit: Unit): StyleSizeLength {
    const length = new StyleSizeLength();
    length.value_ = value;
    length.unit_ = unit;
    return length;
  }

  private static readonly UNDEFINED = new StyleSizeLength();
  private static readonly AUTO = StyleSizeLength.make(NaN, Unit.Auto);

  /** Undefined if `value` is NaN or infinite. */
  static points(value: number): StyleSizeLength {
    return Number.isFinite(value)
      ? StyleSizeLength.make(value, Unit.Point)
      : StyleSizeLength.UNDEFINED;
  }

  /** Undefined if `value` is NaN or infinite. */
  static percent(value: number): StyleSizeLength {
    return Number.isFinite(value)
      ? StyleSizeLength.make(value, Unit.Percent)
      : StyleSizeLength.UNDEFINED;
  }

  static ofAuto(): StyleSizeLength {
    return StyleSizeLength.AUTO;
  }

  static undefined(): StyleSizeLength {
    return StyleSizeLength.UNDEFINED;
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
  equals(rhs: StyleSizeLength): boolean {
    return (
      this.unit_ === rhs.unit_ &&
      (this.value_ === rhs.value_ || (Number.isNaN(this.value_) && Number.isNaN(rhs.value_)))
    );
  }

  inexactEquals(other: StyleSizeLength): boolean {
    return this.unit_ === other.unit_ && inexactEqualsNumber(this.value_, other.value_);
  }
}
