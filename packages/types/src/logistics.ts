import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Course ---

export const CourseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Course name is required"),
  description: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code")
    .nullable()
    .optional(),
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code")
    .nullable()
    .optional(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial();

export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

export const CourseResponseSchema = createResponseSchema(CourseSchema);
export type CourseResponse = z.infer<typeof CourseResponseSchema>;

export const CourseListResponseSchema = createResponseSchema(
  z.array(CourseSchema),
);
export type CourseListResponse = z.infer<typeof CourseListResponseSchema>;

// --- Class ---

export const ClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Class name is required"),
  courseId: z.string(),
  teacherId: z.string().nullable().optional(),
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  // Joined fields
  course: CourseSchema.optional(),
  teacher: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }).nullable().optional(),
  _count: z.object({
    students: z.number(),
  }).optional(),
  studentCount: z.number().optional(),
});

export type Class = z.infer<typeof ClassSchema>;

export const CreateClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  courseId: z.string(),
  teacherId: z.string().nullable().optional(),
});

export type CreateClassInput = z.infer<typeof CreateClassSchema>;

export const UpdateClassSchema = CreateClassSchema.partial();

export type UpdateClassInput = z.infer<typeof UpdateClassSchema>;

export const ClassResponseSchema = createResponseSchema(ClassSchema);
export type ClassResponse = z.infer<typeof ClassResponseSchema>;

export const ClassListResponseSchema = createResponseSchema(
  z.array(ClassSchema),
);
export type ClassListResponse = z.infer<typeof ClassListResponseSchema>;

// --- Roster ---

export const ClassStudentSchema = z.object({
  classId: z.string(),
  studentId: z.string(),
  centerId: z.string(),
  student: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
    })
    .optional(),
});

export type ClassStudent = z.infer<typeof ClassStudentSchema>;

export const AddStudentToClassSchema = z.object({
  studentId: z.string(),
});

export type AddStudentToClassInput = z.infer<typeof AddStudentToClassSchema>;

export const RosterResponseSchema = createResponseSchema(
  z.array(ClassStudentSchema),
);
export type RosterResponse = z.infer<typeof RosterResponseSchema>;

// --- ClassSchedule (Recurring) ---

export const SessionStatusEnum = z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]);
export type SessionStatus = z.infer<typeof SessionStatusEnum>;

export const ClassScheduleSchema = z.object({
  id: z.string(),
  classId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  roomName: z.string().nullable().optional(),
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type ClassSchedule = z.infer<typeof ClassScheduleSchema>;

export const CreateClassScheduleSchema = z.object({
  classId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  roomName: z.string().nullable().optional(),
});

export type CreateClassScheduleInput = z.infer<typeof CreateClassScheduleSchema>;

export const UpdateClassScheduleSchema = CreateClassScheduleSchema.partial().omit({ classId: true });

export type UpdateClassScheduleInput = z.infer<typeof UpdateClassScheduleSchema>;

export const ClassScheduleResponseSchema = createResponseSchema(ClassScheduleSchema);
export type ClassScheduleResponse = z.infer<typeof ClassScheduleResponseSchema>;

export const ClassScheduleListResponseSchema = createResponseSchema(z.array(ClassScheduleSchema));
export type ClassScheduleListResponse = z.infer<typeof ClassScheduleListResponseSchema>;

// --- ClassSession (Specific Occurrence) ---

export const ClassSessionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  scheduleId: z.string().nullable().optional(),
  startTime: z.union([z.date(), z.string()]),
  endTime: z.union([z.date(), z.string()]),
  roomName: z.string().nullable().optional(),
  status: SessionStatusEnum,
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  // Joined fields for calendar display
  class: ClassSchema.optional(),
});

export type ClassSession = z.infer<typeof ClassSessionSchema>;

export const CreateClassSessionSchema = z.object({
  classId: z.string(),
  scheduleId: z.string().nullable().optional(),
  startTime: z.union([z.date(), z.string()]),
  endTime: z.union([z.date(), z.string()]),
  roomName: z.string().nullable().optional(),
  status: SessionStatusEnum.optional(),
});

export type CreateClassSessionInput = z.infer<typeof CreateClassSessionSchema>;

export const UpdateClassSessionSchema = z.object({
  startTime: z.union([z.date(), z.string()]).optional(),
  endTime: z.union([z.date(), z.string()]).optional(),
  roomName: z.string().nullable().optional(),
  status: SessionStatusEnum.optional(),
});

export type UpdateClassSessionInput = z.infer<typeof UpdateClassSessionSchema>;

export const ClassSessionResponseSchema = createResponseSchema(ClassSessionSchema);
export type ClassSessionResponse = z.infer<typeof ClassSessionResponseSchema>;

export const ClassSessionListResponseSchema = createResponseSchema(z.array(ClassSessionSchema));
export type ClassSessionListResponse = z.infer<typeof ClassSessionListResponseSchema>;

// --- Session Generation ---

export const GenerateSessionsSchema = z.object({
  classId: z.string().optional(), // If provided, generate only for this class
  startDate: z.union([z.date(), z.string()]),
  endDate: z.union([z.date(), z.string()]),
});

export type GenerateSessionsInput = z.infer<typeof GenerateSessionsSchema>;

export const GenerateSessionsResponseSchema = createResponseSchema(
  z.object({
    generatedCount: z.number(),
    sessions: z.array(ClassSessionSchema),
  }),
);
export type GenerateSessionsResponse = z.infer<typeof GenerateSessionsResponseSchema>;

// --- Notification ---

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  centerId: z.string(),
  title: z.string(),
  message: z.string(),
  read: z.boolean(),
  createdAt: z.union([z.date(), z.string()]),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListResponseSchema = createResponseSchema(z.array(NotificationSchema));
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

export const MarkNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()),
});

export type MarkNotificationReadInput = z.infer<typeof MarkNotificationReadSchema>;

export const UnreadCountResponseSchema = createResponseSchema(
  z.object({
    count: z.number(),
  }),
);
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
