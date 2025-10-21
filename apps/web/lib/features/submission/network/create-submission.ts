import { CreateSubmissionInput } from "@workspace/types";
import client from "../../../core/client";

async function createSubmission(input: CreateSubmissionInput) {
  const result = await client.POST("/api/submission/", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { createSubmission };
