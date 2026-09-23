import { Node, FlexDirection, Wrap, Align, Edge, PositionType, Gutter, Direction } from "../../dist/index.js";
const n = new Node(); n.setWidth(100); n.setWidth("20%"); n.setFlexDirection(FlexDirection.Column); n.setFlexWrap(Wrap.Wrap); n.setAlignItems(Align.Center);
n.setPadding(Edge.All, 4); n.setMargin(Edge.Horizontal, 1); n.setPosition(Edge.Right, 0); n.setPositionType(PositionType.Absolute); n.setGap(Gutter.Column, 2);
n.setFlexGrow(1); n.setMinWidth(10); n.setHeight(12); const c = new Node(); n.insertChild(c, 0); c.setMeasureFunc(() => ({ width: 1, height: 1 }));
n.calculateLayout(undefined, undefined, Direction.LTR); console.log(c.getComputedLeft(), c.getComputedTop(), c.getComputedWidth(), c.getComputedHeight());
