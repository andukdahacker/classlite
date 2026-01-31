import { describe, it, expect } from "vitest";
import { functions } from "./functions.js";

describe("Inngest Functions Registry", () => {
  it("should export functions array", () => {
    expect(Array.isArray(functions)).toBe(true);
  });

  it("should have at least one function registered", () => {
    expect(functions.length).toBeGreaterThanOrEqual(1);
  });
});
