import {
  ClassSessionListResponse,
  ClassSessionResponse,
  CreateClassSessionInput,
  GenerateSessionsInput,
  GenerateSessionsResponse,
  UpdateClassSessionInput,
} from "@workspace/types";
import { format } from "date-fns";
import { JwtPayload } from "jsonwebtoken";
import { NotificationsService } from "../notifications/notifications.service.js";
import { SessionsService } from "./sessions.service.js";

export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listSessions(
    user: JwtPayload,
    startDate: string,
    endDate: string,
    classId?: string,
  ): Promise<ClassSessionListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const sessions = await this.sessionsService.listSessions(
      centerId,
      new Date(startDate),
      new Date(endDate),
      classId,
    );
    return {
      data: sessions,
      message: "Sessions retrieved successfully",
    };
  }

  async getSessionsForWeek(
    user: JwtPayload,
    weekStart: string,
    classId?: string,
  ): Promise<ClassSessionListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const sessions = await this.sessionsService.getSessionsForWeek(
      centerId,
      new Date(weekStart),
      classId,
    );
    return {
      data: sessions,
      message: "Sessions retrieved successfully",
    };
  }

  async getSession(
    id: string,
    user: JwtPayload,
  ): Promise<ClassSessionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const session = await this.sessionsService.getSession(centerId, id);
    return {
      data: session,
      message: "Session retrieved successfully",
    };
  }

  async createSession(
    input: CreateClassSessionInput,
    user: JwtPayload,
  ): Promise<ClassSessionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const session = await this.sessionsService.createSession(centerId, input);
    console.log("Created session:", session);
    return {
      data: session,
      message: "Session created successfully",
    };
  }

  async updateSession(
    id: string,
    input: UpdateClassSessionInput,
    user: JwtPayload,
  ): Promise<ClassSessionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const { session, previousStartTime, previousEndTime } =
      await this.sessionsService.updateSession(centerId, id, input);

    // Check if time changed - if so, notify students and teacher
    const timeChanged =
      (input.startTime !== undefined &&
        new Date(input.startTime).getTime() !== previousStartTime.getTime()) ||
      (input.endTime !== undefined &&
        new Date(input.endTime).getTime() !== previousEndTime.getTime());

    if (timeChanged) {
      // Get participants to notify
      const participants = await this.sessionsService.getClassParticipants(
        centerId,
        session.classId,
      );

      const userIdsToNotify: string[] = [
        ...participants.studentIds,
        ...(participants.teacherId ? [participants.teacherId] : []),
      ];

      if (userIdsToNotify.length > 0) {
        const className = session.class?.name ?? "Class";
        const courseName = session.class?.course?.name ?? "Course";
        const newTime = format(new Date(session.startTime), "MMM d, h:mm a");

        await this.notificationsService.createBulkNotifications(
          centerId,
          userIdsToNotify,
          "Session Rescheduled",
          `${courseName} - ${className} has been moved to ${newTime}`,
        );
      }
    }

    return {
      data: session,
      message: "Session updated successfully",
    };
  }

  async deleteSession(
    id: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.sessionsService.deleteSession(centerId, id);
    return {
      message: "Session deleted successfully",
    };
  }

  async generateSessions(
    input: GenerateSessionsInput,
    user: JwtPayload,
  ): Promise<GenerateSessionsResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const result = await this.sessionsService.generateSessions(centerId, input);
    return {
      data: result,
      message: `Generated ${result.generatedCount} sessions successfully`,
    };
  }
}
