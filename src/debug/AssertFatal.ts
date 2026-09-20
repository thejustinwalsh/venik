export function fatalWithMessage(message: string): never {
  throw new Error(message);
}

export function assertFatal(condition: boolean, message: string): asserts condition {
  if (!condition) {
    fatalWithMessage(message);
  }
}
