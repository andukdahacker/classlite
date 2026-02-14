import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockMutate = vi.fn();
vi.mock("./use-save-answers", () => ({
  useSaveAnswers: () => ({ mutate: mockMutate }),
}));

vi.mock("../lib/submission-storage", () => ({
  saveAnswersLocal: vi.fn().mockResolvedValue(undefined),
  clearAnswersLocal: vi.fn().mockResolvedValue(undefined),
  isStorageAvailable: vi.fn().mockResolvedValue(true),
}));

// Mock onlineManager
let onlineSubscriber: ((isOnline: boolean) => void) | null = null;
let mockIsOnline = true;

vi.mock("@tanstack/react-query", () => ({
  onlineManager: {
    isOnline: () => mockIsOnline,
    subscribe: (callback: (isOnline: boolean) => void) => {
      onlineSubscriber = callback;
      return () => {
        onlineSubscriber = null;
      };
    },
  },
}));

import { toast } from "sonner";
import { useAutoSave } from "./use-auto-save";
import { saveAnswersLocal, clearAnswersLocal, isStorageAvailable } from "../lib/submission-storage";

const mockSaveLocal = vi.mocked(saveAnswersLocal);
const mockClearLocal = vi.mocked(clearAnswersLocal);
const mockIsAvailable = vi.mocked(isStorageAvailable);

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mockSaveLocal.mockResolvedValue(undefined);
  mockClearLocal.mockResolvedValue(undefined);
  mockIsAvailable.mockResolvedValue(true);
  mockIsOnline = true;
  onlineSubscriber = null;
});

afterEach(() => {
  vi.useRealTimers();
});

const defaultOptions = {
  centerId: "c1",
  assignmentId: "a1",
  submissionId: "sub-1",
  answers: {} as Record<string, unknown>,
  enabled: true,
};

describe("useAutoSave", () => {
  it("starts with idle status", () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));
    expect(result.current.saveStatus).toBe("idle");
    expect(result.current.lastSavedAt).toBeNull();
    expect(result.current.storageAvailable).toBe(true);
    expect(result.current.isOnline).toBe(true);
  });

  it("saves to IndexedDB every 3 seconds when answers change", async () => {
    const answers = { q1: { text: "hello" } };
    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    // Let storage check complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Advance 3 seconds to trigger interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mockSaveLocal).toHaveBeenCalledWith("c1", "a1", "sub-1", answers);
    expect(result.current.saveStatus).toBe("saved");
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it("skips save when answers have not changed", async () => {
    const answers = { q1: { text: "hello" } };
    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // First save
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockSaveLocal).toHaveBeenCalledTimes(1);

    // Second interval — same answers, should skip
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockSaveLocal).toHaveBeenCalledTimes(1);
    expect(result.current.saveStatus).toBe("saved");
  });

  it("debounces server save after IndexedDB save", async () => {
    const answers = { q1: { text: "hello" } };
    renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    // Let storage check + interval + debounce all fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: "sub-1",
        answers: [{ questionId: "q1", answer: { text: "hello" } }],
      }),
      expect.any(Object),
    );
  });

  it("does not save when disabled", async () => {
    renderHook(() =>
      useAutoSave({ ...defaultOptions, enabled: false, answers: { q1: { text: "hi" } } }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(mockSaveLocal).not.toHaveBeenCalled();
  });

  it("does not save when centerId is undefined", async () => {
    renderHook(() =>
      useAutoSave({ ...defaultOptions, centerId: undefined, answers: { q1: { text: "hi" } } }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mockSaveLocal).not.toHaveBeenCalled();
  });

  it("sets error status when IndexedDB save fails", async () => {
    mockSaveLocal.mockRejectedValueOnce(new Error("write failed"));

    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers: { q1: { text: "hi" } } }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(result.current.saveStatus).toBe("error");
  });

  it("skips IndexedDB writes and shows toast when storage unavailable", async () => {
    mockIsAvailable.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers: { q1: { text: "hi" } } }),
    );

    // Let storage check complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.storageAvailable).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      "Auto-save unavailable \u2014 your work is only saved to the server",
    );

    // Trigger interval — should skip IndexedDB
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mockSaveLocal).not.toHaveBeenCalled();
    // Status still transitions (server save handles it)
    expect(result.current.saveStatus).toBe("saved");
  });

  it("shows toast only once when storage unavailable", async () => {
    mockIsAvailable.mockResolvedValue(false);

    const { rerender } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers: { q1: { text: "hi" } } }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    rerender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("clearLocal calls clearAnswersLocal with correct params", async () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));

    await act(async () => {
      await result.current.clearLocal();
    });

    expect(mockClearLocal).toHaveBeenCalledWith("c1", "a1");
  });

  it("exposes lastServerSaveTimestamp ref", () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));
    expect(result.current.lastServerSaveTimestamp.current).toBe(0);
  });

  it("only sends changed questionIds to server", async () => {
    const answers = { q1: { text: "hello" }, q2: { text: "world" } };
    renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    // Let storage check + interval + debounce all fire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const firstCall = mockMutate.mock.calls[0];
    expect(firstCall[0].answers).toHaveLength(2);
  });

  // --- Offline/Online tests (Story 4.3) ---

  it("transitions to 'offline' status when onlineManager reports offline", async () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));

    expect(result.current.isOnline).toBe(true);
    expect(result.current.saveStatus).toBe("idle");

    // Simulate going offline
    mockIsOnline = false;
    await act(async () => {
      onlineSubscriber?.(false);
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.saveStatus).toBe("offline");
  });

  it("IndexedDB saves continue every 3s while offline (server saves paused)", async () => {
    const answers = { q1: { text: "hello" } };
    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Go offline
    mockIsOnline = false;
    await act(async () => {
      onlineSubscriber?.(false);
    });

    expect(result.current.saveStatus).toBe("offline");

    // Advance 3s — IndexedDB save should happen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mockSaveLocal).toHaveBeenCalledWith("c1", "a1", "sub-1", answers);

    // Server save should NOT have been called (debounce skipped while offline)
    // Only the initial calls from the subscribe callback may exist, but the
    // interval's server debounce should be skipped
    const serverCallsBeforeOnline = mockMutate.mock.calls.length;

    // Advance another 3s — more IndexedDB saves, still no new server saves
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    // No additional server save calls while offline
    expect(mockMutate.mock.calls.length).toBe(serverCallsBeforeOnline);
  });

  it("on reconnect with pending changes, transitions to syncing → saved and shows toast", async () => {
    const answers = { q1: { text: "hello" } };
    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Go offline
    mockIsOnline = false;
    await act(async () => {
      onlineSubscriber?.(false);
    });

    expect(result.current.saveStatus).toBe("offline");

    // Come back online (pending changes exist: answers differ from lastServerSavedAnswers)
    mockIsOnline = true;
    await act(async () => {
      onlineSubscriber?.(true);
    });

    expect(result.current.saveStatus).toBe("syncing");
    expect(result.current.isOnline).toBe(true);

    // The sync mutation was called — simulate its onSuccess
    const syncCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    expect(syncCall[0].submissionId).toBe("sub-1");

    await act(async () => {
      syncCall[1].onSuccess();
    });

    expect(result.current.saveStatus).toBe("saved");
    expect(toast.success).toHaveBeenCalledWith("Changes synced");
  });

  it("on reconnect with no pending changes, transitions to idle", async () => {
    // Start with no answers (empty object matches lastServerSavedAnswers which is also empty)
    const { result } = renderHook(() => useAutoSave(defaultOptions));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Go offline
    mockIsOnline = false;
    await act(async () => {
      onlineSubscriber?.(false);
    });

    expect(result.current.saveStatus).toBe("offline");

    // Come back online — no pending changes
    mockIsOnline = true;
    await act(async () => {
      onlineSubscriber?.(true);
    });

    expect(result.current.saveStatus).toBe("idle");
  });

  it("exposes isOnline in return value", () => {
    const { result } = renderHook(() => useAutoSave(defaultOptions));
    expect(result.current.isOnline).toBe(true);
  });

  it("on reconnect with pending changes, transitions to error and shows toast on server sync failure", async () => {
    const answers = { q1: { text: "hello" } };
    const { result } = renderHook(() =>
      useAutoSave({ ...defaultOptions, answers }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Go offline
    mockIsOnline = false;
    await act(async () => {
      onlineSubscriber?.(false);
    });

    expect(result.current.saveStatus).toBe("offline");

    // Come back online
    mockIsOnline = true;
    await act(async () => {
      onlineSubscriber?.(true);
    });

    expect(result.current.saveStatus).toBe("syncing");

    // Simulate server sync failure via onError callback
    const syncCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    await act(async () => {
      syncCall[1].onError(new Error("Server error"));
    });

    expect(result.current.saveStatus).toBe("error");
    expect(toast.error).toHaveBeenCalledWith("Failed to sync changes — please check your connection");
  });
});
