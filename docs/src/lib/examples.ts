export type Example = { id: string; title: string; source: string };

export const examples: Example[] = [
  {
    id: "app",
    title: "App layout",
    source: `<Node style={{width: 250, height: 475, padding: 10}}>
  {/* Defaults follow CSS: flexDirection is "row" and position is "static". */}
  <Node
    style={{flex: 1, flexDirection: "column", rowGap: 10, position: "relative"}}
  >
    <Node style={{height: 60}} />
    <Node style={{flex: 1, marginInline: 10}} />
    <Node style={{flex: 2, marginInline: 10}} />
    <Node
      style={{
        position: "absolute",
        width: "100%",
        bottom: 0,
        height: 64,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      <Node style={{height: 40, width: 40}} />
      <Node style={{height: 40, width: 40}} />
      <Node style={{height: 40, width: 40}} />
      <Node style={{height: 40, width: 40}} />
    </Node>
  </Node>
</Node>
`,
  },
  {
    id: "hud",
    title: "Game HUD",
    source: `<Node
  style={{
    width: 480,
    height: 270,
    padding: 16,
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
  }}
>
  {/* Top bar: score on the left, timer on the right. */}
  <Node
    style={{
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
    }}
  >
    <Node style={{width: 120, height: 24}} />
    <Node style={{width: 64, height: 24}} />
  </Node>
  {/* Bottom bar: health, then abilities pushed to the right. */}
  <Node
    style={{
      flexDirection: "row",
      width: "100%",
      alignItems: "flex-end",
      gap: 8,
    }}
  >
    <Node style={{width: "25%", height: 24}} />
    <Node style={{flex: 1}} />
    <Node style={{width: 40, height: 40, borderWidth: 2, padding: 4}}>
      <Node style={{flex: 1}} />
    </Node>
    <Node style={{width: 40, height: 40, borderWidth: 2, padding: 4}}>
      <Node style={{flex: 1}} />
    </Node>
    <Node style={{width: 40, height: 40, borderWidth: 2, padding: 4}}>
      <Node style={{flex: 1}} />
    </Node>
  </Node>
</Node>
`,
  },
  {
    id: "grow-shrink",
    title: "Grow and shrink",
    source: `<Node style={{width: 400, padding: 10, flexDirection: "column", gap: 10}}>
  {/* Free space is shared in proportion to flexGrow. */}
  <Node style={{flexDirection: "row", height: 40, gap: 10}}>
    <Node style={{flexGrow: 1}} />
    <Node style={{flexGrow: 2}} />
    <Node style={{flexGrow: 1}} />
  </Node>
  {/* Overflow is taken away in proportion to flexShrink × basis. */}
  <Node style={{flexDirection: "row", height: 40, gap: 10}}>
    <Node style={{width: 300, flexShrink: 1}} />
    <Node style={{width: 300, flexShrink: 0}} />
  </Node>
  {/* A basis plus growth. */}
  <Node style={{flexDirection: "row", height: 40, gap: 10}}>
    <Node style={{flexBasis: 50, flexGrow: 1}} />
    <Node style={{flexBasis: 150, flexGrow: 1}} />
  </Node>
</Node>
`,
  },
  {
    id: "wrap",
    title: "Wrapping",
    source: `<Node
  style={{
    width: 320,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignContent: "flex-start",
  }}
>
  <Node style={{width: 90, height: 50}} />
  <Node style={{width: 140, height: 50}} />
  <Node style={{width: 60, height: 50}} />
  <Node style={{width: 200, height: 50}} />
  <Node style={{width: 90, height: 50}} />
  <Node style={{width: 60, height: 50}} />
  <Node style={{width: 100, height: 50}} />
</Node>
`,
  },
  {
    id: "absolute",
    title: "Absolute positioning",
    source: `<Node style={{width: 300, height: 200, padding: 12, borderWidth: 4}}>
  <Node style={{flex: 1}} />
  {/* Absolute children resolve their insets against the padding box of
      the nearest ancestor whose position is not "static". */}
  <Node
    style={{position: "absolute", top: 0, right: 0, width: 60, height: 60}}
  />
  <Node
    style={{
      position: "absolute",
      left: "50%",
      bottom: 8,
      width: 100,
      height: 30,
    }}
  />
  {/* Insets on all sides size the box; the margin keeps it off the edges. */}
  <Node style={{position: "absolute", inset: 30, margin: 20}} />
</Node>
`,
  },
  {
    id: "aspect",
    title: "Aspect ratio and percentages",
    source: `<Node
  style={{
    width: 360,
    padding: 10,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  }}
>
  {/* Height follows width from the aspect ratio. */}
  <Node style={{width: "40%", aspectRatio: 1}} />
  <Node style={{flex: 1, flexDirection: "column", gap: 10}}>
    <Node style={{width: "100%", aspectRatio: 16 / 9}} />
    <Node style={{width: "50%", aspectRatio: 2, alignSelf: "flex-end"}} />
    <Node style={{height: 30, marginLeft: "25%"}} />
  </Node>
</Node>
`,
  },
];
