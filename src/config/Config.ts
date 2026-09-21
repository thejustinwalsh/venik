/**
 * Layout configuration shared between nodes.
 */
export class Config {
  /** @internal Bumped whenever a change to the config invalidates existing layouts. */
  version: number = 0;
  private pointScaleFactor_: number = 1.0;
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
}

/** @internal Whether layouts computed under `oldConfig` must be recomputed under `newConfig`. */
export function configUpdateInvalidatesLayout(oldConfig: Config, newConfig: Config): boolean {
  return oldConfig.getPointScaleFactor() !== newConfig.getPointScaleFactor();
}
