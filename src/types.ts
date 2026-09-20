import type { Config } from "./config/Config.ts";
import type { LogLevel, MeasureMode, Unit } from "./enums.ts";
import type { Node } from "./node/Node.ts";

/** Equivalent of `YGUndefined`. Setters also accept `undefined`. */
export const Undefined: number = NaN;

export type Layout = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type Size = {
  width: number;
  height: number;
};

/** Equivalent of `YGValue`. */
export type Value = {
  unit: Unit;
  value: number;
};

export type Percent = `${number}%`;

/**
 * Same leading parameters as yoga-layout; the node being measured is passed
 * as a trailing argument (the C API passes it first).
 */
export type MeasureFunction = (
  width: number,
  widthMode: MeasureMode,
  height: number,
  heightMode: MeasureMode,
  node: Node,
) => Size;

export type BaselineFunction = (width: number, height: number, node: Node) => number;

export type DirtiedFunction = (node: Node) => void;

/** Returns the clone that should replace `oldNode`, or null to use the default `oldNode.clone()`. */
export type CloneNodeFunction = (oldNode: Node, owner: Node, childIndex: number) => Node | null;

/** The C API passes a printf format + va_list; here the message arrives already formatted. */
export type Logger = (
  config: Config | null,
  node: Node | null,
  level: LogLevel,
  message: string,
) => void;
