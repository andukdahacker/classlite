import { PrismaClient } from "@workspace/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  authAccount: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  centerMembership: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
} as unknown as PrismaClient;

const mockFirebaseAuth = {
  verifyIdToken: vi.fn(),
  setCustomUserClaims: vi.fn(),
};

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockPrisma, mockFirebaseAuth as any);
  });

  describe("login", () => {
    it("should verify token and return user data for existing user", async () => {
      // Arrange
      const idToken = "valid-token";
      const decodedToken = {
        uid: "firebase-uid-123",
        email: "test@example.com",
        name: "Test User",
      };
      const existingUser = {
        id: "user-id-123",
        email: "test@example.com",
        name: "Test User",
      };
      const membership = {
        centerId: "center-id-123",
        role: "TEACHER",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.authAccount.findUnique as any).mockResolvedValue({
        userId: existingUser.id,
      });
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockPrisma.centerMembership.findFirst as any).mockResolvedValue(
        membership,
      );

      // Act
      const result = await authService.login(idToken);

      // Assert
      expect(mockFirebaseAuth.verifyIdToken).toHaveBeenCalledWith(idToken);
      expect(result.user).toEqual({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: "TEACHER",
        centerId: "center-id-123",
      });
    });

    it("should create user and auth account for new user", async () => {
      // Arrange
      const idToken = "new-user-token";
      const decodedToken = {
        uid: "new-uid-123",
        email: "new@example.com",
        name: "New User",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.authAccount.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.findUnique as any)
        .mockResolvedValueOnce(null) // first call in login
        .mockResolvedValueOnce({
          id: "new-user-id",
          email: decodedToken.email,
          name: decodedToken.name,
        }); // second call after creation
      (mockPrisma.user.create as any).mockResolvedValue({
        id: "new-user-id",
        email: decodedToken.email,
        name: decodedToken.name,
      });
      (mockPrisma.centerMembership.findFirst as any).mockResolvedValue(null);

      // Act
      const result = await authService.login(idToken);

      // Assert
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.authAccount.create).toHaveBeenCalledWith({
        data: {
          userId: "new-user-id",
          provider: "FIREBASE",
          providerUserId: decodedToken.uid,
          email: decodedToken.email,
        },
      });
      expect(result.user.id).toBe("new-user-id");
      expect(result.user.role).toBe("STUDENT"); // Default role
    });

    it("should sync custom claims when centerId is present", async () => {
      // Arrange
      const idToken = "token-with-center";
      const decodedToken = {
        uid: "uid-with-center",
        email: "center@example.com",
      };
      const existingUser = {
        id: "user-id-456",
        email: "center@example.com",
      };
      const membership = {
        centerId: "center-id-456",
        role: "OWNER",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.authAccount.findUnique as any).mockResolvedValue({
        userId: existingUser.id,
      });
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockPrisma.centerMembership.findFirst as any).mockResolvedValue(
        membership,
      );

      // Act
      await authService.login(idToken);

      // Assert
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith(
        decodedToken.uid,
        {
          center_id: membership.centerId,
          role: "owner",
        },
      );
    });
  });
});
