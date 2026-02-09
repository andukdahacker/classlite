import { vi, describe, it, expect, beforeEach } from "vitest";
import { TagsService } from "./tags.service.js";

describe("TagsService", () => {
  let tagsService: TagsService;
  let mockPrisma: any;
  let mockTenantedClient: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    mockTenantedClient = {
      exerciseTag: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      exerciseTagAssignment: {
        findMany: vi.fn(),
        createMany: vi.fn(),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockTenantedClient),
      $transaction: vi.fn().mockImplementation(async (fn: any) => {
        return fn(mockPrisma);
      }),
    };

    tagsService = new TagsService(mockPrisma as any);
  });

  describe("listTags", () => {
    it("should return all tags sorted by name with counts", async () => {
      const mockTags = [
        { id: "tag-1", name: "Environment", centerId, _count: { tagAssignments: 3 } },
        { id: "tag-2", name: "Health", centerId, _count: { tagAssignments: 0 } },
      ];
      mockTenantedClient.exerciseTag.findMany.mockResolvedValue(mockTags);

      const result = await tagsService.listTags(centerId);

      expect(result).toEqual(mockTags);
      expect(mockTenantedClient.exerciseTag.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { _count: { select: { tagAssignments: true } } },
      });
    });

    it("should return empty array when no tags exist", async () => {
      mockTenantedClient.exerciseTag.findMany.mockResolvedValue([]);

      const result = await tagsService.listTags(centerId);

      expect(result).toEqual([]);
    });
  });

  describe("createTag", () => {
    it("should create a tag successfully", async () => {
      const input = { name: "Environment" };
      const mockTag = {
        id: "tag-1",
        name: "Environment",
        centerId,
        _count: { tagAssignments: 0 },
      };
      mockTenantedClient.exerciseTag.create.mockResolvedValue(mockTag);

      const result = await tagsService.createTag(centerId, input);

      expect(result).toEqual(mockTag);
      expect(mockTenantedClient.exerciseTag.create).toHaveBeenCalledWith({
        data: { name: "Environment", centerId },
        include: { _count: { select: { tagAssignments: true } } },
      });
    });

    it("should throw conflict error on duplicate name (P2002)", async () => {
      const input = { name: "Environment" };
      mockTenantedClient.exerciseTag.create.mockRejectedValue({ code: "P2002" });

      await expect(tagsService.createTag(centerId, input)).rejects.toThrow(
        "Tag with this name already exists",
      );
    });

    it("should rethrow non-P2002 errors", async () => {
      const input = { name: "Environment" };
      const error = new Error("DB connection failed");
      mockTenantedClient.exerciseTag.create.mockRejectedValue(error);

      await expect(tagsService.createTag(centerId, input)).rejects.toThrow(
        "DB connection failed",
      );
    });
  });

  describe("updateTag", () => {
    it("should update tag name successfully", async () => {
      const tagId = "tag-1";
      const input = { name: "Updated Name" };
      const mockTag = {
        id: tagId,
        name: "Updated Name",
        centerId,
        _count: { tagAssignments: 2 },
      };
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue({
        id: tagId,
        name: "Old Name",
        centerId,
      });
      mockTenantedClient.exerciseTag.update.mockResolvedValue(mockTag);

      const result = await tagsService.updateTag(centerId, tagId, input);

      expect(result).toEqual(mockTag);
      expect(mockTenantedClient.exerciseTag.update).toHaveBeenCalledWith({
        where: { id: tagId },
        data: { name: "Updated Name" },
        include: { _count: { select: { tagAssignments: true } } },
      });
    });

    it("should throw not found when tag does not exist", async () => {
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue(null);

      await expect(
        tagsService.updateTag(centerId, "nonexistent", { name: "New" }),
      ).rejects.toThrow("Tag not found");
    });

    it("should throw conflict error on duplicate name (P2002)", async () => {
      const tagId = "tag-1";
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue({
        id: tagId,
        name: "Old",
        centerId,
      });
      mockTenantedClient.exerciseTag.update.mockRejectedValue({ code: "P2002" });

      await expect(
        tagsService.updateTag(centerId, tagId, { name: "Existing" }),
      ).rejects.toThrow("Tag with this name already exists");
    });
  });

  describe("deleteTag", () => {
    it("should delete tag successfully", async () => {
      const tagId = "tag-1";
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue({
        id: tagId,
        name: "Environment",
        centerId,
      });
      mockTenantedClient.exerciseTag.delete.mockResolvedValue({ id: tagId });

      await tagsService.deleteTag(centerId, tagId);

      expect(mockTenantedClient.exerciseTag.delete).toHaveBeenCalledWith({
        where: { id: tagId },
      });
    });

    it("should throw not found when tag does not exist", async () => {
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue(null);

      await expect(
        tagsService.deleteTag(centerId, "nonexistent"),
      ).rejects.toThrow("Tag not found");
    });
  });

  describe("mergeTags", () => {
    it("should throw not found when source tag does not exist", async () => {
      mockTenantedClient.exerciseTag.findUnique.mockResolvedValue(null);

      await expect(
        tagsService.mergeTags(centerId, {
          sourceTagId: "nonexistent",
          targetTagId: "tag-2",
        }),
      ).rejects.toThrow("Source tag not found");
    });

    it("should throw not found when target tag does not exist", async () => {
      mockTenantedClient.exerciseTag.findUnique
        .mockResolvedValueOnce({ id: "tag-1", name: "Source", centerId })
        .mockResolvedValueOnce(null);

      await expect(
        tagsService.mergeTags(centerId, {
          sourceTagId: "tag-1",
          targetTagId: "nonexistent",
        }),
      ).rejects.toThrow("Target tag not found");
    });

    it("should throw bad request when merging tag into itself", async () => {
      await expect(
        tagsService.mergeTags(centerId, {
          sourceTagId: "tag-1",
          targetTagId: "tag-1",
        }),
      ).rejects.toThrow("Cannot merge a tag into itself");
    });

    it("should merge tags within a transaction", async () => {
      const sourceTagId = "tag-1";
      const targetTagId = "tag-2";

      mockTenantedClient.exerciseTag.findUnique
        .mockResolvedValueOnce({ id: sourceTagId, name: "Source", centerId })
        .mockResolvedValueOnce({ id: targetTagId, name: "Target", centerId });

      // Inside the transaction, the mock will return the tenanted client
      mockTenantedClient.exerciseTagAssignment.findMany
        .mockResolvedValueOnce([{ exerciseId: "ex-1" }]) // target assignments
        .mockResolvedValueOnce([
          { id: "assign-1", exerciseId: "ex-1", tagId: sourceTagId }, // duplicate
          { id: "assign-2", exerciseId: "ex-2", tagId: sourceTagId }, // unique
        ]); // source assignments

      mockTenantedClient.exerciseTagAssignment.deleteMany.mockResolvedValue({ count: 1 });
      mockTenantedClient.exerciseTagAssignment.updateMany.mockResolvedValue({ count: 1 });
      mockTenantedClient.exerciseTag.delete.mockResolvedValue({ id: sourceTagId });
      const mergedTag = {
        id: targetTagId,
        name: "Target",
        centerId,
        _count: { tagAssignments: 2 },
      };
      mockTenantedClient.exerciseTag.findUniqueOrThrow.mockResolvedValue(mergedTag);

      const result = await tagsService.mergeTags(centerId, {
        sourceTagId,
        targetTagId,
      });

      expect(result).toEqual(mergedTag);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("setExerciseTags", () => {
    it("should delete existing and create new assignments", async () => {
      const exerciseId = "ex-1";
      const tagIds = ["tag-1", "tag-2"];

      mockTenantedClient.exerciseTagAssignment.deleteMany.mockResolvedValue({ count: 1 });
      mockTenantedClient.exerciseTagAssignment.createMany.mockResolvedValue({ count: 2 });

      await tagsService.setExerciseTags(centerId, exerciseId, tagIds);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should only delete when tagIds is empty", async () => {
      const exerciseId = "ex-1";

      mockTenantedClient.exerciseTagAssignment.deleteMany.mockResolvedValue({ count: 1 });

      await tagsService.setExerciseTags(centerId, exerciseId, []);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("getExerciseTags", () => {
    it("should return tags for an exercise via join", async () => {
      const exerciseId = "ex-1";
      const mockAssignments = [
        {
          tag: {
            id: "tag-1",
            name: "Environment",
            centerId,
            _count: { tagAssignments: 3 },
          },
        },
        {
          tag: {
            id: "tag-2",
            name: "Health",
            centerId,
            _count: { tagAssignments: 1 },
          },
        },
      ];
      mockTenantedClient.exerciseTagAssignment.findMany.mockResolvedValue(
        mockAssignments,
      );

      const result = await tagsService.getExerciseTags(centerId, exerciseId);

      expect(result).toEqual([
        { id: "tag-1", name: "Environment", centerId, _count: { tagAssignments: 3 } },
        { id: "tag-2", name: "Health", centerId, _count: { tagAssignments: 1 } },
      ]);
      expect(
        mockTenantedClient.exerciseTagAssignment.findMany,
      ).toHaveBeenCalledWith({
        where: { exerciseId },
        include: {
          tag: {
            include: { _count: { select: { tagAssignments: true } } },
          },
        },
      });
    });

    it("should return empty array when exercise has no tags", async () => {
      mockTenantedClient.exerciseTagAssignment.findMany.mockResolvedValue([]);

      const result = await tagsService.getExerciseTags(centerId, "ex-1");

      expect(result).toEqual([]);
    });
  });
});
