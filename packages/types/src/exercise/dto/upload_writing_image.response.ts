import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { ExerciseSchema } from "../schema/exercise.schema.js";

export const UploadWritingImageResponseSchema =
  BaseResponseSchema(ExerciseSchema);

export type UploadWritingImageResponse = Static<
  typeof UploadWritingImageResponseSchema
>;
