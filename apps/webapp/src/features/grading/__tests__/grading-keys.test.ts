import { describe, it, expect } from "vitest";
import { gradingKeys } from "../hooks/grading-keys";

describe("gradingKeys", () => {
  it("returns base key for all", () => {
    expect(gradingKeys.all).toEqual(["grading"]);
  });

  it("returns queue key with filters", () => {
    const filters = { classId: "abc", status: "ready" };
    expect(gradingKeys.queue(filters)).toEqual(["grading", "queue", filters]);
  });

  it("returns detail key with id", () => {
    expect(gradingKeys.detail("sub-1")).toEqual(["grading", "detail", "sub-1"]);
  });

  it("returns feedback key with id", () => {
    expect(gradingKeys.feedback("sub-1")).toEqual([
      "grading",
      "feedback",
      "sub-1",
    ]);
  });

  it("all keys start with base key", () => {
    const base = gradingKeys.all;
    expect(gradingKeys.queue({})[0]).toBe(base[0]);
    expect(gradingKeys.detail("x")[0]).toBe(base[0]);
    expect(gradingKeys.feedback("x")[0]).toBe(base[0]);
  });
});
