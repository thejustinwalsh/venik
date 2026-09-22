import { Node, FLEX_DIRECTION_COLUMN, WRAP_WRAP, ALIGN_CENTER, EDGE_ALL, EDGE_HORIZONTAL, EDGE_RIGHT, POSITION_TYPE_ABSOLUTE, GUTTER_COLUMN, DIRECTION_LTR } from "flexily";
const n = Node.create({ defaults: "css" }); n.setWidth(100); n.setWidthPercent(20); n.setFlexDirection(FLEX_DIRECTION_COLUMN); n.setFlexWrap(WRAP_WRAP); n.setAlignItems(ALIGN_CENTER);
n.setPadding(EDGE_ALL, 4); n.setMargin(EDGE_HORIZONTAL, 1); n.setPosition(EDGE_RIGHT, 0); n.setPositionType(POSITION_TYPE_ABSOLUTE); n.setGap(GUTTER_COLUMN, 2);
n.setFlexGrow(1); n.setMinWidth(10); n.setHeight(12); const c = Node.create(); n.insertChild(c, 0); c.setMeasureFunc(() => ({ width: 1, height: 1 }));
n.calculateLayout(undefined, undefined, DIRECTION_LTR); console.log(c.getComputedLeft(), c.getComputedTop(), c.getComputedWidth(), c.getComputedHeight());
