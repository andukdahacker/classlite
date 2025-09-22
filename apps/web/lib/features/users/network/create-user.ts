import { CreateUserInput } from "@workspace/types";
import client from "../../../core/client";

async function createUser(input: CreateUserInput) {
  const result = await client.POST("/api/user/", {
    body: input,
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { createUser };
