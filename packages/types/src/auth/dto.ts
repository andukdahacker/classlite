import { z } from "zod";
import { createResponseSchema } from "../response.js";

export const UserRoleSchema = z.enum(["OWNER", "ADMIN", "TEACHER", "STUDENT"]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  role: UserRoleSchema,
  centerId: z.string().nullable(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const LoginRequestSchema = z.object({
  idToken: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseDataSchema = z.object({
  user: AuthUserSchema,
});

export type AuthResponseData = z.infer<typeof AuthResponseDataSchema>;

export const AuthResponseSchema = createResponseSchema(AuthResponseDataSchema);

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
