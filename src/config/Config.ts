import type { Node } from "../node/Node.ts";
import type { CloneNodeFunction } from "../types.ts";

/**
 * Layout configuration shared between nodes.
 */
export class Config {
  private cloneNodeCallback_: CloneNodeFunction | null = null;

  private version_: number = 0;
  private pointScaleFactor_: number = 1.0;
  context: unknown = null;

  private static default_: Config | null = null;

  /** The config used by nodes created without one. Equivalent of `YGConfigGetDefault`. */
  static getDefault(): Config {
    return (Config.default_ ??= new Config());
  }

  free(): void {
    // Nothing to release: configs are garbage collected.
  }

  setPointScaleFactor(pixelsInPoint: number): void {
    if (pixelsInPoint < 0.0 || pixelsInPoint !== pixelsInPoint) {
      throw new Error("Scale factor should not be less than zero");
    }

    if (this.pointScaleFactor_ !== pixelsInPoint) {
      this.pointScaleFactor_ = pixelsInPoint;
      this.version_++;
    }
  }
  getPointScaleFactor(): number {
    return this.pointScaleFactor_;
  }

  setCloneNodeFunc(cloneNodeFunc: CloneNodeFunction | null): void {
    this.cloneNodeCallback_ = cloneNodeFunc;
  }

  /** @internal Clones `node` through the clone node func if one is set, otherwise with `node.clone()`. */
  cloneNode(node: Node, owner: Node, childIndex: number): Node {
    let clone: Node | null = null;
    if (this.cloneNodeCallback_ !== null) {
      clone = this.cloneNodeCallback_(node, owner, childIndex);
    }
    if (clone === null) {
      clone = node.clone();
    }
    return clone;
  }

  /** @internal Bumped whenever a change to the config invalidates existing layouts. */
  getVersion(): number {
    return this.version_;
  }
}

/** @internal Whether layouts computed under `oldConfig` must be recomputed under `newConfig`. */
export function configUpdateInvalidatesLayout(oldConfig: Config, newConfig: Config): boolean {
  return oldConfig.getPointScaleFactor() !== newConfig.getPointScaleFactor();
}
