import { z } from "zod";

export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    data: dataSchema.nullable(),
    message: z.string(),
  });
};

export type ApiResponse<T> = {
  data: T | null;
  message: string;
};
