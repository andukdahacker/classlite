import type {
  AutosaveExerciseInput,
  CreateExerciseInput,
  ExerciseListResponse,
  ExerciseResponse,
  UpdateExerciseInput,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors/app-error.js";
import { ExercisesService } from "./exercises.service.js";

export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  async listExercises(
    user: JwtPayload,
    filters?: { skill?: string; status?: string },
  ): Promise<ExerciseListResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercises = await this.exercisesService.listExercises(
      centerId,
      filters,
    );
    return {
      data: exercises,
      message: "Exercises retrieved successfully",
    };
  }

  async getExercise(id: string, user: JwtPayload): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.getExercise(centerId, id);
    return {
      data: exercise,
      message: "Exercise retrieved successfully",
    };
  }

  async createExercise(
    input: CreateExerciseInput,
    user: JwtPayload,
  ): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.createExercise(
      centerId,
      input,
      user.uid,
    );
    return {
      data: exercise,
      message: "Exercise created successfully",
    };
  }

  async updateExercise(
    id: string,
    input: UpdateExerciseInput,
    user: JwtPayload,
  ): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.updateExercise(
      centerId,
      id,
      input,
    );
    return {
      data: exercise,
      message: "Exercise updated successfully",
    };
  }

  async autosaveExercise(
    id: string,
    input: AutosaveExerciseInput,
    user: JwtPayload,
  ): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.autosaveExercise(
      centerId,
      id,
      input,
    );
    return {
      data: exercise,
      message: "Exercise auto-saved successfully",
    };
  }

  async deleteExercise(
    id: string,
    user: JwtPayload,
  ): Promise<{ message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.exercisesService.deleteExercise(centerId, id);
    return {
      message: "Exercise deleted successfully",
    };
  }

  async publishExercise(
    id: string,
    user: JwtPayload,
  ): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.publishExercise(centerId, id);
    return {
      data: exercise,
      message: "Exercise published successfully",
    };
  }

  async archiveExercise(
    id: string,
    user: JwtPayload,
  ): Promise<ExerciseResponse> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const exercise = await this.exercisesService.archiveExercise(centerId, id);
    return {
      data: exercise,
      message: "Exercise archived successfully",
    };
  }
}
