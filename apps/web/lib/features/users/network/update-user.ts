import { UpdateUserInput } from "@/lib/schema/types";
import client from "../../../core/client";

async function updateUser(input: UpdateUserInput, userId: string) {
  const result = await client.PUT("/api/user/", {
    body: {
      userId,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      username: input.username,
      role: input.role,
    },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { updateUser };
