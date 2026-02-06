import { describe, it, expect } from "vitest";
import { CreateInvitationRequestSchema } from "./invitation.js";

describe("Invitation DTOs", () => {
  describe("CreateInvitationRequestSchema", () => {
    it("should validate a valid invitation request", () => {
      const validRequest = {
        email: "teacher@example.com",
        role: "TEACHER",
      };
      const result = CreateInvitationRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it("should fail on invalid email", () => {
      const invalidRequest = {
        email: "not-an-email",
        role: "TEACHER",
      };
      const result = CreateInvitationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should fail on invalid role", () => {
      const invalidRequest = {
        email: "student@example.com",
        role: "SUPERADMIN",
      };
      const result = CreateInvitationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it("should fail on missing email", () => {
      const invalidRequest = {
        role: "STUDENT",
      };
      const result = CreateInvitationRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });
});
