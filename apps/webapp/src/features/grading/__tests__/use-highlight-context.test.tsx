import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import {
  HighlightProvider,
  useHighlightValue,
  useHighlightSetter,
  useHighlightState,
} from "../hooks/use-highlight-context";

function TestValueConsumer() {
  const value = useHighlightValue();
  return <div data-testid="value">{value ?? "null"}</div>;
}

function TestSetterConsumer({ id }: { id: string }) {
  const setter = useHighlightSetter();
  return (
    <button data-testid="setter" onClick={() => setter(id, false)}>
      Set {id}
    </button>
  );
}

describe("useHighlightContext", () => {
  it("provides null as default value", () => {
    render(
      <HighlightProvider>
        <TestValueConsumer />
      </HighlightProvider>,
    );

    expect(screen.getByTestId("value")).toHaveTextContent("null");
  });

  it("updates value when setter is called", async () => {
    vi.useFakeTimers();

    render(
      <HighlightProvider>
        <TestValueConsumer />
        <TestSetterConsumer id="item-1" />
      </HighlightProvider>,
    );

    expect(screen.getByTestId("value")).toHaveTextContent("null");

    act(() => {
      screen.getByTestId("setter").click();
    });

    expect(screen.getByTestId("value")).toHaveTextContent("item-1");

    vi.useRealTimers();
  });

  it("useHighlightState returns both value and setter", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HighlightProvider>{children}</HighlightProvider>
    );

    const { result } = renderHook(() => useHighlightState(), { wrapper });

    expect(result.current.highlightedItemId).toBeNull();
    expect(typeof result.current.setHighlightedItemId).toBe("function");
  });

  it("debounces mouse events (debounce=true)", async () => {
    vi.useFakeTimers();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HighlightProvider>{children}</HighlightProvider>
    );

    const { result } = renderHook(() => useHighlightState(), { wrapper });

    // Call with debounce=true (default)
    act(() => {
      result.current.setHighlightedItemId("item-1", true);
    });

    // Value should NOT be set yet (debounced)
    expect(result.current.highlightedItemId).toBeNull();

    // Advance timers past debounce
    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(result.current.highlightedItemId).toBe("item-1");

    vi.useRealTimers();
  });

  it("does not debounce focus events (debounce=false)", () => {
    vi.useFakeTimers();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <HighlightProvider>{children}</HighlightProvider>
    );

    const { result } = renderHook(() => useHighlightState(), { wrapper });

    act(() => {
      result.current.setHighlightedItemId("item-1", false);
    });

    // Should be set immediately
    expect(result.current.highlightedItemId).toBe("item-1");

    vi.useRealTimers();
  });
});
