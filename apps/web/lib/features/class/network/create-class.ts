import client from "../../../core/client";
import { CreateClassFormInput } from "../components/add-class-button";

async function createClass(input: CreateClassFormInput) {
  const result = await client.POST("/api/class/", {
    body: {
      centerId: input.centerId,
      name: input.name,
      description: input.description,
      classMember: input.classMembers,
    },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export default createClass;
