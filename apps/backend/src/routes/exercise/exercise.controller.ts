import { JsonObject } from "@prisma/client/runtime/library.js";
import {
  CreateExerciseInput,
  CreateExerciseResponse,
  DeleteExerciseInput,
  DeleteListeningFileInput,
  DeleteWritingImageInput,
  GetExerciseInput,
  GetExerciseListInput,
  GetExerciseListResponse,
  GetExerciseResponse,
  NoDataResponse,
  UpdateExerciseInput,
  UpdateExerciseResponse,
  UploadListeningFileInput,
  UploadListeningFileResponse,
  UploadWritingImageInput,
  UploadWritingImageResponse,
} from "@workspace/types";
import { Prisma } from "../../generated/prisma/client/client.js";
import S3Service from "../../services/s3_service.js";
import ExerciseService from "./exercise.service.js";

class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly s3Service: S3Service,
  ) {}

  async createExercise(
    input: CreateExerciseInput,
    centerId: string,
  ): Promise<CreateExerciseResponse> {
    const exercise = await this.exerciseService.createExercise(input, centerId);

    return {
      data: {
        exercise,
      },
      message: "Created exercise successfully",
    };
  }

  async updateExercise(
    input: UpdateExerciseInput,
    centerId: string,
  ): Promise<UpdateExerciseResponse> {
    const exercise = await this.exerciseService.getExercise(input);

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    if (exercise?.centerId != centerId) {
      throw new Error("Unauthorized");
    }

    const updatedExercise = await this.exerciseService.updateExercise(input);

    return {
      data: updatedExercise,
      message: "Updated exercise successfully",
    };
  }

  async deleteExercise(
    input: DeleteExerciseInput,
    centerId: string,
    bucketName: string,
  ): Promise<NoDataResponse> {
    const exercise = await this.exerciseService.getExercise(input);

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    if (exercise?.centerId != centerId) {
      throw new Error("Unauthorized");
    }

    const content = exercise.content as JsonObject;

    if (content["file"]) {
      const file = content["file"] as JsonObject;
      const key = file["key"];
      if (key) {
        await this.s3Service.deleteFile({ key: key as string, bucketName });
      }
    }

    await this.exerciseService.deleteExercise(input);

    return {
      message: "Deleted exercise successfully",
    };
  }

  async getExercise(
    input: GetExerciseInput,
    centerId: string,
  ): Promise<GetExerciseResponse> {
    const exercise = await this.exerciseService.getExercise(input);

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    if (exercise?.centerId != centerId) {
      throw new Error("Unauthorized");
    }

    return {
      data: {
        exercise,
      },
      message: "Get exercise successfully",
    };
  }

  async getExerciseList(
    input: GetExerciseListInput,
    centerId: string,
  ): Promise<GetExerciseListResponse> {
    const exercises = await this.exerciseService.getExerciseList(
      input,
      centerId,
    );

    if (exercises.length < input.take) {
      return {
        data: {
          nodes: exercises,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get exercise list successfully",
      };
    }

    const cursor = exercises[exercises.length - 1]!.id;

    const nextCall = await this.exerciseService.getExerciseList(
      {
        ...input,
        cursor,
      },
      centerId,
    );

    if (nextCall.length == 0) {
      return {
        data: {
          nodes: exercises,
          pageInfo: {
            hasNextPage: false,
          },
        },
        message: "Get exercise list successfully",
      };
    }

    return {
      data: {
        nodes: exercises,
        pageInfo: {
          hasNextPage: true,
          cursor,
        },
      },
      message: "Get exercise list successfully",
    };
  }

  async uploadListeningFile(
    file: any,
    data: UploadListeningFileInput,
    bucketName: string,
  ): Promise<UploadListeningFileResponse> {
    const result = await this.s3Service.uploadFile({
      bucketName,
      body: Buffer.from(file),
      fileName: data.fileName,
    });

    const exercise = await this.exerciseService.getExercise({ id: data.id });

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    const content = exercise.content as Prisma.JsonObject;

    const newContent = {
      ...content,
      file: {
        url: result.url,
        key: result.key,
        fileName: result.fileName,
      },
    };

    const updated = await this.exerciseService.updateExercise({
      id: data.id,
      content: newContent,
    });

    return {
      data: updated,
      message: "Uploaded and attached file to exercise",
    };
  }

  async removeListeningFile(
    input: DeleteListeningFileInput,
    bucketName: string,
  ): Promise<NoDataResponse> {
    const key = input.key.split("/").pop();

    if (!key) {
      throw new Error("Cannot get key");
    }

    await this.s3Service.deleteFile({ key, bucketName });

    const exercise = await this.exerciseService.getExercise({ id: input.id });

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    const content = exercise.content as Prisma.JsonObject;

    content["file"] = null;

    await this.exerciseService.updateExercise({ id: input.id, content });

    return {
      message: "Removed listening file successfully",
    };
  }

  async removeWritingImage(
    input: DeleteWritingImageInput,
    bucketName: string,
  ): Promise<NoDataResponse> {
    const key = input.key.split("/").pop();

    if (!key) {
      throw new Error("Cannot get key");
    }

    await this.s3Service.deleteFile({ key, bucketName });

    const exercise = await this.exerciseService.getExercise({ id: input.id });

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    const content = exercise.content as Prisma.JsonObject;

    content["file"] = null;

    await this.exerciseService.updateExercise({ id: input.id, content });

    return {
      message: "Removed writing image successfully",
    };
  }

  async uploadWritingImage(
    input: UploadWritingImageInput,
    bucketName: string,
  ): Promise<UploadWritingImageResponse> {
    const exercise = await this.exerciseService.getExercise({ id: input.id });

    if (!exercise) {
      throw new Error("Cannot find exercise");
    }

    const result = await this.s3Service.uploadFile({
      bucketName,
      fileName: input.fileName,
      body: Buffer.from(input.file),
    });

    const content = exercise.content as Prisma.JsonObject;

    const newContent = {
      ...content,
      file: {
        url: result.url,
        key: result.key,
        fileName: result.fileName,
      },
    };

    const updated = await this.exerciseService.updateExercise({
      id: input.id,
      content: newContent,
    });

    return {
      data: updated,
      message: "Upload successfully",
    };
  }
}

export default ExerciseController;
