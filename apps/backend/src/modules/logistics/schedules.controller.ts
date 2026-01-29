import {
  ClassScheduleListResponse,
  ClassScheduleResponse,
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { SchedulesService } from "./schedules.service.js";

export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  async listSchedules(
    user: JwtPayload,
    classId?: string,
  ): Promise<ClassScheduleListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const schedules = await this.schedulesService.listSchedules(
      centerId,
      classId,
    );
    return {
      data: schedules,
      message: "Schedules retrieved successfully",
    };
  }

  async getSchedule(
    id: string,
    user: JwtPayload,
  ): Promise<ClassScheduleResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const schedule = await this.schedulesService.getSchedule(centerId, id);
    return {
      data: schedule,
      message: "Schedule retrieved successfully",
    };
  }

  async createSchedule(
    input: CreateClassScheduleInput,
    user: JwtPayload,
  ): Promise<ClassScheduleResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const schedule = await this.schedulesService.createSchedule(
      centerId,
      input,
    );
    console.log("Created Schedule:", schedule);
    return {
      data: schedule,
      message: "Schedule created successfully",
    };
  }

  async updateSchedule(
    id: string,
    input: UpdateClassScheduleInput,
    user: JwtPayload,
  ): Promise<ClassScheduleResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const schedule = await this.schedulesService.updateSchedule(
      centerId,
      id,
      input,
    );
    return {
      data: schedule,
      message: "Schedule updated successfully",
    };
  }

  async deleteSchedule(
    id: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.schedulesService.deleteSchedule(centerId, id);
    return {
      message: "Schedule deleted successfully",
    };
  }
}
