import { describe, it, expect } from "vitest";
import { inngest } from "./client.js";

describe("Inngest Client", () => {
  it("should have correct client id", () => {
    expect(inngest.id).toBe("classlite");
  });

  it("should be an Inngest instance", () => {
    expect(inngest).toBeDefined();
    expect(typeof inngest.createFunction).toBe("function");
    expect(typeof inngest.send).toBe("function");
  });
});
