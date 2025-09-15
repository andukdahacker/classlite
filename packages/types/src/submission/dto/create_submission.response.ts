import { Static } from "@sinclair/typebox";
import { BaseResponseSchema } from "../../response.js";
import { SubmissionSchema } from "../schema/submission.schema.js";

export const CreateSubmissionResponseSchema =
  BaseResponseSchema(SubmissionSchema);

export type CreateSubmissionResponse = Static<
  typeof CreateSubmissionResponseSchema
>;
