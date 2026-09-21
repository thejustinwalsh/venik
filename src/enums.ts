export const Align = {
  Auto: 0,
  FlexStart: 1,
  Center: 2,
  FlexEnd: 3,
  Stretch: 4,
  Baseline: 5,
  SpaceBetween: 6,
  SpaceAround: 7,
  SpaceEvenly: 8,
  Start: 9,
  End: 10,
} as const;
export type Align = (typeof Align)[keyof typeof Align];

export const BoxSizing = {
  BorderBox: 0,
  ContentBox: 1,
} as const;
export type BoxSizing = (typeof BoxSizing)[keyof typeof BoxSizing];

export const Dimension = {
  Width: 0,
  Height: 1,
} as const;
export type Dimension = (typeof Dimension)[keyof typeof Dimension];

export const Direction = {
  Inherit: 0,
  LTR: 1,
  RTL: 2,
} as const;
export type Direction = (typeof Direction)[keyof typeof Direction];

export const Display = {
  Flex: 0,
  None: 1,
  Contents: 2,
} as const;
export type Display = (typeof Display)[keyof typeof Display];

export const Edge = {
  Left: 0,
  Top: 1,
  Right: 2,
  Bottom: 3,
  Start: 4,
  End: 5,
  Horizontal: 6,
  Vertical: 7,
  All: 8,
} as const;
export type Edge = (typeof Edge)[keyof typeof Edge];

export const FlexDirection = {
  Column: 0,
  ColumnReverse: 1,
  Row: 2,
  RowReverse: 3,
} as const;
export type FlexDirection = (typeof FlexDirection)[keyof typeof FlexDirection];

export const Gutter = {
  Column: 0,
  Row: 1,
  All: 2,
} as const;
export type Gutter = (typeof Gutter)[keyof typeof Gutter];

export const Justify = {
  Auto: 0,
  FlexStart: 1,
  Center: 2,
  FlexEnd: 3,
  SpaceBetween: 4,
  SpaceAround: 5,
  SpaceEvenly: 6,
  Stretch: 7,
  Start: 8,
  End: 9,
} as const;
export type Justify = (typeof Justify)[keyof typeof Justify];

export const Overflow = {
  Visible: 0,
  Hidden: 1,
  Scroll: 2,
} as const;
export type Overflow = (typeof Overflow)[keyof typeof Overflow];

export const PositionType = {
  Static: 0,
  Relative: 1,
  Absolute: 2,
} as const;
export type PositionType = (typeof PositionType)[keyof typeof PositionType];

/**
 * A CSS auto box size: how an available size constrains the box being laid out or measured.
 * https://www.w3.org/TR/css-sizing-3/#auto-box-sizes
 * https://www.w3.org/TR/css-flexbox-1/#min-size-auto
 */
export const SizingMode = {
  /**
   * The size a box would take if its outer size filled the available space in
   * the given axis; in other words, the stretch fit into the available space,
   * if that is definite. Undefined if the available space is indefinite.
   */
  StretchFit: 0,
  /**
   * A box's "ideal" size in a given axis when given infinite available space.
   * Usually this is the smallest size the box could take in that axis while
   * still fitting around its contents, i.e. minimizing unfilled space while
   * avoiding overflow.
   */
  MaxContent: 1,
  /**
   * If the available space in a given axis is definite, equal to
   * clamp(min-content size, stretch-fit size, max-content size) (i.e.
   * max(min-content size, min(max-content size, stretch-fit size))). When
   * sizing under a min-content constraint, equal to the min-content size.
   * Otherwise, equal to the max-content size in that axis.
   */
  FitContent: 2,
} as const;
export type SizingMode = (typeof SizingMode)[keyof typeof SizingMode];

export const Unit = {
  Undefined: 0,
  Point: 1,
  Percent: 2,
  Auto: 3,
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const Wrap = {
  NoWrap: 0,
  Wrap: 1,
  WrapReverse: 2,
} as const;
export type Wrap = (typeof Wrap)[keyof typeof Wrap];
