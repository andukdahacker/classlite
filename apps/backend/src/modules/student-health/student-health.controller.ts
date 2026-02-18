import { StudentHealthService } from "./student-health.service.js";

export class StudentHealthController {
  constructor(private readonly service: StudentHealthService) {}

  async getDashboard(
    centerId: string,
    filters: { classId?: string; search?: string },
    teacherUserId?: string,
  ) {
    const result = await this.service.getDashboard(
      centerId,
      filters,
      teacherUserId,
    );
    return {
      data: result,
      message: "Student health dashboard loaded",
    };
  }

  async getStudentProfile(
    centerId: string,
    studentId: string,
    teacherUserId?: string,
  ) {
    const result = await this.service.getStudentProfile(
      centerId,
      studentId,
      teacherUserId,
    );
    return {
      data: result,
      message: "Student profile loaded",
    };
  }

  async getTeacherAtRiskWidget(centerId: string, teacherUserId: string) {
    const result = await this.service.getTeacherAtRiskWidget(
      centerId,
      teacherUserId,
    );
    return {
      data: result,
      message: "ok",
    };
  }

  async createFlag(
    centerId: string,
    studentId: string,
    createdById: string,
    note: string,
    teacherUserId?: string,
  ) {
    const result = await this.service.createFlag(
      centerId,
      studentId,
      createdById,
      note,
      teacherUserId,
    );
    return {
      data: result,
      message: "Student flagged for admin review",
    };
  }

  async getStudentFlags(centerId: string, studentId: string) {
    const result = await this.service.getStudentFlags(centerId, studentId);
    return {
      data: result,
      message: "ok",
    };
  }

  async resolveFlag(
    centerId: string,
    flagId: string,
    resolvedById: string,
    resolvedNote?: string,
  ) {
    const result = await this.service.resolveFlag(
      centerId,
      flagId,
      resolvedById,
      resolvedNote,
    );
    return {
      data: result,
      message: "Flag resolved",
    };
  }

  async sendIntervention(
    centerId: string,
    createdById: string,
    payload: {
      studentId: string;
      recipientEmail: string;
      subject: string;
      body: string;
      templateUsed: string;
    },
  ) {
    const result = await this.service.sendIntervention(
      centerId,
      createdById,
      payload,
    );
    return {
      data: result,
      message: "Intervention email queued",
    };
  }

  async getInterventionHistory(centerId: string, studentId: string) {
    const result = await this.service.getInterventionHistory(
      centerId,
      studentId,
    );
    return {
      data: result,
      message: "ok",
    };
  }

  async getEmailPreview(centerId: string, studentId: string) {
    const result = await this.service.getEmailPreview(centerId, studentId);
    return {
      data: result,
      message: "ok",
    };
  }
}
