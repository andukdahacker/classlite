import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagSelector } from "./TagSelector";

// Mock the useTags hook
const mockCreateTag = vi.fn();
vi.mock("../hooks/use-tags", () => ({
  useTags: () => ({
    tags: [
      { id: "tag-1", name: "Environment", _count: { tagAssignments: 3 } },
      { id: "tag-2", name: "Health", _count: { tagAssignments: 1 } },
      { id: "tag-3", name: "Technology", _count: { tagAssignments: 0 } },
    ],
    createTag: mockCreateTag,
    isCreating: false,
  }),
}));

// Mock Popover/Command components (Radix)
vi.mock("@workspace/ui/components/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PopoverTrigger: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div {...props}>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@workspace/ui/components/command", () => ({
  Command: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandInput: ({
    placeholder,
    value,
    onValueChange,
  }: {
    placeholder: string;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandEmpty: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandItem: ({
    children,
    onSelect,
    ...props
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    value?: string;
    disabled?: boolean;
  }) => (
    <div role="option" onClick={onSelect} {...props}>
      {children}
    </div>
  ),
}));

describe("TagSelector", () => {
  const defaultProps = {
    centerId: "center-1",
    bandLevel: null as string | null,
    selectedTagIds: [] as string[],
    questionTypes: [] as any[],
    onBandLevelChange: vi.fn(),
    onTagsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTag.mockReset();
  });

  it("renders the Tags & Organization header", () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText("Tags & Organization")).toBeInTheDocument();
  });

  it("renders Target Band Level section", () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText("Target Band Level")).toBeInTheDocument();
  });

  it("renders Topic Tags section", () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText("Topic Tags")).toBeInTheDocument();
  });

  it("shows 'Select tags...' when no tags are selected", () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText("Select tags...")).toBeInTheDocument();
  });

  it("shows tag count when tags are selected", () => {
    render(<TagSelector {...defaultProps} selectedTagIds={["tag-1", "tag-2"]} />);
    expect(screen.getByText("2 tags selected")).toBeInTheDocument();
  });

  it("shows singular 'tag' for single selection", () => {
    render(<TagSelector {...defaultProps} selectedTagIds={["tag-1"]} />);
    expect(screen.getByText("1 tag selected")).toBeInTheDocument();
  });

  it("renders selected tag chips with remove buttons", () => {
    render(<TagSelector {...defaultProps} selectedTagIds={["tag-1", "tag-2"]} />);
    // Tags appear both in the command list and as selected chips
    const envMatches = screen.getAllByText("Environment");
    expect(envMatches.length).toBeGreaterThanOrEqual(1);
    const healthMatches = screen.getAllByText("Health");
    expect(healthMatches.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onTagsChange when remove button clicked on a tag chip", async () => {
    const onTagsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TagSelector
        {...defaultProps}
        selectedTagIds={["tag-1", "tag-2"]}
        onTagsChange={onTagsChange}
      />,
    );

    // Find the X button inside a badge (span with data-slot="badge")
    const badges = document.querySelectorAll("[data-slot='badge']");
    const envBadge = Array.from(badges).find((b) =>
      b.textContent?.includes("Environment"),
    );
    const xButton = envBadge?.querySelector("button");
    expect(xButton).toBeTruthy();
    if (xButton) await user.click(xButton);

    expect(onTagsChange).toHaveBeenCalledWith(["tag-2"]);
  });

  it("does not show Question Types section when empty", () => {
    render(<TagSelector {...defaultProps} questionTypes={[]} />);
    expect(screen.queryByText("Question Types")).not.toBeInTheDocument();
  });

  it("shows Question Types section with badges when present", () => {
    render(
      <TagSelector
        {...defaultProps}
        questionTypes={["R1_MCQ_SINGLE", "R3_TFNG"]}
      />,
    );
    expect(screen.getByText("Question Types")).toBeInTheDocument();
    expect(screen.getByText("MCQ Single")).toBeInTheDocument();
    expect(screen.getByText("TFNG")).toBeInTheDocument();
  });

  it("deduplicates question types", () => {
    render(
      <TagSelector
        {...defaultProps}
        questionTypes={["R1_MCQ_SINGLE", "R1_MCQ_SINGLE", "R3_TFNG"]}
      />,
    );
    const mcqBadges = screen.getAllByText("MCQ Single");
    expect(mcqBadges).toHaveLength(1);
  });

  it("displays available tags in the command list", () => {
    render(<TagSelector {...defaultProps} />);
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("calls onTagsChange when a tag option is selected", async () => {
    const onTagsChange = vi.fn();
    const user = userEvent.setup();
    render(<TagSelector {...defaultProps} onTagsChange={onTagsChange} />);

    // Click the "Environment" option
    const options = screen.getAllByRole("option");
    const envOption = options.find((el) => el.textContent?.includes("Environment"));
    if (envOption) await user.click(envOption);

    expect(onTagsChange).toHaveBeenCalledWith(["tag-1"]);
  });

  it("calls onTagsChange to remove when already-selected tag is clicked", async () => {
    const onTagsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TagSelector
        {...defaultProps}
        selectedTagIds={["tag-1"]}
        onTagsChange={onTagsChange}
      />,
    );

    const options = screen.getAllByRole("option");
    const envOption = options.find((el) => el.textContent?.includes("Environment"));
    if (envOption) await user.click(envOption);

    expect(onTagsChange).toHaveBeenCalledWith([]);
  });
});
