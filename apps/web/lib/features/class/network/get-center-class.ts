import { GetClassListInput } from "@workspace/types";
import client from "../../../core/client";

async function getCenterClassList(input: GetClassListInput) {
  const result = await client.GET("/api/class/list", {
    params: { query: input },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getCenterClassList };
