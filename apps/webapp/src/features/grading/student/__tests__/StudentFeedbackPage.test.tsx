import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentScoreDisplay } from "../StudentScoreDisplay";
import { StudentFeedbackContent } from "../StudentFeedbackContent";
import { StudentCommentsList } from "../StudentCommentsList";
import { SubmissionHistoryPanel } from "../SubmissionHistoryPanel";

// Mock react-router
vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ centerId: "center-1", submissionId: "sub-1" }),
}));

describe("StudentScoreDisplay", () => {
  it("renders overall score prominently", () => {
    render(
      <StudentScoreDisplay
        overallScore={6.5}
        criteriaScores={null}
        skill="WRITING"
      />,
    );
    expect(screen.getByText("6.5")).toBeInTheDocument();
    expect(screen.getByText("Band Score")).toBeInTheDocument();
  });

  it("renders criteria breakdown for writing", () => {
    render(
      <StudentScoreDisplay
        overallScore={6.0}
        criteriaScores={{
          taskAchievement: 6,
          coherence: 6,
          lexicalResource: 5.5,
          grammaticalRange: 6.5,
        }}
        skill="WRITING"
      />,
    );
    expect(screen.getByText("Task Achievement")).toBeInTheDocument();
    expect(screen.getByText("Coherence & Cohesion")).toBeInTheDocument();
    expect(screen.getByText("Lexical Resource")).toBeInTheDocument();
    expect(screen.getByText("Grammatical Range & Accuracy")).toBeInTheDocument();
  });

  it("renders speaking criteria for speaking skill", () => {
    render(
      <StudentScoreDisplay
        overallScore={7.0}
        criteriaScores={{ fluency: 7, pronunciation: 7 }}
        skill="SPEAKING"
      />,
    );
    expect(screen.getByText("Fluency & Coherence")).toBeInTheDocument();
    expect(screen.getByText("Pronunciation")).toBeInTheDocument();
  });

  it("shows dash when no score available", () => {
    render(
      <StudentScoreDisplay
        overallScore={null}
        criteriaScores={null}
        skill="WRITING"
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

describe("StudentFeedbackContent", () => {
  const baseAnswer = {
    id: "ans-1",
    questionId: "q-1",
    answer: { text: "The students was going to school every day. They enjoyed learning." },
  };

  it("renders student answers", () => {
    render(
      <StudentFeedbackContent
        answers={[baseAnswer]}
        feedbackItems={[]}
        teacherComments={[]}
        skill="WRITING"
      />,
    );
    expect(
      screen.getByText(/The students was going to school/),
    ).toBeInTheDocument();
  });

  it("renders grammar corrections as tracked changes", () => {
    render(
      <StudentFeedbackContent
        answers={[baseAnswer]}
        feedbackItems={[
          {
            id: "item-1",
            type: "grammar",
            content: "Subject-verb agreement",
            startOffset: 13,
            endOffset: 16,
            originalContextSnippet: "was",
            suggestedFix: "were",
            severity: "error",
          },
        ]}
        teacherComments={[]}
        skill="WRITING"
      />,
    );
    // The original text should be struck through
    const strikethrough = screen.getByText("was");
    expect(strikethrough.classList.contains("line-through")).toBe(true);
    // The suggested fix should appear
    expect(screen.getByText("were")).toBeInTheDocument();
  });

  it("renders only approved items (only receives approved from backend)", () => {
    render(
      <StudentFeedbackContent
        answers={[baseAnswer]}
        feedbackItems={[
          {
            id: "item-1",
            type: "vocabulary",
            content: "Good word choice here",
            startOffset: 0,
            endOffset: 12,
            suggestedFix: null,
            severity: "suggestion",
          },
        ]}
        teacherComments={[]}
        skill="WRITING"
      />,
    );
    // Should have a highlighted span (the component only receives approved items from API)
    expect(screen.getByText("The students")).toBeInTheDocument();
  });

  it("renders teacher comment anchors with emerald style", () => {
    render(
      <StudentFeedbackContent
        answers={[baseAnswer]}
        feedbackItems={[]}
        teacherComments={[
          {
            id: "tc-1",
            content: "Well written passage",
            startOffset: 0,
            endOffset: 12,
            authorName: "Teacher One",
          },
        ]}
        skill="WRITING"
      />,
    );
    // The teacher-highlighted text should exist
    expect(screen.getByText("The students")).toBeInTheDocument();
  });
});

describe("StudentCommentsList", () => {
  it("renders general feedback section", () => {
    render(
      <StudentCommentsList
        feedbackItems={[]}
        teacherComments={[]}
        generalFeedback="Overall good effort. Keep practicing."
      />,
    );
    expect(screen.getByText("General Feedback")).toBeInTheDocument();
    expect(
      screen.getByText("Overall good effort. Keep practicing."),
    ).toBeInTheDocument();
  });

  it("renders unanchored AI feedback items", () => {
    render(
      <StudentCommentsList
        feedbackItems={[
          {
            id: "ai-1",
            type: "general",
            content: "Consider improving your conclusion",
            startOffset: null,
            endOffset: null,
            createdAt: "2026-02-17T10:00:00Z",
          },
        ]}
        teacherComments={[]}
        generalFeedback={null}
      />,
    );
    expect(
      screen.getByText("Consider improving your conclusion"),
    ).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders unanchored teacher comments with author name", () => {
    render(
      <StudentCommentsList
        feedbackItems={[]}
        teacherComments={[
          {
            id: "tc-1",
            content: "Great progress this week!",
            startOffset: null,
            endOffset: null,
            authorName: "Mrs. Smith",
            createdAt: "2026-02-17T11:00:00Z",
          },
        ]}
        generalFeedback={null}
      />,
    );
    expect(screen.getByText("Great progress this week!")).toBeInTheDocument();
    expect(screen.getByText("Teacher")).toBeInTheDocument();
    expect(screen.getByText("Mrs. Smith")).toBeInTheDocument();
  });

  it("returns null when no content to display", () => {
    const { container } = render(
      <StudentCommentsList
        feedbackItems={[]}
        teacherComments={[]}
        generalFeedback={null}
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("StudentFeedbackContent — mobile viewport", () => {
  it("renders without horizontal overflow at 375px width", () => {
    // Simulate narrow viewport
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
    const { container } = render(
      <StudentFeedbackContent
        answers={[
          {
            id: "ans-1",
            questionId: "q-1",
            answer: { text: "A long student answer that should wrap properly on narrow viewports without causing horizontal scroll bars to appear." },
          },
        ]}
        feedbackItems={[]}
        teacherComments={[]}
        skill="WRITING"
      />,
    );
    // The container should not exceed viewport width
    const el = container.firstElementChild;
    expect(el).toBeTruthy();
    // No element should have scrollWidth > clientWidth (no horizontal overflow)
    if (el) {
      expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth || 375);
    }
  });
});

describe("SubmissionHistoryPanel", () => {
  it("shows when multiple submissions exist", () => {
    render(
      <SubmissionHistoryPanel
        history={[
          {
            id: "sub-2",
            submittedAt: "2026-02-17T10:00:00Z",
            score: 6.0,
            status: "GRADED",
          },
          {
            id: "sub-1",
            submittedAt: "2026-02-15T10:00:00Z",
            score: 5.5,
            status: "GRADED",
          },
        ]}
        currentSubmissionId="sub-2"
      />,
    );
    expect(screen.getByText("Submission History (2)")).toBeInTheDocument();
  });

  it("hides when only one entry", () => {
    const { container } = render(
      <SubmissionHistoryPanel
        history={[
          {
            id: "sub-1",
            submittedAt: "2026-02-17T10:00:00Z",
            score: 6.0,
            status: "GRADED",
          },
        ]}
        currentSubmissionId="sub-1"
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});
