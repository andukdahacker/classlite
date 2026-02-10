# Story 3.15: Exercise Assignment Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want to manage exercise assignments separately from exercise creation,
so that I can assign the same exercise to multiple classes with different due dates.

## Acceptance Criteria

1. **AC1: Assignment List** — `/:centerId/assignments` shows all assignments with columns: Exercise Title, Skill, Class, Due Date, Time Limit, Submissions (X/Y), Status (Open/Closed/Archived). Paginated, searchable by exercise title, filterable by class, skill, status, due date range.
2. **AC2: Create Assignment** — "Assign Exercise" opens dialog: Select Exercise (only PUBLISHED) → Select Class(es) or Individual Students → Set Due Date/Time → Set Time Limit (or use exercise default) → Optional Instructions.
3. **AC3: Multi-Class Assignment** — Single exercise can be assigned to multiple classes simultaneously, creating separate assignment records per class.
4. **AC4: Edit Assignment** — Due date can be extended. Time limit can be adjusted before first submission. Instructions can be updated at any time.
5. **AC5: Close Assignment** — "Close" action prevents new submissions. Sets status to CLOSED.
6. **AC6: Delete Assignment** — Assignments with submissions can only be archived, not deleted. (Submission check deferred until Epic 4 — currently all assignments are deletable.)
7. **AC7: Student Notification** — Creating an assignment triggers in-app notification to all assigned students via existing `NotificationsService.createBulkNotifications()`.
8. **AC8: Reopen Assignment** — Archived/Closed assignments can be reopened with a new due date, setting status back to OPEN.

## Scope Clarification

**What IS built in this story:**
- Prisma: `Assignment` model, `AssignmentStudent` junction model, `AssignmentStatus` enum
- Backend: Full CRUD + close/reopen/archive for assignments at `/api/v1/assignments/`
- Backend: Student roster snapshot at assignment creation (copies class students → AssignmentStudent)
- Backend: In-app notifications to students on assignment creation (via existing NotificationsService)
- Frontend: Assignments list page with filters, search, actions
- Frontend: Create Assignment dialog (exercise picker, class picker, date/time, instructions)
- Frontend: Edit, Close, Reopen, Archive, Delete actions
- Frontend: Route registration + navigation link
- Frontend: Wire up exercise library assignment count column (replace "—" stubs from Story 3.14)
- Types: Zod schemas for all assignment operations
- Tests: Service tests + page tests

**What is NOT built (out of scope):**
- Student assignment dashboard (Story 3.16)
- Student submissions (Epic 4)
- Submission-based delete protection (depends on Epic 4 submissions)
- Grading integration (Epic 5)
- Real "Submissions X/Y" data — stubbed as "0/N" (N = assigned student count, 0 submissions until Epic 4)
- Real "Avg Score" data in exercise library — stays stubbed until Epic 5
- Due date reminder notifications (future enhancement)
- Drag-and-drop reordering of assignments

## Tasks / Subtasks

### Task 1: Prisma Schema — New Models (AC: all)

- [x]1.1 Add `AssignmentStatus` enum to `packages/db/prisma/schema.prisma`:
  ```prisma
  enum AssignmentStatus {
    OPEN
    CLOSED
    ARCHIVED
  }
  ```

- [x]1.2 Add `Assignment` model:
  ```prisma
  model Assignment {
    id           String           @id @default(cuid())
    centerId     String           @map("center_id")
    exerciseId   String           @map("exercise_id")
    classId      String?          @map("class_id")
    dueDate      DateTime?        @map("due_date")
    timeLimit    Int?             @map("time_limit")
    instructions String?
    status       AssignmentStatus @default(OPEN)
    createdById  String           @map("created_by_id")
    createdAt    DateTime         @default(now()) @map("created_at")
    updatedAt    DateTime         @updatedAt @map("updated_at")

    exercise           Exercise            @relation(fields: [exerciseId], references: [id])
    class              Class?              @relation(fields: [classId], references: [id])
    createdBy          User                @relation("AssignmentCreator", fields: [createdById], references: [id])
    studentAssignments AssignmentStudent[]

    @@unique([id, centerId])
    @@index([centerId])
    @@index([centerId, exerciseId])
    @@index([centerId, classId])
    @@index([centerId, status])
    @@index([centerId, dueDate])
    @@map("assignment")
  }
  ```
  **NOTE:** `classId` is nullable — null when assigning to individual students rather than a class. `timeLimit` is in seconds; null means use exercise default. `dueDate` nullable for assignments without deadlines.

- [x]1.3 Add `AssignmentStudent` junction model:
  ```prisma
  model AssignmentStudent {
    id           String   @id @default(cuid())
    assignmentId String   @map("assignment_id")
    studentId    String   @map("student_id")
    centerId     String   @map("center_id")
    createdAt    DateTime @default(now()) @map("created_at")

    assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
    student    User       @relation("AssignmentStudents", fields: [studentId], references: [id])

    @@unique([assignmentId, studentId])
    @@index([centerId])
    @@index([studentId, centerId])
    @@map("assignment_student")
  }
  ```
  **PURPOSE:** Snapshots which students were assigned at creation time. Decouples from class roster changes. Also used by Story 3.16 to query "my assignments" per student.

- [x]1.4 Add relations to existing models — add to `Exercise`, `Class`, `User`:
  ```prisma
  // In Exercise model, add:
  assignments Assignment[]

  // In Class model, add:
  assignments Assignment[]

  // In User model, add:
  createdAssignments  Assignment[]        @relation("AssignmentCreator")
  studentAssignments  AssignmentStudent[] @relation("AssignmentStudents")
  ```

- [x]1.5 Run `pnpm --filter=db db:generate && pnpm --filter=db db:push`

### Task 2: Register Multi-Tenancy (AC: all)

- [x]2.1 Add `"Assignment"` and `"AssignmentStudent"` to `TENANTED_MODELS` array in `packages/db/src/tenanted-client.ts` (after `"MockTestSectionExercise"`):
  ```ts
  const TENANTED_MODELS = [
    // ... existing entries ...
    "MockTestSectionExercise",
    "Assignment",        // NEW
    "AssignmentStudent", // NEW
  ];
  ```
  **CRITICAL:** Without this, all assignment queries will bypass tenant isolation and return cross-center data.

- [x]2.2 Rebuild db package: `pnpm --filter=db build`

### Task 3: Zod Schemas — Types Package (AC: all)

- [x]3.1 Create `packages/types/src/assignments.ts`:
  ```ts
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

  // --- Assignment Count per Exercise (for library view) ---
  export const ExerciseAssignmentCountsSchema = createResponseSchema(
    z.array(AssignmentCountSchema)
  );
  ```

- [x]3.2 Export from `packages/types/src/index.ts`:
  ```ts
  export * from "./assignments.js";
  ```

### Task 4: Backend — Assignments Service (AC: 1-8)

- [x]4.1 Create `apps/backend/src/modules/assignments/assignments.service.ts`:

  ```ts
  import { PrismaClient, Assignment } from "@prisma/client";
  import { getTenantedClient } from "@workspace/db";
  import { AppError } from "../../errors/app-error.js";
  import { NotificationsService } from "../notifications/notifications.service.js";

  const ASSIGNMENT_INCLUDE = {
    exercise: { select: { id: true, title: true, skill: true, status: true } },
    class: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
    _count: { select: { studentAssignments: true } },
  };

  const ASSIGNMENT_DETAIL_INCLUDE = {
    ...ASSIGNMENT_INCLUDE,
    studentAssignments: {
      include: {
        student: { select: { id: true, name: true, email: true } },
      },
    },
  };

  export class AssignmentsService {
    constructor(
      private readonly prisma: PrismaClient,
      private readonly notificationsService: NotificationsService,
    ) {}

    // ... methods below
  }
  ```

- [x]4.2 `listAssignments` method:
  ```ts
  async listAssignments(
    centerId: string,
    filters?: {
      exerciseId?: string;
      classId?: string;
      status?: string;
      skill?: string;
    },
  ): Promise<Assignment[]> {
    const db = getTenantedClient(this.prisma, centerId);
    const where: any = {};
    if (filters?.exerciseId) where.exerciseId = filters.exerciseId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.status) where.status = filters.status;
    if (filters?.skill) where.exercise = { skill: filters.skill };
    return await db.assignment.findMany({
      where,
      include: ASSIGNMENT_INCLUDE,
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    });
  }
  ```
  **NOTE:** Orders by dueDate ascending (nearest deadline first, nulls last), then createdAt descending. The `nulls: "last"` ensures assignments without deadlines appear at the bottom.

- [x]4.3 `getAssignment` method:
  ```ts
  async getAssignment(centerId: string, id: string): Promise<Assignment> {
    const db = getTenantedClient(this.prisma, centerId);
    const assignment = await db.assignment.findUnique({
      where: { id },
      include: ASSIGNMENT_DETAIL_INCLUDE,
    });
    if (!assignment) throw AppError.notFound("Assignment not found");
    return assignment;
  }
  ```

- [x]4.4 `createAssignment` method (AC: 2, 3, 7):
  ```ts
  async createAssignment(
    centerId: string,
    input: {
      exerciseId: string;
      classIds?: string[];
      studentIds?: string[];
      dueDate?: string | null;
      timeLimit?: number | null;
      instructions?: string | null;
    },
    firebaseUid: string,
  ): Promise<Assignment[]> {
    const db = getTenantedClient(this.prisma, centerId);

    // 1. Resolve Firebase UID → userId
    const authAccount = await db.authAccount.findUniqueOrThrow({
      where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } },
    });

    // 2. Verify exercise exists and is PUBLISHED
    const exercise = await db.exercise.findUnique({ where: { id: input.exerciseId } });
    if (!exercise) throw AppError.notFound("Exercise not found");
    if (exercise.status !== "PUBLISHED") {
      throw AppError.badRequest("Only published exercises can be assigned");
    }

    const assignments: Assignment[] = [];

    if (input.classIds && input.classIds.length > 0) {
      // 3a. Class-based: create one assignment per class
      for (const classId of input.classIds) {
        const cls = await db.class.findUnique({
          where: { id: classId },
          include: { students: { select: { studentId: true } } },
        });
        if (!cls) throw AppError.notFound(`Class ${classId} not found`);

        const assignment = await db.$transaction(async (tx) => {
          const created = await tx.assignment.create({
            data: {
              centerId,
              exerciseId: input.exerciseId,
              classId,
              dueDate: input.dueDate ? new Date(input.dueDate) : null,
              timeLimit: input.timeLimit ?? null,
              instructions: input.instructions ?? null,
              status: "OPEN",
              createdById: authAccount.userId,
            },
          });

          // Snapshot class roster → AssignmentStudent
          if (cls.students.length > 0) {
            await tx.assignmentStudent.createMany({
              data: cls.students.map((s) => ({
                assignmentId: created.id,
                studentId: s.studentId,
                centerId,
              })),
            });
          }

          return await tx.assignment.findUniqueOrThrow({
            where: { id: created.id },
            include: ASSIGNMENT_INCLUDE,
          });
        });

        assignments.push(assignment);

        // Notify students
        const studentIds = cls.students.map((s) => s.studentId);
        if (studentIds.length > 0) {
          await this.notificationsService.createBulkNotifications(
            centerId,
            studentIds,
            "New Assignment",
            `You have a new assignment: ${exercise.title}${input.dueDate ? ` (due ${new Date(input.dueDate).toLocaleDateString()})` : ""}`,
          );
        }
      }
    } else if (input.studentIds && input.studentIds.length > 0) {
      // 3b. Individual student assignment (no classId)
      const assignment = await db.$transaction(async (tx) => {
        const created = await tx.assignment.create({
          data: {
            centerId,
            exerciseId: input.exerciseId,
            classId: null,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            timeLimit: input.timeLimit ?? null,
            instructions: input.instructions ?? null,
            status: "OPEN",
            createdById: authAccount.userId,
          },
        });

        await tx.assignmentStudent.createMany({
          data: input.studentIds!.map((studentId) => ({
            assignmentId: created.id,
            studentId,
            centerId,
          })),
        });

        return await tx.assignment.findUniqueOrThrow({
          where: { id: created.id },
          include: ASSIGNMENT_INCLUDE,
        });
      });

      assignments.push(assignment);

      // Notify students
      await this.notificationsService.createBulkNotifications(
        centerId,
        input.studentIds,
        "New Assignment",
        `You have a new assignment: ${exercise.title}${input.dueDate ? ` (due ${new Date(input.dueDate).toLocaleDateString()})` : ""}`,
      );
    }

    return assignments;
  }
  ```

  **CRITICAL DESIGN DECISIONS:**
  - Multi-class creates separate Assignment records (AC3) — each with its own roster snapshot.
  - Students are snapshot from `ClassStudent` at creation time, not dynamically resolved.
  - Notifications are sent AFTER the transaction commits to avoid notifying on failed creates.
  - Exercise must be PUBLISHED — prevent assigning DRAFT/ARCHIVED exercises.

- [x]4.5 `updateAssignment` method (AC: 4):
  ```ts
  async updateAssignment(
    centerId: string,
    id: string,
    input: { dueDate?: string | null; timeLimit?: number | null; instructions?: string | null },
  ): Promise<Assignment> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "ARCHIVED") {
      throw AppError.badRequest("Archived assignments cannot be edited. Reopen first.");
    }

    return await db.assignment.update({
      where: { id },
      data: {
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
        timeLimit: input.timeLimit !== undefined ? input.timeLimit : undefined,
        instructions: input.instructions !== undefined ? input.instructions : undefined,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }
  ```

- [x]4.6 `closeAssignment` method (AC: 5):
  ```ts
  async closeAssignment(centerId: string, id: string): Promise<Assignment> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status !== "OPEN") {
      throw AppError.badRequest("Only open assignments can be closed");
    }
    return await db.assignment.update({
      where: { id },
      data: { status: "CLOSED" },
      include: ASSIGNMENT_INCLUDE,
    });
  }
  ```

- [x]4.7 `reopenAssignment` method (AC: 8):
  ```ts
  async reopenAssignment(
    centerId: string,
    id: string,
    input: { dueDate?: string | null },
  ): Promise<Assignment> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "OPEN") {
      throw AppError.badRequest("Assignment is already open");
    }
    return await db.assignment.update({
      where: { id },
      data: {
        status: "OPEN",
        dueDate: input.dueDate ? new Date(input.dueDate) : existing.dueDate,
      },
      include: ASSIGNMENT_INCLUDE,
    });
  }
  ```

- [x]4.8 `deleteAssignment` method (AC: 6):
  ```ts
  async deleteAssignment(centerId: string, id: string): Promise<void> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    // TODO: Story 4.x — check for submissions here. If submissions exist, reject delete.
    // For now, all assignments can be deleted (no submission system yet).
    await db.assignment.delete({ where: { id } });
  }
  ```

- [x]4.9 `archiveAssignment` method (AC: 6):
  ```ts
  async archiveAssignment(centerId: string, id: string): Promise<Assignment> {
    const db = getTenantedClient(this.prisma, centerId);
    const existing = await db.assignment.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Assignment not found");
    if (existing.status === "ARCHIVED") {
      throw AppError.badRequest("Assignment is already archived");
    }
    return await db.assignment.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: ASSIGNMENT_INCLUDE,
    });
  }
  ```

- [x]4.10 `getAssignmentCountsByExercise` method (for exercise library wiring):
  ```ts
  async getAssignmentCountsByExercise(
    centerId: string,
    exerciseIds: string[],
  ): Promise<{ exerciseId: string; count: number }[]> {
    const db = getTenantedClient(this.prisma, centerId);
    const counts = await db.assignment.groupBy({
      by: ["exerciseId"],
      where: { exerciseId: { in: exerciseIds } },
      _count: { id: true },
    });
    return counts.map((c) => ({
      exerciseId: c.exerciseId,
      count: c._count.id,
    }));
  }
  ```

### Task 5: Backend — Assignments Controller (AC: all)

- [x]5.1 Create `apps/backend/src/modules/assignments/assignments.controller.ts`:
  ```ts
  import { AssignmentsService } from "./assignments.service.js";
  import type { JwtPayload } from "../../middlewares/auth.middleware.js";

  export class AssignmentsController {
    constructor(private readonly service: AssignmentsService) {}

    async list(user: JwtPayload, filters?: { exerciseId?: string; classId?: string; status?: string; skill?: string }) {
      const assignments = await this.service.listAssignments(user.centerId, filters);
      return { data: assignments, message: "Assignments retrieved" };
    }

    async get(id: string, user: JwtPayload) {
      const assignment = await this.service.getAssignment(user.centerId, id);
      return { data: assignment, message: "Assignment retrieved" };
    }

    async create(input: any, user: JwtPayload) {
      const assignments = await this.service.createAssignment(user.centerId, input, user.uid);
      return {
        data: assignments,
        message: `${assignments.length} assignment(s) created`,
      };
    }

    async update(id: string, input: any, user: JwtPayload) {
      const assignment = await this.service.updateAssignment(user.centerId, id, input);
      return { data: assignment, message: "Assignment updated" };
    }

    async close(id: string, user: JwtPayload) {
      const assignment = await this.service.closeAssignment(user.centerId, id);
      return { data: assignment, message: "Assignment closed" };
    }

    async reopen(id: string, input: any, user: JwtPayload) {
      const assignment = await this.service.reopenAssignment(user.centerId, id, input);
      return { data: assignment, message: "Assignment reopened" };
    }

    async delete(id: string, user: JwtPayload) {
      await this.service.deleteAssignment(user.centerId, id);
      return { data: null, message: "Assignment deleted" };
    }

    async archive(id: string, user: JwtPayload) {
      const assignment = await this.service.archiveAssignment(user.centerId, id);
      return { data: assignment, message: "Assignment archived" };
    }

    async getCountsByExercise(exerciseIds: string[], user: JwtPayload) {
      const counts = await this.service.getAssignmentCountsByExercise(user.centerId, exerciseIds);
      return { data: counts, message: "Assignment counts retrieved" };
    }
  }
  ```

### Task 6: Backend — Assignments Routes (AC: all)

- [x]6.1 Create `apps/backend/src/modules/assignments/assignments.routes.ts`:

  **Endpoints:**
  ```
  GET    /                     → List assignments (query: exerciseId, classId, status, skill)
  GET    /:id                  → Get single assignment with student list
  POST   /                     → Create assignment(s)
  PATCH  /:id                  → Update assignment (dueDate, timeLimit, instructions)
  POST   /:id/close            → Close assignment
  POST   /:id/reopen           → Reopen assignment (with optional new dueDate)
  POST   /:id/archive          → Archive assignment
  DELETE /:id                  → Delete assignment
  POST   /counts-by-exercise   → Get assignment counts for exercise IDs (for library view)
  ```

  All routes require `authMiddleware` + `requireRole(["OWNER", "ADMIN", "TEACHER"])`.

  **CRITICAL:** Register `POST /counts-by-exercise` BEFORE `POST /:id/close` etc. — Fastify radix tree router matches literal segments before parameter segments.

  Route schema definitions:
  ```ts
  // Import schemas from @workspace/types
  import {
    CreateAssignmentSchema,
    UpdateAssignmentSchema,
    ReopenAssignmentSchema,
    AssignmentStatusSchema,
  } from "@workspace/types";
  import { z } from "zod";

  // GET / query
  querystring: z.object({
    exerciseId: z.string().optional(),
    classId: z.string().optional(),
    status: AssignmentStatusSchema.optional(),
    skill: z.string().optional(),
  })

  // POST /counts-by-exercise body
  body: z.object({
    exerciseIds: z.array(z.string()).min(1).max(200),
  })
  ```

- [x]6.2 Instantiate service and controller inside the route plugin:
  ```ts
  export async function assignmentsRoutes(fastify: FastifyInstance) {
    const notificationsService = new NotificationsService(fastify.prisma);
    const service = new AssignmentsService(fastify.prisma, notificationsService);
    const controller = new AssignmentsController(service);
    // ... route definitions ...
  }
  ```
  **NOTE:** `NotificationsService` is instantiated here and injected into `AssignmentsService`. This is the same pattern used by other modules that depend on cross-cutting services.

- [x]6.3 Register in `apps/backend/src/app.ts`:
  ```ts
  import { assignmentsRoutes } from "./modules/assignments/assignments.routes.js";
  // In the route registration block:
  await app.register(assignmentsRoutes, { prefix: "/api/v1/assignments" });
  ```
  Place after `mockTestRoutes` registration, before `notificationsRoutes`.

### Task 7: Backend — Tests (AC: all)

- [x]7.1 Create `apps/backend/src/modules/assignments/assignments.service.test.ts`:

  Test cases:
  - `createAssignment` — creates assignment for single class, snapshots students
  - `createAssignment` — creates separate assignments for multi-class (AC3)
  - `createAssignment` — creates assignment for individual students (no classId)
  - `createAssignment` — rejects DRAFT exercise
  - `createAssignment` — rejects ARCHIVED exercise
  - `createAssignment` — rejects when no classIds or studentIds provided
  - `createAssignment` — triggers bulk notification to students (verify via mock)
  - `listAssignments` — returns all assignments ordered by dueDate ASC
  - `listAssignments` — filters by status
  - `listAssignments` — filters by classId
  - `listAssignments` — filters by exerciseId
  - `listAssignments` — filters by skill
  - `getAssignment` — returns assignment with student details
  - `getAssignment` — throws NotFound for invalid ID
  - `updateAssignment` — updates dueDate
  - `updateAssignment` — updates timeLimit and instructions
  - `updateAssignment` — rejects update on ARCHIVED assignment
  - `closeAssignment` — OPEN → CLOSED
  - `closeAssignment` — rejects non-OPEN
  - `reopenAssignment` — CLOSED → OPEN
  - `reopenAssignment` — ARCHIVED → OPEN
  - `reopenAssignment` — rejects already OPEN
  - `reopenAssignment` — sets new dueDate if provided
  - `deleteAssignment` — deletes assignment and cascade-deletes AssignmentStudents
  - `deleteAssignment` — throws NotFound for invalid ID
  - `archiveAssignment` — sets status to ARCHIVED
  - `archiveAssignment` — rejects already ARCHIVED
  - `getAssignmentCountsByExercise` — returns correct counts grouped by exerciseId
  - `getAssignmentCountsByExercise` — returns empty array for exercises with no assignments

  **Test setup pattern:** Follow `exercises.service.test.ts` — use real Prisma with test DB, create test data in `beforeEach`, clean up in `afterEach`. Mock `NotificationsService.createBulkNotifications` via vi.spyOn.

### Task 8: Frontend — Hooks (AC: all)

- [x]8.1 Create `apps/webapp/src/features/assignments/hooks/use-assignments.ts`:

  ```ts
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import client from "@/core/client";

  export const assignmentsKeys = {
    all: ["assignments"] as const,
    lists: () => [...assignmentsKeys.all, "list"] as const,
    list: (filters: AssignmentFilters) => [...assignmentsKeys.lists(), filters] as const,
    details: () => [...assignmentsKeys.all, "detail"] as const,
    detail: (id: string) => [...assignmentsKeys.details(), id] as const,
    counts: () => [...assignmentsKeys.all, "counts"] as const,
  };

  type AssignmentFilters = {
    exerciseId?: string;
    classId?: string;
    status?: string;
    skill?: string;
  };

  // NOTE: centerId is passed as parameter (matching exercises hook pattern).
  // Page component extracts centerId via: const { user } = useAuth(); const centerId = user?.centerId;
  export function useAssignments(centerId: string | undefined, filters: AssignmentFilters = {}) {
    const queryClient = useQueryClient();

    const query = useQuery({
      queryKey: assignmentsKeys.list(filters),
      queryFn: async () => {
        const { data, error } = await client.GET("/api/v1/assignments/", {
          params: { query: filters },
        });
        if (error) throw error;
        return data?.data ?? [];
      },
      enabled: !!centerId,
    });

    // Mutations: create, update, close, reopen, archive, delete
    const createMutation = useMutation({
      mutationFn: async (input: CreateAssignmentInput) => {
        const { data, error } = await client.POST("/api/v1/assignments/", {
          body: input,
        });
        if (error) throw error;
        return data?.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: assignmentsKeys.lists() });
      },
    });

    // ... similar patterns for update, close, reopen, archive, delete

    return {
      assignments: query.data ?? [],
      isLoading: query.isLoading,
      createAssignment: createMutation.mutateAsync,
      isCreating: createMutation.isPending,
      // ... other mutations
    };
  }
  ```

  **Also export:** `useAssignment(id)` for single assignment detail, and `useAssignmentCounts(exerciseIds)` for exercise library column.

- [x]8.2 Create `useAssignmentCounts` hook for exercise library integration:
  ```ts
  export function useAssignmentCounts(exerciseIds: string[]) {
    return useQuery({
      queryKey: [...assignmentsKeys.counts(), exerciseIds],
      queryFn: async () => {
        if (exerciseIds.length === 0) return [];
        const { data, error } = await client.POST("/api/v1/assignments/counts-by-exercise", {
          body: { exerciseIds },
        });
        if (error) throw error;
        return data?.data ?? [];
      },
      enabled: exerciseIds.length > 0,
    });
  }
  ```

### Task 9: Frontend — Assignments Page (AC: 1)

- [x]9.1 Create `apps/webapp/src/features/assignments/assignments-page.tsx`:

  **Layout:**
  - Page header: "Assignments" title + "Assign Exercise" button (primary)
  - Filter bar: Search (by exercise title), Class filter (dropdown), Skill filter, Status filter, Due date range
  - Table columns: Exercise Title, Skill icon, Class, Due Date, Time Limit, Submissions (X/Y), Status badge, Actions
  - Row actions dropdown: Edit, Close (if OPEN), Reopen (if CLOSED/ARCHIVED), Archive, Delete
  - Client-side pagination (20 per page)

  **Filter state pattern:** Follow `exercises-page.tsx` — local state for each filter, memoized filtered list, reset page on filter change.

  **Status badges:**
  ```ts
  const STATUS_VARIANTS: Record<string, string> = {
    OPEN: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
    ARCHIVED: "bg-yellow-100 text-yellow-700",
  };
  ```

  **Submissions column:** Display `0/${assignment._count?.studentAssignments ?? 0}` — zero submissions since Epic 4 not built yet. Add `// TODO: Epic 4 — Replace 0 with actual submission count`.

  **Due date display:**
  - Past due + OPEN → Red text "Overdue"
  - Due today → Orange text "Due today"
  - Future → Normal date display
  - No due date → "No deadline"

  **UI Components:** Use `Table`, `Badge`, `Button`, `DropdownMenu`, `Select`, `Input` from `@workspace/ui`. Use `Calendar`/`DatePicker` if available, otherwise use native `<input type="datetime-local">`.

### Task 10: Frontend — Create Assignment Dialog (AC: 2, 3)

- [x]10.1 Create `apps/webapp/src/features/assignments/components/create-assignment-dialog.tsx`:

  **Dialog steps (single dialog, not wizard):**
  1. **Exercise picker**: Search/filter exercises, show only PUBLISHED. Use a Select/Combobox with exercise title + skill icon. Reuse exercise list query with status=PUBLISHED filter.
  2. **Target selection**: Radio: "Assign to Classes" or "Assign to Individual Students"
     - Classes: Multi-select class dropdown (from existing classes query in logistics hooks)
     - Students: Multi-select student search (from existing users/students query)
  3. **Settings**: Due Date (datetime picker), Time Limit (number input, placeholder shows exercise default), Instructions (textarea)
  4. **Submit button**: "Assign to N class(es)" or "Assign to N student(s)"

  **Props:**
  ```ts
  interface CreateAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultExerciseId?: string; // Pre-select when coming from exercise library "Assign" action
  }
  ```

  **Validation:**
  - Exercise required
  - At least one class or student
  - Due date must be in the future (if set)
  - Time limit must be positive (if set)

  **On success:** Toast "Assignment created for N class(es)" → close dialog → invalidate assignment queries.

- [x]10.2 Reuse existing `useClasses` hook for class selection:
  - **EXISTS:** `apps/webapp/src/features/logistics/hooks/use-logistics.ts` exports `useClasses(centerId)` → returns `{ classes, isLoading }`.
  - Each `class` object has `id`, `name`, and related `students[]` (for count display).
  - Use this directly in the class multi-select dropdown — no new hook needed.
  - Display: class name + student count (e.g., "Class 10A (25 students)")

- [x]10.3 Add "Assign" action to exercise library (exercises-page.tsx):
  - Add "Assign" to row `DropdownMenu` — only visible for PUBLISHED exercises
  - Opens `CreateAssignmentDialog` with `defaultExerciseId` set
  - Icon: `Send` from `lucide-react`

### Task 11: Frontend — Assignment Actions (AC: 4, 5, 6, 8)

- [x]11.1 Implement Edit action:
  - Click "Edit" in row dropdown → opens `EditAssignmentDialog`
  - Dialog shows: Due Date, Time Limit, Instructions fields (pre-filled)
  - On save: calls `updateAssignment` mutation

- [x]11.2 Implement Close action (AC: 5):
  - Click "Close" → confirmation dialog "Close this assignment? Students will no longer be able to submit."
  - On confirm: calls `closeAssignment(id)` → toast "Assignment closed"

- [x]11.3 Implement Reopen action (AC: 8):
  - Click "Reopen" → dialog with optional new due date
  - On confirm: calls `reopenAssignment(id, { dueDate })` → toast "Assignment reopened"

- [x]11.4 Implement Archive action:
  - Click "Archive" → confirmation dialog
  - On confirm: calls `archiveAssignment(id)` → toast "Assignment archived"

- [x]11.5 Implement Delete action (AC: 6):
  - Click "Delete" → confirmation dialog with warning
  - On confirm: calls `deleteAssignment(id)` → toast "Assignment deleted"
  - Only show for assignments that can be deleted (currently all; Epic 4 will add submission check)

- [x]11.6 Action visibility rules:
  ```
  Edit       → OPEN, CLOSED (not ARCHIVED)
  Close      → OPEN only
  Reopen     → CLOSED, ARCHIVED
  Archive    → OPEN, CLOSED
  Delete     → all statuses (Epic 4 will restrict)
  ```

### Task 12: Frontend — Route Registration + Navigation (AC: all)

- [x]12.1 Add routes in `apps/webapp/src/App.tsx`:
  ```tsx
  <Route
    path="assignments"
    element={
      <ProtectedRoute allowedRoles={["OWNER", "ADMIN", "TEACHER"]}>
        <AssignmentsPage />
      </ProtectedRoute>
    }
  />
  ```
  Place after the exercises routes.

- [x]12.2 Add "Assignments" to navigation:
  - Navigation config lives in `apps/webapp/src/core/config/navigation.ts` using `NavItemConfig` interface.
  - Add entry inside `getNavigationConfig()` function after "Exercises" (order 4):
    ```ts
    {
      title: "Assignments",
      url: `/${centerId}/assignments`,
      icon: FileCheck, // from lucide-react — ClipboardList is already used by Mock Tests
      allowedRoles: ["OWNER", "ADMIN", "TEACHER"],
      order: 4.5, // Between Exercises (4) and Mock Tests (5) — or renumber as needed
      mobileVisible: true,
    }
    ```
  - Import `FileCheck` from `lucide-react`
  - The sidebar reads from this config via `apps/webapp/src/core/components/common/app-sidebar.tsx`

### Task 13: Frontend — Wire Up Exercise Library Stubs (AC: 8 of Story 3.14)

- [x]13.1 In `apps/webapp/src/features/exercises/exercises-page.tsx`:
  - Import `useAssignmentCounts` from assignments hooks
  - After exercise list loads, extract exerciseIds and call `useAssignmentCounts`
  - Replace `"—"` stub in "Assignments" column with actual count
  - Replace `"—"` stub in grid view card "Assignments" with actual count
  - "Avg Score" column remains `"—"` (no submission/grading data until Epic 5)
  - Remove the `// TODO: Story 3.15` comments

  ```tsx
  // In exercises-page.tsx:
  const exerciseIds = exercises.map((e) => e.id);
  const { data: assignmentCounts } = useAssignmentCounts(exerciseIds);
  const countMap = new Map(
    (assignmentCounts ?? []).map((c) => [c.exerciseId, c.count])
  );

  // In table column:
  {countMap.get(exercise.id) ?? 0}

  // In grid card:
  Assignments: {countMap.get(exercise.id) ?? 0}
  ```

### Task 14: Frontend — Tests (AC: all)

- [x]14.1 Create `apps/webapp/src/features/assignments/assignments-page.test.tsx`:
  Test cases:
  - Renders assignment list table with correct columns
  - Displays assignment data (exercise title, class, due date, status)
  - Search filters by exercise title
  - Status filter narrows results
  - Class filter narrows results
  - "Assign Exercise" button opens create dialog
  - Create dialog shows exercise picker with only PUBLISHED exercises
  - Create dialog shows class multi-select
  - Close action visible only for OPEN assignments
  - Reopen action visible for CLOSED/ARCHIVED assignments
  - Overdue assignments show red "Overdue" indicator
  - Pagination controls navigate between pages
  - Submissions column shows "0/N" format

### Task 15: Schema Sync (AC: all)

- [x]15.1 Start backend dev server: `pnpm --filter=backend dev`
- [x]15.2 Run `pnpm --filter=webapp sync-schema-dev`
- [x]15.3 Verify `apps/webapp/src/schema/schema.d.ts` includes all new assignment endpoints

## Dev Notes

### Architecture Compliance

- **Route-Controller-Service pattern**: All backend code follows `assignments.service.ts` → `assignments.controller.ts` → `assignments.routes.ts` layering exactly as established by exercises module.
- **Multi-tenancy**: All queries use `getTenantedClient(this.prisma, centerId)`. New models registered in `TENANTED_MODELS`.
- **Zod validation**: All request/response schemas in `packages/types/src/assignments.ts`. Uses `fastify-type-provider-zod` for route validation.
- **Response format**: Always `{ data: T | null, message: string }` via `createResponseSchema()`.
- **Error handling**: Use `AppError.notFound()` / `AppError.badRequest()` for domain errors. Route catch blocks use `mapPrismaError` from `../../errors/prisma-errors.js`.

### Key Implementation Patterns (from Stories 3.1-3.14)

- **Firebase UID resolution**: `db.authAccount.findUniqueOrThrow({ where: { provider_providerUserId: { provider: "FIREBASE", providerUserId: firebaseUid } } })` → get `userId`. Uses compound unique key.
- **EXERCISE_INCLUDE constant** (for reference): `{ createdBy: select, sections: ordered include questions, tagAssignments: select tag }`. Define similar `ASSIGNMENT_INCLUDE` for consistent relation loading.
- **Frontend hooks pattern**: Query key factory `assignmentsKeys`, `client.GET`/`POST`/`PATCH`/`DELETE`, `queryClient.invalidateQueries`. Import `client` from `@/core/client` (default export). Get `centerId` from `useAuth()` hook.
- **Frontend page pattern**: Follow `exercises-page.tsx` — filter state, query hook with filters, data table, row actions dropdown, pagination.
- **ESM imports**: All backend imports require `.js` extensions: `import { AssignmentsService } from "./assignments.service.js";`
- **Prisma naming**: ALL models use `@@map("snake_case")`, ALL columns use `@map("snake_case")`. Enforced for new `Assignment` and `AssignmentStudent` models.
- **JwtPayload import**: `import type { JwtPayload } from "../../middlewares/auth.middleware.js"` — fields: `{ uid, email, role, centerId }`. Do NOT import from `jsonwebtoken`.
- **Auth/Role middleware imports**: `import { authMiddleware } from "../../middlewares/auth.middleware.js"` and `import { requireRole } from "../../middlewares/role.middleware.js"` — note `middlewares` (plural) directory.
- **Frontend centerId**: `useAuth()` returns `{ user, firebaseUser, loading, logout, sessionExpired }`. Access centerId via `user?.centerId`, NOT direct destructure.
- **React Router**: Uses `react-router` v7 (`import { ... } from "react-router"`).
- **Client import**: `import client from "@/core/client"` — default export, typed via OpenAPI schema at `@/schema/schema`.

### Cross-Service Dependency: NotificationsService

The `AssignmentsService` depends on `NotificationsService` for student notifications (AC7). This is injected via constructor, not imported as a singleton. The pattern:
```ts
// In assignments.routes.ts:
const notificationsService = new NotificationsService(app.prisma);
const service = new AssignmentsService(app.prisma, notificationsService);
```
For testing, mock `NotificationsService.createBulkNotifications` via `vi.spyOn` or constructor injection with a mock.

### Notification Model (Existing)

The `Notification` model is already in the schema (lines 285-300). Key method: `createBulkNotifications(centerId, userIds, title, message)` in `NotificationsService`.

### Student Roster Snapshot Design

When assigning to a class, the `AssignmentStudent` junction table records which students are assigned at creation time. This means:
- Students added to the class AFTER assignment creation will NOT see the assignment
- Students removed from the class AFTER assignment creation will STILL see the assignment
- This is intentional — assignments are a point-in-time record

### Exercise Library Integration (Task 13)

Story 3.14 stubbed two columns in the exercise library:
- **Assignments** column → now shows real count via `POST /api/v1/assignments/counts-by-exercise`
- **Avg Score** column → stays as "—" until Epic 5 grading

The `useAssignmentCounts` hook batches exerciseIds into a single POST request to minimize API calls. The response is a `Map<exerciseId, count>` for O(1) lookup in the table.

### Frontend Navigation Update

Navigation config is in `apps/webapp/src/core/config/navigation.ts`, used by `apps/webapp/src/core/components/common/app-sidebar.tsx`. The `NavItemConfig` interface: `{ title, url, icon, allowedRoles, order, mobileVisible, badge? }`. Current nav items: Dashboard(1), Schedule(2), Classes(3), Exercises(4), Mock Tests(5), Grading(6), Students(7), Settings(8), My Profile(9).

Add "Assignments" at order 4.5 (after Exercises, before Mock Tests). Use `FileCheck` icon — `ClipboardList` is already used by Mock Tests. Roles: OWNER, ADMIN, TEACHER.

### Route Registration Order in app.ts

Register `assignmentsRoutes` after existing exercise/mock-test routes:
```ts
await app.register(exercisesRoutes, { prefix: "/api/v1/exercises" });
await app.register(sectionsRoutes, { prefix: "/api/v1/exercises" });
await app.register(aiGenerationRoutes, { prefix: "/api/v1/exercises" });
await app.register(tagsRoutes, { prefix: "/api/v1/tags" });
await app.register(mockTestRoutes, { prefix: "/api/v1/mock-tests" });
await app.register(assignmentsRoutes, { prefix: "/api/v1/assignments" }); // NEW
await app.register(notificationsRoutes, { prefix: "/api/v1/notifications" });
```

### "Assign" Action in Exercise Library

Add a row action to `exercises-page.tsx` that opens the assignment creation dialog with the exercise pre-selected. This provides a natural workflow: browse exercises → find the one you want → assign it. The action should only be visible for PUBLISHED exercises (DRAFT can't be assigned, ARCHIVED shouldn't be).

### New Files Created

**Backend:**
- `apps/backend/src/modules/assignments/assignments.service.ts`
- `apps/backend/src/modules/assignments/assignments.controller.ts`
- `apps/backend/src/modules/assignments/assignments.routes.ts`
- `apps/backend/src/modules/assignments/assignments.service.test.ts`

**Frontend:**
- `apps/webapp/src/features/assignments/assignments-page.tsx`
- `apps/webapp/src/features/assignments/assignments-page.test.tsx`
- `apps/webapp/src/features/assignments/hooks/use-assignments.ts`
- `apps/webapp/src/features/assignments/components/create-assignment-dialog.tsx`
- `apps/webapp/src/features/assignments/components/edit-assignment-dialog.tsx`

**Shared:**
- `packages/types/src/assignments.ts`

**Modified Files:**
- `packages/db/prisma/schema.prisma` (new models + relations)
- `packages/db/src/tenanted-client.ts` (TENANTED_MODELS)
- `packages/types/src/index.ts` (export assignments)
- `apps/backend/src/app.ts` (route registration)
- `apps/webapp/src/App.tsx` (route registration)
- `apps/webapp/src/core/config/navigation.ts` (add Assignments nav item)
- `apps/webapp/src/features/exercises/exercises-page.tsx` (wire up assignment counts, add "Assign" action)
- `apps/webapp/src/features/exercises/hooks/use-exercises.ts` (no change needed — assignment counts use separate hook)
- `apps/webapp/src/schema/schema.d.ts` (auto-generated after sync)

### Previous Story Learnings (Stories 3.1-3.14)

- **Common code review issues**: Empty `onBlur` handlers, dead props, missing test coverage for all branches, duplicate case blocks. Keep code minimal, test every path.
- **Schema sync required**: After adding new routes, run `pnpm --filter=webapp sync-schema-dev` with backend running.
- **Bulk routes before parameterized routes**: In `assignments.routes.ts`, register `POST /counts-by-exercise` before `POST /:id/close`, `POST /:id/reopen`, `POST /:id/archive` — Fastify radix tree router matches literal segments before parameter segments.
- **Story 3.14 created stubs**: `exercises-page.tsx` has `"—"` placeholders and `// TODO: Story 3.15` comments for assignment count and avg score columns. Wire up assignment count; leave avg score stubbed.
- **Transaction pattern**: Use `db.$transaction()` for multi-step writes (create assignment + snapshot students). Follow the pattern from `duplicateExercise` in `exercises.service.ts`.

### Git Intelligence

Recent commits follow `feat(exercises): implement story 3.X <description>` pattern. This story should use: `feat(assignments): implement story 3.15 exercise assignment management`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.15 Exercise Assignment Management (FR16)]
- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.16 Student Assignment Dashboard (FR17) — data model must support this]
- [Source: _bmad-output/planning-artifacts/architecture.md — Route-Controller-Service, Multi-tenancy, Feature-First structure]
- [Source: project-context.md — Multi-tenancy enforcement, Prisma naming, Testing rules, Layered architecture]
- [Source: 3-14-exercise-library-management.md — Stubbed Assignments/Avg Score columns, exercise list patterns, bulk action patterns]
- [Source: packages/db/prisma/schema.prisma — Exercise model, Class model, ClassStudent model, Notification model, User model]
- [Source: packages/db/src/tenanted-client.ts — TENANTED_MODELS array]
- [Source: apps/backend/src/modules/notifications/notifications.service.ts — createBulkNotifications method]
- [Source: apps/backend/src/modules/exercises/exercises.service.ts — EXERCISE_INCLUDE, CRUD patterns, transaction patterns]
- [Source: apps/backend/src/modules/exercises/exercises.routes.ts — Route schema definitions, bulk route ordering]
- [Source: apps/backend/src/app.ts — Route registration order and prefix patterns]
- [Source: apps/webapp/src/features/exercises/exercises-page.tsx — Filter state, table rendering, action handlers, grid/list toggle]
- [Source: apps/webapp/src/features/exercises/hooks/use-exercises.ts — Query key factory, mutation patterns]
- [Source: apps/webapp/src/core/client.ts — OpenAPI client import pattern]
- [Source: apps/webapp/src/App.tsx — Route registration pattern with ProtectedRoute]
- [Source: apps/webapp/src/core/config/navigation.ts — NavItemConfig interface, getNavigationConfig(), nav item ordering]
- [Source: apps/webapp/src/features/auth/auth-context.tsx — useAuth() returns { user, firebaseUser, loading, logout, sessionExpired }; centerId via user?.centerId]
- [Source: apps/webapp/src/features/logistics/hooks/use-logistics.ts — useClasses(centerId) hook for class selection]
- [Source: apps/backend/src/middlewares/auth.middleware.ts — JwtPayload type, authMiddleware]
- [Source: apps/backend/src/middlewares/role.middleware.ts — requireRole() middleware]
- [Source: apps/backend/src/errors/app-error.ts — AppError.notFound(), .badRequest(), .conflict(), .unauthorized(), .forbidden()]
- [Source: apps/backend/src/errors/prisma-errors.ts — mapPrismaError() maps P2025→notFound, P2002→conflict, P2003→badRequest]
- [Source: packages/types/src/response.ts — createResponseSchema() function]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Navigation tests updated to account for new "Assignments" nav item (9→10 total, 8→9 teacher, overflow list updated)
- Exercises page tests updated to mock `useAssignmentCounts` and `CreateAssignmentDialog` (new dependencies from Task 13)
- Exercises page test "stub columns" updated: Assignments column now shows real count (0) instead of em dash
- TypeScript error in routes: `reply.status(error.statusCode)` fixed with `as 500` cast pattern
- AssignmentFilters status type changed from `string` to `AssignmentStatus` to fix type mismatch

### Completion Notes List

- All 15 tasks completed
- Backend: 557 tests passing (29 new assignment service tests + 528 existing, 0 regressions)
- Frontend: 500 tests passing (16 new assignment page tests + updated navigation/exercises tests, 0 regressions)
- Webapp build: clean
- Schema sync: completed (schema.d.ts includes all new assignment endpoints)
- Submissions column stubbed as "0/N" (Epic 4)
- Avg Score column in exercise library remains stubbed as "—" (Epic 5)

### Code Review Fixes Applied (2026-02-10)

10 issues found and fixed during adversarial code review:

**Critical (3):**
1. **Fix #1 — Individual student assignment UI missing**: CreateAssignmentDialog now has radio toggle for "Classes" vs "Individual Students" with student multi-select using `useUsers` hook
2. **Fix #2 — Reopen dialog lacks new due date input**: Replaced simple AlertDialog with Dialog containing optional datetime-local input for new due date
3. **Fix #3 — Due date range filter missing**: Added dueDateStart/dueDateEnd inputs to filter bar, wired to API filters, added backend query support

**High (2):**
4. **Fix #4 — `any` types throughout**: Replaced `type AssignmentRow = any` with `Assignment` from `@workspace/types`, fixed `assignment: any` → `Assignment` in edit dialog
5. **Fix #5 — `as never` cast**: Changed `status: "PUBLISHED" as never` to `status: "PUBLISHED" as ExerciseStatus`

**Medium (5):**
6. **Fix #6 — Route error handling duplication**: Extracted `handleRouteError` function, eliminated 8x duplicated catch blocks, added `request.log.error(error)` logging
7. **Fix #7 — Class filter client-side**: Moved classId filtering from client-side to API filter in `apiFilters` memo
8. **Fix #8 — Student ID validation**: Added `centerMembership.findFirst` validation for individual student IDs before assignment creation
9. **Fix #9 — formatTimeLimit shows "0m"**: Fixed to output "1h" instead of "1h 0m" for exact hours
10. **Fix #10 — Service filter types loose**: Changed `status?: string` to `status?: "OPEN" | "CLOSED" | "ARCHIVED"`, added dueDateStart/dueDateEnd filter support

**Tests:** Updated backend tests (2 new: due date range filter, student validation), updated frontend test ("1h 0m" → "1h"). All tests pass: backend 557, frontend 500.

### File List

**New Files:**
- `packages/types/src/assignments.ts` — Zod schemas for assignments
- `apps/backend/src/modules/assignments/assignments.service.ts` — Assignment CRUD service
- `apps/backend/src/modules/assignments/assignments.controller.ts` — Assignment controller
- `apps/backend/src/modules/assignments/assignments.routes.ts` — Assignment API routes
- `apps/backend/src/modules/assignments/assignments.service.test.ts` — Service tests (29 tests)
- `apps/webapp/src/features/assignments/assignments-page.tsx` — Assignments list page
- `apps/webapp/src/features/assignments/assignments-page.test.tsx` — Page tests (16 tests)
- `apps/webapp/src/features/assignments/hooks/use-assignments.ts` — React Query hooks
- `apps/webapp/src/features/assignments/components/create-assignment-dialog.tsx` — Create dialog
- `apps/webapp/src/features/assignments/components/edit-assignment-dialog.tsx` — Edit dialog

**Modified Files:**
- `packages/db/prisma/schema.prisma` — Added AssignmentStatus enum, Assignment model, AssignmentStudent model, relations
- `packages/db/src/tenanted-client.ts` — Added Assignment, AssignmentStudent to TENANTED_MODELS
- `packages/types/src/index.ts` — Added assignments export
- `apps/backend/src/app.ts` — Registered assignments routes
- `apps/webapp/src/App.tsx` — Added assignments route
- `apps/webapp/src/core/config/navigation.ts` — Added Assignments nav item (order 4.5)
- `apps/webapp/src/core/config/navigation.test.ts` — Updated counts for new nav item
- `apps/webapp/src/features/exercises/exercises-page.tsx` — Wired up assignment counts, added Assign action
- `apps/webapp/src/features/exercises/exercises-page.test.tsx` — Added assignment hook mocks, updated stub test
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated (schema sync)
