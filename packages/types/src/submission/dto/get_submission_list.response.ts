import { Static } from "@sinclair/typebox";
import { PaginatedBaseReponseSchema } from "../../response.js";
import { SubmissionSchema } from "../schema/submission.schema.js";

export const GetSubmissionListResponseSchema =
  PaginatedBaseReponseSchema(SubmissionSchema);

export type GetSubmissionListResponse = Static<
  typeof GetSubmissionListResponseSchema
>;
