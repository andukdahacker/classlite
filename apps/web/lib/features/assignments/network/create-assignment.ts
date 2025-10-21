import { CreateAssignmentsInput } from "@workspace/types";
import client from "../../../core/client";

async function createAssignments(input: CreateAssignmentsInput) {
  const result = await client.POST("/api/assignment/", { body: input });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data;
}

export { createAssignments };
