import { inngest } from "../../inngest/client.js";
import { createPrisma } from "../../../plugins/create-prisma.js";
import { getAuth } from "firebase-admin/auth";

// Note: Each step.run() creates a new PrismaClient because:
// 1. Inngest steps are durable and can retry independently
// 2. Steps may run in different processes or after delays
// 3. Connection pooling at the database level handles efficiency
// This is intentional for Inngest's durable execution model.

// Event type for user deletion scheduling
export type UserDeletionScheduledEvent = {
  name: "user/deletion.scheduled";
  data: {
    userId: string;
    deletionRequestedAt: string;
  };
};

// The grace period in days before actual deletion
const DELETION_GRACE_PERIOD_DAYS = 7;

/**
 * Inngest function that handles scheduled user deletion.
 *
 * Flow:
 * 1. Wait for 7 days (grace period)
 * 2. Check if deletion is still pending (user might have cancelled)
 * 3. If still pending, perform actual deletion:
 *    - Delete Firebase auth account
 *    - Delete all user data from database
 */
export const userDeletionJob = inngest.createFunction(
  {
    id: "user-deletion",
    retries: 3,
  },
  { event: "user/deletion.scheduled" },
  async ({ event, step }) => {
    const { userId, deletionRequestedAt } = event.data;

    // Step 1: Wait for the grace period
    await step.sleep("wait-grace-period", `${DELETION_GRACE_PERIOD_DAYS}d`);

    // Step 2: Check if deletion is still pending
    const shouldDelete = await step.run("check-deletion-status", async () => {
      const prisma = createPrisma();
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { deletionRequestedAt: true },
        });

        // If user doesn't exist or deletion was cancelled, skip
        if (!user || !user.deletionRequestedAt) {
          return false;
        }

        // Verify the deletion request timestamp matches (user didn't re-request)
        const originalDate = new Date(deletionRequestedAt).getTime();
        const currentDate = user.deletionRequestedAt.getTime();

        return originalDate === currentDate;
      } finally {
        await prisma.$disconnect();
      }
    });

    if (!shouldDelete) {
      return {
        status: "cancelled",
        message: "Deletion was cancelled or user not found"
      };
    }

    // Step 3: Delete Firebase auth account
    await step.run("delete-firebase-account", async () => {
      const prisma = createPrisma();
      try {
        const authAccount = await prisma.authAccount.findFirst({
          where: { userId, provider: "FIREBASE" },
        });

        if (authAccount) {
          try {
            await getAuth().deleteUser(authAccount.providerUserId);
          } catch (error) {
            // Firebase user might already be deleted, log but continue
            console.error("Failed to delete Firebase user:", error);
          }
        }
      } finally {
        await prisma.$disconnect();
      }
    });

    // Step 4: Delete user data from database
    await step.run("delete-user-data", async () => {
      const prisma = createPrisma();
      try {
        // Delete in order to handle foreign key constraints
        // 1. Delete memberships (will cascade to permissions)
        await prisma.centerMembership.deleteMany({
          where: { userId },
        });

        // 2. Delete auth accounts
        await prisma.authAccount.deleteMany({
          where: { userId },
        });

        // 3. Delete class enrollments
        await prisma.classStudent.deleteMany({
          where: { studentId: userId },
        });

        // 4. Delete notifications
        await prisma.notification.deleteMany({
          where: { userId },
        });

        // 5. Finally delete the user
        await prisma.user.delete({
          where: { id: userId },
        });
      } finally {
        await prisma.$disconnect();
      }
    });

    return {
      status: "completed",
      message: `User ${userId} has been deleted`
    };
  }
);
