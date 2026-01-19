import { CenterRole, MembershipStatus, PrismaClient } from "@workspace/db";
import { Auth } from "firebase-admin/auth";
import { AuthResponseData, AuthUser } from "@workspace/types";

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly firebaseAuth: Auth,
  ) {}

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
        where: { userId, status: MembershipStatus.ACTIVE },
        include: { center: true },
      });

      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error("INTERNAL_ERROR: User not found");

      return {
        user: {
          id: user.id,
          email: user.email!,
          name: user.name,
          role: (membership?.role as unknown as any) || "STUDENT",
          centerId: membership?.centerId || null,
        },
      };
    });

    // 4. Sync Custom Claims if needed
    await this.syncCustomClaims(uid, result.user);

    return result;
  }

  private async syncCustomClaims(uid: string, user: AuthUser) {
    if (user.centerId) {
      await this.firebaseAuth.setCustomUserClaims(uid, {
        center_id: user.centerId,
        role: user.role.toLowerCase(),
      });
    }
  }
}
