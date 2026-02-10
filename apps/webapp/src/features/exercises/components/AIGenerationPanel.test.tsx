import { render, screen } from "@testing-library/react";
import { beforeEach, describe, it, vi, expect } from "vitest";
import { AIGenerationPanel } from "./AIGenerationPanel";

// Mock the AI generation hook
const mockGenerate = vi.fn();
let mockJobStatus: { status: string; error?: string } | null = null;
let mockIsGenerating = false;
let mockIsGenerateLoading = false;

vi.mock("../hooks/use-ai-generation", () => ({
  useAIGeneration: () => ({
    jobStatus: mockJobStatus,
    isGenerating: mockIsGenerating,
    generate: mockGenerate,
    isGenerateLoading: mockIsGenerateLoading,
  }),
}));

describe("AIGenerationPanel", () => {
  const defaultProps = {
    exerciseId: "ex-1",
    hasPassage: true,
    existingSections: [] as never[],
    onGenerationComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockJobStatus = null;
    mockIsGenerating = false;
    mockIsGenerateLoading = false;
  });

  it("renders the AI Question Generation title", () => {
    render(<AIGenerationPanel {...defaultProps} />);
    expect(screen.getByText("AI Question Generation")).toBeInTheDocument();
  });

  it("shows message when no passage is available", () => {
    render(<AIGenerationPanel {...defaultProps} hasPassage={false} />);
    expect(
      screen.getByText("Add a passage first before generating questions."),
    ).toBeInTheDocument();
  });

  it("shows Add Question Type button when passage exists", () => {
    render(<AIGenerationPanel {...defaultProps} />);
    expect(screen.getByText("Add Question Type")).toBeInTheDocument();
  });

  it("shows generating state when isGenerating is true", () => {
    mockIsGenerating = true;
    mockJobStatus = { status: "processing" };
    render(<AIGenerationPanel {...defaultProps} />);
    expect(screen.getByText("Generating questions...")).toBeInTheDocument();
    expect(screen.getByText("Status: processing")).toBeInTheDocument();
  });

  it("shows error state when generation failed", () => {
    mockJobStatus = { status: "failed", error: "AI timeout" };
    render(<AIGenerationPanel {...defaultProps} />);
    expect(
      screen.getByText("Generation failed: AI timeout"),
    ).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("shows success state when generation completed", () => {
    mockJobStatus = { status: "completed" };
    render(<AIGenerationPanel {...defaultProps} />);
    expect(
      screen.getByText("Questions generated successfully"),
    ).toBeInTheDocument();
  });

  it("does not show Generate Questions button when no types selected", () => {
    render(<AIGenerationPanel {...defaultProps} />);
    expect(screen.queryByText("Generate Questions")).not.toBeInTheDocument();
  });

  it("does not show difficulty selector when no types selected", () => {
    render(<AIGenerationPanel {...defaultProps} />);
    expect(screen.queryByText("Difficulty:")).not.toBeInTheDocument();
  });
});
