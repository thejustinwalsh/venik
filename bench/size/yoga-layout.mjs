import Yoga from "yoga-layout";
const cfg = Yoga.Config.create(); cfg.setUseWebDefaults(true);
const n = Yoga.Node.create(cfg); n.setWidth(100); n.setWidthPercent(20); n.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN); n.setFlexWrap(Yoga.WRAP_WRAP); n.setAlignItems(Yoga.ALIGN_CENTER);
n.setPadding(Yoga.EDGE_ALL, 4); n.setMargin(Yoga.EDGE_HORIZONTAL, 1); n.setPosition(Yoga.EDGE_RIGHT, 0); n.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE); n.setGap(Yoga.GUTTER_COLUMN, 2);
n.setFlexGrow(1); n.setMinWidth(10); n.setHeight(12); const c = Yoga.Node.create(cfg); n.insertChild(c, 0); c.setMeasureFunc(() => ({ width: 1, height: 1 }));
n.calculateLayout(undefined, undefined, Yoga.DIRECTION_LTR); console.log(c.getComputedLeft(), c.getComputedTop(), c.getComputedWidth(), c.getComputedHeight());
