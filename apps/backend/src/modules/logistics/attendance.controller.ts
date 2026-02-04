import { AttendanceService } from "./attendance.service.js";
import {
  CreateAttendanceInput,
  BulkAttendanceInput,
  SessionAttendanceDataResponse,
  AttendanceResponse,
  BulkAttendanceResponse,
  AttendanceStatsResponse,
  AttendanceHistoryResponse,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  async getSessionAttendance(
    sessionId: string,
    user: JwtPayload,
  ): Promise<SessionAttendanceDataResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const result = await this.attendanceService.getSessionAttendance(centerId, sessionId);
    return { data: result, message: "Session attendance retrieved successfully" };
  }

  async markAttendance(
    sessionId: string,
    input: CreateAttendanceInput,
    user: JwtPayload,
  ): Promise<AttendanceResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const attendance = await this.attendanceService.markAttendance(
      centerId,
      sessionId,
      input,
      user.uid,
    );
    return { data: attendance, message: "Attendance marked successfully" };
  }

  async markBulkAttendance(
    sessionId: string,
    input: BulkAttendanceInput,
    user: JwtPayload,
  ): Promise<BulkAttendanceResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const result = await this.attendanceService.markBulkAttendance(
      centerId,
      sessionId,
      input,
      user.uid,
    );
    return { data: result, message: "Bulk attendance marked successfully" };
  }

  async getStudentAttendanceStats(
    studentId: string,
    user: JwtPayload,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceStatsResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const stats = await this.attendanceService.getStudentAttendanceStats(
      centerId,
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return { data: stats, message: "Attendance stats retrieved successfully" };
  }

  async getStudentAttendanceHistory(
    studentId: string,
    user: JwtPayload,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceHistoryResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const history = await this.attendanceService.getStudentAttendanceHistory(
      centerId,
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return { data: history, message: "Attendance history retrieved successfully" };
  }

  async getClassAttendanceStats(
    classId: string,
    user: JwtPayload,
  ): Promise<{ data: { totalStudents: number; totalSessions: number; averageAttendancePercentage: number }; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const stats = await this.attendanceService.getClassAttendanceStats(centerId, classId);
    return { data: stats, message: "Class attendance stats retrieved successfully" };
  }
}
