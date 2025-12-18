import { GetAssignmentsByUserInput } from "@workspace/types";
import client from "../../../core/client";

async function getAssignmentsByUser(input: GetAssignmentsByUserInput) {
  const result = await client.GET("/api/assignment/student", {
    params: {
      query: input,
    },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getAssignmentsByUser };
