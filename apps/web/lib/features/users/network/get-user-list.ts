import client from "@/lib/core/client";

async function getUserList() {
  const result = await client.GET("/api/user/list");

  if (result.error) {
    throw new Error(result.error.error);
  }

  return result.data.data;
}

export default getUserList;
