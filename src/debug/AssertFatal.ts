// Port of yoga-cpp/yoga/debug/AssertFatal.{h,cpp}

import type { Config } from "../config/Config.ts";
import { LogLevel } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import { log, logWithNode } from "./Log.ts";

export function fatalWithMessage(message: string): never {
  throw new Error(message);
}

export function assertFatal(condition: boolean, message: string): asserts condition {
  if (!condition) {
    log(null, null, LogLevel.Fatal, `${message}\n`);
    fatalWithMessage(message);
  }
}

export function assertFatalWithNode(
  node: Node | null,
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    logWithNode(node, LogLevel.Fatal, `${message}\n`);
    fatalWithMessage(message);
  }
}

export function assertFatalWithConfig(
  config: Config | null,
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    log(config, null, LogLevel.Fatal, `${message}\n`);
    fatalWithMessage(message);
  }
}
