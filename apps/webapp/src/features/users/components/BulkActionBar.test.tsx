import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { BulkActionBar } from "./BulkActionBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API hooks
const mockBulkDeactivateMutateAsync = vi.fn();
const mockBulkRemindMutateAsync = vi.fn();

vi.mock("../users.api", () => ({
  useBulkDeactivate: () => ({
    mutateAsync: mockBulkDeactivateMutateAsync,
    isPending: false,
  }),
  useBulkRemind: () => ({
    mutateAsync: mockBulkRemindMutateAsync,
    isPending: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("BulkActionBar", () => {
  const mockOnClear = vi.fn();
  const selectedUserIds = ["user-1", "user-2", "user-3"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockBulkDeactivateMutateAsync.mockResolvedValue({
      data: { processed: 3, failed: 0 },
    });
    mockBulkRemindMutateAsync.mockResolvedValue({
      data: { processed: 3, failed: 0 },
    });
  });

  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        selectedUserIds={[]}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders action bar when users are selected", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedUserIds={selectedUserIds}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();
    expect(screen.getByText("Deactivate")).toBeInTheDocument();
    expect(screen.getByText("Send Reminder")).toBeInTheDocument();
    expect(screen.getByText("Clear selection")).toBeInTheDocument();
  });

  it("calls bulkRemind mutation when Send Reminder is clicked", async () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedUserIds={selectedUserIds}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("Send Reminder"));

    await waitFor(() => {
      expect(mockBulkRemindMutateAsync).toHaveBeenCalledWith({
        userIds: selectedUserIds,
      });
    });

    expect(mockOnClear).toHaveBeenCalled();
  });

  it("calls onClear when Clear selection is clicked", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedUserIds={selectedUserIds}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("Clear selection"));

    expect(mockOnClear).toHaveBeenCalled();
  });

  it("displays correct count for single selection", () => {
    render(
      <BulkActionBar
        selectedCount={1}
        selectedUserIds={["user-1"]}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("has Deactivate button that opens dialog", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedUserIds={selectedUserIds}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    const deactivateButton = screen.getByRole("button", { name: "Deactivate" });
    expect(deactivateButton).toBeInTheDocument();
    expect(deactivateButton).not.toBeDisabled();
  });

  it("has Send Reminder button", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        selectedUserIds={selectedUserIds}
        onClear={mockOnClear}
      />,
      { wrapper: createWrapper() }
    );

    const reminderButton = screen.getByRole("button", { name: "Send Reminder" });
    expect(reminderButton).toBeInTheDocument();
    expect(reminderButton).not.toBeDisabled();
  });
});
