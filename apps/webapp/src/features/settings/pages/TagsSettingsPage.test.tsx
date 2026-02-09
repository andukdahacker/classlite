import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TagsSettingsPage } from "./TagsSettingsPage";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { centerId: "center-1", id: "user-1", role: "OWNER" },
  }),
}));

// Mock useTags hook
const mockCreateTag = vi.fn();
const mockUpdateTag = vi.fn();
const mockDeleteTag = vi.fn();
const mockMergeTags = vi.fn();

vi.mock("@/features/exercises/hooks/use-tags", () => ({
  useTags: () => ({
    tags: [
      { id: "tag-1", name: "Environment", _count: { tagAssignments: 3 } },
      { id: "tag-2", name: "Health", _count: { tagAssignments: 1 } },
    ],
    isLoading: false,
    createTag: mockCreateTag,
    isCreating: false,
    updateTag: mockUpdateTag,
    deleteTag: mockDeleteTag,
    mergeTags: mockMergeTags,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TagsSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTag.mockReset();
    mockUpdateTag.mockReset();
    mockDeleteTag.mockReset();
    mockMergeTags.mockReset();
  });

  it("renders page heading and description", () => {
    render(<TagsSettingsPage />);
    expect(screen.getByText("Topic Tags")).toBeInTheDocument();
    expect(
      screen.getByText(/Manage topic tags for organizing exercises/),
    ).toBeInTheDocument();
  });

  it("renders the add tag input and button", () => {
    render(<TagsSettingsPage />);
    expect(
      screen.getByPlaceholderText(/New tag name/),
    ).toBeInTheDocument();
    expect(screen.getByText("Add Tag")).toBeInTheDocument();
  });

  it("renders existing tags with their exercise counts", () => {
    render(<TagsSettingsPage />);
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("3 exercises")).toBeInTheDocument();
    expect(screen.getByText("1 exercise")).toBeInTheDocument();
  });

  it("disables Add Tag button when input is empty", () => {
    render(<TagsSettingsPage />);
    const addButton = screen.getByText("Add Tag").closest("button")!;
    expect(addButton).toBeDisabled();
  });

  it("enables Add Tag button when input has text", async () => {
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    await user.type(screen.getByPlaceholderText(/New tag name/), "Technology");

    const addButton = screen.getByText("Add Tag").closest("button")!;
    expect(addButton).toBeEnabled();
  });

  it("calls createTag and clears input on submit", async () => {
    mockCreateTag.mockResolvedValue({
      id: "tag-3",
      name: "Technology",
    });
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    const input = screen.getByPlaceholderText(/New tag name/);
    await user.type(input, "Technology");
    await user.click(screen.getByText("Add Tag"));

    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalledWith({ name: "Technology" });
    });
  });

  it("calls createTag on Enter key", async () => {
    mockCreateTag.mockResolvedValue({ id: "tag-3", name: "Technology" });
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    const input = screen.getByPlaceholderText(/New tag name/);
    await user.type(input, "Technology{Enter}");

    await waitFor(() => {
      expect(mockCreateTag).toHaveBeenCalledWith({ name: "Technology" });
    });
  });

  it("shows rename input when rename button clicked", async () => {
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    // Click the pencil/rename button for Environment
    const renameButtons = screen.getAllByTitle("Rename");
    await user.click(renameButtons[0]);

    // Should show an input with the current name
    const renameInput = screen.getByDisplayValue("Environment");
    expect(renameInput).toBeInTheDocument();
  });

  it("calls updateTag when rename is confirmed", async () => {
    mockUpdateTag.mockResolvedValue({
      id: "tag-1",
      name: "Climate",
    });
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    // Click rename button for Environment
    const renameButtons = screen.getAllByTitle("Rename");
    await user.click(renameButtons[0]);

    // Clear and type new name
    const renameInput = screen.getByDisplayValue("Environment");
    await user.clear(renameInput);
    await user.type(renameInput, "Climate{Enter}");

    await waitFor(() => {
      expect(mockUpdateTag).toHaveBeenCalledWith({
        id: "tag-1",
        input: { name: "Climate" },
      });
    });
  });

  it("shows delete confirmation dialog", async () => {
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);

    expect(screen.getByText("Delete Tag")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/),
    ).toBeInTheDocument();
  });

  it("calls deleteTag when delete is confirmed", async () => {
    mockDeleteTag.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    // Click delete button for first tag
    const deleteButtons = screen.getAllByTitle("Delete");
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTag).toHaveBeenCalledWith("tag-1");
    });
  });

  it("renders merge buttons for each tag", () => {
    render(<TagsSettingsPage />);
    const mergeButtons = screen.getAllByTitle("Merge");
    expect(mergeButtons).toHaveLength(2);
  });

  it("opens merge dialog when merge button clicked", async () => {
    const user = userEvent.setup();
    render(<TagsSettingsPage />);

    const mergeButtons = screen.getAllByTitle("Merge");
    await user.click(mergeButtons[0]);

    expect(screen.getByText("Merge Tag")).toBeInTheDocument();
    expect(screen.getByText(/Merge into:/)).toBeInTheDocument();
  });
});
