import { assertFatalWithConfig } from "../debug/AssertFatal.ts";
import { getDefaultLogger } from "../debug/Log.ts";
import type { LogLevel } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import type { CloneNodeFunction, Logger } from "../types.ts";

/**
 * Layout configuration shared between nodes. Port of `yoga::Config` plus the
 * `YGConfig*` C API, exposed with the method names of the `yoga-layout`
 * JavaScript package.
 */
export class Config {
  private cloneNodeCallback_: CloneNodeFunction | null = null;
  private logger_: Logger = getDefaultLogger();

  private useWebDefaults_: boolean = false;

  private version_: number = 0;
  private pointScaleFactor_: number = 1.0;
  private context_: unknown = null;

  private static default_: Config | null = null;

  // yoga-layout compatible factories
  static create(): Config {
    return new Config();
  }
  static destroy(config: Config): void {
    config.free();
  }

  /** The config used by nodes created without one. Equivalent of `YGConfigGetDefault`. */
  static getDefault(): Config {
    return (Config.default_ ??= new Config());
  }

  free(): void {
    // Nothing to release: configs are garbage collected.
  }

  setUseWebDefaults(useWebDefaults: boolean): void {
    this.useWebDefaults_ = useWebDefaults;
  }
  useWebDefaults(): boolean {
    return this.useWebDefaults_;
  }

  setPointScaleFactor(pixelsInPoint: number): void {
    assertFatalWithConfig(
      this,
      pixelsInPoint >= 0.0,
      "Scale factor should not be less than zero",
    );

    if (this.pointScaleFactor_ !== pixelsInPoint) {
      this.pointScaleFactor_ = pixelsInPoint;
      this.version_++;
    }
  }
  getPointScaleFactor(): number {
    return this.pointScaleFactor_;
  }

  setLogger(logger: Logger | null): void {
    this.logger_ = logger ?? getDefaultLogger();
  }

  setContext(context: unknown): void {
    this.context_ = context;
  }
  getContext(): unknown {
    return this.context_;
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

  /** @internal */
  log(node: Node | null, level: LogLevel, message: string): void {
    this.logger_(this, node, level, message);
  }

  /** @internal Bumped whenever a change to the config invalidates existing layouts. */
  getVersion(): number {
    return this.version_;
  }
}

/** @internal Whether layouts computed under `oldConfig` must be recomputed under `newConfig`. */
export function configUpdateInvalidatesLayout(oldConfig: Config, newConfig: Config): boolean {
  return (
    oldConfig.getPointScaleFactor() !== newConfig.getPointScaleFactor() ||
    oldConfig.useWebDefaults() !== newConfig.useWebDefaults()
  );
}
