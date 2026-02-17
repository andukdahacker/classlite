import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock highlight context
const mockHighlightValue = vi.fn().mockReturnValue(null);
vi.mock("../hooks/use-highlight-context", () => ({
  useHighlightValue: () => mockHighlightValue(),
}));

import { HighlightedText } from "../components/HighlightedText";

beforeEach(() => {
  mockHighlightValue.mockReturnValue(null);
});

describe("HighlightedText", () => {
  it("renders plain text when no feedback items", () => {
    render(<HighlightedText text="Hello world" feedbackItems={[]} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders highlighted span with data-feedback-id", () => {
    const items = [
      {
        id: "item-1",
        startOffset: 0,
        endOffset: 5,
        severity: "error" as const,
        anchorStatus: "valid" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-1"]');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent("Hello");
  });

  it("applies active highlight bg for error severity", () => {
    mockHighlightValue.mockReturnValue("item-1");
    const items = [
      {
        id: "item-1",
        startOffset: 0,
        endOffset: 5,
        severity: "error" as const,
        anchorStatus: "valid" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-1"]');
    expect(span?.className).toContain("bg-red-100");
    mockHighlightValue.mockReturnValue(null);
  });

  it("applies active highlight bg for warning severity", () => {
    mockHighlightValue.mockReturnValue("item-2");
    const items = [
      {
        id: "item-2",
        startOffset: 0,
        endOffset: 5,
        severity: "warning" as const,
        anchorStatus: "valid" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-2"]');
    expect(span?.className).toContain("bg-amber-100");
    mockHighlightValue.mockReturnValue(null);
  });

  it("applies active highlight bg for suggestion severity", () => {
    mockHighlightValue.mockReturnValue("item-3");
    const items = [
      {
        id: "item-3",
        startOffset: 0,
        endOffset: 5,
        severity: "suggestion" as const,
        anchorStatus: "valid" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-3"]');
    expect(span?.className).toContain("bg-blue-100");
    mockHighlightValue.mockReturnValue(null);
  });

  it("applies dotted underline on inactive anchored spans", () => {
    mockHighlightValue.mockReturnValue(null);
    const items = [
      {
        id: "item-1",
        startOffset: 0,
        endOffset: 5,
        severity: "error" as const,
        anchorStatus: "valid" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-1"]');
    expect(span?.className).toContain("underline");
    expect(span?.className).toContain("decoration-dotted");
  });

  it("does not render spans for orphaned items", () => {
    const items = [
      {
        id: "item-1",
        startOffset: 0,
        endOffset: 5,
        severity: "error" as const,
        anchorStatus: "orphaned" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-1"]');
    expect(span).toBeNull();
  });

  it("does not render spans for no-anchor items", () => {
    const items = [
      {
        id: "item-1",
        startOffset: 0,
        endOffset: 5,
        severity: "error" as const,
        anchorStatus: "no-anchor" as const,
      },
    ];
    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    const span = document.querySelector('[data-feedback-id="item-1"]');
    expect(span).toBeNull();
  });

  it("handles overlapping ranges with severity priority", () => {
    const items = [
      {
        id: "error-item",
        startOffset: 0,
        endOffset: 8,
        severity: "error" as const,
        anchorStatus: "valid" as const,
      },
      {
        id: "warning-item",
        startOffset: 3,
        endOffset: 11,
        severity: "warning" as const,
        anchorStatus: "valid" as const,
      },
    ];
    mockHighlightValue.mockReturnValue("error-item");

    render(<HighlightedText text="Hello world" feedbackItems={items} />);

    // The overlap (indices 3-8) should use the error item (higher severity)
    const errorSpan = document.querySelector('[data-feedback-id="error-item"]');
    expect(errorSpan).toBeInTheDocument();
    mockHighlightValue.mockReturnValue(null);
  });

  it("renders across paragraph boundaries", () => {
    const { container } = render(
      <HighlightedText text={"Hello\nworld"} feedbackItems={[]} />,
    );

    // Should have 2 paragraphs for text with \n
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(2);
    expect(paragraphs[0].textContent).toBe("Hello");
    expect(paragraphs[1].textContent).toBe("world");
  });
});
