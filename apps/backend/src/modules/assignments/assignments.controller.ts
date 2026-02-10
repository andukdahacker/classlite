import { JwtPayload } from "jsonwebtoken";
import { AssignmentsService } from "./assignments.service.js";

export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  async list(user: JwtPayload, filters?: { exerciseId?: string; classId?: string; status?: "OPEN" | "CLOSED" | "ARCHIVED"; skill?: string; dueDateStart?: string; dueDateEnd?: string }) {
    const assignments = await this.service.listAssignments(user.centerId, filters);
    return { data: assignments, message: "Assignments retrieved" };
  }

  async get(id: string, user: JwtPayload) {
    const assignment = await this.service.getAssignment(user.centerId, id);
    return { data: assignment, message: "Assignment retrieved" };
  }

  async create(input: { exerciseId: string; classIds?: string[]; studentIds?: string[]; dueDate?: string | null; timeLimit?: number | null; instructions?: string | null }, user: JwtPayload) {
    const assignments = await this.service.createAssignment(user.centerId, input, user.uid);
    return {
      data: assignments,
      message: `${assignments.length} assignment(s) created`,
    };
  }

  async update(id: string, input: { dueDate?: string | null; timeLimit?: number | null; instructions?: string | null }, user: JwtPayload) {
    const assignment = await this.service.updateAssignment(user.centerId, id, input);
    return { data: assignment, message: "Assignment updated" };
  }

  async close(id: string, user: JwtPayload) {
    const assignment = await this.service.closeAssignment(user.centerId, id);
    return { data: assignment, message: "Assignment closed" };
  }

  async reopen(id: string, input: { dueDate?: string | null }, user: JwtPayload) {
    const assignment = await this.service.reopenAssignment(user.centerId, id, input);
    return { data: assignment, message: "Assignment reopened" };
  }

  async delete(id: string, user: JwtPayload) {
    await this.service.deleteAssignment(user.centerId, id);
    return { data: null, message: "Assignment deleted" };
  }

  async archive(id: string, user: JwtPayload) {
    const assignment = await this.service.archiveAssignment(user.centerId, id);
    return { data: assignment, message: "Assignment archived" };
  }

  async getCountsByExercise(exerciseIds: string[], user: JwtPayload) {
    const counts = await this.service.getAssignmentCountsByExercise(user.centerId, exerciseIds);
    return { data: counts, message: "Assignment counts retrieved" };
  }
}
