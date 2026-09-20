# baba-yaga

TypeScript port of the [Yoga](https://github.com/facebook/yoga) layout
engine.

```ts
import { Node, Edge, Direction } from "baba-yaga";

const root = new Node();
root.setWidth(100);
root.setPadding(Edge.All, 10);
root.calculateLayout(undefined, undefined, Direction.LTR);
root.getComputedLayout();
```

The API follows the `yoga-layout` npm package (`Node.create()`, `Config.create()`
and the flat `ALIGN_CENTER`-style constants are kept, and the default export is
a `Yoga` object) so it can be swapped in.

## Status

Test-driven rewrite of the reference C++ sources:
its test-suite was ported first (`tests/`), then the engine (`src/`, mirroring
the C++ file layout) until every test passed. Flexbox layout, absolute
positioning, `display: contents`, measure/baseline callbacks, the measurement
cache, pixel-grid rounding, events and node cloning are all ported.

Unlike Yoga, there is a single, standards-driven behaviour: Yoga's errata
(`setErrata` and friends) and experimental feature flags are gone. The CSS
Flexbox §4.5 automatic minimum size (`min-width/height: auto`), the
spec-correct free-space distribution, and what Yoga gates behind
`WebFlexBasis` / `FixFlexBasisFitContent` are always on. Code that calls
`config.setErrata(...)` or `config.setExperimentalFeatureEnabled(...)` has to
drop those calls.
Like upstream at this revision, grid styles can be set but there is no grid
layout algorithm yet.

```sh
npm test            # vitest
npm run build       # tsdown → dist/ (ESM + CJS + .d.ts)
npm run typecheck   # tsc --noEmit (TypeScript 7)
```
