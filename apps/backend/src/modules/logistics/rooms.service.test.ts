import { vi, describe, it, expect, beforeEach } from "vitest";
import { RoomsService } from "./rooms.service.js";

describe("RoomsService", () => {
  let roomsService: RoomsService;
  let mockPrisma: any;
  let mockTenantedClient: any;
  const centerId = "center-123";

  beforeEach(() => {
    vi.clearAllMocks();

    mockTenantedClient = {
      room: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      classSession: {
        count: vi.fn(),
      },
    };

    mockPrisma = {
      $extends: vi.fn().mockReturnValue(mockTenantedClient),
    };

    roomsService = new RoomsService(mockPrisma as any);
  });

  describe("listRooms", () => {
    it("should return all rooms sorted by name", async () => {
      const mockRooms = [
        { id: "room-1", name: "Room 101", centerId, createdAt: new Date(), updatedAt: new Date() },
        { id: "room-2", name: "Room 202", centerId, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockTenantedClient.room.findMany.mockResolvedValue(mockRooms);

      const result = await roomsService.listRooms(centerId);

      expect(result).toEqual(mockRooms);
      expect(mockTenantedClient.room.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
    });

    it("should return empty array when no rooms exist", async () => {
      mockTenantedClient.room.findMany.mockResolvedValue([]);

      const result = await roomsService.listRooms(centerId);

      expect(result).toEqual([]);
    });
  });

  describe("createRoom", () => {
    it("should create a room successfully", async () => {
      const input = { name: "Room 101" };
      const mockRoom = { id: "room-1", name: "Room 101", centerId, createdAt: new Date(), updatedAt: new Date() };
      mockTenantedClient.room.findFirst.mockResolvedValue(null);
      mockTenantedClient.room.create.mockResolvedValue(mockRoom);

      const result = await roomsService.createRoom(centerId, input);

      expect(result).toEqual(mockRoom);
      expect(mockTenantedClient.room.create).toHaveBeenCalledWith({
        data: { name: "Room 101", centerId },
      });
    });

    it("should throw 409 if room name already exists in same center", async () => {
      const input = { name: "Room 101" };
      mockTenantedClient.room.findFirst.mockResolvedValue({
        id: "room-existing",
        name: "Room 101",
        centerId,
      });

      await expect(roomsService.createRoom(centerId, input)).rejects.toThrow(
        "Room name already exists"
      );
    });
  });

  describe("updateRoom", () => {
    it("should update room name successfully", async () => {
      const roomId = "room-1";
      const input = { name: "Room 202" };
      const mockRoom = { id: roomId, name: "Room 202", centerId, createdAt: new Date(), updatedAt: new Date() };
      mockTenantedClient.room.findFirst.mockResolvedValue(null);
      mockTenantedClient.room.update.mockResolvedValue(mockRoom);

      const result = await roomsService.updateRoom(centerId, roomId, input);

      expect(result).toEqual(mockRoom);
      expect(mockTenantedClient.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: { name: "Room 202" },
      });
    });

    it("should throw if new name conflicts with existing room", async () => {
      const roomId = "room-1";
      const input = { name: "Room 202" };
      mockTenantedClient.room.findFirst.mockResolvedValue({
        id: "room-other",
        name: "Room 202",
        centerId,
      });

      await expect(roomsService.updateRoom(centerId, roomId, input)).rejects.toThrow(
        "Room name already exists"
      );
    });
  });

  describe("deleteRoom", () => {
    it("should delete room successfully", async () => {
      const roomId = "room-1";
      mockTenantedClient.room.findUnique.mockResolvedValue({
        id: roomId,
        name: "Room 101",
        centerId,
      });
      mockTenantedClient.room.delete.mockResolvedValue({ id: roomId });

      await roomsService.deleteRoom(centerId, roomId);

      expect(mockTenantedClient.room.delete).toHaveBeenCalledWith({
        where: { id: roomId },
      });
    });

    it("should throw if room not found", async () => {
      mockTenantedClient.room.findUnique.mockResolvedValue(null);

      await expect(roomsService.deleteRoom(centerId, "nonexistent")).rejects.toThrow(
        "Room not found"
      );
    });
  });
});
