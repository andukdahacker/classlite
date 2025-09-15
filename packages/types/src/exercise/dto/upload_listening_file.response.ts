import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const UploadListeningFileResponseSchema =
  BaseResponseSchema(ExerciseSchema);

export type UploadListeningFileResponse = Static<
  typeof UploadListeningFileResponseSchema
>;
