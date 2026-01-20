import { describe, it, expect } from "vitest";
import {
  LoginRequestSchema,
  AuthResponseSchema,
  CenterSignupWithGoogleRequestSchema,
} from "./dto.js";

describe("Auth DTOs", () => {
  describe("LoginRequestSchema", () => {
    it("should validate a valid login request", () => {
      const validRequest = {
        idToken: "valid-token",
      };
      const result = LoginRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should fail on missing idToken", () => {
      const invalidRequest = {};
      const result = LoginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("CenterSignupWithGoogleRequestSchema", () => {
    it("should validate a valid google center signup request", () => {
      const validRequest = {
        idToken: "google-id-token",
        centerName: "Test Center",
        centerSlug: "test-center",
      };
      const result =
        CenterSignupWithGoogleRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should fail on missing idToken", () => {
      const invalidRequest = {
        centerName: "Test Center",
        centerSlug: "test-center",
      };
      const result =
        CenterSignupWithGoogleRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should fail on invalid slug", () => {
      const invalidRequest = {
        idToken: "google-id-token",
        centerName: "Test Center",
        centerSlug: "Test Center!", // Invalid characters
      };
      const result =
        CenterSignupWithGoogleRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe("AuthResponseSchema", () => {
    it("should validate a valid auth response", () => {
      const validResponse = {
        data: {
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "TEACHER",
            centerId: "center-123",
          },
        },
        message: "Login successful",
      };
      const result = AuthResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should allow null name and centerId", () => {
      const validResponse = {
        data: {
          user: {
            id: "user-123",
            email: "test@example.com",
            name: null,
            role: "STUDENT",
            centerId: null,
          },
        },
        message: "Login successful",
      };
      const result = AuthResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid role", () => {
      const invalidResponse = {
        data: {
          user: {
            id: "user-123",
            email: "test@example.com",
            name: "Test User",
            role: "INVALID_ROLE",
            centerId: "center-123",
          },
        },
        message: "Login failed",
      };
      const result = AuthResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
