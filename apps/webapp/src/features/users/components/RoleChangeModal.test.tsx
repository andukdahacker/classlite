import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { RoleChangeModal } from "./RoleChangeModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserListItem } from "@workspace/types";

// Mock scrollIntoView for Radix Select
Element.prototype.scrollIntoView = vi.fn();

// Mock the API hook
const mockMutateAsync = vi.fn();
vi.mock("../users.api", () => ({
  useChangeRole: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockUser: UserListItem = {
  id: "user-1",
  email: "teacher@test.com",
  name: "Teacher User",
  avatarUrl: null,
  role: "TEACHER",
  status: "ACTIVE",
  membershipId: "mem-1",
  createdAt: "2024-01-01T00:00:00Z",
  lastActiveAt: "2024-01-15T00:00:00Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("RoleChangeModal", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it("renders modal when open", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Change User Role")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <RoleChangeModal user={mockUser} open={false} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText("Change User Role")).not.toBeInTheDocument();
  });

  it("displays user name in description", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText(/Change the role for Teacher User/)
    ).toBeInTheDocument();
  });

  it("displays permission changes section", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Permission changes:")).toBeInTheDocument();
  });

  it("has role select with current role as default", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    // The select should show Teacher
    expect(screen.getByText("Teacher")).toBeInTheDocument();
  });

  it("disables Save button when role unchanged", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();
  });

  it("has Cancel button that closes modal", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders role label correctly", () => {
    render(
      <RoleChangeModal user={mockUser} open={true} onOpenChange={mockOnOpenChange} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("New Role")).toBeInTheDocument();
  });
});
