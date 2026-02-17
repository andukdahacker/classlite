import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock @workspace/ui components
vi.mock("@workspace/ui/components/collapsible", () => ({
  Collapsible: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CollapsibleTrigger: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/separator", () => ({
  Separator: () => <hr />,
}));

vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="feedback-card" {...props}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/skeleton", () => ({
  Skeleton: () => <div />,
}));

vi.mock("@workspace/ui/components/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  SpellCheck: () => <span />,
  BookOpen: () => <span />,
  Link: () => <span />,
  Star: () => <span />,
  MessageCircle: () => <span />,
  AlertTriangle: () => <span />,
  RefreshCw: () => <span />,
  Unlink: () => <span />,
  ChevronDown: () => <span />,
}));

import { HighlightProvider } from "../hooks/use-highlight-context";
import { StudentWorkPane } from "../components/StudentWorkPane";
import { AIFeedbackPane } from "../components/AIFeedbackPane";
import { validateAnchor } from "../hooks/use-anchor-validation";
import type { AnchorStatus } from "../hooks/use-anchor-validation";

const studentText = "The student made a grammer mistake here.";
const feedbackItems = [
  {
    id: "fb-1",
    type: "grammar" as const,
    content: "Grammar error: 'grammer' should be 'grammar'",
    severity: "error" as const,
    confidence: 0.95,
    startOffset: 19,
    endOffset: 26,
    originalContextSnippet: "grammer",
    suggestedFix: "grammar",
  },
];

const answers = [
  {
    id: "a1",
    questionId: "q1",
    answer: { text: studentText },
  },
];

describe("Evidence Anchoring Integration", () => {
  it("hovering a feedback card highlights text and shows correct data attributes", () => {
    // Compute anchor statuses
    const anchorStatuses = new Map<string, AnchorStatus>();
    for (const item of feedbackItems) {
      const result = validateAnchor(
        item.startOffset,
        item.endOffset,
        item.originalContextSnippet,
        studentText,
      );
      anchorStatuses.set(item.id, result.anchorStatus);
    }

    const onHighlight = vi.fn();

    render(
      <HighlightProvider>
        <StudentWorkPane
          exerciseTitle="Test"
          exerciseSkill="WRITING"
          sections={[]}
          answers={answers}
          feedbackItems={feedbackItems}
          anchorStatuses={anchorStatuses}
        />
        <AIFeedbackPane
          analysisStatus="ready"
          feedback={{
            id: "feedback-1",
            overallScore: 6.5,
            criteriaScores: null,
            generalFeedback: null,
            items: feedbackItems,
          }}
          skill="WRITING"
          onRetrigger={() => {}}
          isRetriggering={false}
          anchorStatuses={anchorStatuses}
          highlightedItemId={null}
          onHighlight={onHighlight}
        />
      </HighlightProvider>,
    );

    // Find feedback cards with data-card-id (exclude BandScoreCard)
    const cards = document.querySelectorAll<HTMLElement>("[data-card-id]");
    expect(cards.length).toBeGreaterThan(0);

    // Hover the feedback card (mouse → debounce=true)
    fireEvent.mouseEnter(cards[0]);
    expect(onHighlight).toHaveBeenCalledWith("fb-1", true);

    // Verify text highlight span exists
    const textSpan = document.querySelector('[data-feedback-id="fb-1"]');
    expect(textSpan).toBeInTheDocument();
    expect(textSpan?.textContent).toBe("grammer");

    // Clear hover (mouse → debounce=true)
    fireEvent.mouseLeave(cards[0]);
    expect(onHighlight).toHaveBeenCalledWith(null, true);
  });

  it("anchor validation returns valid for exact match", () => {
    const result = validateAnchor(19, 26, "grammer", studentText);
    expect(result.anchorStatus).toBe("valid");
    expect(result.textAtOffset).toBe("grammer");
  });

  it("feedback cards with no offsets do not show anchor UI", () => {
    const generalItem = {
      id: "fb-general",
      type: "general" as const,
      content: "Overall well written",
      severity: null,
      confidence: null,
      startOffset: null,
      endOffset: null,
      originalContextSnippet: null,
      suggestedFix: null,
    };

    const anchorStatuses = new Map<string, AnchorStatus>();
    anchorStatuses.set("fb-general", "no-anchor");

    render(
      <HighlightProvider>
        <AIFeedbackPane
          analysisStatus="ready"
          feedback={{
            id: "feedback-1",
            overallScore: 6.5,
            criteriaScores: null,
            generalFeedback: null,
            items: [generalItem],
          }}
          skill="WRITING"
          onRetrigger={() => {}}
          isRetriggering={false}
          anchorStatuses={anchorStatuses}
          highlightedItemId={null}
          onHighlight={() => {}}
        />
      </HighlightProvider>,
    );

    // Find the general feedback card (the one with data-card-id="fb-general")
    const card = document.querySelector('[data-card-id="fb-general"]');
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveAttribute("aria-details");
  });
});
