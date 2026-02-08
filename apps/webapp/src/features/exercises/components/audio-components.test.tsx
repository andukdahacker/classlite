import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, it, vi, expect } from "vitest";
import { PlaybackModeSettings } from "./PlaybackModeSettings";
import { AudioSectionMarkers } from "./AudioSectionMarkers";
import { AudioUploadEditor } from "./AudioUploadEditor";

// Mock the audio upload hooks
const mockUploadMutateAsync = vi.fn();
const mockDeleteMutateAsync = vi.fn();
let mockUploadIsPending = false;
let mockDeleteIsPending = false;

vi.mock("../hooks/use-audio-upload", () => ({
  useAudioUpload: () => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: mockUploadIsPending,
  }),
  useAudioDelete: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: mockDeleteIsPending,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

// --- AudioUploadEditor ---
describe("AudioUploadEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUploadIsPending = false;
    mockDeleteIsPending = false;
  });

  it("renders upload drop zone when no audio", () => {
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl={null}
        audioDuration={null}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Drag audio file here or click to upload"),
    ).toBeInTheDocument();
    expect(screen.getByText(/MP3, WAV, M4A/)).toBeInTheDocument();
  });

  it("shows audio player when audioUrl is present", () => {
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl="https://storage.example.com/audio.mp3"
        audioDuration={272}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    const audioElement = document.querySelector("audio");
    expect(audioElement).toBeTruthy();
    expect(audioElement?.getAttribute("src")).toBe(
      "https://storage.example.com/audio.mp3",
    );
  });

  it("shows duration in mm:ss format when audioUrl is present", () => {
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl="https://storage.example.com/audio.mp3"
        audioDuration={272}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    expect(screen.getByText("(4:32)")).toBeInTheDocument();
  });

  it("shows Remove Audio button when audio is uploaded", () => {
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl="https://storage.example.com/audio.mp3"
        audioDuration={120}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    expect(screen.getByText("Remove Audio")).toBeInTheDocument();
  });

  it("calls delete mutation when Remove Audio is clicked", async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined);
    const onAudioChange = vi.fn();
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl="https://storage.example.com/audio.mp3"
        audioDuration={120}
        onAudioChange={onAudioChange}
        onDurationExtracted={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Remove Audio"));
    expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
      exerciseId: "ex-1",
    });
  });

  it("has a hidden file input accepting audio types", () => {
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl={null}
        audioDuration={null}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toBe(".mp3,.wav,.m4a");
  });

  it("shows Uploading state when upload is pending", () => {
    mockUploadIsPending = true;
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl={null}
        audioDuration={null}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });

  it("shows Removing state when delete is pending", () => {
    mockDeleteIsPending = true;
    render(
      <AudioUploadEditor
        exerciseId="ex-1"
        audioUrl="https://storage.example.com/audio.mp3"
        audioDuration={120}
        onAudioChange={vi.fn()}
        onDurationExtracted={vi.fn()}
      />,
    );
    expect(screen.getByText("Removing...")).toBeInTheDocument();
  });
});
