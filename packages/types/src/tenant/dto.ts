import { z } from "zod";
import { createResponseSchema } from "../response.js";

export const CreateTenantSchema = z.object({
  name: z.string().min(1, "Center name is required"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and dashes",
    ),
  ownerEmail: z.email("Invalid owner email address"),
  ownerName: z.string().min(1, "Owner name is required"),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

export const TenantDataSchema = z.object({
  center: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  owner: z.object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    role: z.enum(["OWNER", "ADMIN", "TEACHER", "STUDENT"]),
  }),
});

export type TenantData = z.infer<typeof TenantDataSchema>;

export const TenantResponseSchema = createResponseSchema(TenantDataSchema);

export type TenantResponse = z.infer<typeof TenantResponseSchema>;
