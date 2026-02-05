import { PrismaClient, getTenantedClient } from "@workspace/db";
import type { CreateRoomInput, UpdateRoomInput, Room } from "@workspace/types";

export class RoomsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listRooms(centerId: string): Promise<Room[]> {
    const db = getTenantedClient(this.prisma, centerId);
    return await db.room.findMany({
      orderBy: { name: "asc" },
    });
  }

  async createRoom(centerId: string, input: CreateRoomInput): Promise<Room> {
    const db = getTenantedClient(this.prisma, centerId);

    const existing = await db.room.findFirst({
      where: { name: input.name },
    });
    if (existing) {
      throw new Error("Room name already exists");
    }

    return await db.room.create({
      data: {
        name: input.name,
        centerId,
      },
    });
  }

  async updateRoom(centerId: string, id: string, input: UpdateRoomInput): Promise<Room> {
    const db = getTenantedClient(this.prisma, centerId);

    const existing = await db.room.findFirst({
      where: { name: input.name, id: { not: id } },
    });
    if (existing) {
      throw new Error("Room name already exists");
    }

    return await db.room.update({
      where: { id },
      data: { name: input.name },
    });
  }

  async deleteRoom(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);

    const room = await db.room.findUnique({ where: { id } });
    if (!room) {
      throw new Error("Room not found");
    }

    await db.room.delete({ where: { id } });
  }
}
