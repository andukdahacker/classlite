import {
  CreateClassInput,
  UpdateClassInput,
  ClassResponse,
  ClassListResponse,
  AddStudentToClassInput,
  RosterResponse,
} from "@workspace/types";
import { ClassesService } from "./classes.service.js";
import { JwtPayload } from "jsonwebtoken";

export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  async listClasses(user: JwtPayload): Promise<ClassListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const classes = await this.classesService.listClasses(centerId);
    return {
      data: classes,
      message: "Classes retrieved successfully",
    };
  }

  async getClass(id: string, user: JwtPayload): Promise<ClassResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const cls = await this.classesService.getClass(centerId, id);
    return {
      data: cls,
      message: "Class retrieved successfully",
    };
  }

  async createClass(
    input: CreateClassInput,
    user: JwtPayload,
  ): Promise<ClassResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const cls = await this.classesService.createClass(centerId, input);
    return {
      data: cls,
      message: "Class created successfully",
    };
  }

  async updateClass(
    id: string,
    input: UpdateClassInput,
    user: JwtPayload,
  ): Promise<ClassResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const cls = await this.classesService.updateClass(centerId, id, input);
    return {
      data: cls,
      message: "Class updated successfully",
    };
  }

  async deleteClass(
    id: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.classesService.deleteClass(centerId, id);
    return {
      message: "Class deleted successfully",
    };
  }

  async addStudent(
    classId: string,
    input: AddStudentToClassInput,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.classesService.addStudent(centerId, classId, input.studentId);
    return {
      message: "Student added to class successfully",
    };
  }

  async removeStudent(
    classId: string,
    studentId: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.classesService.removeStudent(centerId, classId, studentId);
    return {
      message: "Student removed from class successfully",
    };
  }

  async listRoster(classId: string, user: JwtPayload): Promise<RosterResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const roster = await this.classesService.listRoster(centerId, classId);
    return {
      data: roster,
      message: "Roster retrieved successfully",
    };
  }

  async getAvailableStudents(
    user: JwtPayload,
    search?: string,
  ): Promise<{ data: any[] }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const students = await this.classesService.getCenterStudents(
      centerId,
      search,
    );
    return {
      data: students.map((s) => ({
        id: s.user.id,
        name: s.user.name,
        email: s.user.email,
      })),
    };
  }
}
