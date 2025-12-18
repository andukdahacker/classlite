import type { paths } from "@/schema/schema";
import createClient, { type Middleware } from "openapi-fetch";

function getCookie(cname: string) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    if (!c) continue;
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

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
  baseUrl: "https://api.classlite.app",
  credentials: "include",
});

client.use(authMiddleware);

export default client;
