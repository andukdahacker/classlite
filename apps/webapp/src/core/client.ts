import type { paths } from "@/schema/schema";
import createClient, { type Middleware } from "openapi-fetch";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    return request;
  },

  async onResponse({ response }) {
    const { status, statusText } = response;

    if (status == 401) {
      throw new UnauthorizedError(statusText);
    }

    return response;
  },
};

export class UnauthorizedError extends Error {}

export const client = createClient<paths>({
  baseUrl: import.meta.env.PROD
    ? "https://api.classlite.app"
    : "http://localhost:4000",
  credentials: "include",
});

client.use(authMiddleware);

export default client;