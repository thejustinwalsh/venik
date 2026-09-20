// Port of yoga-cpp/yoga/style/GridLine.h

// https://www.w3.org/TR/css-grid-1/#typedef-grid-row-start-grid-line
export const GridLineType = {
  Auto: 0,
  Integer: 1,
  Span: 2,
} as const;
export type GridLineType = (typeof GridLineType)[keyof typeof GridLineType];

/** Immutable plain data; compare with `equals` (C++ `operator==`). */
export class GridLine {
  readonly type: GridLineType;
  /** Line position (1, 2, -1, -2, etc) */
  readonly integer: number;

  private constructor(type: GridLineType, integer: number) {
    this.type = type;
    this.integer = integer;
  }

  /** `GridLine::auto_()` */
  static auto(): GridLine {
    return new GridLine(GridLineType.Auto, 0);
  }

  static fromInteger(value: number): GridLine {
    return new GridLine(GridLineType.Integer, value);
  }

  static span(value: number): GridLine {
    return new GridLine(GridLineType.Span, value);
  }

  isAuto(): boolean {
    return this.type === GridLineType.Auto;
  }

  isInteger(): boolean {
    return this.type === GridLineType.Integer;
  }

  isSpan(): boolean {
    return this.type === GridLineType.Span;
  }

  equals(other: GridLine): boolean {
    return this.type === other.type && this.integer === other.integer;
  }
}
