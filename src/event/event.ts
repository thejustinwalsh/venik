// Design notes:
//  - `enum Event::Type` is unscoped in C++, so its values are reachable both
//    as `Event.NodeAllocation` (like C++ `Event::NodeAllocation`) and through
//    the `EventType` enum object. The TS type is `EventType`.
//  - `enum struct LayoutType { kLayout, … }` -> `LayoutType.Layout`, … (the
//    `k` prefix is dropped, like `YG` is for the public enums).
//  - C++'s type-erased `Event::Data` + `data.get<E>()` is replaced by a mapped
//    type: `EventTypedData<E>` is the payload of event type `E`, and a
//    `Subscriber` receives `(node, type, data)` as a discriminated union, so
//    checking `type` narrows `data`:
//
//      Event.subscribe((node, type, data) => {
//        if (type === Event.MeasureCallbackEnd) data.measuredWidth; // typed
//      });
//
//    (TypeScript only accepts subscribers declaring zero or all three
//    parameters for such a union; write `(node, type, _data) => …`.)
//  - `Event::publish<E>(node, data = {})` -> `Event.publish(node, E, data)`;
//    `data` may be omitted for event types without a payload.
//  - Subscribers are called most recently subscribed first (C++ pushes to the
//    head of a linked list).

import type { Config } from "../config/Config.ts";
import type { MeasureMode } from "../enums.ts";
import type { Node } from "../node/Node.ts";

export const LayoutType = {
  Layout: 0,
  Measure: 1,
  CachedLayout: 2,
  CachedMeasure: 3,
} as const;
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType];

export const LayoutPassReason = {
  Initial: 0,
  AbsLayout: 1,
  Stretch: 2,
  MultilineStretch: 3,
  FlexLayout: 4,
  MeasureChild: 5,
  AbsMeasureChild: 6,
  FlexMeasure: 7,
  GridLayout: 8,
  COUNT: 9,
} as const;
export type LayoutPassReason = (typeof LayoutPassReason)[keyof typeof LayoutPassReason];

export class LayoutData {
  layouts = 0;
  measures = 0;
  maxMeasureCache = 0;
  cachedLayouts = 0;
  cachedMeasures = 0;
  measureCallbacks = 0;
  /** Indexed by `LayoutPassReason`. */
  measureCallbackReasonsCount: number[] = new Array<number>(LayoutPassReason.COUNT).fill(0);
}

/** Returns "unknown" for values that are not a real reason (including `COUNT`). */
export function LayoutPassReasonToString(value: LayoutPassReason | number): string {
  switch (value) {
    case LayoutPassReason.Initial:
      return "initial";
    case LayoutPassReason.AbsLayout:
      return "abs_layout";
    case LayoutPassReason.Stretch:
      return "stretch";
    case LayoutPassReason.MultilineStretch:
      return "multiline_stretch";
    case LayoutPassReason.FlexLayout:
      return "flex_layout";
    case LayoutPassReason.MeasureChild:
      return "measure";
    case LayoutPassReason.AbsMeasureChild:
      return "abs_measure";
    case LayoutPassReason.FlexMeasure:
      return "flex_measure";
    case LayoutPassReason.GridLayout:
      return "grid_layout";
    default:
      return "unknown";
  }
}

export const EventType = {
  NodeAllocation: 0,
  NodeDeallocation: 1,
  NodeLayout: 2,
  LayoutPassStart: 3,
  LayoutPassEnd: 4,
  MeasureCallbackStart: 5,
  MeasureCallbackEnd: 6,
  NodeBaselineStart: 7,
  NodeBaselineEnd: 8,
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

/** Payload of event types that carry no data (C++: the empty primary `TypedData<E>`). */
export type EmptyEventData = Readonly<Record<string, never>>;

/** Payload per event type; the specialisations of `Event::TypedData<E>`. */
export type EventDataMap = {
  [EventType.NodeAllocation]: { readonly config: Config };
  [EventType.NodeDeallocation]: { readonly config: Config };
  [EventType.NodeLayout]: { readonly layoutType: LayoutType };
  [EventType.LayoutPassStart]: EmptyEventData;
  /** `layoutData` is live and owned by the layout pass; copy it to keep it. */
  [EventType.LayoutPassEnd]: { readonly layoutData: LayoutData | null };
  [EventType.MeasureCallbackStart]: EmptyEventData;
  [EventType.MeasureCallbackEnd]: {
    readonly width: number;
    readonly widthMeasureMode: MeasureMode;
    readonly height: number;
    readonly heightMeasureMode: MeasureMode;
    readonly measuredWidth: number;
    readonly measuredHeight: number;
    readonly reason: LayoutPassReason;
  };
  [EventType.NodeBaselineStart]: EmptyEventData;
  [EventType.NodeBaselineEnd]: EmptyEventData;
};

/** Equivalent of `Event::TypedData<E>`. */
export type EventTypedData<E extends EventType> = EventDataMap[E];

/** `[node, type, data]` for every event type, discriminated by `type`. */
export type EventArgs = {
  [E in EventType]: [node: Node | null, type: E, data: EventTypedData<E>];
}[EventType];

/** Equivalent of `Event::Subscriber`. */
export type Subscriber = (...args: EventArgs) => void;

type PublishDataArgs<E extends EventType> =
  EventTypedData<E> extends EmptyEventData ? [data?: EmptyEventData] : [data: EventTypedData<E>];

let subscribers: Subscriber[] = [];
const EMPTY_EVENT_DATA: EmptyEventData = Object.freeze({});

// A plain object behind a pure call rather than a class with static fields:
// bundlers keep classes with static initialisers, and the build has to be able
// to drop this module (see `__EVENTS__` in src/globals.d.ts).
export const Event = /* @__PURE__ */ (() => ({
  ...EventType,

  /** Lets hot paths skip building event payloads nobody listens to. */
  hasSubscribers(): boolean {
    return subscribers.length !== 0;
  },

  /** Removes every subscriber. */
  reset(): void {
    subscribers = [];
  },

  subscribe(subscriber: Subscriber): void {
    subscribers.unshift(subscriber);
  },

  publish<E extends EventType>(
    node: Node | null,
    eventType: E,
    ...eventData: PublishDataArgs<E>
  ): void {
    if (subscribers.length === 0) {
      return;
    }
    const args = [node, eventType, eventData[0] ?? EMPTY_EVENT_DATA] as EventArgs;
    for (const subscriber of subscribers) {
      subscriber(...args);
    }
  },
}))();
