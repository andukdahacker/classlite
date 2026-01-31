import { describe, it, expect, vi } from "vitest";

// Mock the inngest client before importing anything else
vi.mock("../../inngest/client.js", () => ({
  inngest: {
    createFunction: vi.fn((config, trigger, handler) => ({
      config,
      trigger,
      handler,
    })),
  },
}));

// Mock firebase-admin/auth
vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({
    deleteUser: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock @workspace/db with a factory that returns a mock
vi.mock("@workspace/db", () => ({
  PrismaClient: vi.fn(),
}));

describe("User Deletion Job", () => {
  describe("Job Configuration", () => {
    it("exports userDeletionJob with correct id", async () => {
      const { userDeletionJob } = await import("./user-deletion.job.js");

      expect(userDeletionJob).toBeDefined();
      expect(userDeletionJob.config.id).toBe("user-deletion");
    });

    it("has correct event trigger", async () => {
      const { userDeletionJob } = await import("./user-deletion.job.js");

      expect(userDeletionJob.trigger.event).toBe("user/deletion.scheduled");
    });

    it("has 3 retries configured", async () => {
      const { userDeletionJob } = await import("./user-deletion.job.js");

      expect(userDeletionJob.config.retries).toBe(3);
    });
  });

  describe("Event Type", () => {
    it("exports UserDeletionScheduledEvent type", async () => {
      // TypeScript type check - just ensure it compiles
      const event: import("./user-deletion.job.js").UserDeletionScheduledEvent = {
        name: "user/deletion.scheduled",
        data: {
          userId: "test-user-id",
          deletionRequestedAt: new Date().toISOString(),
        },
      };

      expect(event.name).toBe("user/deletion.scheduled");
      expect(event.data.userId).toBe("test-user-id");
    });
  });
});
