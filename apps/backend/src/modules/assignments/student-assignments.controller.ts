import { AssignmentsService } from "./assignments.service.js";

/** Serialize all Date fields in an object to ISO strings so the response matches Zod string schemas. */
function serializeDates<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Date) {
      (result as Record<string, unknown>)[key] = (result[key] as Date).toISOString();
    }
  }
  return result;
}

export class StudentAssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  async list(user: { uid: string; centerId: string }, filters?: { skill?: string; status?: "OPEN" | "CLOSED" }) {
    const assignments = await this.service.listStudentAssignments(
      user.centerId,
      user.uid,
      filters,
    );
    return { data: assignments.map((a) => serializeDates(a as Record<string, unknown>)), message: "Student assignments retrieved" };
  }

  async get(id: string, user: { uid: string; centerId: string }) {
    const assignment = await this.service.getStudentAssignment(
      user.centerId,
      id,
      user.uid,
    );
    return { data: serializeDates(assignment as Record<string, unknown>), message: "Assignment retrieved" };
  }
}
