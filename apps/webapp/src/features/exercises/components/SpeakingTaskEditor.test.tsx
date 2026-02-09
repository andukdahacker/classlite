import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { SpeakingTaskEditor } from "./SpeakingTaskEditor";

describe("SpeakingTaskEditor", () => {
  const defaultProps = {
    sectionType: "S1_PART1_QA" as const,
    speakingPrepTime: null as number | null,
    speakingTime: null as number | null,
    maxRecordingDuration: null as number | null,
    enableTranscription: false,
    onSpeakingPrepTimeChange: vi.fn(),
    onSpeakingTimeChange: vi.fn(),
    onMaxRecordingDurationChange: vi.fn(),
    onEnableTranscriptionChange: vi.fn(),
  };

  it("renders speaking exercise settings header", () => {
    render(<SpeakingTaskEditor {...defaultProps} />);
    expect(screen.getByText("Speaking Exercise Settings")).toBeInTheDocument();
  });

  it("hides cue card timer settings for S1_PART1_QA", () => {
    render(<SpeakingTaskEditor {...defaultProps} sectionType="S1_PART1_QA" />);
    expect(screen.queryByText("Cue Card Timer Settings")).not.toBeInTheDocument();
  });

  it("shows cue card timer settings for S2_PART2_CUE_CARD", () => {
    render(<SpeakingTaskEditor {...defaultProps} sectionType="S2_PART2_CUE_CARD" />);
    expect(screen.getByText("Cue Card Timer Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Preparation Time (seconds)")).toBeInTheDocument();
    expect(screen.getByLabelText("Speaking Time (seconds)")).toBeInTheDocument();
  });

  it("hides cue card timer settings for S3_PART3_DISCUSSION", () => {
    render(<SpeakingTaskEditor {...defaultProps} sectionType="S3_PART3_DISCUSSION" />);
    expect(screen.queryByText("Cue Card Timer Settings")).not.toBeInTheDocument();
  });

  it("renders recording duration input", () => {
    render(<SpeakingTaskEditor {...defaultProps} maxRecordingDuration={60} />);
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
  });

  it("calls onMaxRecordingDurationChange when value changes", () => {
    const onMaxRecordingDurationChange = vi.fn();
    render(
      <SpeakingTaskEditor
        {...defaultProps}
        onMaxRecordingDurationChange={onMaxRecordingDurationChange}
      />,
    );
    fireEvent.change(screen.getByLabelText("Max Recording Duration per Question (seconds)"), {
      target: { value: "90" },
    });
    expect(onMaxRecordingDurationChange).toHaveBeenCalledWith(90);
  });

  it("renders transcription checkbox", () => {
    render(<SpeakingTaskEditor {...defaultProps} enableTranscription={false} />);
    expect(screen.getByText("Enable AI Transcription")).toBeInTheDocument();
  });

  it("calls onEnableTranscriptionChange when checkbox is toggled", () => {
    const onEnableTranscriptionChange = vi.fn();
    render(
      <SpeakingTaskEditor
        {...defaultProps}
        onEnableTranscriptionChange={onEnableTranscriptionChange}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onEnableTranscriptionChange).toHaveBeenCalledWith(true);
  });

  it("shows placeholder 120 for cue card recording duration", () => {
    render(<SpeakingTaskEditor {...defaultProps} sectionType="S2_PART2_CUE_CARD" />);
    const recordingInput = screen.getByLabelText("Max Recording Duration per Question (seconds)");
    expect(recordingInput).toHaveAttribute("placeholder", "120");
  });

  it("shows placeholder 60 for non-cue-card recording duration", () => {
    render(<SpeakingTaskEditor {...defaultProps} sectionType="S1_PART1_QA" />);
    const recordingInput = screen.getByLabelText("Max Recording Duration per Question (seconds)");
    expect(recordingInput).toHaveAttribute("placeholder", "60");
  });
});
