import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

import { get, set, del } from "idb-keyval";
import {
  getStorageKey,
  isStorageAvailable,
  saveAnswersLocal,
  loadAnswersLocal,
  clearAnswersLocal,
} from "./submission-storage";

const mockSet = vi.mocked(set);
const mockGet = vi.mocked(get);
const mockDel = vi.mocked(del);

beforeEach(() => {
  vi.clearAllMocks();
  mockSet.mockResolvedValue(undefined);
  mockDel.mockResolvedValue(undefined);
});

describe("getStorageKey", () => {
  it("returns deterministic key with prefix, centerId, and assignmentId", () => {
    expect(getStorageKey("center-1", "assign-2")).toBe(
      "classlite:answers:center-1:assign-2",
    );
  });
});

describe("isStorageAvailable", () => {
  it("returns true when IndexedDB operations succeed", async () => {
    const result = await isStorageAvailable();
    expect(result).toBe(true);
    expect(mockSet).toHaveBeenCalledWith("__classlite_probe__", 1);
    expect(mockDel).toHaveBeenCalledWith("__classlite_probe__");
  });

  it("returns false when IndexedDB set throws", async () => {
    mockSet.mockRejectedValueOnce(new Error("QuotaExceededError"));
    const result = await isStorageAvailable();
    expect(result).toBe(false);
  });

  it("returns false when IndexedDB del throws", async () => {
    mockDel.mockRejectedValueOnce(new Error("blocked"));
    const result = await isStorageAvailable();
    expect(result).toBe(false);
  });
});

describe("saveAnswersLocal", () => {
  it("saves answers with correct key and data shape", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    await saveAnswersLocal("c1", "a1", "sub-1", { q1: { text: "hello" } });

    expect(mockSet).toHaveBeenCalledWith("classlite:answers:c1:a1", {
      centerId: "c1",
      assignmentId: "a1",
      submissionId: "sub-1",
      answers: { q1: { text: "hello" } },
      savedAt: now,
    });

    vi.restoreAllMocks();
  });

  it("handles null submissionId", async () => {
    await saveAnswersLocal("c1", "a1", null, {});
    expect(mockSet).toHaveBeenCalledWith(
      "classlite:answers:c1:a1",
      expect.objectContaining({ submissionId: null }),
    );
  });
});

describe("loadAnswersLocal", () => {
  it("loads answers from correct key", async () => {
    const stored = {
      centerId: "c1",
      assignmentId: "a1",
      submissionId: "sub-1",
      answers: { q1: { text: "hello" } },
      savedAt: 1000,
    };
    mockGet.mockResolvedValue(stored);

    const result = await loadAnswersLocal("c1", "a1");
    expect(result).toEqual(stored);
    expect(mockGet).toHaveBeenCalledWith("classlite:answers:c1:a1");
  });

  it("returns undefined when no data stored", async () => {
    mockGet.mockResolvedValue(undefined);
    const result = await loadAnswersLocal("c1", "a1");
    expect(result).toBeUndefined();
  });
});

describe("saveAnswersLocal error propagation", () => {
  it("rejects when IndexedDB set throws", async () => {
    mockSet.mockRejectedValueOnce(new Error("QuotaExceededError"));
    await expect(saveAnswersLocal("c1", "a1", "sub-1", {})).rejects.toThrow("QuotaExceededError");
  });
});

describe("loadAnswersLocal error propagation", () => {
  it("rejects when IndexedDB get throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("read failed"));
    await expect(loadAnswersLocal("c1", "a1")).rejects.toThrow("read failed");
  });
});

describe("clearAnswersLocal", () => {
  it("deletes entry with correct key", async () => {
    await clearAnswersLocal("c1", "a1");
    expect(mockDel).toHaveBeenCalledWith("classlite:answers:c1:a1");
  });
});
