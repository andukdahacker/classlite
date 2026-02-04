import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserListTable } from "./UserListTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import type { UserListItem } from "@workspace/types";

// Mock UserActionsDropdown
vi.mock("./UserActionsDropdown", () => ({
  UserActionsDropdown: () => <button data-testid="user-actions">Actions</button>,
}));

const mockUsers: UserListItem[] = [
  {
    id: "user-1",
    email: "john@example.com",
    name: "John Doe",
    avatarUrl: null,
    role: "OWNER",
    status: "ACTIVE",
    membershipId: "mem-1",
    createdAt: "2024-01-01T00:00:00Z",
    lastActiveAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "user-2",
    email: "jane@example.com",
    name: "Jane Smith",
    avatarUrl: null,
    role: "TEACHER",
    status: "ACTIVE",
    membershipId: "mem-2",
    createdAt: "2024-01-02T00:00:00Z",
    lastActiveAt: "2024-01-14T00:00:00Z",
  },
  {
    id: "user-3",
    email: "bob@example.com",
    name: "Bob Wilson",
    avatarUrl: null,
    role: "STUDENT",
    status: "SUSPENDED",
    membershipId: "mem-3",
    createdAt: "2024-01-03T00:00:00Z",
    lastActiveAt: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

const defaultProps = {
  users: mockUsers,
  isLoading: false,
  selectedUserIds: [] as string[],
  onSelectionChange: vi.fn(),
  onPageChange: vi.fn(),
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
};

describe("UserListTable", () => {
  it("renders user data correctly", () => {
    render(<UserListTable {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Wilson")).toBeInTheDocument();
  });

  it("renders role badges with correct text", () => {
    render(<UserListTable {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText("OWNER")).toBeInTheDocument();
    expect(screen.getByText("TEACHER")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<UserListTable {...defaultProps} isLoading={true} />, {
      wrapper: createWrapper(),
    });

    // Should show loader and not the table
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("shows empty state when no users", () => {
    render(<UserListTable {...defaultProps} users={[]} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("disables checkbox for OWNER role users", () => {
    render(<UserListTable {...defaultProps} />, { wrapper: createWrapper() });

    // Find all checkboxes (including header)
    const checkboxes = screen.getAllByRole("checkbox");
    // The first user is OWNER, so their checkbox (index 1, after header) should be disabled
    expect(checkboxes[1]).toBeDisabled();
    // Non-owner checkboxes should be enabled
    expect(checkboxes[2]).not.toBeDisabled();
    expect(checkboxes[3]).not.toBeDisabled();
  });

  it("calls onSelectionChange when checkbox is clicked", () => {
    const onSelectionChange = vi.fn();
    render(
      <UserListTable {...defaultProps} onSelectionChange={onSelectionChange} />,
      { wrapper: createWrapper() }
    );

    const checkboxes = screen.getAllByRole("checkbox");
    // Click on the second user's checkbox (Teacher)
    fireEvent.click(checkboxes[2]);

    expect(onSelectionChange).toHaveBeenCalledWith(["user-2"]);
  });

  it("applies strikethrough styling to deactivated users", () => {
    render(<UserListTable {...defaultProps} />, { wrapper: createWrapper() });

    // Bob Wilson is suspended, should have line-through styling
    const bobName = screen.getByText("Bob Wilson");
    expect(bobName).toHaveClass("line-through");
  });

  it("renders pagination controls", () => {
    render(<UserListTable {...defaultProps} totalPages={3} hasMore={true} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("disables Previous button on first page", () => {
    render(<UserListTable {...defaultProps} />, { wrapper: createWrapper() });

    const prevButton = screen.getByRole("button", { name: "Previous" });
    expect(prevButton).toBeDisabled();
  });

  it("disables Next button when no more pages", () => {
    render(<UserListTable {...defaultProps} hasMore={false} />, {
      wrapper: createWrapper(),
    });

    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
  });

  it("calls onPageChange when pagination buttons are clicked", () => {
    const onPageChange = vi.fn();
    render(
      <UserListTable
        {...defaultProps}
        onPageChange={onPageChange}
        currentPage={2}
        hasMore={true}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
