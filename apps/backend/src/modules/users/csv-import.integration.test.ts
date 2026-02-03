import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, CenterRole, MembershipStatus, CsvImportStatus } from "@workspace/db";
import { getTestPrisma, closeTestPrisma, isTestDatabaseAvailable } from "../../test/db.js";

// Mock Firebase Admin before any imports
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    revokeRefreshTokens: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { CsvImportService } from "./csv-import.service.js";

describe("CSV Import Integration", () => {
  let prisma: PrismaClient;
  let dbAvailable = false;
  let csvImportService: CsvImportService;

  const centerAId = "center-csv-import-a";
  const centerBId = "center-csv-import-b";
  const ownerUserId = "csv-owner-user-id";
  const existingUserId = "csv-existing-user-id";

  beforeAll(async () => {
    dbAvailable = await isTestDatabaseAvailable();
    if (dbAvailable) {
      prisma = await getTestPrisma();
    }
  });

  beforeEach(async () => {
    if (!dbAvailable) return;

    try {
      csvImportService = new CsvImportService(prisma);

      // Cleanup - order matters for foreign keys
      await prisma.csvImportRowLog.deleteMany({
        where: {
          importLog: {
            centerId: { in: [centerAId, centerBId] },
          },
        },
      });
      await prisma.csvImportLog.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.centerMembership.deleteMany({
        where: { centerId: { in: [centerAId, centerBId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [ownerUserId, existingUserId] } },
      });
      await prisma.center.deleteMany({
        where: { id: { in: [centerAId, centerBId] } },
      });

      // Setup centers
      await prisma.center.create({
        data: { id: centerAId, name: "Center A", slug: "center-csv-import-a" },
      });
      await prisma.center.create({
        data: { id: centerBId, name: "Center B", slug: "center-csv-import-b" },
      });

      // Setup users
      await prisma.user.createMany({
        data: [
          { id: ownerUserId, email: "csv-owner@test.com", name: "Owner User" },
          { id: existingUserId, email: "existing@test.com", name: "Existing User" },
        ],
      });

      // Setup memberships for Center A
      await prisma.centerMembership.createMany({
        data: [
          { centerId: centerAId, userId: ownerUserId, role: CenterRole.OWNER, status: MembershipStatus.ACTIVE },
          { centerId: centerAId, userId: existingUserId, role: CenterRole.TEACHER, status: MembershipStatus.ACTIVE },
        ],
      });
    } catch (e) {
      console.warn("Database integration test setup failed:", e);
    }
  });

  afterAll(async () => {
    if (dbAvailable && prisma) {
      try {
        // Cleanup
        await prisma.csvImportRowLog.deleteMany({
          where: {
            importLog: {
              centerId: { in: [centerAId, centerBId] },
            },
          },
        });
        await prisma.csvImportLog.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.centerMembership.deleteMany({
          where: { centerId: { in: [centerAId, centerBId] } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: [ownerUserId, existingUserId] } },
        });
        await prisma.center.deleteMany({
          where: { id: { in: [centerAId, centerBId] } },
        });
      } catch {}
    }
    await closeTestPrisma();
  });

  describe("parseAndValidate - Database Integration", () => {
    it.skipIf(!dbAvailable)("creates import log with rows in database", async () => {
      const csv = `Email,Name,Role
newuser@example.com,New User,Teacher
another@example.com,Another User,Student`;

      const result = await csvImportService.parseAndValidate(
        Buffer.from(csv),
        centerAId,
        ownerUserId,
        "test.csv"
      );

      expect(result.importLogId).toBeDefined();
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);

      // Verify database records
      const importLog = await prisma.csvImportLog.findUnique({
        where: { id: result.importLogId },
        include: { rows: true },
      });

      expect(importLog).toBeDefined();
      expect(importLog?.totalRows).toBe(2);
      expect(importLog?.rows).toHaveLength(2);
      expect(importLog?.status).toBe(CsvImportStatus.PENDING);
    });

    it.skipIf(!dbAvailable)("detects existing center members as duplicates", async () => {
      const csv = `Email,Name,Role
existing@test.com,Existing User,Teacher`;

      const result = await csvImportService.parseAndValidate(
        Buffer.from(csv),
        centerAId,
        ownerUserId,
        "test.csv"
      );

      expect(result.duplicateRows).toBe(1);
      expect(result.validRows).toBe(0);
      expect(result.rows[0].status).toBe("DUPLICATE_IN_CENTER");
    });

    it.skipIf(!dbAvailable)("allows same email in different center", async () => {
      const csv = `Email,Name,Role
existing@test.com,Existing User,Teacher`;

      // Import to Center B (where user doesn't have membership)
      const result = await csvImportService.parseAndValidate(
        Buffer.from(csv),
        centerBId,
        ownerUserId,
        "test.csv"
      );

      expect(result.validRows).toBe(1);
      expect(result.duplicateRows).toBe(0);
    });
  });

  describe("getImportStatus - Database Integration", () => {
    it.skipIf(!dbAvailable)("returns correct status from database", async () => {
      const csv = `Email,Name,Role
user1@example.com,User One,Teacher`;

      const validateResult = await csvImportService.parseAndValidate(
        Buffer.from(csv),
        centerAId,
        ownerUserId,
        "test.csv"
      );

      const status = await csvImportService.getImportStatus(
        validateResult.importLogId,
        centerAId
      );

      expect(status.status).toBe(CsvImportStatus.PENDING);
      expect(status.isComplete).toBe(false);
    });
  });

  describe("getImportHistory - Database Integration", () => {
    it.skipIf(!dbAvailable)("returns paginated import history", async () => {
      // Create multiple imports
      await csvImportService.parseAndValidate(
        Buffer.from(`Email,Name,Role\nuser1@example.com,User 1,Teacher`),
        centerAId,
        ownerUserId,
        "import1.csv"
      );
      await csvImportService.parseAndValidate(
        Buffer.from(`Email,Name,Role\nuser2@example.com,User 2,Student`),
        centerAId,
        ownerUserId,
        "import2.csv"
      );

      const history = await csvImportService.getImportHistory(centerAId, {
        page: 1,
        limit: 10,
      });

      expect(history.items.length).toBeGreaterThanOrEqual(2);
      expect(history.items[0].importedBy.id).toBe(ownerUserId);
    });

    it.skipIf(!dbAvailable)("filters by status", async () => {
      await csvImportService.parseAndValidate(
        Buffer.from(`Email,Name,Role\nuser3@example.com,User 3,Teacher`),
        centerAId,
        ownerUserId,
        "import3.csv"
      );

      const history = await csvImportService.getImportHistory(centerAId, {
        page: 1,
        limit: 10,
        status: CsvImportStatus.PENDING,
      });

      // All items should be PENDING
      history.items.forEach((item) => {
        expect(item.status).toBe(CsvImportStatus.PENDING);
      });
    });
  });

  describe("Multi-tenancy - Cross-center isolation", () => {
    it.skipIf(!dbAvailable)("import in Center A not visible from Center B", async () => {
      // Create import in Center A
      await csvImportService.parseAndValidate(
        Buffer.from(`Email,Name,Role\nuserA@example.com,User A,Teacher`),
        centerAId,
        ownerUserId,
        "centerA.csv"
      );

      // Get history for Center B
      const historyB = await csvImportService.getImportHistory(centerBId, {
        page: 1,
        limit: 10,
      });

      // Center B should not see Center A's imports
      const centerAImports = historyB.items.filter(
        (item) => item.fileName === "centerA.csv"
      );
      expect(centerAImports).toHaveLength(0);
    });
  });

  describe("Large CSV handling", () => {
    it.skipIf(!dbAvailable)("handles 100 row CSV efficiently", async () => {
      const rows = ["Email,Name,Role"];
      for (let i = 0; i < 100; i++) {
        rows.push(`user${i}@example.com,User ${i},Student`);
      }
      const largeCsv = rows.join("\n");

      const startTime = Date.now();
      const result = await csvImportService.parseAndValidate(
        Buffer.from(largeCsv),
        centerAId,
        ownerUserId,
        "large.csv"
      );
      const endTime = Date.now();

      expect(result.totalRows).toBe(100);
      expect(result.validRows).toBe(100);
      // Should complete in reasonable time (under 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe("Concurrent imports - Same center stress test", () => {
    it.skipIf(!dbAvailable)("handles concurrent imports from same center", async () => {
      // Create 3 different CSV files to import concurrently
      const csv1 = `Email,Name,Role\nconcurrent1@example.com,User 1,Teacher`;
      const csv2 = `Email,Name,Role\nconcurrent2@example.com,User 2,Student`;
      const csv3 = `Email,Name,Role\nconcurrent3@example.com,User 3,Teacher`;

      // Start all imports concurrently
      const [result1, result2, result3] = await Promise.all([
        csvImportService.parseAndValidate(
          Buffer.from(csv1),
          centerAId,
          ownerUserId,
          "concurrent1.csv"
        ),
        csvImportService.parseAndValidate(
          Buffer.from(csv2),
          centerAId,
          ownerUserId,
          "concurrent2.csv"
        ),
        csvImportService.parseAndValidate(
          Buffer.from(csv3),
          centerAId,
          ownerUserId,
          "concurrent3.csv"
        ),
      ]);

      // All should succeed with unique import log IDs
      expect(result1.importLogId).toBeDefined();
      expect(result2.importLogId).toBeDefined();
      expect(result3.importLogId).toBeDefined();
      expect(result1.importLogId).not.toBe(result2.importLogId);
      expect(result2.importLogId).not.toBe(result3.importLogId);

      // All should have valid rows
      expect(result1.validRows).toBe(1);
      expect(result2.validRows).toBe(1);
      expect(result3.validRows).toBe(1);

      // Verify all import logs were created in database
      const history = await csvImportService.getImportHistory(centerAId, {
        page: 1,
        limit: 10,
      });

      const concurrentImports = history.items.filter((item) =>
        item.fileName.startsWith("concurrent")
      );
      expect(concurrentImports.length).toBeGreaterThanOrEqual(3);
    });

    it.skipIf(!dbAvailable)("concurrent imports don't interfere with duplicate detection", async () => {
      // Two imports with overlapping emails submitted concurrently
      const csv1 = `Email,Name,Role\nshared@example.com,User Shared,Teacher`;
      const csv2 = `Email,Name,Role\nshared@example.com,User Shared Copy,Student`;

      const [result1, result2] = await Promise.all([
        csvImportService.parseAndValidate(
          Buffer.from(csv1),
          centerAId,
          ownerUserId,
          "overlap1.csv"
        ),
        csvImportService.parseAndValidate(
          Buffer.from(csv2),
          centerAId,
          ownerUserId,
          "overlap2.csv"
        ),
      ]);

      // Both should complete (duplicate detection happens at execution time, not validation)
      expect(result1.importLogId).toBeDefined();
      expect(result2.importLogId).toBeDefined();
      // At validation time, both appear valid (no existing membership yet)
      expect(result1.validRows).toBe(1);
      expect(result2.validRows).toBe(1);
    });
  });
});
