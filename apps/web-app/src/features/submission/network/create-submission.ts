import client from "@/core/client";
import type { CreateSubmissionInput } from "@workspace/types";

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
