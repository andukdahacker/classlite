import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock("@/core/client", () => ({
  default: {
    GET: (...args: unknown[]) => mockGet(...args),
    POST: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>(
      "@tanstack/react-query",
    );
  return actual;
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useInterventionHistory,
  useInterventionPreview,
  useSendIntervention,
} from "../hooks/use-intervention";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useInterventionHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns intervention history on success", async () => {
    const mockHistory = [
      {
        id: "int-1",
        recipientEmail: "parent@test.com",
        subject: "Concern",
        status: "SENT",
        sentAt: "2026-02-15T10:00:00Z",
      },
    ];
    mockGet.mockResolvedValue({
      data: { data: mockHistory },
      error: undefined,
    });

    const { result } = renderHook(() => useInterventionHistory("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].subject).toBe("Concern");
  });

  it("does not fetch when studentId is null", () => {
    const { result } = renderHook(() => useInterventionHistory(null), {
      wrapper: createWrapper(),
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.history).toEqual([]);
  });
});

describe("useInterventionPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns preview data on success", async () => {
    const mockPreview = {
      recipientEmail: "parent@test.com",
      subject: "Concern about Alice",
      body: "Dear parent...",
      templateUsed: "concern-general",
    };
    mockGet.mockResolvedValue({
      data: { data: mockPreview },
      error: undefined,
    });

    const { result } = renderHook(() => useInterventionPreview("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.preview).not.toBeNull();
    expect(result.current.preview?.subject).toBe("Concern about Alice");
  });
});

describe("useSendIntervention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends intervention via POST", async () => {
    mockPost.mockResolvedValue({
      data: { data: { interventionId: "il-1", status: "pending" } },
      error: undefined,
    });

    const { result } = renderHook(() => useSendIntervention("s1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        studentId: "s1",
        recipientEmail: "parent@test.com",
        subject: "Test",
        body: "Test body",
        templateUsed: "concern-general",
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/api/v1/student-health/interventions",
      expect.objectContaining({
        body: expect.objectContaining({ studentId: "s1" }),
      }),
    );
  });
});
