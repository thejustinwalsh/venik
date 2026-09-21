import type { SizingMode, Unit } from "./enums.ts";
import type { Node } from "./node/Node.ts";

/** Equivalent of `YGUndefined`. Setters also accept `undefined`. */
export const Undefined: number = NaN;

export type Size = {
  width: number;
  height: number;
};

/**
 * A style length as the style getters return it. It is the node's own
 * immutable length rather than a copy, so reading a style allocates nothing.
 */
export type Value = {
  readonly unit: Unit;
  readonly value: number;
};

export type Percent = `${number}%`;

/**
 * Same leading parameters as yoga-layout; the node being measured is passed
 * as a trailing argument (the C API passes it first).
 */
export type MeasureFunction = (
  width: number,
  widthMode: SizingMode,
  height: number,
  heightMode: SizingMode,
  node: Node,
) => Size;

export type BaselineFunction = (width: number, height: number, node: Node) => number;

export type DirtiedFunction = (node: Node) => void;
