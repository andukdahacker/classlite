import client from "@/lib/core/client";
import { GetStudentClassInput } from "@workspace/types";

async function getStudentClass(input: GetStudentClassInput) {
  const result = await client.GET("/api/class/{classId}/student", {
    params: {
      path: input,
    },
  });

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export { getStudentClass };
