/**
 * Build-time switch for the event system (`src/event/event.ts`). The vitest
 * config defines it as `true`; the tsdown build defines it as `false`, so every
 * `if (__EVENTS__)` block and the event module itself are dropped from `dist/`.
 */
declare const __EVENTS__: boolean;

/** Available in every JS runtime, but not part of the ES lib typings. */
declare const console: {
  warn(message: string): void;
};
