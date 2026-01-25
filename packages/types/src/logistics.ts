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
