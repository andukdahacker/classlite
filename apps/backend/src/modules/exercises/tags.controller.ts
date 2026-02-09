import type {
  CreateExerciseTagInput,
  UpdateExerciseTagInput,
  MergeExerciseTagsInput,
  ExerciseTag,
} from "@workspace/types";
import { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../errors/app-error.js";
import { TagsService } from "./tags.service.js";

export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  async listTags(
    user: JwtPayload,
  ): Promise<{ data: ExerciseTag[]; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const tags = await this.tagsService.listTags(centerId);
    return { data: tags, message: "Tags retrieved successfully" };
  }

  async createTag(
    input: CreateExerciseTagInput,
    user: JwtPayload,
  ): Promise<{ data: ExerciseTag; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const tag = await this.tagsService.createTag(centerId, input);
    return { data: tag, message: "Tag created successfully" };
  }

  async updateTag(
    tagId: string,
    input: UpdateExerciseTagInput,
    user: JwtPayload,
  ): Promise<{ data: ExerciseTag; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const tag = await this.tagsService.updateTag(centerId, tagId, input);
    return { data: tag, message: "Tag updated successfully" };
  }

  async deleteTag(
    tagId: string,
    user: JwtPayload,
  ): Promise<{ data: null; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.tagsService.deleteTag(centerId, tagId);
    return { data: null, message: "Tag deleted successfully" };
  }

  async mergeTags(
    input: MergeExerciseTagsInput,
    user: JwtPayload,
  ): Promise<{ data: ExerciseTag; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const tag = await this.tagsService.mergeTags(centerId, input);
    return { data: tag, message: "Tags merged successfully" };
  }

  async setExerciseTags(
    exerciseId: string,
    tagIds: string[],
    user: JwtPayload,
  ): Promise<{ data: null; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    await this.tagsService.setExerciseTags(centerId, exerciseId, tagIds);
    return { data: null, message: "Exercise tags updated successfully" };
  }

  async getExerciseTags(
    exerciseId: string,
    user: JwtPayload,
  ): Promise<{ data: ExerciseTag[]; message: string }> {
    const centerId = user.centerId;
    if (!centerId) throw AppError.unauthorized("Center ID missing from token");

    const tags = await this.tagsService.getExerciseTags(centerId, exerciseId);
    return { data: tags, message: "Exercise tags retrieved successfully" };
  }
}
