import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock react-resizable-panels — destructure non-DOM props to avoid React warnings
vi.mock("react-resizable-panels", () => ({
  PanelGroup: ({
    children,
    direction,
    className,
  }: {
    children: React.ReactNode;
    direction: string;
    className?: string;
    autoSaveId?: string;
  }) => (
    <div data-testid="panel-group" data-direction={direction} className={className}>
      {children}
    </div>
  ),
  Panel: ({
    children,
  }: {
    children: React.ReactNode;
    defaultSize?: number;
    minSize?: number;
  }) => (
    <div data-testid="panel">
      {children}
    </div>
  ),
  PanelResizeHandle: ({ className }: { className?: string; children?: React.ReactNode }) => (
    <div data-testid="resize-handle" className={className} />
  ),
}));

let matchMediaMatches = false;
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: matchMediaMatches && query === "(max-width: 767px)",
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
});

import { WorkbenchLayout } from "../components/WorkbenchLayout";

describe("WorkbenchLayout", () => {
  beforeEach(() => {
    matchMediaMatches = false;
  });

  it("renders both panes", () => {
    render(
      <WorkbenchLayout
        leftPane={<div>Left Content</div>}
        rightPane={<div>Right Content</div>}
      />,
    );

    expect(screen.getByText("Left Content")).toBeInTheDocument();
    expect(screen.getByText("Right Content")).toBeInTheDocument();
  });

  it("renders two panels", () => {
    render(
      <WorkbenchLayout
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />,
    );

    expect(screen.getAllByTestId("panel")).toHaveLength(2);
  });

  it("renders resize handle on desktop", () => {
    render(
      <WorkbenchLayout
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />,
    );

    expect(screen.getByTestId("resize-handle")).toBeInTheDocument();
  });

  it("hides resize handle on mobile viewport", () => {
    matchMediaMatches = true;

    // Need to re-render with mobile matchMedia
    const mobileMockMatchMedia = vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mobileMockMatchMedia,
    });

    const { container } = render(
      <WorkbenchLayout
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />,
    );

    // On mobile, resize handle should not render
    expect(container.querySelector("[data-testid='resize-handle']")).toBeNull();
  });

  it("uses vertical direction on mobile", () => {
    const mobileMockMatchMedia = vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: query === "(max-width: 767px)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: mobileMockMatchMedia,
    });

    render(
      <WorkbenchLayout
        leftPane={<div>Left</div>}
        rightPane={<div>Right</div>}
      />,
    );

    expect(screen.getByTestId("panel-group")).toHaveAttribute(
      "data-direction",
      "vertical",
    );
  });
});
