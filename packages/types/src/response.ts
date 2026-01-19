import { z } from "zod";

export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return z.object({
    data: dataSchema.nullable(),
    message: z.string(),
  });
};

export const ErrorResponseSchema = z.object({
  message: z.string(),
  error: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
