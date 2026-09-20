export function assertFatal(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
