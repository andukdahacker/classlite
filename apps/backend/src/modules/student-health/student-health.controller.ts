import { StudentHealthService } from "./student-health.service.js";

export class StudentHealthController {
  constructor(private readonly service: StudentHealthService) {}

  async getDashboard(
    centerId: string,
    filters: { classId?: string; search?: string },
  ) {
    const result = await this.service.getDashboard(centerId, filters);
    return {
      data: result,
      message: "Student health dashboard loaded",
    };
  }
}
