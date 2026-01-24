import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

describe("AuthController", () => {
  let authController: AuthController;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      centerSignup: vi.fn(),
      centerSignupWithGoogle: vi.fn(),
      login: vi.fn(),
      getUserMembership: vi.fn(),
    };
    authController = new AuthController(mockAuthService as AuthService);
  });

  it("centerSignup should return data", async () => {
    const input = {
      centerName: "Test",
      centerSlug: "test",
      ownerEmail: "test@test.com",
      ownerName: "Test",
      password: "password123",
    };
    const mockResult = {
      user: {
        id: "123",
        email: "test@test.com",
        name: "Test",
        role: "OWNER" as const,
        centerId: "center-123",
      },
    };
    mockAuthService.centerSignup.mockResolvedValue(mockResult);

    const result = await authController.centerSignup(input);

    expect(mockAuthService.centerSignup).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      data: mockResult,
      message: "Center registered successfully",
    });
  });

  it("centerSignupWithGoogle should return data", async () => {
    const input = {
      idToken: "token",
      centerName: "Test",
      centerSlug: "test",
    };
    const mockResult = {
      user: {
        id: "123",
        email: "test@test.com",
        name: "Test",
        role: "OWNER" as const,
        centerId: "center-123",
      },
    };
    mockAuthService.centerSignupWithGoogle.mockResolvedValue(mockResult);

    const result = await authController.centerSignupWithGoogle(input);

    expect(mockAuthService.centerSignupWithGoogle).toHaveBeenCalledWith(input);
    expect(result).toEqual({
      data: mockResult,
      message: "Center registered successfully with Google",
    });
  });

  it("login should return data", async () => {
    const idToken = "token";
    const mockResult = {
      user: {
        id: "123",
        email: "test@test.com",
        name: "Test",
        role: "TEACHER" as const,
        centerId: "center-123",
      },
    };
    mockAuthService.login.mockResolvedValue(mockResult);

    const result = await authController.login(idToken);

    expect(mockAuthService.login).toHaveBeenCalledWith(idToken);
    expect(result).toEqual({
      data: mockResult,
      message: "Login successful",
    });
  });

  describe("getCurrentUser", () => {
    it("should return user profile data", async () => {
      const uid = "uid-123";
      const centerId = "center-123";
      const mockMembership = {
        user: { id: "user-123", email: "test@test.com", name: "Test" },
        role: "TEACHER" as const,
        centerId: "center-123",
      };

      mockAuthService.getUserMembership.mockResolvedValue(mockMembership);

      const result = await authController.getCurrentUser(uid, centerId);

      expect(mockAuthService.getUserMembership).toHaveBeenCalledWith(
        uid,
        centerId,
      );
      expect(result).toEqual({
        id: "user-123",
        email: "test@test.com",
        name: "Test",
        role: "TEACHER",
        centerId: "center-123",
      });
    });

    it("should throw error if membership not found", async () => {
      mockAuthService.getUserMembership.mockResolvedValue(null);

      await expect(
        authController.getCurrentUser("uid", "center"),
      ).rejects.toThrow("NOT_FOUND: User not found in this center");
    });
  });
});
