// The C++ API is printf style; here messages arrive already formatted.

import type { Config } from "../config/Config.ts";
import { LogLevel } from "../enums.ts";
import type { Node } from "../node/Node.ts";
import type { Logger } from "../types.ts";

// Available in every JS runtime, but not part of the ES lib typings.
declare const console: {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
};

export function log(
  config: Config | null,
  node: Node | null,
  level: LogLevel,
  message: string,
): void {
  if (config === null) {
    defaultLogger(null, node, level, message);
  } else {
    config.log(node, level, message);
  }
}

export function logWithNode(node: Node | null, level: LogLevel, message: string): void {
  log(node === null ? null : node.getConfig(), node, level, message);
}

const defaultLogger: Logger = (_config, _node, level, message) => {
  switch (level) {
    case LogLevel.Fatal:
      // Fatal messages are always followed by a thrown Error carrying the
      // same message, so they are not printed a second time.
      break;
    case LogLevel.Error:
      console.error(message);
      break;
    case LogLevel.Warn:
      console.warn(message);
      break;
    default:
      console.log(message);
  }
};

export function getDefaultLogger(): Logger {
  return defaultLogger;
}
