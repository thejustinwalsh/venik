# baba-yaga

TypeScript port of the [Yoga](https://github.com/facebook/yoga) layout
engine.

```ts
import { Node, Edge, Direction } from "baba-yaga";

const root = new Node();
root.setWidth(100);
root.setPadding(Edge.All, 10);
root.calculateLayout(undefined, undefined, Direction.LTR);
root.getComputedWidth(); // 100
```

Method names follow the `yoga-layout` npm package, but it is not a drop-in:
nodes and configs are made with `new Node()` / `new Config()` (there is no
static `create`/`destroy`), enums are only the `Align.Center`-style objects
(no flat `ALIGN_CENTER` constants, no default export), and the defaults differ
(see below).

## Use in a render loop

The layout path is written to produce as little garbage as possible, so
`calculateLayout()` can run every frame:

- A clean tree returns immediately; a dirty one only revisits dirty branches.
- Layout allocates no objects or arrays. Scratch structures (flex lines, the
  flattened child list of `display: contents` parents) are pooled and reused.
- Style setters called with the value a node already has allocate nothing and
  don't dirty the node. A setter that changes a length allocates one small object.
- A measure function may return the same `{ width, height }` object every time;
  it is read before the function can be called again.
- Reading allocates nothing: results come from `getComputedLeft()` /
  `getComputedWidth()` and friends (there is no `getComputedLayout()` object),
  and style getters such as `getWidth()` return the node's own immutable
  `{ unit, value }` length, not a copy.
- Inserting and removing children allocates nothing beyond array growth.

What remains is V8 boxing fractional and `NaN` doubles that cross function calls
it doesn't inline: short-lived 16-byte numbers, proportional to the number of
nodes relaid out.

## Status

Test-driven rewrite of the reference C++ sources:
its test-suite was ported first (`tests/`), then the engine (`src/`, mirroring
the C++ file layout) until every test passed. Flexbox layout, absolute
positioning, `display: contents`, measure/baseline callbacks, the measurement
cache, pixel-grid rounding, events and node cloning are all ported.

Yoga's instrumentation events (`src/event/event.ts`) are test-only: every use
sits behind the build-time `__EVENTS__` flag, which vitest sets to `true` and
the tsdown build to `false`, so none of it reaches `dist/`.

Unlike Yoga, there is a single behaviour: Yoga's errata (`setErrata` and
friends) and experimental feature flags are gone. The spec-correct free-space
distribution, and what Yoga gates behind `WebFlexBasis` /
`FixFlexBasisFitContent`, are always on.

One deliberate deviation from CSS: there is no Flexbox §4.5 automatic minimum
size. `min-width/height: auto` acts as `0`, as in every released Yoga, because
finding an item's min-content size costs an extra measure pass. Set an explicit
`min-width` / `min-height` to keep an item from shrinking below its content. Code that calls
`config.setErrata(...)` or `config.setExperimentalFeatureEnabled(...)` has to
drop those calls.

Defaults are the CSS initial values, not Yoga's: `flex-direction: row`,
`flex-shrink: 1`, `align-content: stretch`, and `flex: <n>` means `n 1 0`.
`setUseWebDefaults` is gone because there is nothing left to opt into. A tree
written for Yoga needs `setFlexDirection(FlexDirection.Column)`,
`setFlexShrink(0)` and `setAlignContent(Align.FlexStart)` wherever it relied
on the old defaults (the test-suite does this through `newFixtureNode`).
There is no grid layout: the Yoga revision this started from only had grid
*styles* (no algorithm), and that inert API was removed.

```sh
npm test            # vitest
npm run build       # tsdown → dist/ (ESM + CJS + .d.ts)
npm run typecheck   # tsc --noEmit (TypeScript 7)
```
