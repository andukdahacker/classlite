import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTextSelection } from "../hooks/use-text-selection";

// jsdom doesn't implement Range.getBoundingClientRect — mock it
const mockBoundingRect: DOMRect = {
  x: 100,
  y: 200,
  width: 80,
  height: 16,
  top: 200,
  right: 180,
  bottom: 216,
  left: 100,
  toJSON: () => ({}),
};

beforeEach(() => {
  Range.prototype.getBoundingClientRect = vi.fn(() => mockBoundingRect);
});

// Helper to create a mock container with answer elements and char-start spans
function createMockContainer() {
  const container = document.createElement("div");
  // Mock getBoundingClientRect on the container element
  container.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    top: 0,
    right: 600,
    bottom: 400,
    left: 0,
    toJSON: () => ({}),
  }));

  const answer0 = document.createElement("div");
  answer0.setAttribute("data-answer-index", "0");

  const span1 = document.createElement("span");
  span1.setAttribute("data-char-start", "0");
  span1.textContent = "Hello world ";
  answer0.appendChild(span1);

  const span2 = document.createElement("span");
  span2.setAttribute("data-char-start", "12");
  span2.textContent = "this is a test";
  answer0.appendChild(span2);

  container.appendChild(answer0);

  const answer1 = document.createElement("div");
  answer1.setAttribute("data-answer-index", "1");

  const span3 = document.createElement("span");
  span3.setAttribute("data-char-start", "0");
  span3.textContent = "Second answer text";
  answer1.appendChild(span3);

  container.appendChild(answer1);

  document.body.appendChild(container);
  return container;
}

describe("useTextSelection", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    container = createMockContainer();
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null selectionState initially", () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSelection(ref, [{ globalStartOffset: 0 }, { globalStartOffset: 28 }]),
    );

    expect(result.current.selectionState).toBeNull();
  });

  it("detects selection on mouseup within an answer", () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSelection(ref, [{ globalStartOffset: 0 }, { globalStartOffset: 28 }]),
    );

    // Create a mock selection within the first span
    const span = container.querySelector("[data-char-start='0']")!;
    const textNode = span.firstChild!;

    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5); // "Hello"

    // Mock window.getSelection
    const mockSelection = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => range,
      toString: () => "Hello",
      removeAllRanges: vi.fn(),
    };
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

    // Trigger mouseup
    act(() => {
      container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    // Advance past the 10ms setTimeout in the hook
    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current.selectionState).not.toBeNull();
    expect(result.current.selectionState?.text).toBe("Hello");
    expect(result.current.selectionState?.startOffset).toBe(0);
    expect(result.current.selectionState?.endOffset).toBe(5);
  });

  it("rejects cross-answer selections", () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSelection(ref, [{ globalStartOffset: 0 }, { globalStartOffset: 28 }]),
    );

    // Create a range spanning two different answers
    const span0 = container.querySelector("[data-answer-index='0'] [data-char-start='0']")!;
    const span1 = container.querySelector("[data-answer-index='1'] [data-char-start='0']")!;
    const textNode0 = span0.firstChild!;
    const textNode1 = span1.firstChild!;

    const range = document.createRange();
    range.setStart(textNode0, 0);
    range.setEnd(textNode1, 5);

    const mockSelection = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => range,
      toString: () => "Hello world this is a test\n\nSecon",
      removeAllRanges: vi.fn(),
    };
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

    act(() => {
      container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    // Should remain null — cross-answer selection rejected
    expect(result.current.selectionState).toBeNull();
  });

  it("clears selection on Escape key", () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSelection(ref, [{ globalStartOffset: 0 }]),
    );

    // Simulate setting a selection state first
    const span = container.querySelector("[data-char-start='0']")!;
    const textNode = span.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);

    const removeAllRanges = vi.fn();
    const mockSelection = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => range,
      toString: () => "Hello",
      removeAllRanges,
    };
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

    act(() => {
      container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    // Verify selection was set
    expect(result.current.selectionState).not.toBeNull();

    // Now press Escape
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(result.current.selectionState).toBeNull();
    expect(removeAllRanges).toHaveBeenCalled();
  });

  it("computes global offsets for second answer", () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSelection(ref, [{ globalStartOffset: 0 }, { globalStartOffset: 28 }]),
    );

    const span = container.querySelector("[data-answer-index='1'] [data-char-start='0']")!;
    const textNode = span.firstChild!;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 6); // "Second"

    const mockSelection = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => range,
      toString: () => "Second",
      removeAllRanges: vi.fn(),
    };
    vi.spyOn(window, "getSelection").mockReturnValue(mockSelection as unknown as Selection);

    act(() => {
      container.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(result.current.selectionState).not.toBeNull();
    // Global offsets = answer1 globalStartOffset (28) + local offsets (0, 6)
    expect(result.current.selectionState?.startOffset).toBe(28);
    expect(result.current.selectionState?.endOffset).toBe(34);
    expect(result.current.selectionState?.answerIndex).toBe(1);
  });
});
