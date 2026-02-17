import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { ConnectionLineOverlay } from "../components/ConnectionLineOverlay";

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver);

describe("ConnectionLineOverlay", () => {
  const mockContainerRef = {
    current: document.createElement("div"),
  } as React.RefObject<HTMLDivElement | null>;

  beforeEach(() => {
    // Set up container with mock elements
    const container = document.createElement("div");
    const textSpan = document.createElement("span");
    textSpan.setAttribute("data-feedback-id", "item-1");
    const card = document.createElement("div");
    card.setAttribute("data-card-id", "item-1");

    container.appendChild(textSpan);
    container.appendChild(card);

    // Mock getBoundingClientRect
    container.getBoundingClientRect = () => ({
      top: 0, left: 0, right: 1000, bottom: 600,
      width: 1000, height: 600, x: 0, y: 0, toJSON: () => {},
    });
    textSpan.getBoundingClientRect = () => ({
      top: 100, left: 50, right: 150, bottom: 120,
      width: 100, height: 20, x: 50, y: 100, toJSON: () => {},
    });
    card.getBoundingClientRect = () => ({
      top: 100, left: 600, right: 800, bottom: 150,
      width: 200, height: 50, x: 600, y: 100, toJSON: () => {},
    });

    (mockContainerRef as { current: HTMLDivElement }).current = container;
  });

  it("renders SVG when highlightedItemId is set and not mobile", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId="item-1"
        isMobile={false}
        severity="error"
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("renders nothing when isMobile is true", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId="item-1"
        isMobile={true}
        severity="error"
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("renders nothing when highlightedItemId is null", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId={null}
        isMobile={false}
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("renders nothing when no matching DOM elements", () => {
    const emptyContainer = document.createElement("div");
    emptyContainer.getBoundingClientRect = () => ({
      top: 0, left: 0, right: 1000, bottom: 600,
      width: 1000, height: 600, x: 0, y: 0, toJSON: () => {},
    });
    const emptyRef = { current: emptyContainer } as React.RefObject<HTMLDivElement | null>;

    const { container } = render(
      <ConnectionLineOverlay
        containerRef={emptyRef}
        highlightedItemId="non-existent"
        isMobile={false}
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("has aria-hidden on SVG element", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId="item-1"
        isMobile={false}
        severity="error"
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("has pointer-events-none on SVG", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId="item-1"
        isMobile={false}
        severity="error"
      />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains("pointer-events-none")).toBe(true);
  });

  it("uses correct stroke color for error severity", () => {
    const { container } = render(
      <ConnectionLineOverlay
        containerRef={mockContainerRef}
        highlightedItemId="item-1"
        isMobile={false}
        severity="error"
      />,
    );

    const paths = container.querySelectorAll("path");
    // Main stroke path (second one)
    const mainPath = paths[1];
    expect(mainPath).toHaveAttribute("stroke", "#EF4444");
  });
});
