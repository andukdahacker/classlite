import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PendingInvitationsTable } from "./PendingInvitationsTable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API hooks
const mockResendMutateAsync = vi.fn();
const mockRevokeMutateAsync = vi.fn();
const mockInvitationsData = [
  {
    id: "inv-1",
    email: "invited1@test.com",
    role: "TEACHER",
    status: "INVITED",
    createdAt: new Date().toISOString(),
    userId: "user-1",
  },
  {
    id: "inv-2",
    email: "invited2@test.com",
    role: "STUDENT",
    status: "INVITED",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 hours ago
    userId: "user-2",
  },
];

vi.mock("../users.api", () => ({
  useInvitations: () => ({
    data: mockInvitationsData,
    isLoading: false,
  }),
  useResendInvitation: () => ({
    mutateAsync: mockResendMutateAsync,
    isPending: false,
  }),
  useRevokeInvitation: () => ({
    mutateAsync: mockRevokeMutateAsync,
    isPending: false,
  }),
}));

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

describe("PendingInvitationsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResendMutateAsync.mockResolvedValue({});
    mockRevokeMutateAsync.mockResolvedValue({});
  });

  it("renders table with invitations", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    expect(screen.getByText("invited1@test.com")).toBeInTheDocument();
    expect(screen.getByText("invited2@test.com")).toBeInTheDocument();
  });

  it("displays role badges", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    expect(screen.getByText("TEACHER")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
  });

  it("shows Expired status for expired invitations", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    const expiredElements = screen.getAllByText("Expired");
    expect(expiredElements.length).toBeGreaterThan(0);
  });

  it("renders resend buttons for each invitation", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    const resendButtons = screen.getAllByTitle("Resend invitation");
    expect(resendButtons).toHaveLength(2);
  });

  it("renders revoke buttons for each invitation", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    const revokeButtons = screen.getAllByTitle("Revoke invitation");
    expect(revokeButtons).toHaveLength(2);
  });

  it("calls resend mutation when resend button is clicked", async () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    const resendButtons = screen.getAllByTitle("Resend invitation");
    fireEvent.click(resendButtons[0]);

    await waitFor(() => {
      expect(mockResendMutateAsync).toHaveBeenCalledWith("inv-1");
    });
  });

  it("opens confirmation dialog when revoke button is clicked", async () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    const revokeButtons = screen.getAllByTitle("Revoke invitation");
    fireEvent.click(revokeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Revoke Invitation")).toBeInTheDocument();
    });
  });

  it("displays table headers correctly", () => {
    render(<PendingInvitationsTable />, { wrapper: createWrapper() });

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
    expect(screen.getByText("Expires")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});
