import { AssignmentsService } from "./assignments.service.js";

export class StudentAssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  async list(user: { uid: string; centerId: string }, filters?: { skill?: string; status?: "OPEN" | "CLOSED" }) {
    const assignments = await this.service.listStudentAssignments(
      user.centerId,
      user.uid,
      filters,
    );
    return { data: assignments, message: "Student assignments retrieved" };
  }

  async get(id: string, user: { uid: string; centerId: string }) {
    const assignment = await this.service.getStudentAssignment(
      user.centerId,
      id,
      user.uid,
    );
    return { data: assignment, message: "Assignment retrieved" };
  }
}
