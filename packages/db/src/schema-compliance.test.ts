import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("schema-compliance", () => {
  const schemaPath = resolve(__dirname, "../prisma/schema.prisma");
  const schema = readFileSync(schemaPath, "utf-8");

  it("every model should have a @@map directive with singular snake_case name", () => {
    // Extract all model blocks
    const modelRegex = /model\s+(\w+)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    let match;
    const models: { name: string; mapValue: string | null }[] = [];

    while ((match = modelRegex.exec(schema)) !== null) {
      const modelName = match[1]!;
      const modelBody = match[2]!;

      // Find @@map("...") in model body
      const mapMatch = modelBody.match(/@@map\("([^"]+)"\)/);
      models.push({
        name: modelName,
        mapValue: mapMatch ? mapMatch[1]! : null,
      });
    }

    expect(models.length).toBeGreaterThan(0);

    for (const model of models) {
      // Every model must have @@map
      expect(
        model.mapValue,
        `Model ${model.name} is missing @@map directive`,
      ).not.toBeNull();

      // @@map value must be snake_case (lowercase + underscores only)
      expect(
        model.mapValue,
        `Model ${model.name} @@map("${model.mapValue}") is not snake_case`,
      ).toMatch(/^[a-z][a-z0-9_]*$/);

      // @@map value should be singular (not end with 's')
      // Whitelist words that naturally end in 's' but are singular
      if (model.mapValue && model.mapValue.endsWith("s")) {
        const naturalSWords = [
          "status",
          "address",
          "class",
          "progress",
          "analysis",
          "basis",
          "canvas",
          "process",
          "access",
          "success",
        ];
        const lastSegment = model.mapValue.split("_").pop()!;
        const endsNaturally = naturalSWords.includes(lastSegment);
        expect(
          endsNaturally,
          `Model ${model.name} @@map("${model.mapValue}") appears to be plural — convention is singular. If "${lastSegment}" is naturally singular, add it to the whitelist in this test.`,
        ).toBe(true);
      }
    }
  });
});
