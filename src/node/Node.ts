import { calculateLayout } from "../algorithm/CalculateLayout.ts";
import {
  dimension,
  inlineEndEdge,
  inlineStartEdge,
  isRow,
  PhysicalEdge,
  resolveCrossDirection,
  resolveDirection,
} from "../algorithm/FlexDirection.ts";
import { Config, configUpdateInvalidatesLayout } from "../config/Config.ts";
import {
  Align,
  BoxSizing,
  Dimension,
  Direction,
  Display,
  Edge,
  FlexDirection,
  type Gutter,
  type Justify,
  type SizingMode,
  type Overflow,
  PositionType,
  type Wrap,
} from "../enums.ts";
import { Event } from "../event/event.ts";
import { Style } from "../style/Style.ts";
import { StyleLength } from "../style/StyleLength.ts";
import type {
  BaselineFunction,
  DirtiedFunction,
  MeasureFunction,
  Percent,
  Size,
  Value,
} from "../types.ts";
import { LayoutResults } from "./LayoutResults.ts";

/**
 * A layout node.
 *
 * `undefined` and NaN are both accepted wherever a value may be unset.
 */
export class Node {
  /** Set by layout when this node was laid out again; cleared by the caller once it has read the results. */
  hasNewLayout: boolean = true;
  context: unknown = null;
  /** The parent node, or null for a root. Maintained by the child list methods. */
  owner: Node | null = null;

  /** @internal */
  style: Style = new Style();
  /** @internal */
  layout: LayoutResults = new LayoutResults();
  /** @internal */
  lineIndex: number = 0;

  private isReferenceBaseline_: boolean = false;
  private isDirty_: boolean = true;
  private measureFunc_: MeasureFunction | null = null;
  private baselineFunc_: BaselineFunction | null = null;
  private dirtiedFunc_: DirtiedFunction | null = null;
  private contentsChildrenCount_: number = 0;
  private children_: Node[] = [];
  // Scratch list behind `getLayoutChildren`, only for nodes with `display: contents` children.
  private layoutChildren_: Node[] | null = null;
  private config_: Config;
  private processedDimensions_: StyleLength[] = [StyleLength.undefined(), StyleLength.undefined()];

  constructor(config: Config = Config.getDefault()) {
    this.config_ = config;
    if (__EVENTS__) Event.publish(this, Event.NodeAllocation, { config });
  }

  // Layout
  calculateLayout(width?: number | "auto", height?: number | "auto", direction?: Direction): void {
    calculateLayout(
      this,
      width === undefined || width === "auto" ? NaN : width,
      height === undefined || height === "auto" ? NaN : height,
      direction ?? Direction.LTR,
    );
  }
  isDirty(): boolean {
    return this.isDirty_;
  }
  markDirty(): void {
    if (!this.hasMeasureFunc()) {
      throw new Error(
        "Only leaf nodes with custom measure functions should manually mark themselves as dirty",
      );
    }

    this.markDirtyAndPropagate();
  }
  setDirtiedFunc(dirtiedFunc: DirtiedFunction | null): void {
    this.dirtiedFunc_ = dirtiedFunc;
  }
  unsetDirtiedFunc(): void {
    this.dirtiedFunc_ = null;
  }

  // Tree
  insertChild(child: Node, index: number): void {
    if (child.owner !== null) {
      throw new Error("Child already has a owner, it must be removed first.");
    }

    if (this.hasMeasureFunc()) {
      throw new Error("Cannot add child: Nodes with measure functions cannot have children.");
    }

    this.insertChildRaw(child, index);
    child.owner = this;
    this.markDirtyAndPropagate();
  }
  removeChild(child: Node): void {
    if (this.removeChildRaw(child)) {
      child.detachFromOwner();
      this.markDirtyAndPropagate();
    }
  }
  /** Removes this node from its owner, if it has one. */
  detach(): void {
    this.owner?.removeChild(this);
  }
  removeAllChildren(): void {
    if (this.children_.length === 0) {
      return;
    }
    for (let i = 0, length = this.children_.length; i < length; i++) {
      this.children_[i]!.detachFromOwner();
    }
    this.setChildrenRaw([]);
    this.markDirtyAndPropagate();
  }
  setChildren(children: readonly Node[]): void {
    if (children.length === 0 && this.children_.length === 0) {
      return;
    }
    for (let i = 0, length = children.length; i < length; i++) {
      const owner = children[i]!.owner;
      if (owner !== null && owner !== this) {
        throw new Error("Child already has a owner, it must be removed first.");
      }
    }

    for (let i = 0, length = this.children_.length; i < length; i++) {
      const oldChild = this.children_[i]!;
      // Children that stay keep their layout.
      if (!children.includes(oldChild)) {
        oldChild.layout.reset();
        oldChild.owner = null;
      }
    }
    this.setChildrenRaw(children);
    for (let i = 0, length = children.length; i < length; i++) {
      children[i]!.owner = this;
    }
    this.markDirtyAndPropagate();
  }
  getChild(index: number): Node | null {
    return this.children_[index] ?? null;
  }
  getChildCount(): number {
    return this.children_.length;
  }

  // Config, context and callbacks
  setConfig(config: Config): void {
    if (configUpdateInvalidatesLayout(this.config_, config)) {
      this.markDirtyAndPropagate();
      this.layout.configVersion = 0;
    } else {
      // If the config is functionally the same, then align the configVersion so
      // that we can reuse the layout cache
      this.layout.configVersion = config.version;
    }

    this.config_ = config;
  }
  getConfig(): Config {
    return this.config_;
  }
  setMeasureFunc(measureFunc: MeasureFunction | null): void {
    if (measureFunc !== null) {
      if (this.children_.length !== 0) {
        throw new Error(
          "Cannot set measure function: Nodes with measure functions cannot have children.",
        );
      }
    }

    this.measureFunc_ = measureFunc;
  }
  unsetMeasureFunc(): void {
    this.setMeasureFunc(null);
  }
  hasMeasureFunc(): boolean {
    return this.measureFunc_ !== null;
  }
  setBaselineFunc(baselineFunc: BaselineFunction | null): void {
    this.baselineFunc_ = baselineFunc;
  }
  hasBaselineFunc(): boolean {
    return this.baselineFunc_ !== null;
  }
  setIsReferenceBaseline(isReferenceBaseline: boolean): void {
    if (this.isReferenceBaseline_ !== isReferenceBaseline) {
      this.isReferenceBaseline_ = isReferenceBaseline;
      this.markDirtyAndPropagate();
    }
  }
  isReferenceBaseline(): boolean {
    return this.isReferenceBaseline_;
  }

  // Computed layout (YGNodeLayoutGet*)
  getComputedLeft(): number {
    return this.layout.position[PhysicalEdge.Left];
  }
  getComputedTop(): number {
    return this.layout.position[PhysicalEdge.Top];
  }
  getComputedRight(): number {
    return this.layout.position[PhysicalEdge.Right];
  }
  getComputedBottom(): number {
    return this.layout.position[PhysicalEdge.Bottom];
  }
  getComputedWidth(): number {
    return this.layout.dimensions[Dimension.Width];
  }
  getComputedHeight(): number {
    return this.layout.dimensions[Dimension.Height];
  }
  getComputedRawWidth(): number {
    return this.layout.rawDimensions[Dimension.Width];
  }
  getComputedRawHeight(): number {
    return this.layout.rawDimensions[Dimension.Height];
  }
  getComputedDirection(): Direction {
    return this.layout.direction;
  }
  getComputedHadOverflow(): boolean {
    return this.layout.hadOverflow;
  }
  getComputedMargin(edge: Edge): number {
    return this.layout.margin[this.resolveLayoutEdge(edge)];
  }
  getComputedBorder(edge: Edge): number {
    return this.layout.border[this.resolveLayoutEdge(edge)];
  }
  getComputedPadding(edge: Edge): number {
    return this.layout.padding[this.resolveLayoutEdge(edge)];
  }

  // Style
  copyStyle(node: Node): void {
    if (!this.style.equals(node.style)) {
      this.style.assign(node.style);
      this.markDirtyAndPropagate();
    }
  }
  setDirection(direction: Direction): void {
    if (this.style.direction !== direction) {
      this.style.direction = direction;
      this.markDirtyAndPropagate();
    }
  }
  getDirection(): Direction {
    return this.style.direction;
  }
  setFlexDirection(flexDirection: FlexDirection): void {
    if (this.style.flexDirection !== flexDirection) {
      this.style.flexDirection = flexDirection;
      this.markDirtyAndPropagate();
    }
  }
  getFlexDirection(): FlexDirection {
    return this.style.flexDirection;
  }
  setJustifyContent(justifyContent: Justify): void {
    if (this.style.justifyContent !== justifyContent) {
      this.style.justifyContent = justifyContent;
      this.markDirtyAndPropagate();
    }
  }
  getJustifyContent(): Justify {
    return this.style.justifyContent;
  }
  setAlignContent(alignContent: Align): void {
    if (this.style.alignContent !== alignContent) {
      this.style.alignContent = alignContent;
      this.markDirtyAndPropagate();
    }
  }
  getAlignContent(): Align {
    return this.style.alignContent;
  }
  setAlignItems(alignItems: Align): void {
    if (this.style.alignItems !== alignItems) {
      this.style.alignItems = alignItems;
      this.markDirtyAndPropagate();
    }
  }
  getAlignItems(): Align {
    return this.style.alignItems;
  }
  setAlignSelf(alignSelf: Align): void {
    if (this.style.alignSelf !== alignSelf) {
      this.style.alignSelf = alignSelf;
      this.markDirtyAndPropagate();
    }
  }
  getAlignSelf(): Align {
    return this.style.alignSelf;
  }
  setPositionType(positionType: PositionType): void {
    if (this.style.positionType !== positionType) {
      this.style.positionType = positionType;
      this.markDirtyAndPropagate();
    }
  }
  getPositionType(): PositionType {
    return this.style.positionType;
  }
  setFlexWrap(flexWrap: Wrap): void {
    if (this.style.flexWrap !== flexWrap) {
      this.style.flexWrap = flexWrap;
      this.markDirtyAndPropagate();
    }
  }
  getFlexWrap(): Wrap {
    return this.style.flexWrap;
  }
  setOverflow(overflow: Overflow): void {
    if (this.style.overflow !== overflow) {
      this.style.overflow = overflow;
      this.markDirtyAndPropagate();
    }
  }
  getOverflow(): Overflow {
    return this.style.overflow;
  }
  setDisplay(display: Display): void {
    if (this.style.display !== display) {
      this.style.display = display;
      this.markDirtyAndPropagate();
    }
  }
  getDisplay(): Display {
    return this.style.display;
  }
  setBoxSizing(boxSizing: BoxSizing): void {
    if (this.style.boxSizing !== boxSizing) {
      this.style.boxSizing = boxSizing;
      this.markDirtyAndPropagate();
    }
  }
  getBoxSizing(): BoxSizing {
    return this.style.boxSizing;
  }
  setFlex(flex: number | undefined): void {
    const value = flex ?? NaN;
    if (!Object.is(this.style.flex, value)) {
      this.style.flex = value;
      this.markDirtyAndPropagate();
    }
  }
  getFlex(): number {
    return this.style.flex;
  }
  setFlexGrow(flexGrow: number | undefined): void {
    const value = flexGrow ?? NaN;
    if (!Object.is(this.style.flexGrow, value)) {
      this.style.flexGrow = value;
      this.markDirtyAndPropagate();
    }
  }
  getFlexGrow(): number {
    const flexGrow = this.style.flexGrow;
    return flexGrow !== flexGrow ? Style.DefaultFlexGrow : flexGrow;
  }
  setFlexShrink(flexShrink: number | undefined): void {
    const value = flexShrink ?? NaN;
    if (!Object.is(this.style.flexShrink, value)) {
      this.style.flexShrink = value;
      this.markDirtyAndPropagate();
    }
  }
  getFlexShrink(): number {
    const flexShrink = this.style.flexShrink;
    return flexShrink !== flexShrink ? Style.DefaultFlexShrink : flexShrink;
  }
  setAspectRatio(aspectRatio: number | undefined): void {
    // Degenerate aspect ratios (0, infinite) act as auto.
    // See https://drafts.csswg.org/css-sizing-4/#valdef-aspect-ratio-ratio
    const ratio = aspectRatio ?? NaN;
    const value = ratio === 0 || ratio === Infinity || ratio === -Infinity ? NaN : ratio;
    if (!Object.is(this.style.aspectRatio, value)) {
      this.style.aspectRatio = value;
      this.markDirtyAndPropagate();
    }
  }
  getAspectRatio(): number {
    return this.style.aspectRatio;
  }

  // Style: flex basis and dimensions
  setFlexBasis(flexBasis: number | "auto" | Percent | undefined): void {
    this.updateFlexBasis(parseLength(flexBasis, this.style.flexBasis));
  }
  setFlexBasisPercent(flexBasis: number | undefined): void {
    this.updateFlexBasis(StyleLength.percent(flexBasis ?? NaN, this.style.flexBasis));
  }
  setFlexBasisAuto(): void {
    this.updateFlexBasis(StyleLength.ofAuto());
  }
  getFlexBasis(): Value {
    return this.style.flexBasis;
  }
  setWidth(width: number | "auto" | Percent | undefined): void {
    this.updateDimension(
      Dimension.Width,
      parseLength(width, this.style.dimensions[Dimension.Width]),
    );
  }
  setWidthPercent(width: number | undefined): void {
    this.updateDimension(
      Dimension.Width,
      StyleLength.percent(width ?? NaN, this.style.dimensions[Dimension.Width]),
    );
  }
  setWidthAuto(): void {
    this.updateDimension(Dimension.Width, StyleLength.ofAuto());
  }
  getWidth(): Value {
    return this.style.dimensions[Dimension.Width];
  }
  setHeight(height: number | "auto" | Percent | undefined): void {
    this.updateDimension(
      Dimension.Height,
      parseLength(height, this.style.dimensions[Dimension.Height]),
    );
  }
  setHeightPercent(height: number | undefined): void {
    this.updateDimension(
      Dimension.Height,
      StyleLength.percent(height ?? NaN, this.style.dimensions[Dimension.Height]),
    );
  }
  setHeightAuto(): void {
    this.updateDimension(Dimension.Height, StyleLength.ofAuto());
  }
  getHeight(): Value {
    return this.style.dimensions[Dimension.Height];
  }
  setMinWidth(minWidth: number | Percent | undefined): void {
    this.updateMinDimension(
      Dimension.Width,
      parseLength(minWidth, this.style.minDimensions[Dimension.Width]),
    );
  }
  setMinWidthPercent(minWidth: number | undefined): void {
    this.updateMinDimension(
      Dimension.Width,
      StyleLength.percent(minWidth ?? NaN, this.style.minDimensions[Dimension.Width]),
    );
  }
  getMinWidth(): Value {
    return this.style.minDimensions[Dimension.Width];
  }
  setMinHeight(minHeight: number | Percent | undefined): void {
    this.updateMinDimension(
      Dimension.Height,
      parseLength(minHeight, this.style.minDimensions[Dimension.Height]),
    );
  }
  setMinHeightPercent(minHeight: number | undefined): void {
    this.updateMinDimension(
      Dimension.Height,
      StyleLength.percent(minHeight ?? NaN, this.style.minDimensions[Dimension.Height]),
    );
  }
  getMinHeight(): Value {
    return this.style.minDimensions[Dimension.Height];
  }
  setMaxWidth(maxWidth: number | Percent | undefined): void {
    this.updateMaxDimension(
      Dimension.Width,
      parseLength(maxWidth, this.style.maxDimensions[Dimension.Width]),
    );
  }
  setMaxWidthPercent(maxWidth: number | undefined): void {
    this.updateMaxDimension(
      Dimension.Width,
      StyleLength.percent(maxWidth ?? NaN, this.style.maxDimensions[Dimension.Width]),
    );
  }
  getMaxWidth(): Value {
    return this.style.maxDimensions[Dimension.Width];
  }
  setMaxHeight(maxHeight: number | Percent | undefined): void {
    this.updateMaxDimension(
      Dimension.Height,
      parseLength(maxHeight, this.style.maxDimensions[Dimension.Height]),
    );
  }
  setMaxHeightPercent(maxHeight: number | undefined): void {
    this.updateMaxDimension(
      Dimension.Height,
      StyleLength.percent(maxHeight ?? NaN, this.style.maxDimensions[Dimension.Height]),
    );
  }
  getMaxHeight(): Value {
    return this.style.maxDimensions[Dimension.Height];
  }

  // Style: edges and gutters
  setPosition(edge: Edge, position: number | "auto" | Percent | undefined): void {
    this.updateEdge(this.style.position, edge, parseLength(position, this.style.position[edge]));
  }
  setPositionPercent(edge: Edge, position: number | undefined): void {
    this.updateEdge(
      this.style.position,
      edge,
      StyleLength.percent(position ?? NaN, this.style.position[edge]),
    );
  }
  setPositionAuto(edge: Edge): void {
    this.updateEdge(this.style.position, edge, StyleLength.ofAuto());
  }
  getPosition(edge: Edge): Value {
    return this.style.position[edge];
  }
  setMargin(edge: Edge, margin: number | "auto" | Percent | undefined): void {
    this.updateEdge(this.style.margin, edge, parseLength(margin, this.style.margin[edge]));
  }
  setMarginPercent(edge: Edge, margin: number | undefined): void {
    this.updateEdge(
      this.style.margin,
      edge,
      StyleLength.percent(margin ?? NaN, this.style.margin[edge]),
    );
  }
  setMarginAuto(edge: Edge): void {
    this.updateEdge(this.style.margin, edge, StyleLength.ofAuto());
  }
  getMargin(edge: Edge): Value {
    return this.style.margin[edge];
  }
  setPadding(edge: Edge, padding: number | Percent | undefined): void {
    this.updateEdge(this.style.padding, edge, parseLength(padding, this.style.padding[edge]));
  }
  setPaddingPercent(edge: Edge, padding: number | undefined): void {
    this.updateEdge(
      this.style.padding,
      edge,
      StyleLength.percent(padding ?? NaN, this.style.padding[edge]),
    );
  }
  getPadding(edge: Edge): Value {
    return this.style.padding[edge];
  }
  setBorder(edge: Edge, border: number | undefined): void {
    this.updateEdge(
      this.style.border,
      edge,
      StyleLength.points(border ?? NaN, this.style.border[edge]),
    );
  }
  getBorder(edge: Edge): number {
    const border = this.style.border[edge];
    if (border.isUndefined() || border.isAuto()) {
      return NaN;
    }

    return border.value;
  }
  setGap(gutter: Gutter, gapLength: number | Percent | undefined): void {
    this.updateEdge(this.style.gap, gutter, parseLength(gapLength, this.style.gap[gutter]));
  }
  setGapPercent(gutter: Gutter, gapLength: number | undefined): void {
    this.updateEdge(
      this.style.gap,
      gutter,
      StyleLength.percent(gapLength ?? NaN, this.style.gap[gutter]),
    );
  }
  getGap(gutter: Gutter): Value {
    return this.style.gap[gutter];
  }

  // Internal API (`yoga::Node` members that have no C API equivalent)

  /** @internal The raw child list, including `display: contents` nodes. */
  getChildren(): readonly Node[] {
    return this.children_;
  }
  /** @internal Children that take part in layout: `display: contents` nodes are replaced by their children. */
  getLayoutChildren(): readonly Node[] {
    // Like the C++ iterator this looks at the children's current display
    // rather than at `contentsChildrenCount_`, which goes stale when a child's
    // display changes after it was inserted.
    if (!hasContentsNode(this.children_)) {
      this.layoutChildren_ = null;
      return this.children_;
    }

    // Refilled on every call and reused, so the list is only valid until the
    // tree changes. Callers within a layout pass all see the same contents.
    const layoutChildren = (this.layoutChildren_ ??= []);
    const count = collectLayoutChildren(this, layoutChildren, 0);
    // Truncating an array makes V8 drop its storage, so only do it when the list shrank.
    if (layoutChildren.length !== count) {
      layoutChildren.length = count;
    }
    return layoutChildren;
  }
  /** @internal */
  getLayoutChildCount(): number {
    return this.getLayoutChildren().length;
  }
  /** @internal `yoga::Node::insertChild`: inserts into the child list without setting the owner, asserting or dirtying. */
  insertChildRaw(child: Node, index: number): void {
    if (child.style.display === Display.Contents) {
      this.contentsChildrenCount_++;
    }

    // Not `splice`, which allocates an array for the elements it removed.
    const children = this.children_;
    children.push(child);
    for (let i = children.length - 1; i > index; i--) {
      children[i] = children[i - 1]!;
    }
    children[index] = child;
  }
  /** @internal `yoga::Node::setChildren`: replaces the child list without updating owners or dirtying. */
  setChildrenRaw(children: readonly Node[]): void {
    this.children_ = children.slice();

    this.contentsChildrenCount_ = 0;
    for (let i = 0, length = children.length; i < length; i++) {
      const child = children[i]!;
      if (child.style.display === Display.Contents) {
        this.contentsChildrenCount_++;
      }
    }
  }
  /** @internal Sets the dirty flag (firing the dirtied func on a clean -> dirty transition) without propagating. */
  setDirty(isDirty: boolean): void {
    if (isDirty === this.isDirty_) {
      return;
    }
    this.isDirty_ = isDirty;
    if (isDirty && this.dirtiedFunc_ !== null) {
      this.dirtiedFunc_(this);
    }
  }
  /** @internal */
  markDirtyAndPropagate(): void {
    if (!this.isDirty_) {
      this.setDirty(true);
      this.layout.computedFlexBasis = NaN;
      if (this.owner !== null) {
        this.owner.markDirtyAndPropagate();
      }
    }
  }
  /** @internal Invokes the measure func. */
  measure(
    availableWidth: number,
    widthMode: SizingMode,
    availableHeight: number,
    heightMode: SizingMode,
  ): Size {
    const size = this.measureFunc_!(availableWidth, widthMode, availableHeight, heightMode, this);
    const width = size.width;
    const height = size.height;
    if (height !== height || height < 0 || width !== width || width < 0) {
      // The caller clamps; the object is the measure function's and is left alone.
      console.warn(
        `Measure function returned an invalid dimension: [width=${width}, height=${height}]`,
      );
    }
    return size;
  }
  /** @internal Invokes the baseline func. */
  baseline(width: number, height: number): number {
    return this.baselineFunc_!(width, height, this);
  }

  /** @internal */
  dimensionWithMargin(axis: FlexDirection, widthSize: number): number {
    return (
      this.layout.measuredDimensions[dimension(axis)] +
      this.style.computeMarginForAxis(axis, widthSize)
    );
  }

  /** @internal */
  isLayoutDimensionDefined(axis: FlexDirection): boolean {
    const value = this.layout.measuredDimensions[dimension(axis)];
    return value >= 0;
  }

  /**
   * @internal
   * Whether the node has a "definite length" along the given axis.
   * https://www.w3.org/TR/css-sizing-3/#definite
   */
  hasDefiniteLength(dimension: Dimension, ownerSize: number): boolean {
    return this.processedDimensions_[dimension]!.resolve(ownerSize) >= 0;
  }

  /** @internal */
  hasContentsChildren(): boolean {
    return this.contentsChildrenCount_ !== 0;
  }

  /** @internal */
  getProcessedDimension(dimension: Dimension): StyleLength {
    return this.processedDimensions_[dimension]!;
  }

  /** @internal NaN when undefined. */
  getResolvedDimension(
    direction: Direction,
    dimension: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const value = this.processedDimensions_[dimension]!.resolve(referenceLength);
    if (this.style.boxSizing === BoxSizing.BorderBox) {
      return value;
    }

    const paddingAndBorder = this.style.computePaddingAndBorderForDimension(
      direction,
      dimension,
      ownerWidth,
    );

    return value + (paddingAndBorder === paddingAndBorder ? paddingAndBorder : 0);
  }

  /** @internal */
  setLayoutDimension(lengthValue: number, dimension: Dimension): void {
    this.layout.dimensions[dimension] = lengthValue;
    this.layout.rawDimensions[dimension] = lengthValue;
  }

  // If both left and right are defined, then use left. Otherwise return +left or
  // -right depending on which is defined. Ignore statically positioned nodes as
  // insets do not apply to them.
  /** @internal */
  relativePosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const style = this.style;
    if (style.positionType === PositionType.Static) {
      return 0;
    }
    if (
      style.isInlineStartPositionDefined(axis, direction) &&
      !style.isInlineStartPositionAuto(axis, direction)
    ) {
      return style.computeInlineStartPosition(axis, direction, axisSize);
    }

    return -1 * style.computeInlineEndPosition(axis, direction, axisSize);
  }

  /** @internal `yoga::Node::setPosition`: computes the layout position from margins and insets. */
  setLayoutPositionFromStyle(direction: Direction, ownerWidth: number, ownerHeight: number): void {
    /* Root nodes should be always layouted as LTR, so we don't return negative
     * values. */
    const directionRespectingRoot = this.owner !== null ? direction : Direction.LTR;
    const style = this.style;
    const layout = this.layout;
    const mainAxis = resolveDirection(style.flexDirection, directionRespectingRoot);
    const crossAxis = resolveCrossDirection(mainAxis, directionRespectingRoot);

    // In the case of position static these are just 0. See:
    // https://www.w3.org/TR/css-position-3/#valdef-position-static
    const relativePositionMain = this.relativePosition(
      mainAxis,
      directionRespectingRoot,
      isRow(mainAxis) ? ownerWidth : ownerHeight,
    );
    const relativePositionCross = this.relativePosition(
      crossAxis,
      directionRespectingRoot,
      isRow(mainAxis) ? ownerHeight : ownerWidth,
    );

    const mainAxisLeadingEdge = inlineStartEdge(mainAxis, direction);
    const mainAxisTrailingEdge = inlineEndEdge(mainAxis, direction);
    const crossAxisLeadingEdge = inlineStartEdge(crossAxis, direction);
    const crossAxisTrailingEdge = inlineEndEdge(crossAxis, direction);

    layout.position[mainAxisLeadingEdge] =
      style.computeInlineStartMargin(mainAxis, direction, ownerWidth) + relativePositionMain;
    layout.position[mainAxisTrailingEdge] =
      style.computeInlineEndMargin(mainAxis, direction, ownerWidth) + relativePositionMain;
    layout.position[crossAxisLeadingEdge] =
      style.computeInlineStartMargin(crossAxis, direction, ownerWidth) + relativePositionCross;
    layout.position[crossAxisTrailingEdge] =
      style.computeInlineEndMargin(crossAxis, direction, ownerWidth) + relativePositionCross;
  }

  /** @internal */
  processFlexBasis(): StyleLength {
    const flexBasis = this.style.flexBasis;
    if (!flexBasis.isAuto() && !flexBasis.isUndefined()) {
      return flexBasis;
    }
    // `flex: <positive number>` is `<number> 1 0` in CSS
    if (this.style.flex > 0) {
      return StyleLength.zero();
    }
    return StyleLength.ofAuto();
  }

  /** @internal NaN when undefined. */
  resolveFlexBasis(
    direction: Direction,
    flexDirection: FlexDirection,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const flexBasis = this.processFlexBasis();
    if (flexBasis.isAuto()) {
      // The literal, so that V8 has no computed double to box.
      return NaN;
    }
    const value = flexBasis.resolve(referenceLength);
    if (this.style.boxSizing === BoxSizing.BorderBox) {
      return value;
    }

    const paddingAndBorder = this.style.computePaddingAndBorderForDimension(
      direction,
      dimension(flexDirection),
      ownerWidth,
    );

    return value + (paddingAndBorder === paddingAndBorder ? paddingAndBorder : 0);
  }

  /** @internal */
  processDimensions(): void {
    const style = this.style;
    for (let i = 0, length = DIMENSIONS.length; i < length; i++) {
      const dim = DIMENSIONS[i]!;
      if (
        style.maxDimensions[dim].isDefined() &&
        style.maxDimensions[dim].inexactEquals(style.minDimensions[dim])
      ) {
        this.processedDimensions_[dim] = style.maxDimensions[dim];
      } else {
        this.processedDimensions_[dim] = style.dimensions[dim];
      }
    }
  }

  /** @internal */
  resolveDirection(ownerDirection: Direction): Direction {
    if (this.style.direction === Direction.Inherit) {
      return ownerDirection !== Direction.Inherit ? ownerDirection : Direction.LTR;
    } else {
      return this.style.direction;
    }
  }

  /** @internal */
  clearChildren(): void {
    this.children_ = [];
  }

  /** @internal `yoga::Node::removeChild(Node*)`: removes the first occurrence of child. */
  removeChildRaw(child: Node): boolean {
    const index = this.children_.indexOf(child);
    if (index !== -1) {
      this.removeChildAt(index);
      return true;
    }
    return false;
  }

  /** @internal `yoga::Node::removeChild(size_t)` */
  removeChildAt(index: number): void {
    if (this.children_[index]!.style.display === Display.Contents) {
      this.contentsChildrenCount_--;
    }
    // Not `splice`, which allocates an array for the elements it removed.
    const children = this.children_;
    for (let i = index + 1, length = children.length; i < length; i++) {
      children[i - 1] = children[i]!;
    }
    children.pop();
  }

  /** @internal */
  resolveFlexGrow(): number {
    // Root nodes flexGrow should always be 0
    if (this.owner === null) {
      return 0.0;
    }
    const flexGrow = this.style.flexGrow;
    if (flexGrow === flexGrow) {
      return flexGrow;
    }
    const flex = this.style.flex;
    if (flex > 0) {
      return flex;
    }
    return Style.DefaultFlexGrow;
  }

  /** @internal */
  resolveFlexShrink(): number {
    if (this.owner === null) {
      return 0.0;
    }
    const flexShrink = this.style.flexShrink;
    if (flexShrink === flexShrink) {
      return flexShrink;
    }
    return Style.DefaultFlexShrink;
  }

  /** @internal */
  isNodeFlexible(): boolean {
    return (
      this.style.positionType !== PositionType.Absolute &&
      (this.resolveFlexGrow() !== 0 || this.resolveFlexShrink() !== 0)
    );
  }

  /** The layout of a node removed from its owner is no longer valid. */
  private detachFromOwner(): void {
    this.layout.reset();
    this.owner = null;
    // Mark dirty to invalidate cache, but suppress the dirtied callback
    // since the node is being detached from the tree and should not
    // propagate dirty signals through external callback mechanisms.
    const dirtiedFunc = this.dirtiedFunc_;
    this.dirtiedFunc_ = null;
    this.setDirty(true);
    this.dirtiedFunc_ = dirtiedFunc;
  }

  private resolveLayoutEdge(edge: Edge): PhysicalEdge {
    if (edge > Edge.End) {
      throw new Error("Cannot get layout properties of multi-edge shorthands");
    }

    if (edge === Edge.Start) {
      return this.layout.direction === Direction.RTL ? PhysicalEdge.Right : PhysicalEdge.Left;
    }

    if (edge === Edge.End) {
      return this.layout.direction === Direction.RTL ? PhysicalEdge.Left : PhysicalEdge.Right;
    }

    return edge as PhysicalEdge;
  }

  private updateFlexBasis(value: StyleLength): void {
    if (!this.style.flexBasis.equals(value)) {
      this.style.flexBasis = value;
      this.markDirtyAndPropagate();
    }
  }

  private updateDimension(axis: Dimension, value: StyleLength): void {
    if (!this.style.dimensions[axis].equals(value)) {
      this.style.dimensions[axis] = value;
      this.markDirtyAndPropagate();
    }
  }

  private updateMinDimension(axis: Dimension, value: StyleLength): void {
    if (!this.style.minDimensions[axis].equals(value)) {
      this.style.minDimensions[axis] = value;
      this.markDirtyAndPropagate();
    }
  }

  private updateMaxDimension(axis: Dimension, value: StyleLength): void {
    if (!this.style.maxDimensions[axis].equals(value)) {
      this.style.maxDimensions[axis] = value;
      this.markDirtyAndPropagate();
    }
  }

  private updateEdge(edges: StyleLength[], index: Edge | Gutter, value: StyleLength): void {
    if (!edges[index]!.equals(value)) {
      edges[index] = value;
      this.markDirtyAndPropagate();
    }
  }
}

const DIMENSIONS = [Dimension.Width, Dimension.Height] as const;

function hasContentsNode(children: readonly Node[]): boolean {
  for (let i = 0, length = children.length; i < length; i++) {
    if (children[i]!.style.display === Display.Contents) {
      return true;
    }
  }
  return false;
}

/** Writes the layout children of `node` into `out` from index `count` on; returns the new count. */
function collectLayoutChildren(node: Node, out: Node[], count: number): number {
  const children = node.getChildren();
  for (let i = 0, length = children.length; i < length; i++) {
    const child = children[i]!;
    if (child.style.display === Display.Contents) {
      count = collectLayoutChildren(child, out, count);
    } else if (count === out.length) {
      out.push(child);
      count++;
    } else {
      out[count++] = child;
    }
  }
  return count;
}

/** `current` is the length being replaced, which is returned if it already has the parsed value. */
function parseLength(
  value: number | "auto" | Percent | undefined,
  current: StyleLength,
): StyleLength {
  if (typeof value === "string") {
    return value === "auto"
      ? StyleLength.ofAuto()
      : StyleLength.percent(Number.parseFloat(value), current);
  }
  return StyleLength.points(value ?? NaN, current);
}
