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
  assertFatal,
  assertFatalWithConfig,
  assertFatalWithNode,
  fatalWithMessage,
} from "../debug/AssertFatal.ts";
import { logWithNode } from "../debug/Log.ts";
import {
  Align,
  BoxSizing,
  Dimension,
  Direction,
  Display,
  Edge,
  FlexDirection,
  GridTrackType,
  type Gutter,
  type Justify,
  LogLevel,
  type MeasureMode,
  NodeType,
  type Overflow,
  PositionType,
  type Wrap,
} from "../enums.ts";
import { Event } from "../event/event.ts";
import { maxOrDefined } from "../numeric/Comparison.ts";
import { FloatOptional } from "../numeric/FloatOptional.ts";
import { GridLine } from "../style/GridLine.ts";
import { GridTrackSize } from "../style/GridTrack.ts";
import { Style } from "../style/Style.ts";
import { StyleLength } from "../style/StyleLength.ts";
import { StyleSizeLength } from "../style/StyleSizeLength.ts";
import type {
  BaselineFunction,
  DirtiedFunction,
  Layout,
  MeasureFunction,
  Percent,
  Size,
  Value,
} from "../types.ts";
import { LayoutResults } from "./LayoutResults.ts";

/**
 * A layout node. Port of `yoga::Node` plus the `YGNode*` C API, exposed with
 * the method names of the `yoga-layout` JavaScript package.
 *
 * C API name                          -> method
 *   YGNodeStyleSetFoo(node, v)        -> node.setFoo(v)
 *   YGNodeStyleSetFooPercent(node, v) -> node.setFooPercent(v)
 *   YGNodeStyleGetFoo(node)           -> node.getFoo()
 *   YGNodeLayoutGetFoo(node)          -> node.getComputedFoo()
 *   YGNodeFoo(node, ...)              -> node.foo(...)
 *
 * `undefined` and NaN are both accepted wherever the C API takes YGUndefined.
 */
export class Node {
  private hasNewLayout_: boolean = true;
  private isReferenceBaseline_: boolean = false;
  private isDirty_: boolean = true;
  private alwaysFormsContainingBlock_: boolean = false;
  private nodeType_: NodeType = NodeType.Default;
  private context_: unknown = null;
  private measureFunc_: MeasureFunction | null = null;
  private minContentMeasureFunc_: MeasureFunction | null = null;
  private minContentWidth_: number = NaN;
  private minContentHeight_: number = NaN;
  private baselineFunc_: BaselineFunction | null = null;
  private dirtiedFunc_: DirtiedFunction | null = null;
  private style_: Style = new Style();
  private layout_: LayoutResults = new LayoutResults();
  private lineIndex_: number = 0;
  private contentsChildrenCount_: number = 0;
  private owner_: Node | null = null;
  private children_: Node[] = [];
  private config_: Config;
  private processedDimensions_: StyleSizeLength[] = [
    StyleSizeLength.undefined(),
    StyleSizeLength.undefined(),
  ];

  constructor(config: Config = Config.getDefault()) {
    assertFatal(config != null, "Tried to construct YGNode with null config");
    this.config_ = config;
    if (config.useWebDefaults()) {
      this.useWebDefaults();
    }
    Event.publish(this, Event.NodeAllocation, { config });
  }

  // yoga-layout compatible factories
  static create(config?: Config): Node {
    return new Node(config);
  }
  static createDefault(): Node {
    return new Node();
  }
  static createWithConfig(config: Config): Node {
    return new Node(config);
  }
  static destroy(node: Node): void {
    node.free();
  }


  // Lifecycle
  clone(): Node {
    // Does not expose true value semantics, as children are not cloned eagerly.
    const node: Node = Object.create(Node.prototype);
    node.hasNewLayout_ = this.hasNewLayout_;
    node.isReferenceBaseline_ = this.isReferenceBaseline_;
    node.isDirty_ = this.isDirty_;
    node.alwaysFormsContainingBlock_ = this.alwaysFormsContainingBlock_;
    node.nodeType_ = this.nodeType_;
    node.context_ = this.context_;
    node.measureFunc_ = this.measureFunc_;
    node.minContentMeasureFunc_ = this.minContentMeasureFunc_;
    node.minContentWidth_ = this.minContentWidth_;
    node.minContentHeight_ = this.minContentHeight_;
    node.baselineFunc_ = this.baselineFunc_;
    node.dirtiedFunc_ = this.dirtiedFunc_;
    node.style_ = this.style_.clone();
    node.layout_ = this.layout_.clone();
    node.lineIndex_ = this.lineIndex_;
    node.contentsChildrenCount_ = this.contentsChildrenCount_;
    node.owner_ = null;
    node.children_ = this.children_.slice();
    node.config_ = this.config_;
    node.processedDimensions_ = this.processedDimensions_.slice();
    Event.publish(node, Event.NodeAllocation, { config: node.config_ });
    return node;
  }
  free(): void {
    const owner = this.owner_;
    if (owner !== null) {
      owner.removeChildRaw(this);
      this.owner_ = null;
      owner.markDirtyAndPropagate();
    }

    for (const child of this.children_) {
      child.setOwner(null);
    }

    this.clearChildren();
    Event.publish(this, Event.NodeDeallocation, { config: this.config_ });
  }
  freeRecursive(): void {
    let skipped = 0;
    while (this.children_.length > skipped) {
      const child = this.children_[skipped]!;
      if (child.getOwner() !== this) {
        // Don't free shared nodes that we don't own.
        skipped += 1;
      } else {
        this.removeChild(child);
        child.freeRecursive();
      }
    }
    this.free();
  }
  reset(): void {
    assertFatalWithNode(
      this,
      this.children_.length === 0,
      "Cannot reset a node which still has children attached",
    );
    assertFatalWithNode(
      this,
      this.owner_ === null,
      "Cannot reset a node still attached to a owner",
    );

    this.hasNewLayout_ = true;
    this.isReferenceBaseline_ = false;
    this.isDirty_ = true;
    this.alwaysFormsContainingBlock_ = false;
    this.nodeType_ = NodeType.Default;
    this.context_ = null;
    this.measureFunc_ = null;
    this.minContentMeasureFunc_ = null;
    this.minContentWidth_ = NaN;
    this.minContentHeight_ = NaN;
    this.baselineFunc_ = null;
    this.dirtiedFunc_ = null;
    this.style_ = new Style();
    this.layout_ = new LayoutResults();
    this.lineIndex_ = 0;
    this.contentsChildrenCount_ = 0;
    this.processedDimensions_ = [StyleSizeLength.undefined(), StyleSizeLength.undefined()];
    if (this.config_.useWebDefaults()) {
      this.useWebDefaults();
    }
  }

  // Layout
  calculateLayout(
    width?: number | "auto",
    height?: number | "auto",
    direction?: Direction,
  ): void {
    calculateLayout(
      this,
      width === undefined || width === "auto" ? NaN : width,
      height === undefined || height === "auto" ? NaN : height,
      direction ?? Direction.LTR,
    );
  }
  hasNewLayout(): boolean {
    return this.hasNewLayout_;
  }
  setHasNewLayout(hasNewLayout: boolean): void {
    this.hasNewLayout_ = hasNewLayout;
  }
  markLayoutSeen(): void {
    this.hasNewLayout_ = false;
  }
  isDirty(): boolean {
    return this.isDirty_;
  }
  markDirty(): void {
    assertFatalWithNode(
      this,
      this.hasMeasureFunc(),
      "Only leaf nodes with custom measure functions should manually mark themselves as dirty",
    );

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
    assertFatalWithNode(
      this,
      child.getOwner() === null,
      "Child already has a owner, it must be removed first.",
    );

    assertFatalWithNode(
      this,
      !this.hasMeasureFunc(),
      "Cannot add child: Nodes with measure functions cannot have children.",
    );

    this.insertChildRaw(child, index);
    child.setOwner(this);
    this.markDirtyAndPropagate();
  }
  swapChild(child: Node, index: number): void {
    this.replaceChildAt(child, index);
    child.setOwner(this);
  }
  removeChild(child: Node): void {
    if (this.children_.length === 0) {
      // This is an empty set. Nothing to remove.
      return;
    }

    // Children may be shared between parents, which is indicated by not having an
    // owner. We only want to reset the child completely if it is owned
    // exclusively by one node.
    const childOwner = child.getOwner();
    if (this.removeChildRaw(child)) {
      if (this === childOwner) {
        child.detachFromOwner();
      }
      this.markDirtyAndPropagate();
    }
  }
  removeAllChildren(): void {
    const childCount = this.children_.length;
    if (childCount === 0) {
      // This is an empty set already. Nothing to do.
      return;
    }
    const firstChild = this.children_[0]!;
    if (firstChild.getOwner() === this) {
      // If the first child has this node as its owner, we assume that this child
      // set is unique.
      for (const oldChild of this.children_) {
        oldChild.detachFromOwner();
      }
      this.clearChildren();
      this.markDirtyAndPropagate();
      return;
    }
    // Otherwise, we are not the owner of the child set. We don't have to do
    // anything to clear it.
    this.setChildrenRaw([]);
    this.markDirtyAndPropagate();
  }
  setChildren(children: readonly Node[]): void {
    if (children.length === 0) {
      if (this.children_.length > 0) {
        for (const child of this.children_) {
          child.setLayout(new LayoutResults());
          child.setOwner(null);
        }
        this.setChildrenRaw([]);
        this.markDirtyAndPropagate();
      }
    } else {
      if (this.children_.length > 0) {
        for (const oldChild of this.children_) {
          // Our new children may have nodes in common with the old children. We
          // don't reset these common nodes.
          if (!children.includes(oldChild)) {
            oldChild.setLayout(new LayoutResults());
            oldChild.setOwner(null);
          }
        }
      }
      this.setChildrenRaw(children);
      for (const child of children) {
        child.setOwner(this);
      }
      this.markDirtyAndPropagate();
    }
  }
  getChild(index: number): Node | null {
    return this.children_[index] ?? null;
  }
  getChildCount(): number {
    return this.children_.length;
  }
  getOwner(): Node | null {
    return this.owner_;
  }
  getParent(): Node | null {
    return this.owner_;
  }

  // Config, context and callbacks
  setConfig(config: Config | null): void {
    assertFatal(config !== null, "Attempting to set a null config on a Node");
    assertFatalWithConfig(
      config,
      config.useWebDefaults() === this.config_.useWebDefaults(),
      "UseWebDefaults may not be changed after constructing a Node",
    );

    if (configUpdateInvalidatesLayout(this.config_, config)) {
      this.markDirtyAndPropagate();
      this.layout_.configVersion = 0;
    } else {
      // If the config is functionally the same, then align the configVersion so
      // that we can reuse the layout cache
      this.layout_.configVersion = config.getVersion();
    }

    this.config_ = config;
  }
  getConfig(): Config {
    return this.config_;
  }
  setContext(context: unknown): void {
    this.context_ = context;
  }
  getContext(): unknown {
    return this.context_;
  }
  setMeasureFunc(measureFunc: MeasureFunction | null): void {
    if (measureFunc === null) {
      // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
      // places in Litho
      this.setNodeType(NodeType.Default);
    } else {
      assertFatalWithNode(
        this,
        this.children_.length === 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.",
      );
      // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
      // places in Litho
      this.setNodeType(NodeType.Text);
    }

    this.measureFunc_ = measureFunc;
  }
  unsetMeasureFunc(): void {
    this.setMeasureFunc(null);
  }
  hasMeasureFunc(): boolean {
    return this.measureFunc_ !== null;
  }
  setMinContentMeasureFunc(measureFunc: MeasureFunction | null): void {
    this.minContentMeasureFunc_ = measureFunc;
  }
  hasMinContentMeasureFunc(): boolean {
    return this.minContentMeasureFunc_ !== null;
  }
  setMinContentWidth(minContentWidth: number | undefined): void {
    this.minContentWidth_ = minContentWidth ?? NaN;
  }
  setMinContentHeight(minContentHeight: number | undefined): void {
    this.minContentHeight_ = minContentHeight ?? NaN;
  }
  getMinContentWidth(): number {
    return this.minContentWidth_;
  }
  getMinContentHeight(): number {
    return this.minContentHeight_;
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
  setNodeType(nodeType: NodeType): void {
    this.nodeType_ = nodeType;
  }
  getNodeType(): NodeType {
    return this.nodeType_;
  }
  setAlwaysFormsContainingBlock(alwaysFormsContainingBlock: boolean): void {
    this.alwaysFormsContainingBlock_ = alwaysFormsContainingBlock;
  }
  getAlwaysFormsContainingBlock(): boolean {
    return this.alwaysFormsContainingBlock_;
  }

  // Computed layout (YGNodeLayoutGet*)
  getComputedLeft(): number {
    return this.layout_.position(PhysicalEdge.Left);
  }
  getComputedTop(): number {
    return this.layout_.position(PhysicalEdge.Top);
  }
  getComputedRight(): number {
    return this.layout_.position(PhysicalEdge.Right);
  }
  getComputedBottom(): number {
    return this.layout_.position(PhysicalEdge.Bottom);
  }
  getComputedWidth(): number {
    return this.layout_.dimension(Dimension.Width);
  }
  getComputedHeight(): number {
    return this.layout_.dimension(Dimension.Height);
  }
  getComputedRawWidth(): number {
    return this.layout_.rawDimension(Dimension.Width);
  }
  getComputedRawHeight(): number {
    return this.layout_.rawDimension(Dimension.Height);
  }
  getComputedLayout(): Layout {
    return {
      left: this.getComputedLeft(),
      right: this.getComputedRight(),
      top: this.getComputedTop(),
      bottom: this.getComputedBottom(),
      width: this.getComputedWidth(),
      height: this.getComputedHeight(),
    };
  }
  getComputedDirection(): Direction {
    return this.layout_.direction();
  }
  getComputedHadOverflow(): boolean {
    return this.layout_.hadOverflow();
  }
  getComputedMargin(edge: Edge): number {
    return this.layout_.margin(this.resolveLayoutEdge(edge));
  }
  getComputedBorder(edge: Edge): number {
    return this.layout_.border(this.resolveLayoutEdge(edge));
  }
  getComputedPadding(edge: Edge): number {
    return this.layout_.padding(this.resolveLayoutEdge(edge));
  }

  // Style
  copyStyle(node: Node): void {
    if (!this.style_.equals(node.style_)) {
      this.style_.assign(node.style_);
      this.markDirtyAndPropagate();
    }
  }
  setDirection(direction: Direction): void {
    if (this.style_.direction() !== direction) {
      this.style_.setDirection(direction);
      this.markDirtyAndPropagate();
    }
  }
  getDirection(): Direction {
    return this.style_.direction();
  }
  setFlexDirection(flexDirection: FlexDirection): void {
    if (this.style_.flexDirection() !== flexDirection) {
      this.style_.setFlexDirection(flexDirection);
      this.markDirtyAndPropagate();
    }
  }
  getFlexDirection(): FlexDirection {
    return this.style_.flexDirection();
  }
  setJustifyContent(justifyContent: Justify): void {
    if (this.style_.justifyContent() !== justifyContent) {
      this.style_.setJustifyContent(justifyContent);
      this.markDirtyAndPropagate();
    }
  }
  getJustifyContent(): Justify {
    return this.style_.justifyContent();
  }
  setJustifyItems(justifyItems: Justify): void {
    if (this.style_.justifyItems() !== justifyItems) {
      this.style_.setJustifyItems(justifyItems);
      this.markDirtyAndPropagate();
    }
  }
  getJustifyItems(): Justify {
    return this.style_.justifyItems();
  }
  setJustifySelf(justifySelf: Justify): void {
    if (this.style_.justifySelf() !== justifySelf) {
      this.style_.setJustifySelf(justifySelf);
      this.markDirtyAndPropagate();
    }
  }
  getJustifySelf(): Justify {
    return this.style_.justifySelf();
  }
  setAlignContent(alignContent: Align): void {
    if (this.style_.alignContent() !== alignContent) {
      this.style_.setAlignContent(alignContent);
      this.markDirtyAndPropagate();
    }
  }
  getAlignContent(): Align {
    return this.style_.alignContent();
  }
  setAlignItems(alignItems: Align): void {
    if (this.style_.alignItems() !== alignItems) {
      this.style_.setAlignItems(alignItems);
      this.markDirtyAndPropagate();
    }
  }
  getAlignItems(): Align {
    return this.style_.alignItems();
  }
  setAlignSelf(alignSelf: Align): void {
    if (this.style_.alignSelf() !== alignSelf) {
      this.style_.setAlignSelf(alignSelf);
      this.markDirtyAndPropagate();
    }
  }
  getAlignSelf(): Align {
    return this.style_.alignSelf();
  }
  setPositionType(positionType: PositionType): void {
    if (this.style_.positionType() !== positionType) {
      this.style_.setPositionType(positionType);
      this.markDirtyAndPropagate();
    }
  }
  getPositionType(): PositionType {
    return this.style_.positionType();
  }
  setFlexWrap(flexWrap: Wrap): void {
    if (this.style_.flexWrap() !== flexWrap) {
      this.style_.setFlexWrap(flexWrap);
      this.markDirtyAndPropagate();
    }
  }
  getFlexWrap(): Wrap {
    return this.style_.flexWrap();
  }
  setOverflow(overflow: Overflow): void {
    if (this.style_.overflow() !== overflow) {
      this.style_.setOverflow(overflow);
      this.markDirtyAndPropagate();
    }
  }
  getOverflow(): Overflow {
    return this.style_.overflow();
  }
  setDisplay(display: Display): void {
    if (this.style_.display() !== display) {
      this.style_.setDisplay(display);
      this.markDirtyAndPropagate();
    }
  }
  getDisplay(): Display {
    return this.style_.display();
  }
  setBoxSizing(boxSizing: BoxSizing): void {
    if (this.style_.boxSizing() !== boxSizing) {
      this.style_.setBoxSizing(boxSizing);
      this.markDirtyAndPropagate();
    }
  }
  getBoxSizing(): BoxSizing {
    return this.style_.boxSizing();
  }
  setFlex(flex: number | undefined): void {
    const value = new FloatOptional(flex ?? NaN);
    if (!this.style_.flex().equals(value)) {
      this.style_.setFlex(value);
      this.markDirtyAndPropagate();
    }
  }
  getFlex(): number {
    return this.style_.flex().unwrap();
  }
  setFlexGrow(flexGrow: number | undefined): void {
    const value = new FloatOptional(flexGrow ?? NaN);
    if (!this.style_.flexGrow().equals(value)) {
      this.style_.setFlexGrow(value);
      this.markDirtyAndPropagate();
    }
  }
  getFlexGrow(): number {
    return this.style_.flexGrow().unwrapOrDefault(Style.DefaultFlexGrow);
  }
  setFlexShrink(flexShrink: number | undefined): void {
    const value = new FloatOptional(flexShrink ?? NaN);
    if (!this.style_.flexShrink().equals(value)) {
      this.style_.setFlexShrink(value);
      this.markDirtyAndPropagate();
    }
  }
  getFlexShrink(): number {
    return this.style_
      .flexShrink()
      .unwrapOrDefault(
        this.config_.useWebDefaults() ? Style.WebDefaultFlexShrink : Style.DefaultFlexShrink,
      );
  }
  setAspectRatio(aspectRatio: number | undefined): void {
    const value = new FloatOptional(aspectRatio ?? NaN);
    if (!this.style_.aspectRatio().equals(value)) {
      this.style_.setAspectRatio(value);
      this.markDirtyAndPropagate();
    }
  }
  getAspectRatio(): number {
    return this.style_.aspectRatio().unwrap();
  }

  // Style: flex basis and dimensions
  setFlexBasis(flexBasis: number | "auto" | Percent | undefined): void {
    this.updateFlexBasis(parseSizeLength(flexBasis));
  }
  setFlexBasisPercent(flexBasis: number | undefined): void {
    this.updateFlexBasis(StyleSizeLength.percent(flexBasis ?? NaN));
  }
  setFlexBasisAuto(): void {
    this.updateFlexBasis(StyleSizeLength.ofAuto());
  }
  setFlexBasisMaxContent(): void {
    this.updateFlexBasis(StyleSizeLength.ofMaxContent());
  }
  setFlexBasisFitContent(): void {
    this.updateFlexBasis(StyleSizeLength.ofFitContent());
  }
  setFlexBasisStretch(): void {
    this.updateFlexBasis(StyleSizeLength.ofStretch());
  }
  getFlexBasis(): Value {
    return this.style_.flexBasis().toValue();
  }
  setWidth(width: number | "auto" | Percent | undefined): void {
    this.updateDimension(Dimension.Width, parseSizeLength(width));
  }
  setWidthPercent(width: number | undefined): void {
    this.updateDimension(Dimension.Width, StyleSizeLength.percent(width ?? NaN));
  }
  setWidthAuto(): void {
    this.updateDimension(Dimension.Width, StyleSizeLength.ofAuto());
  }
  setWidthMaxContent(): void {
    this.updateDimension(Dimension.Width, StyleSizeLength.ofMaxContent());
  }
  setWidthFitContent(): void {
    this.updateDimension(Dimension.Width, StyleSizeLength.ofFitContent());
  }
  setWidthStretch(): void {
    this.updateDimension(Dimension.Width, StyleSizeLength.ofStretch());
  }
  getWidth(): Value {
    return this.style_.dimension(Dimension.Width).toValue();
  }
  setHeight(height: number | "auto" | Percent | undefined): void {
    this.updateDimension(Dimension.Height, parseSizeLength(height));
  }
  setHeightPercent(height: number | undefined): void {
    this.updateDimension(Dimension.Height, StyleSizeLength.percent(height ?? NaN));
  }
  setHeightAuto(): void {
    this.updateDimension(Dimension.Height, StyleSizeLength.ofAuto());
  }
  setHeightMaxContent(): void {
    this.updateDimension(Dimension.Height, StyleSizeLength.ofMaxContent());
  }
  setHeightFitContent(): void {
    this.updateDimension(Dimension.Height, StyleSizeLength.ofFitContent());
  }
  setHeightStretch(): void {
    this.updateDimension(Dimension.Height, StyleSizeLength.ofStretch());
  }
  getHeight(): Value {
    return this.style_.dimension(Dimension.Height).toValue();
  }
  setMinWidth(minWidth: number | Percent | undefined): void {
    this.updateMinDimension(Dimension.Width, parseSizeLength(minWidth));
  }
  setMinWidthPercent(minWidth: number | undefined): void {
    this.updateMinDimension(Dimension.Width, StyleSizeLength.percent(minWidth ?? NaN));
  }
  setMinWidthMaxContent(): void {
    this.updateMinDimension(Dimension.Width, StyleSizeLength.ofMaxContent());
  }
  setMinWidthFitContent(): void {
    this.updateMinDimension(Dimension.Width, StyleSizeLength.ofFitContent());
  }
  setMinWidthStretch(): void {
    this.updateMinDimension(Dimension.Width, StyleSizeLength.ofStretch());
  }
  getMinWidth(): Value {
    return this.style_.minDimension(Dimension.Width).toValue();
  }
  setMinHeight(minHeight: number | Percent | undefined): void {
    this.updateMinDimension(Dimension.Height, parseSizeLength(minHeight));
  }
  setMinHeightPercent(minHeight: number | undefined): void {
    this.updateMinDimension(Dimension.Height, StyleSizeLength.percent(minHeight ?? NaN));
  }
  setMinHeightMaxContent(): void {
    this.updateMinDimension(Dimension.Height, StyleSizeLength.ofMaxContent());
  }
  setMinHeightFitContent(): void {
    this.updateMinDimension(Dimension.Height, StyleSizeLength.ofFitContent());
  }
  setMinHeightStretch(): void {
    this.updateMinDimension(Dimension.Height, StyleSizeLength.ofStretch());
  }
  getMinHeight(): Value {
    return this.style_.minDimension(Dimension.Height).toValue();
  }
  setMaxWidth(maxWidth: number | Percent | undefined): void {
    this.updateMaxDimension(Dimension.Width, parseSizeLength(maxWidth));
  }
  setMaxWidthPercent(maxWidth: number | undefined): void {
    this.updateMaxDimension(Dimension.Width, StyleSizeLength.percent(maxWidth ?? NaN));
  }
  setMaxWidthMaxContent(): void {
    this.updateMaxDimension(Dimension.Width, StyleSizeLength.ofMaxContent());
  }
  setMaxWidthFitContent(): void {
    this.updateMaxDimension(Dimension.Width, StyleSizeLength.ofFitContent());
  }
  setMaxWidthStretch(): void {
    this.updateMaxDimension(Dimension.Width, StyleSizeLength.ofStretch());
  }
  getMaxWidth(): Value {
    return this.style_.maxDimension(Dimension.Width).toValue();
  }
  setMaxHeight(maxHeight: number | Percent | undefined): void {
    this.updateMaxDimension(Dimension.Height, parseSizeLength(maxHeight));
  }
  setMaxHeightPercent(maxHeight: number | undefined): void {
    this.updateMaxDimension(Dimension.Height, StyleSizeLength.percent(maxHeight ?? NaN));
  }
  setMaxHeightMaxContent(): void {
    this.updateMaxDimension(Dimension.Height, StyleSizeLength.ofMaxContent());
  }
  setMaxHeightFitContent(): void {
    this.updateMaxDimension(Dimension.Height, StyleSizeLength.ofFitContent());
  }
  setMaxHeightStretch(): void {
    this.updateMaxDimension(Dimension.Height, StyleSizeLength.ofStretch());
  }
  getMaxHeight(): Value {
    return this.style_.maxDimension(Dimension.Height).toValue();
  }

  // Style: edges and gutters
  setPosition(edge: Edge, position: number | "auto" | Percent | undefined): void {
    this.updateEdge(this.style_.position(edge), parseLength(position), edge, Style.prototype.setPosition);
  }
  setPositionPercent(edge: Edge, position: number | undefined): void {
    this.updateEdge(
      this.style_.position(edge),
      StyleLength.percent(position ?? NaN),
      edge,
      Style.prototype.setPosition,
    );
  }
  setPositionAuto(edge: Edge): void {
    this.updateEdge(this.style_.position(edge), StyleLength.ofAuto(), edge, Style.prototype.setPosition);
  }
  getPosition(edge: Edge): Value {
    return this.style_.position(edge).toValue();
  }
  setMargin(edge: Edge, margin: number | "auto" | Percent | undefined): void {
    this.updateEdge(this.style_.margin(edge), parseLength(margin), edge, Style.prototype.setMargin);
  }
  setMarginPercent(edge: Edge, margin: number | undefined): void {
    this.updateEdge(
      this.style_.margin(edge),
      StyleLength.percent(margin ?? NaN),
      edge,
      Style.prototype.setMargin,
    );
  }
  setMarginAuto(edge: Edge): void {
    this.updateEdge(this.style_.margin(edge), StyleLength.ofAuto(), edge, Style.prototype.setMargin);
  }
  getMargin(edge: Edge): Value {
    return this.style_.margin(edge).toValue();
  }
  setPadding(edge: Edge, padding: number | Percent | undefined): void {
    this.updateEdge(this.style_.padding(edge), parseLength(padding), edge, Style.prototype.setPadding);
  }
  setPaddingPercent(edge: Edge, padding: number | undefined): void {
    this.updateEdge(
      this.style_.padding(edge),
      StyleLength.percent(padding ?? NaN),
      edge,
      Style.prototype.setPadding,
    );
  }
  getPadding(edge: Edge): Value {
    return this.style_.padding(edge).toValue();
  }
  setBorder(edge: Edge, border: number | undefined): void {
    this.updateEdge(
      this.style_.border(edge),
      StyleLength.points(border ?? NaN),
      edge,
      Style.prototype.setBorder,
    );
  }
  getBorder(edge: Edge): number {
    const border = this.style_.border(edge);
    if (border.isUndefined() || border.isAuto()) {
      return NaN;
    }

    return border.toValue().value;
  }
  setGap(gutter: Gutter, gapLength: number | Percent | undefined): void {
    this.updateEdge(this.style_.gap(gutter), parseLength(gapLength), gutter, Style.prototype.setGap);
  }
  setGapPercent(gutter: Gutter, gapLength: number | undefined): void {
    this.updateEdge(
      this.style_.gap(gutter),
      StyleLength.percent(gapLength ?? NaN),
      gutter,
      Style.prototype.setGap,
    );
  }
  getGap(gutter: Gutter): Value {
    return this.style_.gap(gutter).toValue();
  }

  // Style: grid
  setGridColumnStart(gridColumnStart: number): void {
    this.updateGridLine(this.style_.gridColumnStart(), GridLine.fromInteger(gridColumnStart), Style.prototype.setGridColumnStart);
  }
  setGridColumnStartAuto(): void {
    this.updateGridLine(this.style_.gridColumnStart(), GridLine.auto(), Style.prototype.setGridColumnStart);
  }
  setGridColumnStartSpan(span: number): void {
    this.updateGridLine(this.style_.gridColumnStart(), GridLine.span(span), Style.prototype.setGridColumnStart);
  }
  getGridColumnStart(): number {
    const gridLine = this.style_.gridColumnStart();
    return gridLine.isInteger() ? gridLine.integer : 0;
  }
  setGridColumnEnd(gridColumnEnd: number): void {
    this.updateGridLine(this.style_.gridColumnEnd(), GridLine.fromInteger(gridColumnEnd), Style.prototype.setGridColumnEnd);
  }
  setGridColumnEndAuto(): void {
    this.updateGridLine(this.style_.gridColumnEnd(), GridLine.auto(), Style.prototype.setGridColumnEnd);
  }
  setGridColumnEndSpan(span: number): void {
    this.updateGridLine(this.style_.gridColumnEnd(), GridLine.span(span), Style.prototype.setGridColumnEnd);
  }
  getGridColumnEnd(): number {
    const gridLine = this.style_.gridColumnEnd();
    return gridLine.isInteger() ? gridLine.integer : 0;
  }
  setGridRowStart(gridRowStart: number): void {
    this.updateGridLine(this.style_.gridRowStart(), GridLine.fromInteger(gridRowStart), Style.prototype.setGridRowStart);
  }
  setGridRowStartAuto(): void {
    this.updateGridLine(this.style_.gridRowStart(), GridLine.auto(), Style.prototype.setGridRowStart);
  }
  setGridRowStartSpan(span: number): void {
    this.updateGridLine(this.style_.gridRowStart(), GridLine.span(span), Style.prototype.setGridRowStart);
  }
  getGridRowStart(): number {
    const gridLine = this.style_.gridRowStart();
    return gridLine.isInteger() ? gridLine.integer : 0;
  }
  setGridRowEnd(gridRowEnd: number): void {
    this.updateGridLine(this.style_.gridRowEnd(), GridLine.fromInteger(gridRowEnd), Style.prototype.setGridRowEnd);
  }
  setGridRowEndAuto(): void {
    this.updateGridLine(this.style_.gridRowEnd(), GridLine.auto(), Style.prototype.setGridRowEnd);
  }
  setGridRowEndSpan(span: number): void {
    this.updateGridLine(this.style_.gridRowEnd(), GridLine.span(span), Style.prototype.setGridRowEnd);
  }
  getGridRowEnd(): number {
    const gridLine = this.style_.gridRowEnd();
    return gridLine.isInteger() ? gridLine.integer : 0;
  }
  setGridTemplateColumnsCount(count: number): void {
    this.style_.resizeGridTemplateColumns(count);
    this.markDirtyAndPropagate();
  }
  setGridTemplateColumn(index: number, type: GridTrackType, value: number): void {
    this.style_.setGridTemplateColumnAt(index, gridTrackSizeFromTypeAndValue(type, value));
    this.markDirtyAndPropagate();
  }
  setGridTemplateColumnMinMax(
    index: number,
    minType: GridTrackType,
    minValue: number,
    maxType: GridTrackType,
    maxValue: number,
  ): void {
    this.style_.setGridTemplateColumnAt(
      index,
      GridTrackSize.minmax(
        styleSizeLengthFromTypeAndValue(minType, minValue),
        styleSizeLengthFromTypeAndValue(maxType, maxValue),
      ),
    );
    this.markDirtyAndPropagate();
  }
  setGridTemplateRowsCount(count: number): void {
    this.style_.resizeGridTemplateRows(count);
    this.markDirtyAndPropagate();
  }
  setGridTemplateRow(index: number, type: GridTrackType, value: number): void {
    this.style_.setGridTemplateRowAt(index, gridTrackSizeFromTypeAndValue(type, value));
    this.markDirtyAndPropagate();
  }
  setGridTemplateRowMinMax(
    index: number,
    minType: GridTrackType,
    minValue: number,
    maxType: GridTrackType,
    maxValue: number,
  ): void {
    this.style_.setGridTemplateRowAt(
      index,
      GridTrackSize.minmax(
        styleSizeLengthFromTypeAndValue(minType, minValue),
        styleSizeLengthFromTypeAndValue(maxType, maxValue),
      ),
    );
    this.markDirtyAndPropagate();
  }
  setGridAutoColumnsCount(count: number): void {
    this.style_.resizeGridAutoColumns(count);
    this.markDirtyAndPropagate();
  }
  setGridAutoColumn(index: number, type: GridTrackType, value: number): void {
    this.style_.setGridAutoColumnAt(index, gridTrackSizeFromTypeAndValue(type, value));
    this.markDirtyAndPropagate();
  }
  setGridAutoColumnMinMax(
    index: number,
    minType: GridTrackType,
    minValue: number,
    maxType: GridTrackType,
    maxValue: number,
  ): void {
    this.style_.setGridAutoColumnAt(
      index,
      GridTrackSize.minmax(
        styleSizeLengthFromTypeAndValue(minType, minValue),
        styleSizeLengthFromTypeAndValue(maxType, maxValue),
      ),
    );
    this.markDirtyAndPropagate();
  }
  setGridAutoRowsCount(count: number): void {
    this.style_.resizeGridAutoRows(count);
    this.markDirtyAndPropagate();
  }
  setGridAutoRow(index: number, type: GridTrackType, value: number): void {
    this.style_.setGridAutoRowAt(index, gridTrackSizeFromTypeAndValue(type, value));
    this.markDirtyAndPropagate();
  }
  setGridAutoRowMinMax(
    index: number,
    minType: GridTrackType,
    minValue: number,
    maxType: GridTrackType,
    maxValue: number,
  ): void {
    this.style_.setGridAutoRowAt(
      index,
      GridTrackSize.minmax(
        styleSizeLengthFromTypeAndValue(minType, minValue),
        styleSizeLengthFromTypeAndValue(maxType, maxValue),
      ),
    );
    this.markDirtyAndPropagate();
  }

  // Internal API (`yoga::Node` members that have no C API equivalent)

  /** @internal */
  style(): Style {
    return this.style_;
  }
  /** @internal The raw child list, including `display: contents` nodes. */
  getChildren(): readonly Node[] {
    return this.children_;
  }
  /** @internal Children that take part in layout: `display: contents` nodes are replaced by their children. */
  getLayoutChildren(): readonly Node[] {
    // Like the C++ iterator this looks at the children's current display
    // rather than at `contentsChildrenCount_`, which goes stale when a child's
    // display changes after it was inserted.
    if (!this.children_.some(isContentsNode)) {
      return this.children_;
    }

    const layoutChildren: Node[] = [];
    collectLayoutChildren(this, layoutChildren);
    return layoutChildren;
  }
  /** @internal */
  getLayoutChildCount(): number {
    return this.getLayoutChildren().length;
  }
  /** @internal Sets the owner without touching the owner's child list. */
  setOwner(owner: Node | null): void {
    this.owner_ = owner;
  }
  /** @internal `yoga::Node::insertChild`: inserts into the child list without setting the owner, asserting or dirtying. */
  insertChildRaw(child: Node, index: number): void {
    if (child.style_.display() === Display.Contents) {
      this.contentsChildrenCount_++;
    }

    this.children_.splice(index, 0, child);
  }
  /** @internal `yoga::Node::setChildren`: replaces the child list without updating owners or dirtying. */
  setChildrenRaw(children: readonly Node[]): void {
    this.children_ = children.slice();

    this.contentsChildrenCount_ = 0;
    for (const child of children) {
      if (child.style_.display() === Display.Contents) {
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
      this.layout_.computedFlexBasis = NaN;
      if (this.owner_ !== null) {
        this.owner_.markDirtyAndPropagate();
      }
    }
  }
  /** @internal Invokes the measure func. */
  measure(
    availableWidth: number,
    widthMode: MeasureMode,
    availableHeight: number,
    heightMode: MeasureMode,
  ): Size {
    return this.sanitizeMeasuredSize(
      this.measureFunc_!(availableWidth, widthMode, availableHeight, heightMode, this),
      "Measure function",
    );
  }
  /** @internal Invokes the baseline func. */
  baseline(width: number, height: number): number {
    return this.baselineFunc_!(width, height, this);
  }

  /** @internal Invokes the min-content measure func. */
  measureMinContent(
    availableWidth: number,
    widthMode: MeasureMode,
    availableHeight: number,
    heightMode: MeasureMode,
  ): Size {
    return this.sanitizeMeasuredSize(
      this.minContentMeasureFunc_!(availableWidth, widthMode, availableHeight, heightMode, this),
      "Min-content measure function",
    );
  }

  private sanitizeMeasuredSize(size: Size, what: string): Size {
    const { width, height } = size;
    if (height !== height || height < 0 || width !== width || width < 0) {
      logWithNode(
        this,
        LogLevel.Warn,
        `${what} returned an invalid dimension to Yoga: [width=${width}, height=${height}]`,
      );
      return { width: maxOrDefined(0, width), height: maxOrDefined(0, height) };
    }

    return size;
  }

  /** @internal */
  dimensionWithMargin(axis: FlexDirection, widthSize: number): number {
    return (
      this.layout_.measuredDimension(dimension(axis)) +
      this.style_.computeMarginForAxis(axis, widthSize)
    );
  }

  /** @internal */
  isLayoutDimensionDefined(axis: FlexDirection): boolean {
    const value = this.layout_.measuredDimension(dimension(axis));
    return value >= 0;
  }

  /**
   * @internal
   * Whether the node has a "definite length" along the given axis.
   * https://www.w3.org/TR/css-sizing-3/#definite
   */
  hasDefiniteLength(dimension: Dimension, ownerSize: number): boolean {
    return this.processedDimensions_[dimension]!.resolveValue(ownerSize) >= 0;
  }

  /** @internal */
  hasContentsChildren(): boolean {
    return this.contentsChildrenCount_ !== 0;
  }

  /** @internal */
  getDirtiedFunc(): DirtiedFunction | null {
    return this.dirtiedFunc_;
  }

  /** @internal */
  getLayout(): LayoutResults {
    return this.layout_;
  }

  /** @internal */
  setLayout(layout: LayoutResults): void {
    this.layout_ = layout;
  }

  /** @internal */
  getLineIndex(): number {
    return this.lineIndex_;
  }

  /** @internal */
  setLineIndex(lineIndex: number): void {
    this.lineIndex_ = lineIndex;
  }

  /** @internal */
  getProcessedDimension(dimension: Dimension): StyleSizeLength {
    return this.processedDimensions_[dimension]!;
  }

  /** @internal NaN when undefined. */
  getResolvedDimension(
    direction: Direction,
    dimension: Dimension,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const value = this.processedDimensions_[dimension]!.resolveValue(referenceLength);
    if (this.style_.boxSizing() === BoxSizing.BorderBox) {
      return value;
    }

    const paddingAndBorder = this.style_.computePaddingAndBorderForDimension(
      direction,
      dimension,
      ownerWidth,
    );

    return value + (paddingAndBorder === paddingAndBorder ? paddingAndBorder : 0);
  }

  /** @internal */
  setLayoutDimension(lengthValue: number, dimension: Dimension): void {
    this.layout_.setDimension(dimension, lengthValue);
    this.layout_.setRawDimension(dimension, lengthValue);
  }

  // If both left and right are defined, then use left. Otherwise return +left or
  // -right depending on which is defined. Ignore statically positioned nodes as
  // insets do not apply to them.
  /** @internal */
  relativePosition(axis: FlexDirection, direction: Direction, axisSize: number): number {
    const style = this.style_;
    if (style.positionType() === PositionType.Static) {
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
    const directionRespectingRoot = this.owner_ !== null ? direction : Direction.LTR;
    const style = this.style_;
    const layout = this.layout_;
    const mainAxis = resolveDirection(style.flexDirection(), directionRespectingRoot);
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

    layout.setPosition(
      mainAxisLeadingEdge,
      style.computeInlineStartMargin(mainAxis, direction, ownerWidth) + relativePositionMain,
    );
    layout.setPosition(
      mainAxisTrailingEdge,
      style.computeInlineEndMargin(mainAxis, direction, ownerWidth) + relativePositionMain,
    );
    layout.setPosition(
      crossAxisLeadingEdge,
      style.computeInlineStartMargin(crossAxis, direction, ownerWidth) + relativePositionCross,
    );
    layout.setPosition(
      crossAxisTrailingEdge,
      style.computeInlineEndMargin(crossAxis, direction, ownerWidth) + relativePositionCross,
    );
  }

  /** @internal */
  processFlexBasis(): StyleSizeLength {
    const flexBasis = this.style_.flexBasis();
    if (!flexBasis.isAuto() && !flexBasis.isUndefined()) {
      return flexBasis;
    }
    if (this.style_.flex().unwrap() > 0) {
      return this.config_.useWebDefaults() ? StyleSizeLength.ofAuto() : StyleSizeLength.points(0);
    }
    return StyleSizeLength.ofAuto();
  }

  /** @internal NaN when undefined. */
  resolveFlexBasis(
    direction: Direction,
    flexDirection: FlexDirection,
    referenceLength: number,
    ownerWidth: number,
  ): number {
    const value = this.processFlexBasis().resolveValue(referenceLength);
    if (this.style_.boxSizing() === BoxSizing.BorderBox) {
      return value;
    }

    const paddingAndBorder = this.style_.computePaddingAndBorderForDimension(
      direction,
      dimension(flexDirection),
      ownerWidth,
    );

    return value + (paddingAndBorder === paddingAndBorder ? paddingAndBorder : 0);
  }

  /** @internal */
  processDimensions(): void {
    const style = this.style_;
    for (const dim of DIMENSIONS) {
      if (
        style.maxDimension(dim).isDefined() &&
        style.maxDimension(dim).inexactEquals(style.minDimension(dim))
      ) {
        this.processedDimensions_[dim] = style.maxDimension(dim);
      } else {
        this.processedDimensions_[dim] = style.dimension(dim);
      }
    }
  }

  /** @internal */
  resolveDirection(ownerDirection: Direction): Direction {
    if (this.style_.direction() === Direction.Inherit) {
      return ownerDirection !== Direction.Inherit ? ownerDirection : Direction.LTR;
    } else {
      return this.style_.direction();
    }
  }

  /** @internal */
  clearChildren(): void {
    this.children_ = [];
  }

  /** @internal Replaces the occurrences of oldChild with newChild */
  replaceChild(oldChild: Node, newChild: Node): void {
    this.trackContentsReplacement(oldChild, newChild);
    this.children_ = this.children_.map((child) => (child === oldChild ? newChild : child));
  }

  /** @internal */
  replaceChildAt(child: Node, index: number): void {
    this.trackContentsReplacement(this.children_[index]!, child);
    this.children_[index] = child;
  }

  private trackContentsReplacement(oldChild: Node, newChild: Node): void {
    const oldIsContents = oldChild.style_.display() === Display.Contents;
    const newIsContents = newChild.style_.display() === Display.Contents;
    if (oldIsContents && !newIsContents) {
      this.contentsChildrenCount_--;
    } else if (!oldIsContents && newIsContents) {
      this.contentsChildrenCount_++;
    }
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
    if (this.children_[index]!.style_.display() === Display.Contents) {
      this.contentsChildrenCount_--;
    }
    this.children_.splice(index, 1);
  }

  /** @internal */
  cloneChildrenIfNeeded(): void {
    const children = this.children_;
    for (let i = 0; i < children.length; i++) {
      let child = children[i]!;
      if (child.getOwner() !== this) {
        child = this.config_.cloneNode(child, this, i);
        children[i] = child;
        child.setOwner(this);

        if (child.style_.display() === Display.Contents) {
          // The contents node's children are treated as children of the
          // contents node's parent for layout purposes, so they need
          // to be cloned as well.
          child.cloneChildrenIfNeeded();
        } else if (child.hasContentsChildren()) {
          child.cloneContentsChildrenIfNeeded();
        }
      }
    }
  }

  /** @internal */
  cloneContentsChildrenIfNeeded(): void {
    const children = this.children_;
    for (let i = 0; i < children.length; i++) {
      let child = children[i]!;
      if (child.style_.display() === Display.Contents && child.getOwner() !== this) {
        child = this.config_.cloneNode(child, this, i);
        children[i] = child;
        child.setOwner(this);
        child.cloneChildrenIfNeeded();
      }
    }
  }

  /** @internal */
  resolveFlexGrow(): number {
    // Root nodes flexGrow should always be 0
    if (this.owner_ === null) {
      return 0.0;
    }
    const flexGrow = this.style_.flexGrow().unwrap();
    if (flexGrow === flexGrow) {
      return flexGrow;
    }
    const flex = this.style_.flex().unwrap();
    if (flex > 0) {
      return flex;
    }
    return Style.DefaultFlexGrow;
  }

  /** @internal */
  resolveFlexShrink(): number {
    if (this.owner_ === null) {
      return 0.0;
    }
    const flexShrink = this.style_.flexShrink().unwrap();
    if (flexShrink === flexShrink) {
      return flexShrink;
    }
    const flex = this.style_.flex().unwrap();
    if (!this.config_.useWebDefaults() && flex < 0) {
      return -flex;
    }
    return this.config_.useWebDefaults() ? Style.WebDefaultFlexShrink : Style.DefaultFlexShrink;
  }

  /** @internal */
  isNodeFlexible(): boolean {
    return (
      this.style_.positionType() !== PositionType.Absolute &&
      (this.resolveFlexGrow() !== 0 || this.resolveFlexShrink() !== 0)
    );
  }

  private useWebDefaults(): void {
    this.style_.setFlexDirection(FlexDirection.Row);
    this.style_.setAlignContent(Align.Stretch);
  }

  /** The layout of a node removed from its exclusive owner is no longer valid. */
  private detachFromOwner(): void {
    this.layout_ = new LayoutResults();
    this.owner_ = null;
    // Mark dirty to invalidate cache, but suppress the dirtied callback
    // since the node is being detached from the tree and should not
    // propagate dirty signals through external callback mechanisms.
    const dirtiedFunc = this.dirtiedFunc_;
    this.dirtiedFunc_ = null;
    this.setDirty(true);
    this.dirtiedFunc_ = dirtiedFunc;
  }

  private resolveLayoutEdge(edge: Edge): PhysicalEdge {
    assertFatalWithNode(
      this,
      edge <= Edge.End,
      "Cannot get layout properties of multi-edge shorthands",
    );

    if (edge === Edge.Start) {
      return this.layout_.direction() === Direction.RTL ? PhysicalEdge.Right : PhysicalEdge.Left;
    }

    if (edge === Edge.End) {
      return this.layout_.direction() === Direction.RTL ? PhysicalEdge.Left : PhysicalEdge.Right;
    }

    return edge as PhysicalEdge;
  }

  private updateFlexBasis(value: StyleSizeLength): void {
    if (!this.style_.flexBasis().equals(value)) {
      this.style_.setFlexBasis(value);
      this.markDirtyAndPropagate();
    }
  }

  private updateDimension(axis: Dimension, value: StyleSizeLength): void {
    if (!this.style_.dimension(axis).equals(value)) {
      this.style_.setDimension(axis, value);
      this.markDirtyAndPropagate();
    }
  }

  private updateMinDimension(axis: Dimension, value: StyleSizeLength): void {
    if (!this.style_.minDimension(axis).equals(value)) {
      this.style_.setMinDimension(axis, value);
      this.markDirtyAndPropagate();
    }
  }

  private updateMaxDimension(axis: Dimension, value: StyleSizeLength): void {
    if (!this.style_.maxDimension(axis).equals(value)) {
      this.style_.setMaxDimension(axis, value);
      this.markDirtyAndPropagate();
    }
  }

  private updateEdge<IdxT>(
    current: StyleLength,
    value: StyleLength,
    idx: IdxT,
    setter: (this: Style, idx: IdxT, value: StyleLength) => void,
  ): void {
    if (!current.equals(value)) {
      setter.call(this.style_, idx, value);
      this.markDirtyAndPropagate();
    }
  }

  private updateGridLine(
    current: GridLine,
    value: GridLine,
    setter: (this: Style, value: GridLine) => void,
  ): void {
    if (!current.equals(value)) {
      setter.call(this.style_, value);
      this.markDirtyAndPropagate();
    }
  }
}

const DIMENSIONS = [Dimension.Width, Dimension.Height] as const;

function isContentsNode(node: Node): boolean {
  return node.style().display() === Display.Contents;
}

function collectLayoutChildren(node: Node, out: Node[]): void {
  for (const child of node.getChildren()) {
    if (child.style().display() === Display.Contents) {
      collectLayoutChildren(child, out);
    } else {
      out.push(child);
    }
  }
}

function parseLength(value: number | "auto" | Percent | undefined): StyleLength {
  if (typeof value === "string") {
    return value === "auto"
      ? StyleLength.ofAuto()
      : StyleLength.percent(Number.parseFloat(value));
  }
  return StyleLength.points(value ?? NaN);
}

function parseSizeLength(value: number | "auto" | Percent | undefined): StyleSizeLength {
  if (typeof value === "string") {
    return value === "auto"
      ? StyleSizeLength.ofAuto()
      : StyleSizeLength.percent(Number.parseFloat(value));
  }
  return StyleSizeLength.points(value ?? NaN);
}

function gridTrackSizeFromTypeAndValue(type: GridTrackType, value: number): GridTrackSize {
  switch (type) {
    case GridTrackType.Points:
      return GridTrackSize.length(value);
    case GridTrackType.Percent:
      return GridTrackSize.percent(value);
    case GridTrackType.Fr:
      return GridTrackSize.fr(value);
    case GridTrackType.Auto:
      return GridTrackSize.auto();
    case GridTrackType.Minmax:
      return GridTrackSize.auto();
    default:
      fatalWithMessage("Unknown YGGridTrackType");
  }
}

function styleSizeLengthFromTypeAndValue(type: GridTrackType, value: number): StyleSizeLength {
  switch (type) {
    case GridTrackType.Points:
      return StyleSizeLength.points(value);
    case GridTrackType.Percent:
      return StyleSizeLength.percent(value);
    case GridTrackType.Fr:
      return StyleSizeLength.stretch(value);
    case GridTrackType.Auto:
      return StyleSizeLength.ofAuto();
    case GridTrackType.Minmax:
      return StyleSizeLength.ofAuto();
    default:
      fatalWithMessage("Unknown YGGridTrackType");
  }
}
