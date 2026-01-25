import {
  CreateCourseInput,
  UpdateCourseInput,
  CourseResponse,
  CourseListResponse,
} from "@workspace/types";
import { CoursesService } from "./courses.service.js";
import { JwtPayload } from "jsonwebtoken";

export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  async listCourses(user: JwtPayload): Promise<CourseListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const courses = await this.coursesService.listCourses(centerId);
    return {
      data: courses,
      message: "Courses retrieved successfully",
    };
  }

  async getCourse(id: string, user: JwtPayload): Promise<CourseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const course = await this.coursesService.getCourse(centerId, id);
    return {
      data: course,
      message: "Course retrieved successfully",
    };
  }

  async createCourse(
    input: CreateCourseInput,
    user: JwtPayload,
  ): Promise<CourseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const course = await this.coursesService.createCourse(centerId, input);
    return {
      data: course,
      message: "Course created successfully",
    };
  }

  async updateCourse(
    id: string,
    input: UpdateCourseInput,
    user: JwtPayload,
  ): Promise<CourseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    const course = await this.coursesService.updateCourse(centerId, id, input);
    return {
      data: course,
      message: "Course updated successfully",
    };
  }

  async deleteCourse(
    id: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw new Error("Center ID missing from token");

    await this.coursesService.deleteCourse(centerId, id);
    return {
      message: "Course deleted successfully",
    };
  }
}
