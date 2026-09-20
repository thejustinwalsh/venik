// Port of yoga-cpp/yoga/enums/YogaEnums.h
//
// C++ specialises `ordinalCount<EnumT>()` per enum and takes the enum as a
// template argument. Here the enum *object* from `src/enums.ts` is passed as
// a regular argument: `ordinals(Edge)`, `ordinalCount(Edge)`.
//
// Only meaningful for sequential enums (values 0..n-1), i.e. not for the
// bitfield enum `PrintOptions`.

/** Shape of the `as const` enum objects in `src/enums.ts`. */
export type EnumObject = Readonly<Record<string, number>>;

/** Count of ordinals in a Yoga enum which is sequential. */
export function ordinalCount(enumObject: EnumObject): number {
  return Object.keys(enumObject).length;
}

/** Count of bits needed to represent every ordinal. */
export function bitCount(enumObject: EnumObject): number {
  return 32 - Math.clz32(ordinalCount(enumObject) - 1);
}

/** Iterates through every value of a sequential Yoga enum, in ordinal order. */
export function ordinals<T extends EnumObject>(enumObject: T): Iterable<T[keyof T]> {
  return (Object.values(enumObject) as T[keyof T][]).sort((a, b) => a - b);
}
