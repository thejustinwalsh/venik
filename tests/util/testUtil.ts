// Port of yoga-cpp/tests/util/TestUtil.{h,cpp}

import { Event, type Subscriber } from "../../src/event/event.ts";
import { FlexDirection, MeasureMode, type Node, type Size } from "../../src/index.ts";

let nodeInstanceCount = 0;

const yogaEventSubscriber: Subscriber = (_node, eventType, _eventData) => {
  switch (eventType) {
    case Event.NodeAllocation:
      nodeInstanceCount++;
      break;
    case Event.NodeDeallocation:
      nodeInstanceCount--;
      break;
    default:
      break;
  }
};

/** Port of `TestUtil::startCountingNodes/nodeCount/stopCountingNodes`. */
export const TestUtil = {
  startCountingNodes(): void {
    nodeInstanceCount = 0;
    Event.subscribe(yogaEventSubscriber);
  },

  nodeCount(): number {
    return nodeInstanceCount;
  },

  stopCountingNodes(): number {
    Event.reset();
    const prev = nodeInstanceCount;
    nodeInstanceCount = 0;
    return prev;
  },
};

/**
 * Port of the RAII `ScopedEventSubscription`: subscribes on construction,
 * `dispose()` stands in for the destructor (`Event.reset()`). Construct it in
 * `beforeEach` and dispose it in `afterEach`.
 */
export class ScopedEventSubscription {
  constructor(s: Subscriber) {
    Event.subscribe(s);
  }

  dispose(): void {
    Event.reset();
  }
}

/** Measures the string stored in the node's context as monospace 10x10 text that wraps on spaces. */
export function intrinsicSizeMeasure(
  width: number,
  widthMode: MeasureMode,
  height: number,
  heightMode: MeasureMode,
  node: Node,
): Size {
  const innerText = node.getContext() as string;
  const heightPerChar = 10;
  const widthPerChar = 10;
  let measuredWidth: number;
  let measuredHeight: number;

  if (widthMode === MeasureMode.Exactly) {
    measuredWidth = width;
  } else if (widthMode === MeasureMode.AtMost) {
    measuredWidth = Math.min(innerText.length * widthPerChar, width);
  } else {
    measuredWidth = innerText.length * widthPerChar;
  }

  const computeHeight = () =>
    calculateHeight(
      innerText,
      node.getFlexDirection() === FlexDirection.Column
        ? measuredWidth
        : Math.max(longestWordWidth(innerText, widthPerChar), measuredWidth),
      widthPerChar,
      heightPerChar,
    );

  if (heightMode === MeasureMode.Exactly) {
    measuredHeight = height;
  } else if (heightMode === MeasureMode.AtMost) {
    measuredHeight = Math.min(computeHeight(), height);
  } else {
    measuredHeight = computeHeight();
  }

  return { width: measuredWidth, height: measuredHeight };
}

export function longestWordWidth(text: string, widthPerChar: number): number {
  let maxLength = 0;
  let currentLength = 0;
  for (const c of text) {
    if (c === " ") {
      maxLength = Math.max(currentLength, maxLength);
      currentLength = 0;
    } else {
      currentLength++;
    }
  }
  return Math.max(currentLength, maxLength) * widthPerChar;
}

export function calculateHeight(
  text: string,
  measuredWidth: number,
  widthPerChar: number,
  heightPerChar: number,
): number {
  if (text.length * widthPerChar <= measuredWidth) {
    return heightPerChar;
  }

  // Matches std::getline(..., ' '): no trailing empty word after a final space.
  const words = text.split(" ");
  if (words.at(-1) === "") {
    words.pop();
  }

  let lines = 1;
  let currentLineLength = 0;
  for (const word of words) {
    const wordWidth = word.length * widthPerChar;
    if (wordWidth > measuredWidth) {
      if (currentLineLength > 0) {
        lines++;
      }
      lines++;
      currentLineLength = 0;
    } else if (currentLineLength + wordWidth <= measuredWidth) {
      currentLineLength += wordWidth + widthPerChar;
    } else {
      lines++;
      currentLineLength = wordWidth + widthPerChar;
    }
  }
  return (currentLineLength === 0 ? lines - 1 : lines) * heightPerChar;
}
