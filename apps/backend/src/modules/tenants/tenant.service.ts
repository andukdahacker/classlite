import { CreateTenantInput, TenantData } from "@workspace/types";
import { CenterRole, MembershipStatus, PrismaClient } from "@workspace/db";
import type { Auth } from "firebase-admin/auth";
import type { Resend } from "resend";

export class TenantService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly firebaseAuth: Auth,
    private readonly resend: Resend,
    private readonly options: { emailFrom: string },
  ) {}

  async createTenant(input: CreateTenantInput): Promise<TenantData> {
    const { name, slug, ownerEmail, ownerName } = input;

    // 1. Check for existing user (AC 3)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (existingUser) {
      throw new Error("CONFLICT: Email already registered in database");
    }

    try {
      await this.firebaseAuth.getUserByEmail(ownerEmail);
      throw new Error("CONFLICT: Email already registered in Firebase");
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // 2. Create Firebase User
    const firebaseUser = await this.firebaseAuth.createUser({
      email: ownerEmail,
      displayName: ownerName,
      emailVerified: true,
    });
    const firebaseUid = firebaseUser.uid;

    try {
      // 3. Perform DB Transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // 3a. Create User
        const user = await tx.user.create({
          data: {
            email: ownerEmail,
            name: ownerName,
          },
        });

        // 3b. Link AuthAccount
        await tx.authAccount.create({
          data: {
            userId: user.id,
            provider: "FIREBASE",
            providerUserId: firebaseUid,
            email: ownerEmail,
          },
        });

        // 3c. Create Center
        const center = await tx.center.create({
          data: {
            name,
            slug,
          },
        });

        // 3d. Create Membership
        await tx.centerMembership.create({
          data: {
            centerId: center.id,
            userId: user.id,
            role: CenterRole.OWNER,
            status: MembershipStatus.ACTIVE,
          },
        });

        return { center, user };
      });

      // 4. Set Custom Claims
      await this.firebaseAuth.setCustomUserClaims(firebaseUid, {
        center_id: result.center.id,
        role: "owner",
      });

      // 5. Send Welcome Email (with Password Reset Link)
      const resetLink =
        await this.firebaseAuth.generatePasswordResetLink(ownerEmail);

      await this.resend.emails.send({
        from: this.options.emailFrom,
        to: ownerEmail,
        subject: "Welcome to ClassLite",
        html: `
        <h1>Welcome to ClassLite, ${ownerName}!</h1>
        <p>Your center <strong>${name}</strong> has been successfully provisioned.</p>
        <p>Please click the link below to set your password and access your account:</p>
        <a href="${resetLink}">Set Password & Login</a>
        <p>If you already have an account, you can just login.</p>
      `,
      });

      return {
        center: {
          id: result.center.id,
          name: result.center.name,
          slug: result.center.slug,
          createdAt: result.center.createdAt,
          updatedAt: result.center.updatedAt,
        },
        owner: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: "OWNER",
        },
      };
    } catch (error) {
      // Cleanup Firebase user if DB transaction or subsequent steps fail
      await this.firebaseAuth.deleteUser(firebaseUid).catch(() => {});
      throw error;
    }
  }
}
