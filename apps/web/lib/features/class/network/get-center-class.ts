import client from "../../../core/client";
import { GetCenterClassListInput } from "../../../schema/types";

async function getCenterClassList(input: GetCenterClassListInput) {
  const result = await client.GET("/api/class/list", {
    params: { query: input },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getCenterClassList };
