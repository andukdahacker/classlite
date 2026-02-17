import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackItemCard } from "../components/FeedbackItemCard";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  SpellCheck: (props: Record<string, unknown>) => <span data-testid="icon-spellcheck" {...props} />,
  BookOpen: (props: Record<string, unknown>) => <span data-testid="icon-bookopen" {...props} />,
  Link: (props: Record<string, unknown>) => <span data-testid="icon-link" {...props} />,
  Star: (props: Record<string, unknown>) => <span data-testid="icon-star" {...props} />,
  MessageCircle: (props: Record<string, unknown>) => <span data-testid="icon-message" {...props} />,
  Unlink: (props: Record<string, unknown>) => <span data-testid="icon-unlink" {...props} />,
}));

vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" {...props}>{children}</span>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
}));

const baseItem = {
  id: "item-1",
  type: "grammar" as const,
  content: "Subject-verb agreement error",
  severity: "error" as const,
  confidence: 0.95,
  originalContextSnippet: null,
  suggestedFix: null,
};

describe("FeedbackItemCard", () => {
  it("calls onHighlight with id and debounce=true on mouse enter", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={baseItem}
        anchorStatus="valid"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId("card"));
    expect(onHighlight).toHaveBeenCalledWith("item-1", true);
  });

  it("calls onHighlight with null and debounce=true on mouse leave", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={baseItem}
        anchorStatus="valid"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.mouseLeave(screen.getByTestId("card"));
    expect(onHighlight).toHaveBeenCalledWith(null, true);
  });

  it("calls onHighlight with id and debounce=false on focus (immediate)", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={baseItem}
        anchorStatus="valid"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.focus(screen.getByTestId("card"));
    expect(onHighlight).toHaveBeenCalledWith("item-1", false);
  });

  it("calls onHighlight with null and debounce=false on blur (immediate)", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={baseItem}
        anchorStatus="valid"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.blur(screen.getByTestId("card"));
    expect(onHighlight).toHaveBeenCalledWith(null, false);
  });

  it("shows 'Anchor lost' text for orphaned items", () => {
    render(
      <FeedbackItemCard item={baseItem} anchorStatus="orphaned" />,
    );

    expect(
      screen.getByText(/Anchor lost — text changed since analysis/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("icon-unlink")).toBeInTheDocument();
  });

  it("does NOT fire onHighlight for orphaned items", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={baseItem}
        anchorStatus="orphaned"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId("card"));
    fireEvent.focus(screen.getByTestId("card"));
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("shows amber dot for drifted items", () => {
    const { container } = render(
      <FeedbackItemCard item={baseItem} anchorStatus="drifted" />,
    );

    const dot = container.querySelector(".bg-amber-400");
    expect(dot).toBeInTheDocument();
  });

  it("no-anchor items have no hover behavior", () => {
    const onHighlight = vi.fn();
    render(
      <FeedbackItemCard
        item={{ ...baseItem, type: "general" }}
        anchorStatus="no-anchor"
        onHighlight={onHighlight}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId("card"));
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("has correct aria-details attribute for valid anchors", () => {
    render(
      <FeedbackItemCard item={baseItem} anchorStatus="valid" />,
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("aria-details", "anchor-item-1");
  });

  it("has data-card-id attribute", () => {
    render(<FeedbackItemCard item={baseItem} />);

    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-card-id", "item-1");
  });
});
