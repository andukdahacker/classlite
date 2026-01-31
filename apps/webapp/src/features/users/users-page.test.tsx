import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsersPage } from "./users-page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";

// Mock all complex child components
vi.mock("./components/InviteUserModal", () => ({
  InviteUserModal: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button onClick={onSuccess} data-testid="invite-user-button">
      Invite User
    </button>
  ),
}));

vi.mock("./components/UserListTable", () => ({
  UserListTable: () => <div data-testid="user-list-table">User List Table</div>,
}));

vi.mock("./components/PendingInvitationsTable", () => ({
  PendingInvitationsTable: () => (
    <div data-testid="pending-invitations-table">Pending Invitations Table</div>
  ),
}));

vi.mock("./components/SearchFilterControls", () => ({
  SearchFilterControls: () => (
    <div data-testid="search-filter-controls">Search Filter Controls</div>
  ),
}));

vi.mock("./components/BulkActionBar", () => ({
  BulkActionBar: () => null,
}));

vi.mock("./users.api", () => ({
  useUsers: () => ({
    data: { items: [], total: 0, hasMore: false },
    isLoading: false,
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("UsersPage", () => {
  it("renders page title and description", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(
      screen.getByText("View and manage all users in your center")
    ).toBeInTheDocument();
  });

  it("renders Invite User button", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("invite-user-button")).toBeInTheDocument();
  });

  it("renders tabs for Active Users and Pending Invitations", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("tab", { name: "Active Users" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Pending Invitations" })
    ).toBeInTheDocument();
  });

  it("shows Active Users tab by default", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    const activeUsersTab = screen.getByRole("tab", { name: "Active Users" });
    expect(activeUsersTab).toHaveAttribute("data-state", "active");
  });

  it("renders search filter controls in users tab", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("search-filter-controls")).toBeInTheDocument();
  });

  it("renders user list table in users tab", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("user-list-table")).toBeInTheDocument();
  });

  it("switches to Pending Invitations tab when InviteUserModal onSuccess is called", () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    // Click the mock invite user button which triggers onSuccess
    const inviteButton = screen.getByTestId("invite-user-button");
    fireEvent.click(inviteButton);

    // Should switch to invitations tab
    const invitationsTab = screen.getByRole("tab", {
      name: "Pending Invitations",
    });
    expect(invitationsTab).toHaveAttribute("data-state", "active");
  });

  it("shows pending invitations table when invitations tab is active", async () => {
    render(<UsersPage />, { wrapper: createWrapper() });

    // Click invitations tab via the onSuccess callback (which we know works)
    const inviteButton = screen.getByTestId("invite-user-button");
    fireEvent.click(inviteButton);

    // Wait for the pending invitations table to be rendered
    await waitFor(() => {
      expect(screen.getByTestId("pending-invitations-table")).toBeInTheDocument();
    });
  });
});
