import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { UserActionsDropdown } from "./UserActionsDropdown";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import type { UserListItem } from "@workspace/types";

// Mock auth context
vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { userId: "current-user-id", role: "OWNER" },
  }),
}));

// Mock RBACWrapper to render children for OWNER
vi.mock("@/features/auth/components/RBACWrapper", () => ({
  RBACWrapper: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the API hooks
const mockDeactivateMutateAsync = vi.fn();
const mockReactivateMutateAsync = vi.fn();

vi.mock("../users.api", () => ({
  useDeactivateUser: () => ({
    mutateAsync: mockDeactivateMutateAsync,
    isPending: false,
  }),
  useReactivateUser: () => ({
    mutateAsync: mockReactivateMutateAsync,
    isPending: false,
  }),
}));

// Mock RoleChangeModal
vi.mock("./RoleChangeModal", () => ({
  RoleChangeModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="role-change-modal">Role Change Modal</div> : null,
}));

const mockTeacher: UserListItem = {
  id: "teacher-1",
  email: "teacher@test.com",
  name: "Teacher User",
  avatarUrl: null,
  role: "TEACHER",
  status: "ACTIVE",
  membershipId: "mem-1",
  createdAt: "2024-01-01T00:00:00Z",
  lastActiveAt: "2024-01-15T00:00:00Z",
};

const mockOwner: UserListItem = {
  ...mockTeacher,
  id: "owner-1",
  role: "OWNER",
  email: "owner@test.com",
  name: "Owner User",
};

const mockDeactivatedUser: UserListItem = {
  ...mockTeacher,
  id: "deactivated-1",
  status: "SUSPENDED",
};

const mockCurrentUser: UserListItem = {
  ...mockTeacher,
  id: "current-user-id", // Same as auth context user
};

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

describe("UserActionsDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeactivateMutateAsync.mockResolvedValue({});
    mockReactivateMutateAsync.mockResolvedValue({});
  });

  it("renders action button with accessibility label", () => {
    render(<UserActionsDropdown user={mockTeacher} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Open menu")).toBeInTheDocument();
  });

  it("renders for different user types without crashing", () => {
    const { rerender } = render(<UserActionsDropdown user={mockTeacher} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<UserActionsDropdown user={mockOwner} />);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<UserActionsDropdown user={mockDeactivatedUser} />);
    expect(screen.getByRole("button")).toBeInTheDocument();

    rerender(<UserActionsDropdown user={mockCurrentUser} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has correct ARIA attributes on trigger button", () => {
    render(<UserActionsDropdown user={mockTeacher} />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup");
  });
});
