import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BandScoreCard } from "../components/BandScoreCard";

vi.mock("lucide-react", () => ({
  Pencil: (props: Record<string, unknown>) => <span data-testid="pencil-icon" {...props} />,
}));

vi.mock("@workspace/ui/components/card", () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/input", () => ({
  Input: (props: Record<string, unknown>) => <input data-testid="score-input" {...props} />,
}));

vi.mock("@workspace/ui/components/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
}));

describe("BandScoreCard", () => {
  it("displays overall score and criteria scores", () => {
    render(
      <BandScoreCard
        overallScore={7.0}
        criteriaScores={{ taskAchievement: 7.0, coherence: 6.5, lexicalResource: 7.0, grammaticalRange: 7.5 }}
        skill="WRITING"
      />,
    );

    // "7" appears 3 times: overall score, taskAchievement, lexicalResource
    const sevens = screen.getAllByText("7");
    expect(sevens.length).toBe(3);
    expect(screen.getByText("6.5")).toBeInTheDocument();
    expect(screen.getByText("7.5")).toBeInTheDocument();
  });

  it("shows score input when clicked with onScoreChange", () => {
    const onScoreChange = vi.fn();
    render(
      <BandScoreCard
        overallScore={7.0}
        criteriaScores={{ taskAchievement: 7.0 }}
        skill="WRITING"
        onScoreChange={onScoreChange}
      />,
    );

    // Click on the overall score (it has role="button")
    const scoreButton = screen.getAllByRole("button")[0]!;
    fireEvent.click(scoreButton);

    expect(screen.getByTestId("score-input")).toBeInTheDocument();
  });

  it("shows AI reference score when teacher overrides", () => {
    render(
      <BandScoreCard
        overallScore={6.5}
        criteriaScores={{ taskAchievement: 6.0 }}
        skill="WRITING"
        teacherFinalScore={7.5}
        onScoreChange={vi.fn()}
      />,
    );

    expect(screen.getByText("AI: 6.5")).toBeInTheDocument();
  });

  it("shows Graded badge when finalized", () => {
    render(
      <BandScoreCard
        overallScore={7.0}
        criteriaScores={{ taskAchievement: 7.0 }}
        skill="WRITING"
        isFinalized={true}
      />,
    );

    expect(screen.getByText("Graded")).toBeInTheDocument();
  });
});
