import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthService } from "./auth.service.js";
import { PrismaClient } from "@workspace/db";
import { Auth } from "firebase-admin/auth";

// Mock Prisma
const mockPrisma = {
  loginAttempt: {
    findUnique: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock Firebase Auth
const mockFirebaseAuth = {} as Auth;

describe("AuthService - Login Attempt Tracking", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockPrisma, mockFirebaseAuth);
  });

  describe("checkLoginAttempt", () => {
    it("should return unlocked with max attempts for unknown email", async () => {
      vi.mocked(mockPrisma.loginAttempt.findUnique).mockResolvedValue(null);

      const result = await authService.checkLoginAttempt("test@example.com");

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(5);
    });

    it("should return unlocked with remaining attempts for known email", async () => {
      vi.mocked(mockPrisma.loginAttempt.findUnique).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 2,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.checkLoginAttempt("test@example.com");

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(3);
    });

    it("should return locked when account is locked", async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      vi.mocked(mockPrisma.loginAttempt.findUnique).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 5,
        lockedUntil: futureDate,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.checkLoginAttempt("test@example.com");

      expect(result.locked).toBe(true);
      expect(result.retryAfterMinutes).toBeGreaterThan(0);
      expect(result.retryAfterMinutes).toBeLessThanOrEqual(10);
    });

    it("should reset and return unlocked when lockout has expired", async () => {
      const pastDate = new Date(Date.now() - 60 * 1000); // 1 minute ago
      vi.mocked(mockPrisma.loginAttempt.findUnique).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 5,
        lockedUntil: pastDate,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockPrisma.loginAttempt.update).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 0,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.checkLoginAttempt("test@example.com");

      expect(result.locked).toBe(false);
      expect(result.attemptsRemaining).toBe(5);
      expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        data: { attempts: 0, lockedUntil: null },
      });
    });

    it("should normalize email to lowercase", async () => {
      vi.mocked(mockPrisma.loginAttempt.findUnique).mockResolvedValue(null);

      await authService.checkLoginAttempt("TEST@EXAMPLE.COM");

      expect(mockPrisma.loginAttempt.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
    });
  });

  describe("recordLoginAttempt", () => {
    it("should reset attempts on successful login", async () => {
      vi.mocked(mockPrisma.loginAttempt.upsert).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 0,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.recordLoginAttempt(
        "test@example.com",
        true
      );

      expect(result.locked).toBe(false);
      expect(mockPrisma.loginAttempt.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "test@example.com" },
          update: { attempts: 0, lockedUntil: null, lastAttempt: expect.any(Date) },
        })
      );
    });

    it("should increment attempts on failed login", async () => {
      vi.mocked(mockPrisma.loginAttempt.upsert).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 2,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.recordLoginAttempt(
        "test@example.com",
        false
      );

      expect(result.locked).toBe(false);
    });

    it("should lock account after 5 failed attempts", async () => {
      vi.mocked(mockPrisma.loginAttempt.upsert).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 5,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(mockPrisma.loginAttempt.update).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.recordLoginAttempt(
        "test@example.com",
        false
      );

      expect(result.locked).toBe(true);
      expect(result.retryAfterMinutes).toBe(15);
      expect(mockPrisma.loginAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "test@example.com" },
          data: { lockedUntil: expect.any(Date) },
        })
      );
    });

    it("should normalize email to lowercase", async () => {
      vi.mocked(mockPrisma.loginAttempt.upsert).mockResolvedValue({
        id: "1",
        email: "test@example.com",
        attempts: 0,
        lockedUntil: null,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authService.recordLoginAttempt("TEST@EXAMPLE.COM", true);

      expect(mockPrisma.loginAttempt.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "test@example.com" },
        })
      );
    });
  });
});
