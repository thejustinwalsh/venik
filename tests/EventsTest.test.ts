// C++ keeps type-erased copies of each event's `TypedData<E>` and reads them
// back with `data<E>()` / `eventTestData<E>()`; here `data(args, E)` and
// `eventTestData(args, E)` do the same (they are unchecked casts like the C++
// static_casts - the tests assert `type` separately).

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  Event,
  type EventType,
  type EventTypedData,
  LayoutData,
  type Subscriber,
} from "../src/event/event.ts";
import { Align, Config, Direction, FlexDirection, Node } from "../src/index.ts";
import { ScopedEventSubscription } from "./util/testUtil.ts";

type TypedEventTestData<E extends EventType> = E extends typeof Event.LayoutPassEnd
  ? { layoutData: LayoutData }
  : Record<string, never>;

type EventArgs = {
  readonly node: Node | null;
  type: EventType;
  dataPtr: EventTypedData<EventType>;
  eventTestDataPtr: TypedEventTestData<EventType> | null;
};

function data<E extends EventType>(args: EventArgs, _type: E): EventTypedData<E> {
  return args.dataPtr as EventTypedData<E>;
}

function eventTestData<E extends EventType>(args: EventArgs, _type: E): TypedEventTestData<E> {
  return args.eventTestDataPtr as TypedEventTestData<E>;
}

let events: EventArgs[] = [];

function lastEvent(): EventArgs {
  return events[events.length - 1]!;
}

function createArgs<E extends EventType>(
  node: Node | null,
  type: E,
  data: EventTypedData<E>,
  eventTestData: TypedEventTestData<E> | null = null,
): EventArgs {
  // Copy the payload, as C++ does with `new Data{data.get<E>()}`.
  return { node, type, dataPtr: { ...data }, eventTestDataPtr: eventTestData };
}

const listen: Subscriber = (node, type, data) => {
  switch (type) {
    case Event.NodeAllocation:
      events.push(createArgs(node, type, data));
      break;
    case Event.NodeDeallocation:
      events.push(createArgs(node, type, data));
      break;
    case Event.NodeLayout:
      events.push(createArgs(node, type, data));
      break;
    case Event.LayoutPassStart:
      events.push(createArgs(node, type, data));
      break;
    case Event.LayoutPassEnd: {
      // The layout data is only valid during the callback: snapshot it
      // (C++ copies `*eventData.layoutData`).
      const eventData = data;
      const layoutData = Object.assign(new LayoutData(), eventData.layoutData, {
        measureCallbackReasonsCount: [...(eventData.layoutData?.measureCallbackReasonsCount ?? [])],
      });
      events.push(createArgs(node, type, data, { layoutData }));
      break;
    }

    case Event.MeasureCallbackStart:
      events.push(createArgs(node, type, data));
      break;
    case Event.MeasureCallbackEnd:
      events.push(createArgs(node, type, data));
      break;
    case Event.NodeBaselineStart:
      events.push(createArgs(node, type, data));
      break;
    case Event.NodeBaselineEnd:
      events.push(createArgs(node, type, data));
      break;
  }
};

describe("EventTest", () => {
  let subscription: ScopedEventSubscription | undefined;

  beforeEach(() => {
    subscription = new ScopedEventSubscription(listen);
  });

  afterEach(() => {
    events = [];
    subscription?.dispose();
    subscription = undefined;
  });

  test("new_node_has_event", () => {
    const c = Config.getDefault();
    const n = new Node();

    expect(lastEvent().node).toBe(n);
    expect(lastEvent().type).toBe(Event.NodeAllocation);
    expect(data(lastEvent(), Event.NodeAllocation).config).toBe(c);

    n.free();
  });

  test("new_node_with_config_event", () => {
    const c = new Config();
    const n = new Node(c);

    expect(lastEvent().node).toBe(n);
    expect(lastEvent().type).toBe(Event.NodeAllocation);
    expect(data(lastEvent(), Event.NodeAllocation).config).toBe(c);

    n.free();
    c.free();
  });

  test("free_node_event", () => {
    const c = new Config();
    const n = new Node(c);
    n.free();

    expect(lastEvent().node).toBe(n);
    expect(lastEvent().type).toBe(Event.NodeDeallocation);
    expect(data(lastEvent(), Event.NodeDeallocation).config).toBe(c);

    c.free();
  });

  test("layout_events", () => {
    const root = new Node();
    const child = new Node();
    root.insertChild(child, 0);

    root.calculateLayout(123, 456, Direction.LTR);

    expect(events[2]!.node).toBe(root);
    expect(events[2]!.type).toBe(Event.LayoutPassStart);

    expect(events[3]!.node).toBe(child);
    expect(events[3]!.type).toBe(Event.NodeLayout);

    expect(events[4]!.node).toBe(child);
    expect(events[4]!.type).toBe(Event.NodeLayout);

    expect(events[5]!.node).toBe(child);
    expect(events[5]!.type).toBe(Event.NodeLayout);

    expect(events[6]!.node).toBe(root);
    expect(events[6]!.type).toBe(Event.NodeLayout);

    expect(events[7]!.node).toBe(root);
    expect(events[7]!.type).toBe(Event.LayoutPassEnd);

    root.freeRecursive();
  });

  test("layout_events_single_node", () => {
    const root = new Node();
    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(events[1]!.node).toBe(root);
    expect(events[1]!.type).toBe(Event.LayoutPassStart);

    expect(events[2]!.node).toBe(root);
    expect(events[2]!.type).toBe(Event.NodeLayout);

    expect(events[3]!.node).toBe(root);
    expect(events[3]!.type).toBe(Event.LayoutPassEnd);

    const layoutData = eventTestData(events[3]!, Event.LayoutPassEnd).layoutData;

    expect(layoutData.layouts).toBe(1);
    expect(layoutData.measures).toBe(0);
    expect(layoutData.maxMeasureCache).toBe(1);
  });

  test("layout_events_counts_multi_node_layout", () => {
    const root = new Node();
    const childA = new Node();
    root.insertChild(childA, 0);
    const childB = new Node();
    root.insertChild(childB, 1);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(events[3]!.node).toBe(root);
    expect(events[3]!.type).toBe(Event.LayoutPassStart);

    expect(events[11]!.node).toBe(root);
    expect(events[11]!.type).toBe(Event.LayoutPassEnd);

    const layoutData = eventTestData(events[11]!, Event.LayoutPassEnd).layoutData;

    expect(layoutData.layouts).toBe(3);
    expect(layoutData.measures).toBe(4);
    expect(layoutData.maxMeasureCache).toBe(3);
  });

  test("layout_events_counts_cache_hits_single_node_layout", () => {
    const root = new Node();

    root.calculateLayout(undefined, undefined, Direction.LTR);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(events[4]!.node).toBe(root);
    expect(events[4]!.type).toBe(Event.LayoutPassStart);

    expect(events[6]!.node).toBe(root);
    expect(events[6]!.type).toBe(Event.LayoutPassEnd);

    const layoutData = eventTestData(events[6]!, Event.LayoutPassEnd).layoutData;

    expect(layoutData.layouts).toBe(0);
    expect(layoutData.measures).toBe(0);
    expect(layoutData.cachedLayouts).toBe(1);
    expect(layoutData.cachedMeasures).toBe(0);
  });

  test("layout_events_counts_cache_hits_multi_node_layout", () => {
    const root = new Node();
    const childA = new Node();
    root.insertChild(childA, 0);
    const childB = new Node();
    root.insertChild(childB, 1);

    root.calculateLayout(987, 654, Direction.LTR);
    root.calculateLayout(123, 456, Direction.LTR);

    root.calculateLayout(987, 654, Direction.LTR);

    expect(lastEvent().node).toBe(root);
    expect(lastEvent().type).toBe(Event.LayoutPassEnd);

    const layoutData = eventTestData(lastEvent(), Event.LayoutPassEnd).layoutData;

    expect(layoutData.layouts).toBe(3);
    expect(layoutData.measures).toBe(0);
    expect(layoutData.maxMeasureCache).toBe(5);
    expect(layoutData.cachedLayouts).toBe(0);
    expect(layoutData.cachedMeasures).toBe(4);
  });

  test("layout_events_has_max_measure_cache", () => {
    const root = new Node();
    const a = new Node();
    root.insertChild(a, 0);
    const b = new Node();
    root.insertChild(b, 1);
    a.setFlexBasis(10);

    for (const s of [20, 30, 40]) {
      root.calculateLayout(s, s, Direction.LTR);
    }

    expect(lastEvent().node).toBe(root);
    expect(lastEvent().type).toBe(Event.LayoutPassEnd);

    const layoutData = eventTestData(lastEvent(), Event.LayoutPassEnd).layoutData;

    expect(layoutData.layouts).toBe(3);
    expect(layoutData.measures).toBe(3);
    expect(layoutData.maxMeasureCache).toBe(7);
  });

  test("measure_functions_get_wrapped", () => {
    const root = new Node();
    root.setMeasureFunc(() => {
      return { width: 0, height: 0 };
    });

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(events[2]!.node).toBe(root);
    expect(events[2]!.type).toBe(Event.MeasureCallbackStart);

    expect(events[events.length - 1]!.node).toBe(root);
    expect(events[events.length - 1]!.type).toBe(Event.LayoutPassEnd);
  });

  test("baseline_functions_get_wrapped", () => {
    const root = new Node();
    const child = new Node();
    root.insertChild(child, 0);

    child.setBaselineFunc(() => 0);
    root.setFlexDirection(FlexDirection.Row);
    root.setAlignItems(Align.Baseline);

    root.calculateLayout(undefined, undefined, Direction.LTR);

    expect(events[5]!.node).toBe(child);
    expect(events[5]!.type).toBe(Event.NodeBaselineStart);

    expect(events[events.length - 1]!.node).toBe(root);
    expect(events[events.length - 1]!.type).toBe(Event.LayoutPassEnd);
  });
});
