import { describe, it, expect } from "vitest";
import { AppError } from "./app-error.js";

describe("AppError", () => {
  it("should create an error with statusCode, errorCode, and message", () => {
    const error = new AppError(400, "BAD_REQUEST", "Invalid input");
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid input");
    expect(error.name).toBe("AppError");
    expect(error).toBeInstanceOf(Error);
  });

  it(".conflict() should create a 409 error", () => {
    const error = AppError.conflict("Already exists");
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe("CONFLICT");
    expect(error.message).toBe("Already exists");
  });

  it(".notFound() should create a 404 error", () => {
    const error = AppError.notFound("Not found");
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe("NOT_FOUND");
  });

  it(".unauthorized() should create a 401 error", () => {
    const error = AppError.unauthorized("Bad token");
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe("UNAUTHORIZED");
  });

  it(".forbidden() should create a 403 error", () => {
    const error = AppError.forbidden("No access");
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe("FORBIDDEN");
  });

  it(".badRequest() should create a 400 error", () => {
    const error = AppError.badRequest("Bad data");
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("BAD_REQUEST");
  });
});
