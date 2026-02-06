import { MembershipStatus, PrismaClient } from "@workspace/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service.js";

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  authAccount: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  center: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  centerMembership: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
} as unknown as PrismaClient;

const mockFirebaseAuth = {
  verifyIdToken: vi.fn(),
  setCustomUserClaims: vi.fn(),
  createUser: vi.fn(),
  deleteUser: vi.fn(),
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
          role: "OWNER",
        },
      );
    });

    it("should transition INVITED status to ACTIVE on login", async () => {
      // Arrange
      const idToken = "invited-token";
      const decodedToken = {
        uid: "firebase-uid-invited",
        email: "invited@test.com",
      };
      const existingUser = {
        id: "user-id-invited",
        email: "invited@test.com",
      };
      const invitedMembership = {
        id: "mem-123",
        centerId: "center-123",
        role: "TEACHER",
        status: "INVITED",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.authAccount.findUnique as any).mockResolvedValue({
        userId: existingUser.id,
      });
      (mockPrisma.user.findUnique as any).mockResolvedValue(existingUser);
      (mockPrisma.centerMembership.findFirst as any).mockResolvedValue(
        invitedMembership,
      );
      (mockPrisma.centerMembership.update as any).mockResolvedValue({
        ...invitedMembership,
        status: "ACTIVE",
      });

      // Act
      const result = await authService.login(idToken);

      // Assert
      expect(mockPrisma.centerMembership.update).toHaveBeenCalledWith({
        where: { id: "mem-123" },
        data: { status: "ACTIVE" },
      });
      expect(result.user.role).toBe("TEACHER");
      expect(result.user.centerId).toBe("center-123");
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith(
        decodedToken.uid,
        {
          center_id: "center-123",
          role: "TEACHER",
        },
      );
    });
  });

  describe("centerSignup", () => {
    it("should create center, firebase user, and DB records", async () => {
      // Arrange
      const input = {
        centerName: "Test Center",
        centerSlug: "test-center",
        ownerEmail: "owner@example.com",
        ownerName: "Owner Name",
        password: "password123",
      };

      const firebaseUid = "fb-uid-123";
      (mockPrisma.center.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.findUnique as any).mockResolvedValue(null);
      mockFirebaseAuth.createUser.mockResolvedValue({ uid: firebaseUid });
      (mockPrisma.center.create as any).mockResolvedValue({ id: "center-id" });
      (mockPrisma.user.create as any).mockResolvedValue({
        id: "user-id",
        email: input.ownerEmail,
        name: input.ownerName,
      });

      // Act
      const result = await authService.centerSignup(input);

      // Assert
      expect(mockFirebaseAuth.createUser).toHaveBeenCalledWith({
        email: input.ownerEmail,
        password: input.password,
        displayName: input.ownerName,
      });
      expect(mockPrisma.center.create).toHaveBeenCalledWith({
        data: { name: input.centerName, slug: input.centerSlug },
      });
      expect(mockPrisma.authAccount.create).toHaveBeenCalled();
      expect(mockPrisma.centerMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: "OWNER",
          status: MembershipStatus.ACTIVE,
        }),
      });
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith(
        firebaseUid,
        {
          center_id: "center-id",
          role: "OWNER",
        },
      );
      expect(result.user.role).toBe("OWNER");
    });

    it("should cleanup firebase user if DB transaction fails", async () => {
      // Arrange
      const input = {
        centerName: "Test Center",
        centerSlug: "test-center",
        ownerEmail: "owner@example.com",
        ownerName: "Owner Name",
        password: "password123",
      };

      mockFirebaseAuth.createUser.mockResolvedValue({ uid: "fb-uid" });
      (mockPrisma.center.create as any).mockRejectedValue(new Error("DB Fail"));

      // Act & Assert
      await expect(authService.centerSignup(input)).rejects.toThrow("DB Fail");
      expect(mockFirebaseAuth.deleteUser).toHaveBeenCalledWith("fb-uid");
    });
  });

  describe("centerSignupWithGoogle", () => {
    it("should verify token and create center/membership for new user", async () => {
      // Arrange
      const input = {
        idToken: "google-token",
        centerName: "Google Center",
        centerSlug: "google-center",
      };
      const decodedToken = {
        uid: "google-uid",
        email: "google@example.com",
        name: "Google User",
        picture: "http://avatar.com",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.center.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.create as any).mockResolvedValue({
        id: "user-id",
        email: decodedToken.email,
        name: decodedToken.name,
      });
      (mockPrisma.center.create as any).mockResolvedValue({ id: "center-id" });

      // Act
      const result = await authService.centerSignupWithGoogle(input);

      // Assert
      expect(mockFirebaseAuth.verifyIdToken).toHaveBeenCalledWith(
        input.idToken,
      );
      expect(mockPrisma.center.create).toHaveBeenCalledWith({
        data: { name: input.centerName, slug: input.centerSlug },
      });
      expect(mockPrisma.authAccount.upsert).toHaveBeenCalled();
      expect(mockPrisma.centerMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          centerId: "center-id",
          userId: "user-id",
          role: "OWNER",
        }),
      });
      expect(mockFirebaseAuth.setCustomUserClaims).toHaveBeenCalledWith(
        decodedToken.uid,
        {
          center_id: "center-id",
          role: "OWNER",
        },
      );
      expect(result.user.role).toBe("OWNER");
    });

    it("should throw error if user already belongs to a center", async () => {
      // Arrange
      const input = {
        idToken: "google-token",
        centerName: "Google Center",
        centerSlug: "google-center",
      };
      const decodedToken = {
        uid: "google-uid",
        email: "google@example.com",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.center.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "existing-user",
        memberships: [{ id: "membership-1", status: MembershipStatus.ACTIVE }],
      });

      // Act & Assert
      await expect(authService.centerSignupWithGoogle(input)).rejects.toThrow(
        "User already belongs to a center",
      );
    });

    it("should link to existing user if they have no active center membership", async () => {
      // Arrange
      const input = {
        idToken: "google-token",
        centerName: "Google Center",
        centerSlug: "google-center",
      };
      const decodedToken = {
        uid: "google-uid",
        email: "google@example.com",
        name: "Google User",
        picture: "http://avatar.com",
      };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(decodedToken);
      (mockPrisma.center.findUnique as any).mockResolvedValue(null);
      (mockPrisma.user.findUnique as any).mockResolvedValue({
        id: "existing-user",
        email: decodedToken.email,
        memberships: [], // No active memberships
      });
      (mockPrisma.user.update as any).mockResolvedValue({
        id: "existing-user",
        email: decodedToken.email,
        name: decodedToken.name,
      });
      (mockPrisma.center.create as any).mockResolvedValue({ id: "center-id" });

      // Act
      const result = await authService.centerSignupWithGoogle(input);

      // Assert
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "existing-user" },
        data: {
          name: decodedToken.name,
          avatarUrl: decodedToken.picture,
        },
      });
      expect(result.user.id).toBe("existing-user");
    });
  });
});
