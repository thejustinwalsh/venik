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

/**
 * Whether two available sizes are the same question to put to the algorithm.
 * Sizes within the epsilon are, with one exception: a node measured under a
 * fit-content mode takes the size it is given when that size is zero or less,
 * and works its content out when it is more (`isFixedSize`). Two sizes on
 * either side of that step have different answers however close they are, so a
 * result found for one must not be handed to the other.
 */
export function sameAvailableSize(a: number, b: number): boolean {
  return inexactEquals(a, b) && a <= 0 === b <= 0;
}
