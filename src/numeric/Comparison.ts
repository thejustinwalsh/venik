// Port of yoga-cpp/yoga/numeric/Comparison.h
//
// C++ overloads on float/double/std::array collapse as follows:
//   - `inexactEquals(float|double, float|double)` -> `inexactEquals(a, b)`
//   - `inexactEquals(std::array, std::array)`     -> `inexactEqualsArray(a, b)`
// The `FloatOptional` overloads of `maxOrDefined`/`inexactEquals` live in
// `./FloatOptional.ts`.

/** max(a, b) if both are defined, otherwise whichever one is defined (NaN if neither). */
export function maxOrDefined(a: number, b: number): number {
  if (a === a && b === b) {
    return Math.max(a, b);
  }
  return a !== a ? b : a;
}

/** min(a, b) if both are defined, otherwise whichever one is defined (NaN if neither). */
export function minOrDefined(a: number, b: number): number {
  if (a === a && b === b) {
    return Math.min(a, b);
  }
  return a !== a ? b : a;
}

/**
 * Custom equality function using a hardcoded epsilon of 0.0001, or returning
 * true if both numbers are NaN.
 */
export function inexactEquals(a: number, b: number): boolean {
  if (a === a && b === b) {
    return Math.abs(a - b) < 0.0001;
  }
  return a !== a && b !== b;
}

/** Element-wise `inexactEquals` of two equally sized arrays. */
export function inexactEqualsArray(val1: readonly number[], val2: readonly number[]): boolean {
  for (let i = 0; i < val1.length; i++) {
    if (!inexactEquals(val1[i]!, val2[i]!)) {
      return false;
    }
  }
  return true;
}
