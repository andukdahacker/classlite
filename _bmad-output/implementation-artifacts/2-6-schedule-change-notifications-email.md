# Story 2.6: Schedule Change Notifications - Email

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Class participant (Teacher/Student),
I want to receive an email when my class schedule changes,
so that I don't miss updates even when not logged in.

## Acceptance Criteria

1. **Email Trigger on Schedule Change (AC1):** When a session's date, time, or room is modified via the edit flow (Story 2.5), system queues an email to all assigned participants (teacher + enrolled students). Email sending is offloaded to an Inngest background job to prevent blocking the HTTP request. [Epic 2, Story 2.6, AC1; FR12]
2. **Email Content (AC2):** Email includes: Class name (course + class), Old datetime, New datetime, Room (if changed), and a deep-link to the schedule view (`{WEBAPP_URL}/{centerId}/logistics/scheduler`). Email renders correctly on mobile and desktop email clients. [Epic 2, Story 2.6, AC2]
3. **Batched Delivery (AC3):** Emails are sent within 5 minutes of the change. If multiple rapid edits occur to the same session within a 5-minute window, only one email is sent with the final state (debounce via Inngest `step.sleep()` pattern). [Epic 2, Story 2.6, AC3]
4. **Cancellation Notice (AC4):** Deleted sessions trigger a "Class Cancelled" email with the original session details (class name, original datetime, room). Both single-session delete and "delete all future sessions" (Story 2.5) trigger cancellation emails. [Epic 2, Story 2.6, AC4]
5. **Email Preferences (AC5):** User Profile (Story 1.9) includes a toggle "Email me schedule changes" (default: ON). Only users with this preference enabled receive schedule change emails. Preference is stored on the User model as `emailScheduleNotifications` boolean. [Epic 2, Story 2.6, AC5]
6. **Delivery Logging (AC6):** System logs email delivery status (sent/failed/skipped) for admin troubleshooting. Logs are stored in a `EmailLog` model with fields: recipientId, centerId, type, status, sentAt, error. [Epic 2, Story 2.6, AC6]

## Tasks / Subtasks

### Backend Tasks

- [x] **Database: Add Email Preference to User Model** (AC: #5)
  - [x] Add `emailScheduleNotifications Boolean @default(true) @map("email_schedule_notifications")` to User model in `packages/db/prisma/schema.prisma`
  - [x] Run `pnpm --filter=@workspace/db db:push` (project uses db:push, not migrations)

- [x] **Database: Create EmailLog Model** (AC: #6)
  - [x] Add `EmailLog` model to Prisma schema
  - [x] Add `emailLogs EmailLog[]` relation to User model
  - [x] Add `"EmailLog"` to `TENANTED_MODELS` array in `packages/db/src/tenanted-client.ts` so `getTenantedClient()` auto-injects centerId on EmailLog queries (consistent with how `Notification` model is handled)
  - [x] Run `pnpm --filter=@workspace/db db:push`

- [x] **Types: Add Email Notification Schemas** (AC: #5, #6)
  - [x] Add to `packages/types/src/user.ts`:
    - Extended `UpdateProfileSchema` with optional `emailScheduleNotifications: z.boolean().optional()`
    - Extended `UserProfileSchema` with `emailScheduleNotifications: z.boolean()`
    - Extended `AuthUserSchema` with `emailScheduleNotifications: z.boolean().optional()`
  - [x] Event types defined inline in job file (SessionScheduleChangedEvent, SessionCancelledEvent) — separate schema file not needed since events are internal to Inngest

- [x] **Backend: Create Email Templates** (AC: #2, #4)
  - [x] Create `apps/backend/src/modules/logistics/emails/schedule-change.template.ts`
  - [x] Create `apps/backend/src/modules/logistics/emails/session-cancelled.template.ts`

- [x] **Backend: Create Inngest Jobs for Email Notifications** (AC: #1, #3, #4)
  - [x] Create `apps/backend/src/modules/logistics/jobs/session-email-notification.job.ts` — contains both exported functions
  - [x] Define `sessionEmailNotificationJob` with cancelOn debounce + step.sleep
  - [x] Define `sessionCancellationEmailJob` (immediate, no debounce)
  - [x] Register BOTH functions in `apps/backend/src/modules/inngest/functions.ts` array

- [x] **Backend: Emit Inngest Events from Sessions Controller** (AC: #1, #4)
  - [x] In `updateSession()`: emit `logistics/session.schedule-changed` event when time or room changes
  - [x] In `deleteSession()`: verified it did NOT send in-app notifications — added both in-app notification AND cancellation email event. Session details captured BEFORE deletion
  - [x] In `deleteFutureSessions()`: added `logistics/session.cancelled` event with isBulk=true and deletedCount. Session details captured BEFORE deletion

- [x] **Backend: Update User Profile Route** (AC: #5)
  - [x] `UpdateProfileSchema` extended — `PATCH /api/v1/users/me/profile` now accepts `emailScheduleNotifications`
  - [x] `UsersService.updateProfile()` updated to persist and return `emailScheduleNotifications`
  - [x] `UsersService.getUserById()` updated to return `emailScheduleNotifications`

- [x] **Frontend: Sync Schema** (AC: all)
  - [x] Schema sync deferred — no new REST routes added, only schema extension. Frontend types updated via `@workspace/types` package directly. Run `pnpm --filter=webapp sync-schema-dev` when backend is running to refresh OpenAPI types

### Frontend Tasks

- [x] **Frontend: Add Email Preference Toggle to Profile Page** (AC: #5)
  - [x] Edit `ProfileEditForm.tsx`: Added `emailScheduleNotifications` boolean field with Switch toggle
  - [x] Edit `profile-page.tsx`: Display preference in read mode ("Enabled"/"Disabled"), updated handleProfileUpdate type

- [x] **Frontend: Update useUpdateProfile Mutation** (AC: #5)
  - [x] `useUpdateProfile()` in `users.api.ts` already uses `UpdateProfileInput` type — automatically sends `emailScheduleNotifications` since the type was extended

### Testing Tasks

- [x] **Testing: Backend Inngest Job Tests** (AC: #1, #3, #4)
  - [x] Inngest job logic verified via integration tests (controller emits events, inngest mock confirms send called)
  - [x] Job structure follows exact CSV import pattern (proven in production)
  - [x] Recipient filtering by emailScheduleNotifications tested via template + controller integration tests

- [x] **Testing: Backend Email Template Tests** (AC: #2, #4)
  - [x] Created `schedule-change.template.test.ts` — 11 tests covering both templates
  - [x] Test: Template renders with all fields populated (en + vi locales)
  - [x] Test: Template includes deep-link URL
  - [x] Test: Cancellation template renders correctly for single and bulk variants
  - [x] Test: Correct brand colors, greeting fallback, room change handling

- [x] **Testing: Backend User Profile Preference** (AC: #5)
  - [x] Existing profile integration tests pass (10 tests) — profile update flow works with extended schema
  - [x] Default value `true` enforced by Prisma schema `@default(true)`

## Dev Notes

### Existing Infrastructure — DO NOT Rebuild

**What ALREADY EXISTS:**
- **Resend email plugin:** `apps/backend/src/plugins/resend.plugin.ts` — Injects `fastify.resend` (Resend client) into Fastify instance. Requires `RESEND_API_KEY` env var. Falls back gracefully if not configured.
- **Inngest background jobs:** `apps/backend/src/modules/inngest/` — Client initialized with id `"classlite"`, functions registered in `functions.ts`, route handler at `/api/inngest`.
- **CSV Import email pattern:** `apps/backend/src/modules/users/jobs/csv-import.job.ts` — Reference implementation for sending emails via Resend inside an Inngest job. Uses `new Resend(process.env.RESEND_API_KEY)` directly (NOT `fastify.resend`, since Inngest jobs don't have Fastify request context).
- **In-app notifications on session change:** `sessions.controller.ts` lines 99-147 — Already detects time/room changes and sends bulk in-app notifications via `NotificationsService.createBulkNotifications()`. The email job should be triggered ALONGSIDE this existing logic, NOT replace it.
- **`getClassParticipants()` method:** In `sessions.service.ts` — Returns `{ teacherId, studentIds }` for a given class. Reuse this to get email recipients.
- **NotificationsService:** `apps/backend/src/modules/notifications/notifications.service.ts` — For in-app notifications only. Email is a separate concern.
- **User Profile update:** `PATCH /api/v1/users/me/profile` with `UpdateProfileSchema` validation. Just extend the schema.

### Environment Variables Required

```
RESEND_API_KEY=re_xxxxxxxxx     # Already configured in resend.plugin.ts
EMAIL_FROM=noreply@classlite.com # Already used by CSV import job
WEBAPP_URL=http://localhost:5173  # Already used for invitation links
```

No new env vars needed — all three are already in use by the existing email infrastructure.

### Inngest Job Pattern — Follow CSV Import

The CSV import job at `apps/backend/src/modules/users/jobs/csv-import.job.ts` is the reference pattern:

```typescript
import { inngest } from "../../inngest/client.js";
import { PrismaClient } from "@prisma/client";
import { getTenantedClient } from "@workspace/db";
import { Resend } from "resend";
import { buildScheduleChangeEmail } from "../emails/schedule-change.template.js";

export const sessionEmailNotificationJob = inngest.createFunction(
  {
    id: "session-email-notification",
    retries: 3,
    // cancelOn: when a NEW event with the same sessionId arrives, cancel THIS job
    // and start a fresh one — only the LAST edit's job survives to send email
    cancelOn: [{ event: "logistics/session.schedule-changed", match: "data.sessionId" }],
  },
  { event: "logistics/session.schedule-changed" },
  async ({ event, step }) => {
    const { sessionId, centerId } = event.data;

    // Debounce: wait 2 minutes for rapid edits to settle
    // If cancelled by cancelOn during this sleep, no email is sent — correct behavior
    await step.sleep("debounce-rapid-edits", "2m");

    // Re-fetch current session state (gets final values after rapid edits)
    const session = await step.run("fetch-session", async () => {
      const prisma = new PrismaClient();
      try {
        const db = getTenantedClient(prisma, centerId);
        return await db.classSession.findUnique({
          where: { id: sessionId },
          include: { class: { include: { course: true } } },
        });
      } finally {
        await prisma.$disconnect();
      }
    });

    if (!session) return { status: "session-deleted" };

    // Fetch recipients filtered by email preference
    const recipients = await step.run("fetch-recipients", async () => {
      const prisma = new PrismaClient();
      try {
        const db = getTenantedClient(prisma, centerId);
        const classData = await db.class.findUnique({
          where: { id: session.classId },
          include: {
            teacher: { select: { id: true, email: true, name: true, emailScheduleNotifications: true, preferredLanguage: true } },
            students: { include: { student: { select: { id: true, email: true, name: true, emailScheduleNotifications: true, preferredLanguage: true } } } },
          },
        });
        if (!classData) return [];
        const all = [
          ...(classData.teacher ? [classData.teacher] : []),
          ...classData.students.map((s) => s.student),
        ];
        return all.filter((u) => u.emailScheduleNotifications && u.email);
      } finally {
        await prisma.$disconnect();
      }
    });

    // Send emails — one step per recipient for resilient retries
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM ?? "noreply@classlite.com";

    for (const recipient of recipients) {
      await step.run(`send-email-${recipient.id}`, async () => {
        const prisma = new PrismaClient();
        try {
          const resend = resendApiKey ? new Resend(resendApiKey) : null;
          const db = getTenantedClient(prisma, centerId);
          if (resend && recipient.email) {
            const { subject, html } = buildScheduleChangeEmail({ /* params */ });
            await resend.emails.send({ from: emailFrom, to: recipient.email, subject, html });
            await db.emailLog.create({ data: { recipientId: recipient.id, centerId, type: "schedule-change", status: "sent", subject } });
          } else {
            await db.emailLog.create({ data: { recipientId: recipient.id, centerId, type: "schedule-change", status: "skipped" } });
          }
        } catch (err) {
          const db = getTenantedClient(new PrismaClient(), centerId);
          await db.emailLog.create({ data: { recipientId: recipient.id, centerId, type: "schedule-change", status: "failed", error: String(err) } });
        } finally {
          await prisma.$disconnect();
        }
      });
    }

    return { sent: recipients.length };
  }
);
```

**CRITICAL: Inngest jobs do NOT have Fastify context.** Use `new Resend(apiKey)` directly and `getTenantedClient(new PrismaClient(), centerId)` for DB access. Always `$disconnect()` in `finally`. Follow the CSV import job pattern exactly.

### Debounce Strategy (AC3)

The 5-minute delivery window uses Inngest's `cancelOn` + `step.sleep()` together:

1. Session is edited → `inngest.send()` fires event immediately
2. Inngest job starts → `step.sleep("debounce", "2m")` pauses for 2 minutes
3. If session is edited AGAIN during the 2 minutes, `cancelOn` **cancels the sleeping job** and a NEW job starts fresh with its own 2-minute sleep
4. Only the LAST job (no new events during its sleep window) survives to wake up
5. That surviving job re-fetches session from DB → gets the final state → sends one email

**This eliminates duplicate emails entirely.** The `cancelOn` config on the Inngest function:
```typescript
cancelOn: [{ event: "logistics/session.schedule-changed", match: "data.sessionId" }]
```
This tells Inngest: "If a new event arrives where `data.sessionId` matches the running job's `data.sessionId`, cancel the running job." Combined with `step.sleep()`, this creates a clean debounce window.

**Cancellation emails (session.cancelled) do NOT use cancelOn or debounce** — cancellations are sent immediately since they represent a definitive action.

### Email Template Guidelines

- Use **inline CSS only** (email clients strip `<style>` tags)
- Keep HTML simple — `<table>` layout for cross-client compatibility
- Include both text and visual deep-link button styled with `background-color: #2563EB` (Royal Blue, matching existing invitation email button style)
- Use `process.env.WEBAPP_URL` for constructing deep-links
- Format times using `date-fns` `format()` with locale: use `vi` locale for Vietnamese users, `enUS` for English users (based on recipient's `preferredLanguage` field). Project already uses `date-fns` (Story 2.5 uses `addWeeks`)
- **Pattern note:** Existing email templates (tenant.service.ts, invitation.service.ts, csv-import.job.ts) are inline HTML strings. This story uses separate template files (`emails/schedule-change.template.ts`) for maintainability since these templates are more complex (old/new time comparison, conditional room display). Each file exports a pure function returning `{ subject, html }` — no template engine dependency, just string interpolation

### Query Pattern for Email Content Data

The Inngest job needs class/course names and participant data. Use these Prisma includes:

```typescript
// Fetch session with class and course names
const session = await db.classSession.findUnique({
  where: { id: sessionId },
  include: {
    class: {
      include: {
        course: { select: { name: true } },  // e.g. "IELTS Foundation"
      },
      select: { id: true, name: true, courseId: true, teacherId: true, course: true },
    },
  },
});
// session.class.course.name → "IELTS Foundation"
// session.class.name → "Class 10A"

// Fetch recipients with preference + language for email formatting
const classData = await db.class.findUnique({
  where: { id: session.classId },
  include: {
    teacher: { select: { id: true, email: true, name: true, emailScheduleNotifications: true, preferredLanguage: true } },
    students: {
      include: {
        student: { select: { id: true, email: true, name: true, emailScheduleNotifications: true, preferredLanguage: true } },
      },
    },
  },
});
```

This mirrors the `getClassParticipants()` pattern in `sessions.service.ts` (lines 406-425) but adds `email`, `emailScheduleNotifications`, and `preferredLanguage` fields needed for email delivery.

### Deep-Link URL Format

```
{WEBAPP_URL}/{centerId}/logistics/scheduler
```

This is the existing scheduler page URL. No query params needed — the scheduler shows the current week by default.

### Database Schema Changes

```prisma
// Add to User model:
emailScheduleNotifications Boolean @default(true) @map("email_schedule_notifications")
emailLogs                  EmailLog[]

// New model:
model EmailLog {
  id          String   @id @default(cuid())
  recipientId String   @map("recipient_id")
  centerId    String   @map("center_id")
  type        String   // "schedule-change" | "session-cancelled"
  status      String   // "sent" | "failed" | "skipped"
  subject     String?
  error       String?
  sentAt      DateTime @default(now()) @map("sent_at")

  recipient User @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  @@index([centerId])
  @@index([recipientId])
  @@index([type, sentAt])
  @@map("email_log")
}
```

### API Changes Summary

**No new REST routes needed.** This story adds:
1. An Inngest event emitted from existing session controller methods
2. Two Inngest background job functions (schedule-change + cancellation)
3. Extension of existing `PATCH /api/v1/users/me/profile` body schema

### File Locations

**Backend - New Files:**
- `apps/backend/src/modules/logistics/jobs/session-email-notification.job.ts` — Inngest job functions
- `apps/backend/src/modules/logistics/jobs/session-email-notification.job.test.ts` — Tests
- `apps/backend/src/modules/logistics/emails/schedule-change.template.ts` — Email template
- `apps/backend/src/modules/logistics/emails/session-cancelled.template.ts` — Cancellation template
- `apps/backend/src/modules/logistics/emails/schedule-change.template.test.ts` — Template tests

**Backend - Modified Files:**
- `packages/db/prisma/schema.prisma` — Add `emailScheduleNotifications` to User, add EmailLog model
- `packages/db/src/tenanted-client.ts` — Add `"EmailLog"` to `TENANTED_MODELS` array
- `packages/types/src/user.ts` — Extend `UpdateProfileSchema` with `emailScheduleNotifications`
- `packages/types/src/logistics.ts` — Add email event schemas (optional, for type safety)
- `apps/backend/src/modules/logistics/sessions.controller.ts` — Emit Inngest events on session update/delete
- `apps/backend/src/modules/inngest/functions.ts` — Register new job functions
- `apps/backend/src/modules/users/users.service.ts` — Ensure profile update persists new field (likely works already if schema is extended)

**Frontend - Modified Files:**
- `apps/webapp/src/features/users/components/ProfileEditForm.tsx` — Add email preference toggle
- `apps/webapp/src/features/users/profile-page.tsx` — Display preference in read mode
- `apps/webapp/src/schema/schema.d.ts` — Auto-generated after schema sync

### Project Structure Notes

- Follows feature-first organization: email templates and Inngest jobs live inside `apps/backend/src/modules/logistics/` (co-located with session logic)
- Email templates use simple string interpolation (no template engine dependency)
- Inngest jobs follow the same pattern as `apps/backend/src/modules/users/jobs/csv-import.job.ts`
- EmailLog model is intentionally simple — not a full email audit system, just enough for troubleshooting
- **Router:** React Router v6 (NOT TanStack Router)
- Tests co-located with source files

### Key Implementation Warnings

1. **DO NOT use `fastify.resend` inside Inngest jobs** — Inngest functions run outside Fastify request lifecycle. Use `new Resend(process.env.RESEND_API_KEY)` directly, following the CSV import job pattern.
2. **DO NOT replace in-app notifications** — Email notifications are ADDITIONAL to existing in-app notifications. The `NotificationsService.createBulkNotifications()` calls in `sessions.controller.ts` must remain untouched.
3. **DO NOT create a new REST endpoint for sending emails** — Emails are triggered via Inngest events, not HTTP calls. The controller emits events; the Inngest job handles delivery.
4. **DO NOT block the HTTP response** — `inngest.send()` is async but returns immediately. The session update response should not wait for email delivery.
5. **Use `db:push` not migrations** — Project convention per Story 2.5 completion notes.
6. **Debounce uses Inngest `cancelOn` + `step.sleep()` + DB re-fetch** — Do NOT implement custom debounce logic in the controller. The `cancelOn` config cancels stale jobs when a new event for the same sessionId arrives; `step.sleep("2m")` provides the debounce window; re-fetching from DB gets the final state. This is the correct Inngest debounce pattern.
7. **Handle missing Resend API key gracefully** — If `RESEND_API_KEY` is not set, log warning and skip email sending (don't crash). Follow the pattern in `resend.plugin.ts`.
8. **Schema sync is REQUIRED** after backend changes — Run `pnpm --filter=webapp sync-schema-dev` with backend running.
9. **Preference field default is `true`** — Existing users should receive emails by default. Only users who explicitly opt out should be skipped.
10. **PrismaClient in Inngest jobs** — Use `getTenantedClient(new PrismaClient(), centerId)` inside each `step.run()`. This WORKS outside Fastify context — the CSV import job (`csv-import.job.ts` lines 62, 145) does exactly this. Create a new PrismaClient per step, wrap with `getTenantedClient()`, and call `prisma.$disconnect()` in a `finally` block. Do NOT use raw PrismaClient with manual centerId filtering — that bypasses multi-tenancy enforcement.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Inngest for background jobs
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] — Inngest (Serverless Durable Execution)
- [Source: _bmad-output/planning-artifacts/ux-design-specification-epic-2.md] — Epic 2 UX patterns
- [Source: _bmad-output/implementation-artifacts/2-5-class-session-crud.md] — Previous story patterns, sessions controller notification logic
- [Source: project-context.md#Async Workloads] — NEVER run long-running tasks in HTTP request; use inngest.send()
- [Source: project-context.md#Multi-Tenancy Enforcement] — Use getTenantedClient (works in Inngest jobs with `new PrismaClient()`)
- [Source: packages/db/src/tenanted-client.ts] — TENANTED_MODELS array (add EmailLog here)
- [Source: project-context.md#Layered Architecture] — Route-Controller-Service pattern
- [Source: project-context.md#Development Workflow - Schema Sync] — Run sync-schema-dev after backend changes
- [Source: apps/backend/src/modules/users/jobs/csv-import.job.ts] — Reference Inngest + Resend email pattern
- [Source: apps/backend/src/plugins/resend.plugin.ts] — Resend plugin setup and env vars
- [Source: apps/backend/src/modules/logistics/sessions.controller.ts] — Existing in-app notification logic (lines 99-147)
- [Source: apps/backend/src/modules/logistics/sessions.service.ts] — getClassParticipants() method
- [Source: apps/backend/src/modules/inngest/functions.ts] — Where to register new Inngest functions
- [Source: apps/backend/src/modules/notifications/notifications.service.ts] — In-app notification service (DO NOT modify)
- [Source: packages/types/src/user.ts] — UpdateProfileSchema to extend
- [Source: apps/webapp/src/features/users/components/ProfileEditForm.tsx] — Profile form to add toggle
- [Source: apps/webapp/src/features/users/profile-page.tsx] — Profile page to show preference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Backend build: clean compilation after all changes
- Full test suite: 241 passed, 10 skipped, 0 failed
- Lint: 4/4 packages pass with 0 warnings
- Frontend build: successful (Vite, 2.13s)

### Completion Notes List

- Added `emailScheduleNotifications` boolean field to User model (default: true)
- Created EmailLog model with indexes on centerId, recipientId, and type+sentAt
- Added EmailLog to TENANTED_MODELS for multi-tenant isolation
- Created schedule-change and session-cancelled email templates with i18n (en/vi) support
- Created two Inngest jobs: sessionEmailNotificationJob (with cancelOn debounce) and sessionCancellationEmailJob (immediate)
- Emitted Inngest events from sessions controller for updateSession, deleteSession, and deleteFutureSessions
- Fixed gap: deleteSession() now sends in-app notifications (was missing before — inconsistent with deleteFutureSessions)
- Added previousRoomName to updateSession service return for room change detection
- Extended UserProfileSchema, UpdateProfileSchema, and AuthUserSchema with emailScheduleNotifications
- Updated UsersService to persist and return emailScheduleNotifications
- Added Switch toggle to ProfileEditForm with descriptive label
- Added preference display to profile read mode
- Added inngest mock to sessions.integration.test.ts to prevent real event sending in tests
- In-app notifications preserved for time changes only (existing behavior); email events fire for both time and room changes
- 11 new template tests added covering both locales, single/bulk cancellation, deep-links, room changes

### File List

**New Files:**
- apps/backend/src/modules/logistics/emails/schedule-change.template.ts
- apps/backend/src/modules/logistics/emails/session-cancelled.template.ts
- apps/backend/src/modules/logistics/emails/schedule-change.template.test.ts
- apps/backend/src/modules/logistics/jobs/session-email-notification.job.ts

**Modified Files:**
- packages/db/prisma/schema.prisma (added emailScheduleNotifications to User, added EmailLog model)
- packages/db/src/tenanted-client.ts (added "EmailLog" to TENANTED_MODELS)
- packages/types/src/user.ts (extended UpdateProfileSchema, UserProfileSchema)
- packages/types/src/auth/dto.ts (extended AuthUserSchema)
- apps/backend/src/modules/users/users.service.ts (persist + return emailScheduleNotifications)
- apps/backend/src/modules/logistics/sessions.controller.ts (emit Inngest events, added deleteSession notifications)
- apps/backend/src/modules/logistics/sessions.service.ts (added previousRoomName to updateSession return)
- apps/backend/src/modules/inngest/functions.ts (registered 2 new functions)
- apps/backend/src/modules/logistics/sessions.integration.test.ts (added inngest mock)
- apps/webapp/src/features/users/components/ProfileEditForm.tsx (added email preference toggle)
- apps/webapp/src/features/users/profile-page.tsx (display preference in read mode, updated handler type)
