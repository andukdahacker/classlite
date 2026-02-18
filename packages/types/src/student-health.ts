import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Enums ---

export const HealthStatusSchema = z.enum(["at-risk", "warning", "on-track"]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// --- Schemas ---

export const StudentHealthMetricsSchema = z.object({
  attendanceRate: z.number(),
  attendanceStatus: HealthStatusSchema,
  totalSessions: z.number(),
  attendedSessions: z.number(),
  assignmentCompletionRate: z.number(),
  assignmentStatus: HealthStatusSchema,
  totalAssignments: z.number(),
  completedAssignments: z.number(),
  overdueAssignments: z.number(),
});
export type StudentHealthMetrics = z.infer<typeof StudentHealthMetricsSchema>;

export const StudentHealthCardSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  healthStatus: HealthStatusSchema,
  metrics: StudentHealthMetricsSchema,
  classes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});
export type StudentHealthCard = z.infer<typeof StudentHealthCardSchema>;

export const HealthSummarySchema = z.object({
  total: z.number(),
  atRisk: z.number(),
  warning: z.number(),
  onTrack: z.number(),
});
export type HealthSummary = z.infer<typeof HealthSummarySchema>;

// --- Request/Response ---

export const StudentHealthDashboardQuerySchema = z.object({
  classId: z.string().optional(),
  search: z.string().optional(),
});
export type StudentHealthDashboardQuery = z.infer<
  typeof StudentHealthDashboardQuerySchema
>;

export const StudentHealthDashboardResponseSchema = z.object({
  students: z.array(StudentHealthCardSchema),
  summary: HealthSummarySchema,
});
export type StudentHealthDashboardResponse = z.infer<
  typeof StudentHealthDashboardResponseSchema
>;

export const StudentHealthDashboardApiResponseSchema = createResponseSchema(
  StudentHealthDashboardResponseSchema,
);
