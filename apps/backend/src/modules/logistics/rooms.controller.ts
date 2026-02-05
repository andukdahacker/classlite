import type { RoomResponse, RoomListResponse, CreateRoomInput, UpdateRoomInput } from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { RoomsService } from "./rooms.service.js";

export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  async listRooms(user: JwtPayload): Promise<RoomListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const rooms = await this.roomsService.listRooms(centerId);
    return {
      data: rooms,
      message: "Rooms retrieved successfully",
    };
  }

  async createRoom(input: CreateRoomInput, user: JwtPayload): Promise<RoomResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const room = await this.roomsService.createRoom(centerId, input);
    return {
      data: room,
      message: "Room created successfully",
    };
  }

  async updateRoom(id: string, input: UpdateRoomInput, user: JwtPayload): Promise<RoomResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const room = await this.roomsService.updateRoom(centerId, id, input);
    return {
      data: room,
      message: "Room updated successfully",
    };
  }

  async deleteRoom(id: string, user: JwtPayload): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.roomsService.deleteRoom(centerId, id);
    return {
      message: "Room deleted successfully",
    };
  }
}
