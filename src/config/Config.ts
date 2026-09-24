/**
 * Layout configuration shared between nodes.
 */
export class Config {
  /** @internal Bumped whenever a change to the config invalidates existing layouts. */
  version: number = 0;
  private pointScaleFactor_: number = 1.0;
  /** @internal See `setRelayoutBoundaries`. */
  relayoutBoundaries: boolean = false;
  context: unknown = null;

  private static default_: Config | null = null;

  /** The config used by nodes created without one. Equivalent of `YGConfigGetDefault`. */
  static getDefault(): Config {
    return (Config.default_ ??= new Config());
  }

  setPointScaleFactor(pixelsInPoint: number): void {
    if (pixelsInPoint < 0.0 || pixelsInPoint !== pixelsInPoint) {
      throw new Error("Scale factor should not be less than zero");
    }

    if (this.pointScaleFactor_ !== pixelsInPoint) {
      this.pointScaleFactor_ = pixelsInPoint;
      this.version++;
    }
  }
  getPointScaleFactor(): number {
    return this.pointScaleFactor_;
  }

  /**
   * Lets a layout pass stop at nodes whose subtree changed without changing
   * size. A change marks every node above it dirty, and each of them lays
   * out all of its children again. With relayout boundaries, a node whose own
   * style and children are unchanged first asks its dirty children the
   * questions it asked them last time, and when every answer is the same it
   * keeps its layout and skips its own pass.
   *
   * That pays off when changes rarely move their ancestors: text or counters
   * updated in place, content swapped in fixed-size slots, deep trees. When
   * changes often resize their ancestors (a child that grows, a row that
   * wraps), the check usually fails after costing a little; leave it off.
   * The layout is the same either way.
   */
  setRelayoutBoundaries(enabled: boolean): void {
    this.relayoutBoundaries = enabled;
  }
  getRelayoutBoundaries(): boolean {
    return this.relayoutBoundaries;
  }
}

/** @internal Whether layouts computed under `oldConfig` must be recomputed under `newConfig`. */
export function configUpdateInvalidatesLayout(oldConfig: Config, newConfig: Config): boolean {
  return oldConfig.getPointScaleFactor() !== newConfig.getPointScaleFactor();
}
