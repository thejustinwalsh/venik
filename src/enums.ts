// Originally generated from Yoga's yoga/YGEnums.h.

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
  Grid: 3,
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

export const Errata = {
  None: 0,
  StretchFlexBasis: 1,
  AbsolutePositionWithoutInsetsExcludesPadding: 2,
  AbsolutePercentAgainstInnerSize: 4,
  MinSizeUndefinedInsteadOfAuto: 8,
  FlexFirstPassUsesRunningTotals: 16,
  All: 2147483647,
  Classic: 2147483646,
} as const;
export type Errata = number;

export const ExperimentalFeature = {
  WebFlexBasis: 0,
  FixFlexBasisFitContent: 1,
} as const;
export type ExperimentalFeature = (typeof ExperimentalFeature)[keyof typeof ExperimentalFeature];

export const FlexDirection = {
  Column: 0,
  ColumnReverse: 1,
  Row: 2,
  RowReverse: 3,
} as const;
export type FlexDirection = (typeof FlexDirection)[keyof typeof FlexDirection];

export const GridTrackType = {
  Auto: 0,
  Points: 1,
  Percent: 2,
  Fr: 3,
  Minmax: 4,
} as const;
export type GridTrackType = (typeof GridTrackType)[keyof typeof GridTrackType];

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

export const LogLevel = {
  Error: 0,
  Warn: 1,
  Info: 2,
  Debug: 3,
  Verbose: 4,
  Fatal: 5,
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const MeasureMode = {
  Undefined: 0,
  Exactly: 1,
  AtMost: 2,
} as const;
export type MeasureMode = (typeof MeasureMode)[keyof typeof MeasureMode];

export const NodeType = {
  Default: 0,
  Text: 1,
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

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

export const Unit = {
  Undefined: 0,
  Point: 1,
  Percent: 2,
  Auto: 3,
  MaxContent: 4,
  FitContent: 5,
  Stretch: 6,
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const Wrap = {
  NoWrap: 0,
  Wrap: 1,
  WrapReverse: 2,
} as const;
export type Wrap = (typeof Wrap)[keyof typeof Wrap];

// yoga-layout compatible flat constants
export const ALIGN_AUTO = Align.Auto;
export const ALIGN_FLEX_START = Align.FlexStart;
export const ALIGN_CENTER = Align.Center;
export const ALIGN_FLEX_END = Align.FlexEnd;
export const ALIGN_STRETCH = Align.Stretch;
export const ALIGN_BASELINE = Align.Baseline;
export const ALIGN_SPACE_BETWEEN = Align.SpaceBetween;
export const ALIGN_SPACE_AROUND = Align.SpaceAround;
export const ALIGN_SPACE_EVENLY = Align.SpaceEvenly;
export const ALIGN_START = Align.Start;
export const ALIGN_END = Align.End;
export const BOX_SIZING_BORDER_BOX = BoxSizing.BorderBox;
export const BOX_SIZING_CONTENT_BOX = BoxSizing.ContentBox;
export const DIMENSION_WIDTH = Dimension.Width;
export const DIMENSION_HEIGHT = Dimension.Height;
export const DIRECTION_INHERIT = Direction.Inherit;
export const DIRECTION_LTR = Direction.LTR;
export const DIRECTION_RTL = Direction.RTL;
export const DISPLAY_FLEX = Display.Flex;
export const DISPLAY_NONE = Display.None;
export const DISPLAY_CONTENTS = Display.Contents;
export const DISPLAY_GRID = Display.Grid;
export const EDGE_LEFT = Edge.Left;
export const EDGE_TOP = Edge.Top;
export const EDGE_RIGHT = Edge.Right;
export const EDGE_BOTTOM = Edge.Bottom;
export const EDGE_START = Edge.Start;
export const EDGE_END = Edge.End;
export const EDGE_HORIZONTAL = Edge.Horizontal;
export const EDGE_VERTICAL = Edge.Vertical;
export const EDGE_ALL = Edge.All;
export const ERRATA_NONE = Errata.None;
export const ERRATA_STRETCH_FLEX_BASIS = Errata.StretchFlexBasis;
export const ERRATA_ABSOLUTE_POSITION_WITHOUT_INSETS_EXCLUDES_PADDING = Errata.AbsolutePositionWithoutInsetsExcludesPadding;
export const ERRATA_ABSOLUTE_PERCENT_AGAINST_INNER_SIZE = Errata.AbsolutePercentAgainstInnerSize;
export const ERRATA_MIN_SIZE_UNDEFINED_INSTEAD_OF_AUTO = Errata.MinSizeUndefinedInsteadOfAuto;
export const ERRATA_FLEX_FIRST_PASS_USES_RUNNING_TOTALS = Errata.FlexFirstPassUsesRunningTotals;
export const ERRATA_ALL = Errata.All;
export const ERRATA_CLASSIC = Errata.Classic;
export const EXPERIMENTAL_FEATURE_WEB_FLEX_BASIS = ExperimentalFeature.WebFlexBasis;
export const EXPERIMENTAL_FEATURE_FIX_FLEX_BASIS_FIT_CONTENT = ExperimentalFeature.FixFlexBasisFitContent;
export const FLEX_DIRECTION_COLUMN = FlexDirection.Column;
export const FLEX_DIRECTION_COLUMN_REVERSE = FlexDirection.ColumnReverse;
export const FLEX_DIRECTION_ROW = FlexDirection.Row;
export const FLEX_DIRECTION_ROW_REVERSE = FlexDirection.RowReverse;
export const GRID_TRACK_TYPE_AUTO = GridTrackType.Auto;
export const GRID_TRACK_TYPE_POINTS = GridTrackType.Points;
export const GRID_TRACK_TYPE_PERCENT = GridTrackType.Percent;
export const GRID_TRACK_TYPE_FR = GridTrackType.Fr;
export const GRID_TRACK_TYPE_MINMAX = GridTrackType.Minmax;
export const GUTTER_COLUMN = Gutter.Column;
export const GUTTER_ROW = Gutter.Row;
export const GUTTER_ALL = Gutter.All;
export const JUSTIFY_AUTO = Justify.Auto;
export const JUSTIFY_FLEX_START = Justify.FlexStart;
export const JUSTIFY_CENTER = Justify.Center;
export const JUSTIFY_FLEX_END = Justify.FlexEnd;
export const JUSTIFY_SPACE_BETWEEN = Justify.SpaceBetween;
export const JUSTIFY_SPACE_AROUND = Justify.SpaceAround;
export const JUSTIFY_SPACE_EVENLY = Justify.SpaceEvenly;
export const JUSTIFY_STRETCH = Justify.Stretch;
export const JUSTIFY_START = Justify.Start;
export const JUSTIFY_END = Justify.End;
export const LOG_LEVEL_ERROR = LogLevel.Error;
export const LOG_LEVEL_WARN = LogLevel.Warn;
export const LOG_LEVEL_INFO = LogLevel.Info;
export const LOG_LEVEL_DEBUG = LogLevel.Debug;
export const LOG_LEVEL_VERBOSE = LogLevel.Verbose;
export const LOG_LEVEL_FATAL = LogLevel.Fatal;
export const MEASURE_MODE_UNDEFINED = MeasureMode.Undefined;
export const MEASURE_MODE_EXACTLY = MeasureMode.Exactly;
export const MEASURE_MODE_AT_MOST = MeasureMode.AtMost;
export const NODE_TYPE_DEFAULT = NodeType.Default;
export const NODE_TYPE_TEXT = NodeType.Text;
export const OVERFLOW_VISIBLE = Overflow.Visible;
export const OVERFLOW_HIDDEN = Overflow.Hidden;
export const OVERFLOW_SCROLL = Overflow.Scroll;
export const POSITION_TYPE_STATIC = PositionType.Static;
export const POSITION_TYPE_RELATIVE = PositionType.Relative;
export const POSITION_TYPE_ABSOLUTE = PositionType.Absolute;
export const UNIT_UNDEFINED = Unit.Undefined;
export const UNIT_POINT = Unit.Point;
export const UNIT_PERCENT = Unit.Percent;
export const UNIT_AUTO = Unit.Auto;
export const UNIT_MAX_CONTENT = Unit.MaxContent;
export const UNIT_FIT_CONTENT = Unit.FitContent;
export const UNIT_STRETCH = Unit.Stretch;
export const WRAP_NO_WRAP = Wrap.NoWrap;
export const WRAP_WRAP = Wrap.Wrap;
export const WRAP_WRAP_REVERSE = Wrap.WrapReverse;
