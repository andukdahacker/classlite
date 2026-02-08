import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { PlaybackModeSettings } from "./PlaybackModeSettings";
import { AudioSectionMarkers } from "./AudioSectionMarkers";

// --- PlaybackModeSettings ---
describe("PlaybackModeSettings", () => {
  it("renders both radio options", () => {
    render(
      <PlaybackModeSettings
        playbackMode="PRACTICE_MODE"
        onPlaybackModeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Practice Mode")).toBeInTheDocument();
    expect(screen.getByText("Test Mode")).toBeInTheDocument();
  });

  it("defaults to Practice Mode when playbackMode is null", () => {
    render(
      <PlaybackModeSettings
        playbackMode={null}
        onPlaybackModeChange={vi.fn()}
      />,
    );
    const practiceRadio = screen.getByLabelText("Practice Mode");
    expect(practiceRadio).toBeInTheDocument();
  });

  it("calls onPlaybackModeChange when selection changes", () => {
    const onChange = vi.fn();
    render(
      <PlaybackModeSettings
        playbackMode="PRACTICE_MODE"
        onPlaybackModeChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Test Mode"));
    expect(onChange).toHaveBeenCalledWith("TEST_MODE");
  });

  it("shows description text for each mode", () => {
    render(
      <PlaybackModeSettings
        playbackMode="PRACTICE_MODE"
        onPlaybackModeChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Unlimited replay with seek bar/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Single play only/),
    ).toBeInTheDocument();
  });
});

// --- AudioSectionMarkers ---
describe("AudioSectionMarkers", () => {
  it("renders nothing when audioDuration is null", () => {
    const { container } = render(
      <AudioSectionMarkers
        sections={[]}
        audioDuration={null}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when audioDuration is 0", () => {
    const { container } = render(
      <AudioSectionMarkers
        sections={[]}
        audioDuration={0}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders section rows when sections exist", () => {
    render(
      <AudioSectionMarkers
        sections={[
          { label: "Section 1", startTime: 0, endTime: 120 },
          { label: "Section 2", startTime: 120, endTime: 240 },
        ]}
        audioDuration={300}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(screen.getByDisplayValue("Section 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Section 2")).toBeInTheDocument();
  });

  it("shows Add Section button", () => {
    render(
      <AudioSectionMarkers
        sections={[]}
        audioDuration={300}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Add Section")).toBeInTheDocument();
  });

  it("calls onSectionsChange when Add Section is clicked", () => {
    const onChange = vi.fn();
    render(
      <AudioSectionMarkers
        sections={[]}
        audioDuration={300}
        onSectionsChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("Add Section"));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        label: "Section 1",
        startTime: 0,
        endTime: 60,
      }),
    ]);
  });

  it("appends section starting from previous section end time", () => {
    const onChange = vi.fn();
    render(
      <AudioSectionMarkers
        sections={[{ label: "Section 1", startTime: 0, endTime: 120 }]}
        audioDuration={300}
        onSectionsChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText("Add Section"));
    expect(onChange).toHaveBeenCalledWith([
      { label: "Section 1", startTime: 0, endTime: 120 },
      expect.objectContaining({
        label: "Section 2",
        startTime: 120,
        endTime: 180,
      }),
    ]);
  });

  it("shows audio duration", () => {
    render(
      <AudioSectionMarkers
        sections={[]}
        audioDuration={185}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Audio duration: 3:05/)).toBeInTheDocument();
  });

  it("shows validation error for endTime <= startTime", () => {
    render(
      <AudioSectionMarkers
        sections={[{ label: "Section 1", startTime: 120, endTime: 60 }]}
        audioDuration={300}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/end time must be after start time/),
    ).toBeInTheDocument();
  });

  it("shows validation error for endTime exceeding duration", () => {
    render(
      <AudioSectionMarkers
        sections={[{ label: "Section 1", startTime: 0, endTime: 400 }]}
        audioDuration={300}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/end time exceeds audio duration/),
    ).toBeInTheDocument();
  });

  it("shows validation error for overlapping sections", () => {
    render(
      <AudioSectionMarkers
        sections={[
          { label: "Section 1", startTime: 0, endTime: 120 },
          { label: "Section 2", startTime: 60, endTime: 180 },
        ]}
        audioDuration={300}
        onSectionsChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/overlaps with Section 1/),
    ).toBeInTheDocument();
  });
});
