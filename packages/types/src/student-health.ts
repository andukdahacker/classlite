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
  hasOpenFlags: z.boolean().optional(),
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

// --- Student Profile (Story 6.2) ---

export const StudentAttendanceRecordSchema = z.object({
  sessionId: z.string(),
  className: z.string(),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});
export type StudentAttendanceRecord = z.infer<
  typeof StudentAttendanceRecordSchema
>;

export const StudentAssignmentRecordSchema = z.object({
  assignmentId: z.string(),
  exerciseTitle: z.string(),
  className: z.string(),
  skill: z.string().nullable(),
  dueDate: z.string(),
  submissionStatus: z.enum([
    "not-submitted",
    "in-progress",
    "submitted",
    "graded",
  ]),
  score: z.number().nullable(),
  submittedAt: z.string().nullable(),
});
export type StudentAssignmentRecord = z.infer<
  typeof StudentAssignmentRecordSchema
>;

export const WeeklyTrendPointSchema = z.object({
  weekStart: z.string(),
  weekLabel: z.string(),
  attendanceRate: z.number(),
  completionRate: z.number(),
});
export type WeeklyTrendPoint = z.infer<typeof WeeklyTrendPointSchema>;

export const StudentProfileResponseSchema = z.object({
  student: z.object({
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
  }),
  attendanceHistory: z.array(StudentAttendanceRecordSchema),
  assignmentHistory: z.array(StudentAssignmentRecordSchema),
  weeklyTrends: z.array(WeeklyTrendPointSchema),
});
export type StudentProfileResponse = z.infer<
  typeof StudentProfileResponseSchema
>;

export const StudentProfileApiResponseSchema = createResponseSchema(
  StudentProfileResponseSchema,
);

// --- Teacher At-Risk Widget (Story 6.4) ---

export const ClassBreakdownSchema = z.object({
  classId: z.string(),
  className: z.string(),
  atRiskCount: z.number(),
  warningCount: z.number(),
});
export type ClassBreakdown = z.infer<typeof ClassBreakdownSchema>;

export const TeacherAtRiskWidgetResponseSchema = z.object({
  students: z.array(StudentHealthCardSchema),
  summary: HealthSummarySchema,
  classBreakdown: z.array(ClassBreakdownSchema),
});
export type TeacherAtRiskWidgetResponse = z.infer<
  typeof TeacherAtRiskWidgetResponseSchema
>;

export const TeacherAtRiskWidgetApiResponseSchema = createResponseSchema(
  TeacherAtRiskWidgetResponseSchema,
);
