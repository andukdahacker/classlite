import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Enums ---

export const InterventionStatusSchema = z.enum([
  "PENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
]);
export type InterventionStatus = z.infer<typeof InterventionStatusSchema>;

export const InterventionTemplateSchema = z.enum([
  "concern-attendance",
  "concern-assignments",
  "concern-general",
]);
export type InterventionTemplate = z.infer<typeof InterventionTemplateSchema>;

// --- Request Schemas ---

export const SendInterventionEmailRequestSchema = z.object({
  studentId: z.string(),
  recipientEmail: z.email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateUsed: InterventionTemplateSchema,
});
export type SendInterventionEmailRequest = z.infer<
  typeof SendInterventionEmailRequestSchema
>;

// --- Response Schemas ---

export const InterventionLogRecordSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  centerId: z.string(),
  createdById: z.string(),
  recipientEmail: z.string(),
  subject: z.string(),
  body: z.string(),
  templateUsed: z.string(),
  status: InterventionStatusSchema,
  error: z.string().nullable(),
  sentAt: z.string(),
});
export type InterventionLogRecord = z.infer<typeof InterventionLogRecordSchema>;

export const InterventionHistoryResponseSchema = z.array(
  InterventionLogRecordSchema,
);
export type InterventionHistoryResponse = z.infer<
  typeof InterventionHistoryResponseSchema
>;

export const InterventionEmailPreviewSchema = z.object({
  recipientEmail: z.string().nullable(),
  subject: z.string(),
  body: z.string(),
  templateUsed: InterventionTemplateSchema,
});
export type InterventionEmailPreview = z.infer<
  typeof InterventionEmailPreviewSchema
>;

// --- API Response Wrappers ---

export const SendInterventionApiResponseSchema = createResponseSchema(
  z.object({
    interventionId: z.string(),
    status: z.literal("pending"),
  }),
);

export const InterventionHistoryApiResponseSchema = createResponseSchema(
  InterventionHistoryResponseSchema,
);

export const InterventionEmailPreviewApiResponseSchema = createResponseSchema(
  InterventionEmailPreviewSchema,
);
