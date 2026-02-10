import type { CreateMockTest, UpdateMockTest } from "@workspace/types";
import { AppError } from "../../errors/app-error.js";
import { MockTestsService } from "./mock-tests.service.js";

interface JwtPayload {
  uid: string;
  email: string;
  role: string;
  centerId: string | null;
}

export class MockTestsController {
  constructor(private readonly service: MockTestsService) {}

  async list(
    filters: { status?: string; testType?: string },
    user: JwtPayload,
  ) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTests = await this.service.listMockTests(centerId, filters);
    return {
      data: mockTests,
      message: "Mock tests retrieved successfully",
    };
  }

  async get(id: string, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTest = await this.service.getMockTest(centerId, id);
    return {
      data: mockTest,
      message: "Mock test retrieved successfully",
    };
  }

  async create(input: CreateMockTest, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTest = await this.service.createMockTest(
      centerId,
      input,
      user.uid,
    );
    return {
      data: mockTest,
      message: "Mock test created successfully",
    };
  }

  async update(id: string, input: UpdateMockTest, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTest = await this.service.updateMockTest(centerId, id, input);
    return {
      data: mockTest,
      message: "Mock test updated successfully",
    };
  }

  async delete(id: string, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.service.deleteMockTest(centerId, id);
    return {
      data: null,
      message: "Mock test deleted successfully",
    };
  }

  async publish(id: string, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTest = await this.service.publishMockTest(centerId, id);
    return {
      data: mockTest,
      message: "Mock test published successfully",
    };
  }

  async archive(id: string, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const mockTest = await this.service.archiveMockTest(centerId, id);
    return {
      data: mockTest,
      message: "Mock test archived successfully",
    };
  }

  async updateSection(
    mockTestId: string,
    sectionId: string,
    input: { timeLimit?: number | null },
    user: JwtPayload,
  ) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const section = await this.service.updateSection(
      centerId,
      mockTestId,
      sectionId,
      input,
    );
    return {
      data: section,
      message: "Section updated successfully",
    };
  }

  async addExercise(
    mockTestId: string,
    sectionId: string,
    exerciseId: string,
    user: JwtPayload,
  ) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const result = await this.service.addExerciseToSection(
      centerId,
      mockTestId,
      sectionId,
      exerciseId,
    );
    return {
      data: result,
      message: "Exercise added to section successfully",
    };
  }

  async removeExercise(
    mockTestId: string,
    sectionId: string,
    exerciseId: string,
    user: JwtPayload,
  ) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.service.removeExerciseFromSection(
      centerId,
      mockTestId,
      sectionId,
      exerciseId,
    );
    return {
      data: null,
      message: "Exercise removed from section successfully",
    };
  }

  async reorderExercises(
    mockTestId: string,
    sectionId: string,
    exerciseIds: string[],
    user: JwtPayload,
  ) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.service.reorderSectionExercises(
      centerId,
      mockTestId,
      sectionId,
      exerciseIds,
    );
    return {
      data: null,
      message: "Exercises reordered successfully",
    };
  }

  async scorePreview(id: string, user: JwtPayload) {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const preview = await this.service.getScorePreview(centerId, id);
    return {
      data: preview,
      message: "Score preview retrieved successfully",
    };
  }
}
