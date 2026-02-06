import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html.js";

describe("escapeHtml", () => {
  it("should escape ampersands", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("should escape angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("should escape double quotes", () => {
    expect(escapeHtml('a"b')).toBe("a&quot;b");
  });

  it("should escape single quotes", () => {
    expect(escapeHtml("a'b")).toBe("a&#39;b");
  });

  it("should escape all special characters together", () => {
    expect(escapeHtml(`<h1>"Hello" & 'World'</h1>`)).toBe(
      "&lt;h1&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/h1&gt;",
    );
  });

  it("should return the same string if no special characters", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });

  it("should handle empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});
