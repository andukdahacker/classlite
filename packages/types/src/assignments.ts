import { z } from "zod";
import { createResponseSchema } from "./response.js";

// --- Enums ---
export const AssignmentStatusSchema = z.enum(["OPEN", "CLOSED", "ARCHIVED"]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

// --- Core Assignment Schema ---
export const AssignmentStudentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  student: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }).optional(),
});

export const AssignmentSchema = z.object({
  id: z.string(),
  centerId: z.string(),
  exerciseId: z.string(),
  classId: z.string().nullable(),
  dueDate: z.string().nullable(), // ISO string
  timeLimit: z.number().nullable(),
  instructions: z.string().nullable(),
  status: AssignmentStatusSchema,
  createdById: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  exercise: z.object({
    id: z.string(),
    title: z.string(),
    skill: z.string(),
    status: z.string(),
  }),
  class: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
  studentAssignments: z.array(AssignmentStudentSchema).optional(),
  _count: z.object({
    studentAssignments: z.number(),
  }).optional(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

// --- Create ---
export const CreateAssignmentSchema = z.object({
  exerciseId: z.string().min(1),
  classIds: z.array(z.string()).optional(),   // For class-based assignment
  studentIds: z.array(z.string()).optional(),  // For individual student assignment
  dueDate: z.string().datetime().optional().nullable(),
  timeLimit: z.number().int().positive().optional().nullable(),
  instructions: z.string().max(2000).optional().nullable(),
});
// NOTE: Do NOT use .refine() here — it doesn't serialize into OpenAPI/Swagger via fastify-type-provider-zod.
// The "classIds or studentIds required" validation is enforced in the SERVICE layer (createAssignment method).
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

// --- Update ---
export const UpdateAssignmentSchema = z.object({
  dueDate: z.string().datetime().optional().nullable(),
  timeLimit: z.number().int().positive().optional().nullable(),
  instructions: z.string().max(2000).optional().nullable(),
});
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

// --- Reopen ---
export const ReopenAssignmentSchema = z.object({
  dueDate: z.string().datetime().optional().nullable(),
});
export type ReopenAssignmentInput = z.infer<typeof ReopenAssignmentSchema>;

// --- Response Schemas ---
export const AssignmentResponseSchema = createResponseSchema(AssignmentSchema);
export const AssignmentListResponseSchema = createResponseSchema(z.array(AssignmentSchema));
export const AssignmentCountSchema = z.object({
  exerciseId: z.string(),
  count: z.number(),
});

// --- Student Assignment (read-only view) ---
export const StudentAssignmentSchema = z.object({
  id: z.string(),
  exerciseId: z.string(),
  classId: z.string().nullable(),
  dueDate: z.string().nullable(),
  timeLimit: z.number().nullable(),
  instructions: z.string().nullable(),
  status: AssignmentStatusSchema,
  createdAt: z.string(),
  exercise: z.object({
    id: z.string(),
    title: z.string(),
    skill: z.string(),
    status: z.string(),
  }),
  class: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
  }),
});
export type StudentAssignment = z.infer<typeof StudentAssignmentSchema>;

export const StudentAssignmentResponseSchema = createResponseSchema(StudentAssignmentSchema);
export const StudentAssignmentListResponseSchema = createResponseSchema(
  z.array(StudentAssignmentSchema)
);

// --- Assignment Count per Exercise (for library view) ---
export const ExerciseAssignmentCountsSchema = createResponseSchema(
  z.array(AssignmentCountSchema)
);
