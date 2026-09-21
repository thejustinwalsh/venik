import { Unit } from "../enums.ts";
import { inexactEquals as inexactEqualsNumber } from "../math.ts";

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
 * combinations.
 */
export class StyleLength {
  // Public and read-only, so that a `StyleLength` is itself the `Value` the
  // style getters hand out: reading a style allocates nothing.
  readonly value: number;
  readonly unit: Unit;

  // We intentionally do not allow direct construction using value and unit, to
  // avoid invalid, or redundant combinations.
  private constructor(value: number, unit: Unit) {
    this.value = value;
    this.unit = unit;
  }

  private static make(value: number, unit: Unit): StyleLength {
    return new StyleLength(value, unit);
  }

  private static readonly UNDEFINED = StyleLength.make(NaN, Unit.Undefined);
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
    return reuse !== undefined && reuse.unit === Unit.Point && reuse.value === value
      ? reuse
      : StyleLength.make(value, Unit.Point);
  }

  /** Like `points`, for a percentage. */
  static percent(value: number, reuse?: StyleLength): StyleLength {
    if (!Number.isFinite(value)) {
      return StyleLength.UNDEFINED;
    }
    return reuse !== undefined && reuse.unit === Unit.Percent && reuse.value === value
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
    return this.unit === Unit.Auto;
  }

  isUndefined(): boolean {
    return this.unit === Unit.Undefined;
  }

  isDefined(): boolean {
    return this.unit !== Unit.Undefined;
  }

  isPercent(): boolean {
    return this.unit === Unit.Percent;
  }

  /** The length in points, or NaN when it is undefined or auto. */
  resolve(referenceLength: number): number {
    switch (this.unit) {
      case Unit.Point:
        return this.value;
      case Unit.Percent:
        return this.value * referenceLength * 0.01;
      default:
        return NaN;
    }
  }

  /** C++ `operator==`. */
  equals(rhs: StyleLength): boolean {
    return (
      this.unit === rhs.unit &&
      (this.value === rhs.value || (this.value !== this.value && rhs.value !== rhs.value))
    );
  }

  inexactEquals(other: StyleLength): boolean {
    return this.unit === other.unit && inexactEqualsNumber(this.value, other.value);
  }
}
