import { z } from "zod";

export const nullable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable();
