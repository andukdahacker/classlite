import { MembershipStatus, PrismaClient } from "@workspace/db";
import {
  AuthResponseData,
  AuthUser,
  CenterSignupRequest,
  CenterSignupWithGoogleRequest,
  UserRole,
} from "@workspace/types";
import { Auth } from "firebase-admin/auth";

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly firebaseAuth: Auth,
  ) {}

  async centerSignup(input: CenterSignupRequest): Promise<AuthResponseData> {
    const { centerName, centerSlug, ownerEmail, ownerName, password } = input;

    // 1. Validate Uniqueness
    const existingCenter = await this.prisma.center.findUnique({
      where: { slug: centerSlug },
    });
    if (existingCenter) {
      throw new Error("CONFLICT: Center slug already exists");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
    });
    if (existingUser) {
      throw new Error("CONFLICT: Email already registered");
    }

    // 2. Create Firebase User
    let firebaseUser;
    try {
      firebaseUser = await this.firebaseAuth.createUser({
        email: ownerEmail,
        password: password,
        displayName: ownerName,
      });
    } catch (error: any) {
      if (error.code === "auth/email-already-exists") {
        throw new Error("CONFLICT: Email already registered in Firebase");
      }
      throw error;
    }

    try {
      // 3. Create Center, User, and Membership in DB
      const result = await this.prisma.$transaction(async (tx) => {
        const center = await tx.center.create({
          data: {
            name: centerName,
            slug: centerSlug,
          },
        });

        const user = await tx.user.create({
          data: {
            email: ownerEmail,
            name: ownerName,
          },
        });

        await tx.authAccount.create({
          data: {
            userId: user.id,
            provider: "FIREBASE",
            providerUserId: firebaseUser.uid,
            email: ownerEmail,
          },
        });

        await tx.centerMembership.create({
          data: {
            centerId: center.id,
            userId: user.id,
            role: "OWNER",
            status: MembershipStatus.ACTIVE,
          },
        });

        return {
          user: {
            id: user.id,
            email: user.email!,
            name: user.name,
            role: "OWNER" as const,
            centerId: center.id,
          },
        };
      });

      // 4. Set Custom Claims
      await this.syncCustomClaims(firebaseUser.uid, result.user);

      return result;
    } catch (error) {
      // Cleanup Firebase User if DB transaction fails or claims sync fails
      if (firebaseUser) {
        await this.firebaseAuth.deleteUser(firebaseUser.uid);
      }
      throw error;
    }
  }

  async centerSignupWithGoogle(
    input: CenterSignupWithGoogleRequest,
  ): Promise<AuthResponseData> {
    const { idToken, centerName, centerSlug } = input;

    // 1. Verify Token
    const decodedToken = await this.firebaseAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new Error("UNAUTHORIZED: Email not provided by identity provider");
    }

    // 2. Validate Uniqueness
    const existingCenter = await this.prisma.center.findUnique({
      where: { slug: centerSlug },
    });
    if (existingCenter) {
      throw new Error("CONFLICT: Center slug already exists");
    }

    // Check if user already belongs to a center
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { status: MembershipStatus.ACTIVE },
        },
      },
    });

    if (existingUser && existingUser.memberships.length > 0) {
      throw new Error("CONFLICT: User already belongs to a center");
    }

    // 3. Create Center, User (if not exists), AuthAccount, and Membership in DB
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let finalUser: {
          id: string;
          email: string | null;
          name: string | null;
        };

        if (existingUser) {
          // Update user profile with latest info from Google
          finalUser = await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: name || existingUser.name,
              avatarUrl: picture || existingUser.avatarUrl,
            },
          });
        } else {
          finalUser = await tx.user.create({
            data: {
              email,
              name: name || null,
              avatarUrl: picture || null,
            },
          });
        }

        const center = await tx.center.create({
          data: {
            name: centerName,
            slug: centerSlug,
          },
        });

        // Ensure AuthAccount exists
        await tx.authAccount.upsert({
          where: {
            provider_providerUserId: {
              provider: "FIREBASE",
              providerUserId: uid,
            },
          },
          create: {
            userId: finalUser.id,
            provider: "FIREBASE",
            providerUserId: uid,
            email,
          },
          update: {
            userId: finalUser.id,
            email,
          },
        });

        await tx.centerMembership.create({
          data: {
            centerId: center.id,
            userId: finalUser.id,
            role: "OWNER",
            status: MembershipStatus.ACTIVE,
          },
        });

        if (!finalUser.email) {
          throw new Error("INTERNAL_ERROR: User email is missing");
        }

        return {
          user: {
            id: finalUser.id,
            email: finalUser.email,
            name: finalUser.name,
            role: "OWNER" as const,
            centerId: center.id,
          },
        };
      });

      // 4. Set Custom Claims
      await this.syncCustomClaims(uid, result.user);

      return result;
    } catch (error: any) {
      if (error.code === "P2002") {
        const target = error.meta?.target;
        if (target?.includes("slug")) {
          throw new Error("CONFLICT: Center slug already exists");
        }
        if (target?.includes("email")) {
          throw new Error("CONFLICT: Email already registered");
        }
      }
      throw error;
    }
  }

  async login(idToken: string): Promise<AuthResponseData> {
    // 1. Verify Token
    const decodedToken = await this.firebaseAuth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new Error("UNAUTHORIZED: Email not provided by identity provider");
    }

    // 2. Find or Create User/Account
    const result = await this.prisma.$transaction(async (tx) => {
      let authAccount = await tx.authAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: "FIREBASE",
            providerUserId: uid,
          },
        },
      });

      let userId: string;

      if (!authAccount) {
        // Find existing user by email or create new
        let user = await tx.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await tx.user.create({
            data: {
              email,
              name: name || null,
              avatarUrl: picture || null,
            },
          });
        }

        userId = user.id;

        // Create auth account
        authAccount = await tx.authAccount.create({
          data: {
            userId,
            provider: "FIREBASE",
            providerUserId: uid,
            email,
          },
        });
      } else {
        userId = authAccount.userId;
      }

      // 3. Get Membership and Role
      const membership = await tx.centerMembership.findFirst({
        where: {
          userId,
          status: { in: [MembershipStatus.ACTIVE, MembershipStatus.INVITED] },
        },
        include: { center: true },
        orderBy: { createdAt: "desc" },
      });

      if (membership && membership.status === MembershipStatus.INVITED) {
        await tx.centerMembership.update({
          where: { id: membership.id },
          data: { status: MembershipStatus.ACTIVE },
        });
        membership.status = MembershipStatus.ACTIVE;
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error("INTERNAL_ERROR: User not found");

      // Validate role is a valid UserRole, default to STUDENT if not
      const validRoles: UserRole[] = ["OWNER", "ADMIN", "TEACHER", "STUDENT"];
      const role: UserRole = membership?.role && validRoles.includes(membership.role as UserRole)
        ? (membership.role as UserRole)
        : "STUDENT";

      return {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name,
          role,
          centerId: membership?.centerId || null,
        },
      };
    });

    // 4. Sync Custom Claims if needed
    await this.syncCustomClaims(uid, result.user);

    return result;
  }

  async getUserMembership(uid: string, centerId: string) {
    const authAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "FIREBASE",
          providerUserId: uid,
        },
      },
    });

    if (!authAccount) return null;

    return this.prisma.centerMembership.findFirst({
      where: {
        userId: authAccount.userId,
        centerId,
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.INVITED] },
      },
      include: {
        user: true,
      },
    });
  }

  private async syncCustomClaims(uid: string, user: AuthUser) {
    await this.firebaseAuth.setCustomUserClaims(uid, {
      center_id: user.centerId || null,
      role: user.role,
    });
  }

  // --- Login Attempt Tracking (Account Lockout) ---

  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  /**
   * Check if running in emulator/test mode (lockout disabled)
   */
  private isEmulatorMode(): boolean {
    return !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
  }

  /**
   * Check if an account is locked due to too many failed attempts
   * NOTE: Always returns consistent response to prevent email enumeration attacks
   * NOTE: Lockout is disabled when running with Firebase emulator (E2E tests)
   */
  async checkLoginAttempt(email: string): Promise<{
    locked: boolean;
    retryAfterMinutes?: number;
    attemptsRemaining?: number;
  }> {
    // Disable lockout in emulator mode for E2E testing
    if (this.isEmulatorMode()) {
      return { locked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    const normalizedEmail = email.toLowerCase().trim();

    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return consistent response for unknown emails (prevent enumeration)
    if (!attempt) {
      return { locked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    // Check if lockout has expired
    if (attempt.lockedUntil) {
      const now = new Date();
      if (attempt.lockedUntil > now) {
        const retryAfterMs = attempt.lockedUntil.getTime() - now.getTime();
        const retryAfterMinutes = Math.ceil(retryAfterMs / (1000 * 60));
        // Only expose lockout status, not attempts (security: prevent enumeration)
        return { locked: true, retryAfterMinutes };
      }
      // Lockout expired, reset attempts
      await this.prisma.loginAttempt.update({
        where: { email: normalizedEmail },
        data: { attempts: 0, lockedUntil: null },
      });
      return { locked: false, attemptsRemaining: this.MAX_ATTEMPTS };
    }

    // Return consistent attemptsRemaining to prevent enumeration
    // (attacker can't tell if email exists based on response)
    const attemptsRemaining = Math.max(0, this.MAX_ATTEMPTS - attempt.attempts);
    return { locked: false, attemptsRemaining };
  }

  /**
   * Reset login attempts for an email (for E2E testing)
   */
  async resetLoginAttempts(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.prisma.loginAttempt.deleteMany({
      where: { email: normalizedEmail },
    });
  }

  /**
   * Record a login attempt (success resets, failure increments)
   * NOTE: Lockout is disabled when running with Firebase emulator (E2E tests)
   */
  async recordLoginAttempt(
    email: string,
    success: boolean
  ): Promise<{
    locked: boolean;
    retryAfterMinutes?: number;
  }> {
    // Disable lockout in emulator mode for E2E testing
    if (this.isEmulatorMode()) {
      return { locked: false };
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (success) {
      // Reset on successful login
      await this.prisma.loginAttempt.upsert({
        where: { email: normalizedEmail },
        create: { email: normalizedEmail, attempts: 0, lastAttempt: new Date() },
        update: { attempts: 0, lockedUntil: null, lastAttempt: new Date() },
      });
      return { locked: false };
    }

    // Failed attempt - increment counter
    const attempt = await this.prisma.loginAttempt.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        attempts: 1,
        lastAttempt: new Date(),
      },
      update: {
        attempts: { increment: 1 },
        lastAttempt: new Date(),
      },
    });

    // Check if should lock
    if (attempt.attempts >= this.MAX_ATTEMPTS) {
      const lockedUntil = new Date(
        Date.now() + this.LOCKOUT_MINUTES * 60 * 1000
      );
      await this.prisma.loginAttempt.update({
        where: { email: normalizedEmail },
        data: { lockedUntil },
      });
      return { locked: true, retryAfterMinutes: this.LOCKOUT_MINUTES };
    }

    return { locked: false };
  }
}
