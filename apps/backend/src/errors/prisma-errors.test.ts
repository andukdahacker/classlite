import { describe, it, expect } from "vitest";
import { mapPrismaError } from "./prisma-errors.js";
import { AppError } from "./app-error.js";

describe("mapPrismaError", () => {
  it("should map P2025 to 404 NotFound", () => {
    const result = mapPrismaError({ code: "P2025" });
    expect(result).toBeInstanceOf(AppError);
    expect(result!.statusCode).toBe(404);
  });

  it("should map P2002 to 409 Conflict", () => {
    const result = mapPrismaError({ code: "P2002" });
    expect(result).toBeInstanceOf(AppError);
    expect(result!.statusCode).toBe(409);
  });

  it("should map P2003 to 400 BadRequest", () => {
    const result = mapPrismaError({ code: "P2003" });
    expect(result).toBeInstanceOf(AppError);
    expect(result!.statusCode).toBe(400);
  });

  it("should return undefined for unknown Prisma errors", () => {
    expect(mapPrismaError({ code: "P9999" })).toBeUndefined();
  });

  it("should return undefined for non-Prisma errors", () => {
    expect(mapPrismaError(new Error("some error"))).toBeUndefined();
  });

  it("should return undefined for null/undefined", () => {
    expect(mapPrismaError(null)).toBeUndefined();
    expect(mapPrismaError(undefined)).toBeUndefined();
  });
});
