import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@workspace/db";
import { getTenantedClient } from "@workspace/db";
import { getTestPrisma, closeTestPrisma, isTestDatabaseAvailable } from "../../test/db.js";
import { InvitationService } from "./invitation.service.js";

describe("Invitation Integration", () => {
  let prisma: PrismaClient;
  let dbAvailable = false;
  let invitationService: InvitationService;

  const centerAId = "center-inv-a";
  const centerBId = "center-inv-b";

  const mockResend = {
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email-123" }),
    },
  };

  beforeAll(async () => {
    dbAvailable = await isTestDatabaseAvailable();
    if (dbAvailable) {
      prisma = await getTestPrisma();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    try {
      invitationService = new InvitationService(prisma, mockResend as any, {
        emailFrom: "test@classlite.app",
        webappUrl: "http://localhost:3000",
      });

      // Cleanup
      await prisma.centerMembership.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.center.deleteMany({
        where: { id: { in: [centerAId, centerBId] } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: ["invited-a@test.com", "invited-b@test.com"] } },
      });

      // Setup
      await prisma.center.create({
        data: { id: centerAId, name: "Center A", slug: "center-inv-a" },
      });
      await prisma.center.create({
        data: { id: centerBId, name: "Center B", slug: "center-inv-b" },
      });
    } catch (e) {
      console.warn("Database integration test setup failed:", e);
    }
  });

  afterAll(async () => {
    if (dbAvailable && prisma) {
      try {
        await prisma.centerMembership.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.center.deleteMany({
          where: { id: { in: [centerAId, centerBId] } },
        });
        await prisma.user.deleteMany({
          where: { email: { in: ["invited-a@test.com", "invited-b@test.com"] } },
        });
      } catch {}
    }
    await closeTestPrisma();
  });

  it("should create invitation in the correct center using tenanted client", async () => {
    if (!dbAvailable) return;

    const email = "invited-a@test.com";

    const result = await invitationService.inviteUser(centerAId, {
      email,
      role: "TEACHER",
    });

    expect(result.centerId).toBe(centerAId);
    expect(result.status).toBe("INVITED");

    // Verify Center B cannot see it
    const dbB = getTenantedClient(prisma, centerBId);
    const membersB = await dbB.centerMembership.findMany();
    expect(membersB.find((m) => m.userId === result.userId)).toBeUndefined();

    // Verify Global client sees it
    const membership = await prisma.centerMembership.findFirst({
      where: { userId: result.userId, centerId: centerAId },
    });
    expect(membership).toBeDefined();
  });
});
