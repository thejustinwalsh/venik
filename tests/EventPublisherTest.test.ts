import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  Event,
  type EventType,
  LayoutPassReason,
  LayoutPassReasonToString,
} from "../src/event/event.ts";
import { MeasureMode, Node } from "../src/index.ts";

// Every enum value declared in LayoutPassReason (excluding the COUNT sentinel).
// Kept in sync with yoga/event/event.h; a missing entry causes the "all known
// reasons" test to catch the omission on the next run.
const kAllKnownReasons: readonly LayoutPassReason[] = [
  LayoutPassReason.Initial,
  LayoutPassReason.AbsLayout,
  LayoutPassReason.Stretch,
  LayoutPassReason.MultilineStretch,
  LayoutPassReason.FlexLayout,
  LayoutPassReason.MeasureChild,
  LayoutPassReason.AbsMeasureChild,
  LayoutPassReason.FlexMeasure,
  LayoutPassReason.GridLayout,
];

describe("LayoutPassReasonToStringTest", () => {
  test("everyKnownReasonMapsToDistinctNonUnknownLabel", () => {
    const labels = new Set<string>();
    for (const reason of kAllKnownReasons) {
      const label = LayoutPassReasonToString(reason);
      expect(
        label,
        `LayoutPassReasonToString returned nullptr for enum value ${reason}`,
      ).not.toBeNull();
      expect(label, `Empty label for enum value ${reason}`).not.toBe("");
      expect(
        label,
        `Enum value ${reason} unexpectedly fell through to the default case`,
      ).not.toBe("unknown");
      labels.add(label);
    }
    expect(labels.size, "At least two LayoutPassReason values share the same label").toBe(
      kAllKnownReasons.length,
    );
  });

  test("fallsBackToUnknownForUnrecognizedValues", () => {
    // Out-of-range integer cast: exercises the switch's default branch, which
    // guards against silent regressions when new enum values are added without
    // updating the switch.
    expect(LayoutPassReasonToString(9999)).toBe("unknown");

    // COUNT is the sentinel used to size arrays and is not a real reason, so
    // it must also fall through to the default case.
    expect(LayoutPassReasonToString(LayoutPassReason.COUNT)).toBe("unknown");
  });
});

describe("EventPublisherTest", () => {
  // Event maintains a process-global subscriber list; clear it around each
  // test to keep the tests independent regardless of ordering.
  beforeEach(() => {
    Event.reset();
  });
  afterEach(() => {
    Event.reset();
  });

  test("resetDetachesPreviouslyRegisteredSubscribersFromFutureEvents", () => {
    let callCount = 0;
    Event.subscribe(() => {
      ++callCount;
    });

    // Sanity-check that the subscriber is actually wired up before reset.
    Event.publish(null, Event.LayoutPassStart);
    expect(callCount).toBe(1);

    Event.reset();
    Event.publish(null, Event.LayoutPassStart);
    Event.publish(null, Event.LayoutPassEnd, { layoutData: null });

    expect(callCount, "Subscriber should not have been invoked after Event::reset()").toBe(1);
  });

  test("publishForwardsToEverySubscriberWithNodeAndType", () => {
    const sentinelNode = new Node();

    let subscriberACallCount = 0;
    let subscriberBCallCount = 0;
    let subscriberAReceivedNode: Node | null = null;
    let subscriberAReceivedType: EventType = Event.NodeAllocation;

    Event.subscribe((node, type, _data) => {
      ++subscriberACallCount;
      subscriberAReceivedNode = node;
      subscriberAReceivedType = type;
    });
    Event.subscribe(() => {
      ++subscriberBCallCount;
    });

    Event.publish(sentinelNode, Event.LayoutPassStart);

    expect(subscriberACallCount).toBe(1);
    expect(subscriberBCallCount).toBe(1);
    expect(subscriberAReceivedNode).toBe(sentinelNode);
    expect(subscriberAReceivedType).toBe(Event.LayoutPassStart);
  });

  test("publishForwardsTypedEventDataPayloadUnmodified", () => {
    let measureCallbackEndCount = 0;
    let capturedWidthMode: MeasureMode = MeasureMode.Undefined;
    let capturedMeasuredWidth = 0;
    let capturedMeasuredHeight = 0;
    let capturedReason: LayoutPassReason = LayoutPassReason.Initial;

    Event.subscribe((_node, type, data) => {
      if (type !== Event.MeasureCallbackEnd) {
        return;
      }
      const payload = data;
      capturedWidthMode = payload.widthMeasureMode;
      capturedMeasuredWidth = payload.measuredWidth;
      capturedMeasuredHeight = payload.measuredHeight;
      capturedReason = payload.reason;
      ++measureCallbackEndCount;
    });

    Event.publish(null, Event.MeasureCallbackEnd, {
      width: 100,
      widthMeasureMode: MeasureMode.AtMost,
      height: 200,
      heightMeasureMode: MeasureMode.Exactly,
      measuredWidth: 42.5,
      measuredHeight: 84.25,
      reason: LayoutPassReason.FlexMeasure,
    });

    expect(measureCallbackEndCount).toBe(1);
    expect(capturedWidthMode).toBe(MeasureMode.AtMost);
    expect(capturedMeasuredWidth).toBeCloseTo(42.5, 4);
    expect(capturedMeasuredHeight).toBeCloseTo(84.25, 4);
    expect(capturedReason).toBe(LayoutPassReason.FlexMeasure);
  });
});
