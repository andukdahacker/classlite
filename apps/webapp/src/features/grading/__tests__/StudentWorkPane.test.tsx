import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock @workspace/ui components
vi.mock("@workspace/ui/components/collapsible", () => ({
  Collapsible: ({ children, ...props }: { children: React.ReactNode; open?: boolean; onOpenChange?: (v: boolean) => void }) => (
    <div data-testid="collapsible" {...props}>{children}</div>
  ),
  CollapsibleTrigger: ({ children, ...props }: { children: React.ReactNode; className?: string }) => (
    <button data-testid="collapsible-trigger" {...props}>{children}</button>
  ),
  CollapsibleContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scroll-area">{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/separator", () => ({
  Separator: (props: { className?: string }) => <hr data-testid="separator" {...props} />,
}));

// Mock HighlightedText to simplify testing
vi.mock("../components/HighlightedText", () => ({
  HighlightedText: ({ text, feedbackItems }: { text: string; feedbackItems: unknown[] }) => (
    <div data-testid="highlighted-text" data-feedback-count={feedbackItems.length}>
      {text}
    </div>
  ),
}));

import { StudentWorkPane } from "../components/StudentWorkPane";

const mockSections = [
  {
    type: "writing_task_2",
    instructions: "Write an essay about climate change.",
    questions: [{ id: "q1", prompt: "Discuss the impact of..." }],
  },
];

const mockAnswers = [
  {
    id: "a1",
    questionId: "q1",
    answer: { text: "Climate change is a global issue that affects everyone. We need to act now." },
    score: undefined,
  },
];

describe("StudentWorkPane", () => {
  it("renders exercise title in collapsible", () => {
    render(
      <StudentWorkPane
        exerciseTitle="IELTS Writing Task 2"
        exerciseSkill="WRITING"
        sections={mockSections}
        answers={mockAnswers}
      />,
    );

    expect(screen.getByText("IELTS Writing Task 2")).toBeInTheDocument();
  });

  it("renders question prompt", () => {
    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={mockSections}
        answers={mockAnswers}
      />,
    );

    expect(screen.getByText("Discuss the impact of...")).toBeInTheDocument();
  });

  it("renders student text via HighlightedText", () => {
    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={mockSections}
        answers={mockAnswers}
      />,
    );

    expect(
      screen.getByText(
        "Climate change is a global issue that affects everyone. We need to act now.",
      ),
    ).toBeInTheDocument();
  });

  it("displays correct word count", () => {
    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={mockSections}
        answers={mockAnswers}
      />,
    );

    // "Climate change is a global issue that affects everyone. We need to act now." = 14 words
    expect(screen.getByText(/14.*250 min words/)).toBeInTheDocument();
  });

  it("shows 'No transcript available' for Speaking with empty transcript", () => {
    const speakingAnswers = [
      { id: "a1", questionId: "q1", answer: { transcript: "" } },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="SPEAKING"
        sections={mockSections}
        answers={speakingAnswers}
      />,
    );

    expect(screen.getByText("No transcript available")).toBeInTheDocument();
  });

  it("shows 'No answer submitted' for Writing with no text", () => {
    const emptyAnswers = [
      { id: "a1", questionId: "q1", answer: {} },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={mockSections}
        answers={emptyAnswers}
      />,
    );

    expect(screen.getByText("No answer submitted")).toBeInTheDocument();
  });

  it("renders multiple questions with separators", () => {
    const multiSections = [
      {
        type: "speaking_part_1",
        instructions: "Answer the following questions.",
        questions: [
          { id: "q1", prompt: "Question 1" },
          { id: "q2", prompt: "Question 2" },
        ],
      },
    ];
    const multiAnswers = [
      { id: "a1", questionId: "q1", answer: { transcript: "Answer one" } },
      { id: "a2", questionId: "q2", answer: { transcript: "Answer two" } },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="SPEAKING"
        sections={multiSections}
        answers={multiAnswers}
      />,
    );

    expect(screen.getByText("Answer one")).toBeInTheDocument();
    expect(screen.getByText("Answer two")).toBeInTheDocument();
    expect(screen.getAllByTestId("separator")).toHaveLength(1);
  });

  // NEW TESTS for Story 5-3

  it("renders text from answers when sections is empty", () => {
    const answersNoSections = [
      {
        id: "a1",
        questionId: "q1",
        answer: { text: "This is my essay about the topic." },
      },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={answersNoSections}
      />,
    );

    expect(screen.getByText("This is my essay about the topic.")).toBeInTheDocument();
  });

  it("displays word count when sections is empty", () => {
    const answersNoSections = [
      {
        id: "a1",
        questionId: "q1",
        answer: { text: "One two three four five" },
      },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={answersNoSections}
      />,
    );

    expect(screen.getByText(/5.*250 min words/)).toBeInTheDocument();
  });

  it("renders multiple answers with separators when sections is empty", () => {
    const multiAnswers = [
      { id: "a1", questionId: "q1", answer: { text: "First answer" } },
      { id: "a2", questionId: "q2", answer: { text: "Second answer" } },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={multiAnswers}
      />,
    );

    expect(screen.getByText("First answer")).toBeInTheDocument();
    expect(screen.getByText("Second answer")).toBeInTheDocument();
    expect(screen.getAllByTestId("separator")).toHaveLength(1);
  });

  it("passes feedbackItems to HighlightedText when sections is empty", () => {
    const answersNoSections = [
      {
        id: "a1",
        questionId: "q1",
        answer: { text: "Hello world" },
      },
    ];

    const feedbackItems = [
      {
        id: "fb-1",
        startOffset: 0,
        endOffset: 5,
        originalContextSnippet: "Hello",
        severity: "error" as const,
      },
    ];

    const anchorStatuses = new Map([["fb-1", "valid" as const]]);

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={answersNoSections}
        feedbackItems={feedbackItems}
        anchorStatuses={anchorStatuses}
      />,
    );

    const highlighted = screen.getByTestId("highlighted-text");
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).toHaveAttribute("data-feedback-count", "1");
  });

  it("shows 'No answer submitted' in empty sections mode with no text", () => {
    const emptyAnswers = [
      { id: "a1", questionId: "q1", answer: {} },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={emptyAnswers}
      />,
    );

    expect(screen.getByText("No answer submitted")).toBeInTheDocument();
  });

  it("shows answer labels when multiple answers in empty sections mode", () => {
    const multiAnswers = [
      { id: "a1", questionId: "q1", answer: { text: "First" } },
      { id: "a2", questionId: "q2", answer: { text: "Second" } },
    ];

    render(
      <StudentWorkPane
        exerciseTitle="Test"
        exerciseSkill="WRITING"
        sections={[]}
        answers={multiAnswers}
      />,
    );

    expect(screen.getByText("Answer 1")).toBeInTheDocument();
    expect(screen.getByText("Answer 2")).toBeInTheDocument();
  });
});
