# 🧹 venik

Layout engine built for JavaScript games.

Initially started as a TypeScript port of the [Yoga](https://github.com/facebook/yoga) layout
engine, but for performance and bundle size reasons diverged from it quite a bit. [See how.](#divergence-from-yoga)

```ts
import { Node, Edge, Justify, Align, Direction } from "venik";

const hud = new Node();
hud.setPadding(Edge.All, 16);
hud.setJustifyContent(Justify.SpaceBetween);
hud.setAlignItems(Align.FlexEnd);

const healthBar = new Node();
healthBar.setWidth("25%");
healthBar.setHeight(24);
hud.insertChild(healthBar, 0);

// Leaves can be sized by a callback, e.g. by measuring text. The returned
// object is read right away, so one can be reused for every call.
const score = new Node();
const size = { width: 0, height: 0 };
score.setMeasureFunc((width) => {
  const m = measureText("Score: 1200", width);
  size.width = m.width;
  size.height = m.height;
  return size;
});
hud.insertChild(score, 1);

// Runs every frame. Setting a style to the value it already has does nothing;
// a clean tree returns immediately; a dirty one revisits only dirty branches.
function frame(viewportWidth: number, viewportHeight: number) {
  hud.setWidth(viewportWidth);
  hud.setHeight(viewportHeight);
  hud.calculateLayout(undefined, undefined, Direction.LTR);

  drawRect(
    healthBar.getComputedLeft(),
    healthBar.getComputedTop(),
    healthBar.getComputedWidth(),
    healthBar.getComputedHeight(),
  );
  drawText("Score: 1200", score.getComputedLeft(), score.getComputedTop());
}
```

## Motivation

In a pursuit of developing my own UI rendering on top of PlayCanvas, I wanted to experiment
with adding an actual CSS Flexbox implementation into it.

I wanted a fast and robust layout engine that won't clog my render loop and JS heap every time I use it.

Here's the benchmark for this library and couple competitors, as printed by
[`bench/`](bench/index.mjs) (`cd bench && npm install && npm run readme`, after
`npm run build` in the root). Times are µs per frame, lower quartile of 40
rounds after warm-up, best of three runs where the engines take turns.

For changes to venik itself, `bench/` also has a [@pmndrs/labs](https://github.com/pmndrs/labs)
suite that runs the working tree against the last release and both competitors,
each engine × scenario in fresh processes:

```sh
cd bench
npm run bench:baseline   # once: save the release as the labs baseline
npm run bench            # the working tree, next to venik 1.0.0, flexily and yoga-layout
npm run bench:gate       # tables, plus exit 1 on a significant slowdown against the baseline
```

| Time per frame | venik | flexily | yoga-layout |
|---|---|---|---|
| One leaf changes | **25µs** | 200µs | 260µs |
| 50 leaves change | **510µs** | 730µs | 1660µs |
| Root resized (full relayout) | **1000µs** | 1050µs | 3190µs |
| Build the tree and lay it out once | 2360µs | **1910µs** | 5910µs |

| Garbage per frame (JS heap) | venik | flexily | yoga-layout |
|---|---|---|---|
| One leaf changes | **1.0 KB** | 16 KB | **1.0 KB** |
| 50 leaves change | **15 KB** | 77 KB | 22 KB |
| Root resized (full relayout) | 65 KB | 181 KB | **2.1 KB** |
| Retained per node after layout | 2.8 KB | 2.8 KB | 0.2 KB + WASM |

| Bundle size | venik | flexily | yoga-layout |
|---|---|---|---|
| Minified | 72 KB | **71 KB** | 125 KB |
| Minified + gzip | **19 KB** | 22 KB | 50 KB |

The same three engines on flexily's own benchmark:

| flexily's board | venik | flexily | yoga-layout |
|---|---|---|---|
| 5×20, one text leaf dirty | **67µs** | 140µs | 79µs |
| 8×30, one text leaf dirty | 150µs | 300µs | **140µs** |
| 8×30, 50 leaves dirty | **550µs** | 890µs | 1390µs |
| 5×20, resize cycle 120→80→120 | **640µs** | 1140µs | 1080µs |
| 5×20, build and lay out | **1030µs** | 1090µs | 3250µs |
| 50 levels deep, one change | **47µs** | 550µs | 82µs |

## Divergence from Yoga

First of all, venik is not a drop-in replacement for Yoga, our APIs are different and overall mechanism differ quite a bit. 

We do though output the same layouts given the same nodes and our test suite is basically Yoga's tests ported to TypeScript.

Also, we don't use the same defaults as Yoga does, leaning more into how browsers pick defaults:

| Property | venik (and CSS) | Yoga |
|---|---|---|
| `flex-direction` | `row` | `column` |
| `flex-shrink` | `1` | `0` |
| `align-content` | `stretch` | `flex-start` |
| `position` | `static` | `relative` |
| `flex: <n>` | `<n> 1 0` | `<n> 1 0` in Yoga's web mode, else `<n> 0 auto` |

So a tree written for Yoga needs `setFlexDirection(FlexDirection.Column)`,
`setFlexShrink(0)` and `setAlignContent(Align.FlexStart)` wherever it relied
on the old defaults; the test-suite does this through a `newFixtureNode`
helper. There is no `setUseWebDefaults`, because there is nothing left to opt
into.

`position: static` being the default also changes where an absolutely
positioned node goes: as in CSS, its containing block is the nearest
*positioned* ancestor, not simply its parent as in Yoga. Give the parent
`position: relative` to get Yoga's behaviour.

And, of course, [Yoga's errata and experimental feature flags are gone.](https://www.yogalayout.dev/docs/getting-started/configuring-yoga)

One deliberate deviation from CSS (an genuine Yoga's quirk we do follow): there is no Flexbox §4.5 automatic minimum
size. `min-width/height: auto` acts as `0`, as in every released Yoga, because
finding an item's min-content size costs an extra measure pass. Set an explicit
`min-width` / `min-height` to keep an item from shrinking below its content.
