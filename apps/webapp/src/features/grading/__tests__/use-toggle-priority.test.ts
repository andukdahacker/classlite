import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";

// Mock API client
const mockPatch = vi.fn();
vi.mock("@/core/client", () => ({
  default: {
    PATCH: (...args: unknown[]) => mockPatch(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useTogglePriority } from "../hooks/use-toggle-priority";
import { gradingKeys } from "../hooks/grading-keys";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    },
  };
}

describe("useTogglePriority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically updates queue cache when toggling priority", async () => {
    const mockData = { data: { submissionId: "sub-1", isPriority: true } };
    mockPatch.mockResolvedValue({ data: mockData, error: undefined });

    const { queryClient, Wrapper } = createWrapper();

    // Seed the queue cache with an item
    queryClient.setQueryData([...gradingKeys.all, "queue", {}], {
      data: {
        items: [
          { submissionId: "sub-1", isPriority: false, gradingStatus: "ready" },
          { submissionId: "sub-2", isPriority: false, gradingStatus: "ready" },
        ],
      },
    });

    const { result } = renderHook(() => useTogglePriority(), {
      wrapper: Wrapper,
    });

    result.current.mutate({ submissionId: "sub-1", isPriority: true });

    // Optimistic update should apply before server response
    await waitFor(() => {
      const cached = queryClient.getQueryData([
        ...gradingKeys.all,
        "queue",
        {},
      ]) as { data: { items: { isPriority: boolean }[] } };
      expect(cached.data.items[0].isPriority).toBe(true);
      // Other items should remain unchanged
      expect(cached.data.items[1].isPriority).toBe(false);
    });

    expect(mockPatch).toHaveBeenCalledWith(
      "/api/v1/grading/submissions/{submissionId}/priority",
      {
        params: { path: { submissionId: "sub-1" } },
        body: { isPriority: true },
      },
    );
  });

  it("rolls back optimistic update on error and shows error toast", async () => {
    mockPatch.mockRejectedValue(new Error("Server error"));

    const { toast } = await import("sonner");

    const { queryClient, Wrapper } = createWrapper();

    // Seed the queue cache
    const originalData = {
      data: {
        items: [
          { submissionId: "sub-1", isPriority: false, gradingStatus: "ready" },
        ],
      },
    };
    queryClient.setQueryData(
      [...gradingKeys.all, "queue", {}],
      originalData,
    );

    const { result } = renderHook(() => useTogglePriority(), {
      wrapper: Wrapper,
    });

    result.current.mutate({ submissionId: "sub-1", isPriority: true });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Cache should have been rolled back to original value
    const cached = queryClient.getQueryData([
      ...gradingKeys.all,
      "queue",
      {},
    ]) as { data: { items: { isPriority: boolean }[] } };
    expect(cached.data.items[0].isPriority).toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Failed to update priority");
  });
});
