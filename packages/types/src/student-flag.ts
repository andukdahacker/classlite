import { z } from "zod";
import { createResponseSchema } from "./response.js";

export const StudentFlagStatusSchema = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "RESOLVED",
]);
export type StudentFlagStatus = z.infer<typeof StudentFlagStatusSchema>;

export const CreateStudentFlagRequestSchema = z.object({
  studentId: z.string(),
  note: z.string().min(10),
});
export type CreateStudentFlagRequest = z.infer<
  typeof CreateStudentFlagRequestSchema
>;

export const ResolveStudentFlagRequestSchema = z.object({
  resolvedNote: z.string().optional(),
});
export type ResolveStudentFlagRequest = z.infer<
  typeof ResolveStudentFlagRequestSchema
>;

export const StudentFlagRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  centerId: z.string(),
  createdById: z.string(),
  createdByName: z.string().nullable(),
  note: z.string(),
  status: StudentFlagStatusSchema,
  resolvedById: z.string().nullable(),
  resolvedByName: z.string().nullable(),
  resolvedNote: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
});
export type StudentFlagRecord = z.infer<typeof StudentFlagRecordSchema>;

export const StudentFlagListApiResponseSchema = createResponseSchema(
  z.array(StudentFlagRecordSchema),
);

export const CreateStudentFlagApiResponseSchema = createResponseSchema(
  z.object({
    flagId: z.string(),
    status: StudentFlagStatusSchema,
  }),
);

export const ResolveStudentFlagApiResponseSchema = createResponseSchema(
  z.object({
    flagId: z.string(),
    status: StudentFlagStatusSchema,
  }),
);
