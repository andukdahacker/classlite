import type {
  QuestionSectionResponse,
  QuestionSectionListResponse,
  QuestionResponse,
  CreateQuestionSectionInput,
  UpdateQuestionSectionInput,
  CreateQuestionInput,
  UpdateQuestionInput,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { SectionsService } from "./sections.service.js";
import { AppError } from "../../errors/app-error.js";

export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  async listSections(
    exerciseId: string,
    user: JwtPayload,
  ): Promise<QuestionSectionListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const sections = await this.sectionsService.listSections(
      centerId,
      exerciseId,
    );
    return {
      data: sections,
      message: "Sections retrieved successfully",
    };
  }

  async createSection(
    exerciseId: string,
    input: CreateQuestionSectionInput,
    user: JwtPayload,
  ): Promise<QuestionSectionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const section = await this.sectionsService.createSection(
      centerId,
      exerciseId,
      input,
    );
    return {
      data: section,
      message: "Section created successfully",
    };
  }

  async updateSection(
    exerciseId: string,
    sectionId: string,
    input: UpdateQuestionSectionInput,
    user: JwtPayload,
  ): Promise<QuestionSectionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const section = await this.sectionsService.updateSection(
      centerId,
      exerciseId,
      sectionId,
      input,
    );
    return {
      data: section,
      message: "Section updated successfully",
    };
  }

  async deleteSection(
    exerciseId: string,
    sectionId: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.sectionsService.deleteSection(centerId, exerciseId, sectionId);
    return {
      message: "Section deleted successfully",
    };
  }

  async createQuestion(
    exerciseId: string,
    sectionId: string,
    input: CreateQuestionInput,
    user: JwtPayload,
  ): Promise<QuestionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const question = await this.sectionsService.createQuestion(
      centerId,
      exerciseId,
      sectionId,
      input,
    );
    return {
      data: question,
      message: "Question created successfully",
    };
  }

  async updateQuestion(
    exerciseId: string,
    sectionId: string,
    questionId: string,
    input: UpdateQuestionInput,
    user: JwtPayload,
  ): Promise<QuestionResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const question = await this.sectionsService.updateQuestion(
      centerId,
      exerciseId,
      sectionId,
      questionId,
      input,
    );
    return {
      data: question,
      message: "Question updated successfully",
    };
  }

  async deleteQuestion(
    exerciseId: string,
    sectionId: string,
    questionId: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.sectionsService.deleteQuestion(
      centerId,
      exerciseId,
      sectionId,
      questionId,
    );
    return {
      message: "Question deleted successfully",
    };
  }
}
