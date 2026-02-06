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
  defaultRoomName: z.string().nullable().optional(),
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
  defaultRoomName: z.string().nullable().optional(),
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

// --- Room ---

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Room name is required"),
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type Room = z.infer<typeof RoomSchema>;

export const CreateRoomInputSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
});

export type CreateRoomInput = z.infer<typeof CreateRoomInputSchema>;

export const UpdateRoomInputSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
});

export type UpdateRoomInput = z.infer<typeof UpdateRoomInputSchema>;

export const RoomResponseSchema = createResponseSchema(RoomSchema);
export type RoomResponse = z.infer<typeof RoomResponseSchema>;

export const RoomListResponseSchema = createResponseSchema(z.array(RoomSchema));
export type RoomListResponse = z.infer<typeof RoomListResponseSchema>;

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

export const RecurrenceEnum = z.enum(["none", "weekly", "biweekly"]);
export type Recurrence = z.infer<typeof RecurrenceEnum>;

export const CreateClassSessionSchema = z.object({
  classId: z.string(),
  scheduleId: z.string().nullable().optional(),
  startTime: z.union([z.date(), z.string()]),
  endTime: z.union([z.date(), z.string()]),
  roomName: z.string().nullable().optional(),
  status: SessionStatusEnum.optional(),
  recurrence: RecurrenceEnum.optional(),
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

// --- Delete Future Sessions ---

export const DeleteFutureSessionsResponseSchema = createResponseSchema(
  z.object({
    deletedCount: z.number(),
  }),
);
export type DeleteFutureSessionsResponse = z.infer<typeof DeleteFutureSessionsResponseSchema>;

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

// --- Conflict Detection ---

export const ConflictCheckInputSchema = z.object({
  classId: z.string(),
  startTime: z.union([z.date(), z.string()]),
  endTime: z.union([z.date(), z.string()]),
  roomName: z.string().nullable().optional(),
  excludeSessionId: z.string().optional(),
});

export type ConflictCheckInput = z.infer<typeof ConflictCheckInputSchema>;

export const ConflictingSessionSchema = z.object({
  id: z.string(),
  classId: z.string(),
  startTime: z.union([z.date(), z.string()]),
  endTime: z.union([z.date(), z.string()]),
  roomName: z.string().nullable().optional(),
  className: z.string().optional(),
  courseName: z.string().optional(),
  teacherName: z.string().nullable().optional(),
});

export type ConflictingSession = z.infer<typeof ConflictingSessionSchema>;

export const SuggestionSchema = z.object({
  type: z.enum(["time", "room"]),
  value: z.string(),
  startTime: z.union([z.date(), z.string()]).optional(),
  endTime: z.union([z.date(), z.string()]).optional(),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

export const ConflictResultSchema = z.object({
  hasConflicts: z.boolean(),
  roomConflicts: z.array(ConflictingSessionSchema),
  teacherConflicts: z.array(ConflictingSessionSchema),
  suggestions: z.array(SuggestionSchema).optional(),
});

export type ConflictResult = z.infer<typeof ConflictResultSchema>;

export const ConflictResultResponseSchema = createResponseSchema(ConflictResultSchema);
export type ConflictResultResponse = z.infer<typeof ConflictResultResponseSchema>;

// Extended ClassSession with conflict flag for calendar display
export const ClassSessionWithConflictsSchema = ClassSessionSchema.extend({
  hasConflicts: z.boolean().optional(),
});

export type ClassSessionWithConflicts = z.infer<typeof ClassSessionWithConflictsSchema>;

// --- Attendance ---

export const AttendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusSchema>;

export const AttendanceSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  status: AttendanceStatusSchema,
  markedBy: z.string(),
  centerId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type Attendance = z.infer<typeof AttendanceSchema>;

export const CreateAttendanceInputSchema = z.object({
  studentId: z.string(),
  status: AttendanceStatusSchema,
});

export type CreateAttendanceInput = z.infer<typeof CreateAttendanceInputSchema>;

export const BulkAttendanceInputSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT"]), // Only PRESENT/ABSENT for bulk
});

export type BulkAttendanceInput = z.infer<typeof BulkAttendanceInputSchema>;

export const StudentWithAttendanceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable().optional(),
  attendance: z.object({
    status: AttendanceStatusSchema,
    markedAt: z.union([z.date(), z.string()]),
  }).nullable(),
});

export type StudentWithAttendance = z.infer<typeof StudentWithAttendanceSchema>;

export const SessionAttendanceResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    startTime: z.union([z.date(), z.string()]),
    endTime: z.union([z.date(), z.string()]),
    status: SessionStatusEnum,
    class: z.object({
      name: z.string(),
      course: z.object({
        name: z.string(),
        color: z.string().nullable().optional(),
      }),
    }),
  }),
  students: z.array(StudentWithAttendanceSchema),
});

export type SessionAttendanceResponse = z.infer<typeof SessionAttendanceResponseSchema>;

export const SessionAttendanceDataResponseSchema = createResponseSchema(SessionAttendanceResponseSchema);
export type SessionAttendanceDataResponse = z.infer<typeof SessionAttendanceDataResponseSchema>;

export const AttendanceResponseSchema = createResponseSchema(AttendanceSchema);
export type AttendanceResponse = z.infer<typeof AttendanceResponseSchema>;

export const BulkAttendanceResponseSchema = createResponseSchema(
  z.object({
    count: z.number(),
    markedStudents: z.array(z.string()),
  }),
);
export type BulkAttendanceResponse = z.infer<typeof BulkAttendanceResponseSchema>;

export const AttendanceStatsResponseSchema = createResponseSchema(
  z.object({
    attendancePercentage: z.number(),
    presentCount: z.number(),
    absentCount: z.number(),
    lateCount: z.number(),
    excusedCount: z.number(),
    totalSessions: z.number(),
  }),
);
export type AttendanceStatsResponse = z.infer<typeof AttendanceStatsResponseSchema>;

export const AttendanceWithSessionSchema = AttendanceSchema.extend({
  session: z.object({
    id: z.string(),
    startTime: z.union([z.date(), z.string()]),
    class: z.object({
      name: z.string(),
      course: z.object({ name: z.string() }),
    }),
  }),
});

export type AttendanceWithSession = z.infer<typeof AttendanceWithSessionSchema>;

export const AttendanceHistoryResponseSchema = createResponseSchema(
  z.array(AttendanceWithSessionSchema),
);
export type AttendanceHistoryResponse = z.infer<typeof AttendanceHistoryResponseSchema>;
