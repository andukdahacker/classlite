import type { AIGenerationJob, GenerateQuestionsRequest, RegenerateQuestionsSectionRequest } from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors/app-error.js";
import { AIGenerationService } from "./ai-generation.service.js";

interface JobResponse {
  data: AIGenerationJob | null;
  message: string;
}

export class AIGenerationController {
  constructor(private readonly aiService: AIGenerationService) {}

  async requestGeneration(
    exerciseId: string,
    input: GenerateQuestionsRequest,
    user: JwtPayload,
  ): Promise<JobResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const job = await this.aiService.requestGeneration(
      centerId,
      exerciseId,
      input.questionTypes,
      input.difficulty,
    );
    return {
      data: job,
      message: "AI generation job created successfully",
    };
  }

  async getJobStatus(jobId: string, user: JwtPayload): Promise<JobResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const job = await this.aiService.getJobStatus(centerId, jobId);
    return {
      data: job,
      message: "Generation job status retrieved",
    };
  }

  async getLatestJob(exerciseId: string, user: JwtPayload): Promise<JobResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const job = await this.aiService.getLatestJob(centerId, exerciseId);
    return {
      data: job ?? null,
      message: job
        ? "Latest generation job retrieved"
        : "No generation jobs found",
    };
  }

  async regenerateSection(
    exerciseId: string,
    input: RegenerateQuestionsSectionRequest,
    user: JwtPayload,
  ): Promise<JobResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const job = await this.aiService.requestRegeneration(
      centerId,
      exerciseId,
      input.sectionId,
      input.difficulty,
    );
    return {
      data: job,
      message: "Section regeneration job created successfully",
    };
  }
}
