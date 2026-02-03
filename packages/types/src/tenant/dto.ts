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
    logoUrl: z.string().nullable().optional(),
    timezone: z.string(),
    brandColor: z.string(),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  }),
  owner: z.object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    role: z.enum(["OWNER", "ADMIN", "TEACHER", "STUDENT"]),
  }),
});

export type TenantData = z.infer<typeof TenantDataSchema>;

export const UpdateCenterSchema = z.object({
  name: z.string().min(1, "Center name is required").optional(),
  logoUrl: z.url("Invalid logo URL").nullable().optional(),
  timezone: z
    .string()
    .refine((val) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: val });
        return true;
      } catch {
        return false;
      }
    }, "Invalid IANA timezone")
    .optional(),
  brandColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code")
    .optional(),
});

export type UpdateCenterInput = z.infer<typeof UpdateCenterSchema>;

export const TenantResponseSchema = createResponseSchema(TenantDataSchema);

export type TenantResponse = z.infer<typeof TenantResponseSchema>;
