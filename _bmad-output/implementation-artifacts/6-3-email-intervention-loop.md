# Story 6.3: Email Intervention Loop

Status: done

## Story

As a Teaching Owner,
I want to email a parent when a student falls behind,
so that I can prevent churn with a personal touch.

## Acceptance Criteria

1. **AC1: Contact Parent Button** — Student Profile Overlay (Story 6.2) contains a "Contact Parent" button visible to Owner/Admin only. Button is hidden for Teacher role.
2. **AC2: Email Compose Modal** — Clicking the button opens an email compose modal with:
   - "To" field pre-filled with student's parent email (if available), otherwise editable text input
   - "Subject" field pre-filled from template (editable)
   - "Body" textarea (plain text for MVP) pre-filled from auto-detected concern template variant that includes student name, specific health data (attendance %, assignment completion %, overdue count), and classes enrolled. Template variant is auto-detected from student health metrics. Owner can edit all fields before sending.
3. **AC3: Email Delivery** — System sends the email via Resend (transactional email service already configured). Uses the existing Inngest job pattern for reliable delivery with retry. Falls back gracefully if `RESEND_API_KEY` is not set (logs as "skipped").
4. **AC4: Intervention Logging** — Every intervention action is logged in a new `InterventionLog` model with: studentId, centerId, createdById, recipientEmail, subject, templateUsed, sentAt. The Student Profile Overlay shows intervention history (most recent first) in a new "Interventions" tab.

## Tasks / Subtasks

- [x] Task 1: Database schema — Add `InterventionLog` model + `parentEmail` field on User (AC: #4, #2)
  - [x] 1.1 Add `parentEmail String? @map("parent_email")` to `User` model in `schema.prisma`
  - [x] 1.2 Add `InterventionStatus` enum (`PENDING`, `SENT`, `FAILED`, `SKIPPED`) and `InterventionLog` model with fields: id, studentId, centerId, createdById, recipientEmail, subject, body, templateUsed, status (InterventionStatus enum, default PENDING), error, sentAt. Include `@@unique([id, centerId])` for tenant isolation per project convention.
  - [x] 1.3 Add relations: InterventionLog → User (student), InterventionLog → User (createdBy)
  - [x] 1.4 Run `pnpm --filter=db db:migrate:dev --name add-intervention-log-and-parent-email`
  - [x] 1.5 Run `pnpm --filter=db build` to regenerate Prisma client

- [x] Task 2: Shared types — Add Zod schemas for intervention (AC: #2, #3, #4)
  - [x] 2.1 Create `packages/types/src/intervention.ts` with schemas: `SendInterventionEmailRequest`, `InterventionLogRecord`, `InterventionHistoryResponse`, `InterventionEmailPreview`
  - [x] 2.2 Export from `packages/types/src/index.ts`

- [x] Task 3: Backend — Intervention service + email template + Inngest job (AC: #3, #4)
  - [x] 3.1 Create `apps/backend/src/modules/student-health/emails/intervention.template.ts` — HTML email with center branding, concern details, health metrics, CTA to contact center. Follow exact pattern from `logistics/emails/schedule-change.template.ts` (locale support, escapeHtml, same styling).
  - [x] 3.2 Create `apps/backend/src/modules/student-health/jobs/intervention-email.job.ts` — Inngest function that sends intervention email via Resend and logs to both `InterventionLog` and `EmailLog`. No debounce needed (interventions are deliberate one-shot actions). **MUST** add early-return guard: if `RESEND_API_KEY` is not set, update InterventionLog status to `SKIPPED`, log warning, and return `{ status: "skipped", reason: "no-api-key" }` without attempting send.
  - [x] 3.3 Register the new Inngest function in `apps/backend/src/modules/inngest/functions.ts`
  - [x] 3.4 Add `sendIntervention` method to `StudentHealthService`: validates student exists, validates recipient email, composes template data, fires Inngest event, creates InterventionLog record with status "pending"
  - [x] 3.5 Add `getInterventionHistory` method to `StudentHealthService`: returns intervention logs for a student, sorted by sentAt desc
  - [x] 3.6 Add `getEmailPreview` method to `StudentHealthService`: returns pre-filled template data (subject, body, recipientEmail, templateUsed) for the compose modal without sending. **Template auto-detection logic:** fetch student health metrics, then: if attendance % < 80 → `templateUsed: "concern-attendance"`; else if assignment completion % < 50 → `templateUsed: "concern-assignments"`; else → `templateUsed: "concern-general"`. Subject and body content vary by template variant. Returns `recipientEmail: null` if no `parentEmail` on student record.
  - [x] 3.7 Add controller methods for the 3 new service methods
  - [x] 3.8 Add routes: `POST /api/v1/student-health/interventions`, `GET /api/v1/student-health/interventions/:studentId`, `GET /api/v1/student-health/interventions/:studentId/preview`
  - [x] 3.9 Write service unit tests (8-10 tests)
  - [x] 3.10 Write route integration tests (5-6 tests)

- [x] Task 4: Frontend — Compose modal + overlay integration (AC: #1, #2, #4)
  - [x] 4.1 Create `apps/webapp/src/features/student-health/hooks/use-intervention.ts` — mutation hook for sending + query hook for history + query hook for preview
  - [x] 4.2 Add query keys to `student-health-keys.ts`
  - [x] 4.3 Create `apps/webapp/src/features/student-health/components/InterventionComposeModal.tsx` — Dialog with To, Subject, Body fields. Pre-fills from preview API. Loading/sending states. Success toast on send.
  - [x] 4.4 Create `apps/webapp/src/features/student-health/components/InterventionHistoryTab.tsx` — List of past interventions (date, recipient, subject, status badge)
  - [x] 4.5 Modify `StudentProfileOverlay.tsx`: Add "Contact Parent" button **inside SheetHeader** as a secondary button next to the health status badge (Owner/Admin only via RBAC, get role from `useAuth()` context), add "Interventions" tab as 4th tab to the existing TabsList, wire up compose modal state: `const [composeOpen, setComposeOpen] = useState(false)`
  - [x] 4.6 Write component tests for InterventionComposeModal (5 tests)
  - [x] 4.7 Write component tests for InterventionHistoryTab (3 tests)
  - [x] 4.8 Write hook tests for use-intervention (3 tests)
  - [x] 4.9 Update StudentProfileOverlay tests (2 tests: button visibility by role, tab rendering)

- [x] Task 5: Schema sync + lint + full test run (AC: all)
  - [x] 5.1 Start backend, run `pnpm --filter=webapp sync-schema-dev` to regenerate `schema.d.ts`
  - [x] 5.2 Run `pnpm lint` across monorepo
  - [x] 5.3 Run `pnpm --filter=backend test` — all must pass (803 passed)
  - [x] 5.4 Run `pnpm --filter=webapp test` — all must pass (875 passed)

## Dev Notes

### Architecture Compliance

- **Layered architecture:** Route → Controller → Service. Service handles DB + Inngest event emission. Controller formats `{ data, message }`. Route extracts params, applies auth middleware.
- **Multi-tenancy:** Use `getTenantedClient(this.prisma, centerId)` for all queries. InterventionLog has `centerId` for tenant isolation.
- **RBAC:** `POST /interventions` and `GET /preview` require `OWNER` or `ADMIN` role. `GET /interventions/:studentId` also requires `OWNER` or `ADMIN`. Use existing `requireRole(["OWNER", "ADMIN"])` preHandler pattern from Story 6.1/6.2.
- **Inngest pattern:** Fire-and-forget via `inngest.send()`. The Inngest job does the actual email sending via Resend. This prevents HTTP timeout if Resend is slow. Follow the exact pattern from `session-email-notification.job.ts`:
  - Use `step.run()` for each operation (fetch data, send email, log result)
  - Create separate `createPrisma()` instances per step (not shared)
  - Always `$disconnect()` in `finally` blocks
  - Log to `EmailLog` model with type `"intervention"` and appropriate status

### Existing Infrastructure to Reuse (DO NOT Recreate)

- **Resend integration:** Already configured in `session-email-notification.job.ts`. Use same env vars: `RESEND_API_KEY`, `EMAIL_FROM`, `WEBAPP_URL`.
- **Email template pattern:** Follow `schedule-change.template.ts` exactly — same HTML structure, same `escapeHtml()` from `logistics/emails/format-utils.ts` (import it, don't recreate), same locale support (en/vi), same center branding header (#2563EB), same responsive table layout.
- **EmailLog model:** Already exists. Reuse for delivery tracking. Add type `"intervention"` to distinguish from schedule emails.
- **format-utils.ts:** Already has `escapeHtml`, `formatDateTime`, `formatTime`, `formatDate`, `getLocale`. Import from `../../logistics/emails/format-utils.js`.
- **AppError class:** Use `AppError.notFound()`, `AppError.conflict()` etc. from `../../errors/app-error.js`.
- **StudentHealthService class:** Already exists at `apps/backend/src/modules/student-health/student-health.service.ts`. ADD methods to this class, don't create a separate service.
- **Student Profile Overlay:** Already built (`StudentProfileOverlay.tsx`). Has Sheet with Tabs (Trends, Attendance, Assignments). Add "Interventions" tab and "Contact Parent" button.
- **useStudentProfile hook:** Returns `{ profile, isLoading, isError, refetch }`. Profile includes `student.email`, `student.healthStatus`, `student.metrics`, `student.classes`.
- **Notification model:** Already exists for in-app notifications. Do NOT use it for intervention logging — interventions get their own `InterventionLog` model.

### Database Schema Details

**New enum — InterventionStatus:**
```prisma
enum InterventionStatus {
  PENDING
  SENT
  FAILED
  SKIPPED
}
```

**New model — InterventionLog:**
```prisma
model InterventionLog {
  id             String             @id @default(cuid())
  studentId      String             @map("student_id")
  centerId       String             @map("center_id")
  createdById    String             @map("created_by_id")
  recipientEmail String             @map("recipient_email")
  subject        String
  body           String             @db.Text
  templateUsed   String             @map("template_used")
  status         InterventionStatus @default(PENDING)
  error          String?
  sentAt         DateTime           @default(now()) @map("sent_at")

  student   User @relation("InterventionStudent", fields: [studentId], references: [id], onDelete: Cascade)
  createdBy User @relation("InterventionCreatedBy", fields: [createdById], references: [id], onDelete: Cascade)

  @@unique([id, centerId])
  @@index([centerId])
  @@index([studentId])
  @@index([studentId, sentAt])
  @@map("intervention_log")
}
```

**Add to User model:**
```prisma
parentEmail String? @map("parent_email")
// TODO: Story 7.3 requires max 3 parent emails per student — migrate to ParentContact model then.
// For now, single parentEmail field is sufficient for Story 6.3 owner-initiated interventions.

// Add relation fields:
interventionsReceived InterventionLog[] @relation("InterventionStudent")
interventionsCreated  InterventionLog[] @relation("InterventionCreatedBy")
```

**CRITICAL:** Add `@@map("intervention_log")` to ensure snake_case table name per project convention. All columns use `@map("snake_case")`. Add `@@unique([id, centerId])` for tenant isolation per project convention (every tenanted model has this constraint).

### Email Template Specification

**Template auto-detection:** `getEmailPreview` selects the template variant based on student health metrics:
- If attendance % < 80 → `concern-attendance` (subject emphasizes attendance)
- Else if assignment completion % < 50 → `concern-assignments` (subject emphasizes assignments)
- Else → `concern-general` (generic concern subject)

All three variants share the same body structure below but adjust the subject line and opening sentence to match the primary concern area.

**Concern template pre-fill content (English):**
```
Subject: Concern About [Student Name]'s Progress — [Center Name]

Hi,

I'm writing to share an update about [Student Name]'s recent progress at [Center Name].
```

**Health metrics section — use styled HTML table rows** (matching `schedule-change.template.ts` responsive table layout with colored left-border boxes, NOT bullet points):
```html
<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
  <tr>
    <td style="padding:10px 16px;background-color:#fef2f2;border-left:4px solid #ef4444;margin-bottom:8px;">
      <p style="margin:0;font-size:14px;">Attendance: <strong>[X]%</strong> ([attended]/[total] sessions)</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:10px 16px;background-color:#fffbeb;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:14px;">Assignment Completion: <strong>[X]%</strong> ([completed]/[total])</p>
    </td>
  </tr>
  <tr><td style="height:8px;"></td></tr>
  <tr>
    <td style="padding:10px 16px;background-color:#fef2f2;border-left:4px solid #ef4444;">
      <p style="margin:0;font-size:14px;">Overdue Assignments: <strong>[N]</strong></p>
    </td>
  </tr>
</table>
```

**Closing section:**
```
[Student Name] is currently flagged as [At Risk / Warning] based on these metrics. I'd love to discuss how we can work together to support them.

Please don't hesitate to reach out if you'd like to schedule a conversation.

Best regards,
[Owner Name]
[Center Name]
```

**Color logic for metric rows:** Use red (`#fef2f2` bg / `#ef4444` border) for metrics in "at-risk" range, amber (`#fffbeb` bg / `#f59e0b` border) for "warning" range, and green (`#f0fdf4` bg / `#10b981` border) for "on-track" range. This matches the traffic light color scheme from Story 6.1.

**Vietnamese version also required** (follow `schedule-change.template.ts` locale pattern).

### API Design

**POST /api/v1/student-health/interventions**
```typescript
// Request body
{
  studentId: string;
  recipientEmail: string;
  subject: string;
  body: string;        // Final edited body from compose modal
  templateUsed: string; // "concern-attendance" | "concern-assignments" | "concern-general"
}
// Response 201
{ data: { interventionId: string; status: "pending" }, message: "Intervention email queued" }
```

**GET /api/v1/student-health/interventions/:studentId**
```typescript
// Response 200
{ data: InterventionLogRecord[], message: "ok" }
```

**GET /api/v1/student-health/interventions/:studentId/preview**
```typescript
// Response 200
{ data: { recipientEmail: string | null; subject: string; body: string; templateUsed: "concern-attendance" | "concern-assignments" | "concern-general" }, message: "ok" }
```

### Inngest Event

```typescript
type InterventionEmailEvent = {
  name: "student-health/intervention.send";
  data: {
    interventionLogId: string;
    centerId: string;
    recipientEmail: string;
    subject: string;
    body: string;  // Already HTML-rendered from template
    senderName: string;
  };
};
```

Register in `apps/backend/src/modules/inngest/functions.ts` alongside existing jobs.

### Frontend Component Architecture

**InterventionComposeModal:**
- Uses Shadcn `<Dialog>` (not Sheet — overlay is already a Sheet, avoid nesting)
- Fields: To (email input), Subject (text input), Body (textarea — plain text is fine, no rich text needed for MVP)
- Pre-fills via `GET /preview` API call when modal opens
- Owner can edit all fields
- "Send" button triggers mutation → closes modal → success toast → refetch intervention history
- "Cancel" button closes without sending
- Disable "Send" while mutation is in-flight (loading spinner on button)

**InterventionHistoryTab:**
- Simple list of past interventions (similar to AttendanceTab pattern)
- Each row: date, recipient email, subject, status badge (sent/failed/pending)
- Empty state: "No interventions yet"

**StudentProfileOverlay modifications:**
- Add "Contact Parent" button **inside the SheetHeader**, as a secondary `variant="outline"` button next to the health status badge. This keeps the CTA visible without cluttering the metrics area below.
- Wrap in RBAC conditional: `{(userRole === "OWNER" || userRole === "ADMIN") && <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>Contact Parent</Button>}`
- Get user role from `useAuth()` context (same pattern used in RBAC throughout the app)
- Add 4th tab "Interventions" to the existing TabsList
- Wire compose modal state: `const [composeOpen, setComposeOpen] = useState(false)`

### Testing Strategy

**Backend service tests (target 10-12):**
- sendIntervention: creates log, fires Inngest event
- sendIntervention: throws 404 for non-existent student
- sendIntervention: throws 404 for student in different center
- sendIntervention: validates email format
- getInterventionHistory: returns sorted list
- getInterventionHistory: returns empty for student with no interventions
- getInterventionHistory: throws 404 for non-existent student
- getEmailPreview: returns pre-filled template with student data
- getEmailPreview: returns null recipientEmail when no parentEmail on record
- getEmailPreview: auto-detects "concern-attendance" when attendance < 80%
- getEmailPreview: auto-detects "concern-assignments" when assignments < 50% but attendance OK

**Backend integration tests (target 5-6):**
- POST /interventions returns 201 with valid payload
- POST /interventions returns 404 for unknown student
- POST /interventions requires OWNER/ADMIN role (Teacher gets 403)
- GET /interventions/:studentId returns 200 with history
- GET /interventions/:studentId/preview returns 200 with template
- Requires auth (401 for unauthenticated)

**Frontend tests (target 13):**
- InterventionComposeModal: renders pre-filled fields
- InterventionComposeModal: submits form with edited values
- InterventionComposeModal: shows loading state while sending
- InterventionComposeModal: closes on cancel
- InterventionComposeModal: disables send button while submitting
- InterventionHistoryTab: renders intervention list
- InterventionHistoryTab: shows empty state
- InterventionHistoryTab: displays correct status badges
- use-intervention: send mutation success
- use-intervention: history query returns data
- use-intervention: preview query returns data
- StudentProfileOverlay: shows Contact Parent button for OWNER
- StudentProfileOverlay: hides Contact Parent button for TEACHER

### Project Structure Notes

All new files follow existing feature-first co-location:

```
apps/backend/src/modules/student-health/
├── emails/
│   └── intervention.template.ts          ← NEW
├── jobs/
│   └── intervention-email.job.ts         ← NEW
├── student-health.service.ts             ← MODIFY (add 3 methods)
├── student-health.controller.ts          ← MODIFY (add 3 methods)
├── student-health.routes.ts              ← MODIFY (add 3 routes)
├── student-health.service.test.ts        ← MODIFY (add 8-10 tests)
├── student-health.routes.integration.test.ts ← MODIFY (add 5-6 tests)
└── index.ts                              ← NO CHANGE

apps/webapp/src/features/student-health/
├── hooks/
│   ├── student-health-keys.ts            ← MODIFY (add intervention keys)
│   ├── use-student-profile.ts            ← NO CHANGE
│   └── use-intervention.ts               ← NEW
├── components/
│   ├── StudentProfileOverlay.tsx         ← MODIFY (add button + tab + modal)
│   ├── InterventionComposeModal.tsx      ← NEW
│   └── InterventionHistoryTab.tsx        ← NEW
└── __tests__/
    ├── InterventionComposeModal.test.tsx  ← NEW
    ├── InterventionHistoryTab.test.tsx    ← NEW
    ├── use-intervention.test.ts           ← NEW
    └── StudentProfileOverlay.test.tsx     ← MODIFY (add 2 tests)

packages/types/src/
├── intervention.ts                        ← NEW
└── index.ts                               ← MODIFY (add export)

packages/db/prisma/
└── schema.prisma                          ← MODIFY (add InterventionLog + parentEmail)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.3: Email Intervention Loop]
- [Source: apps/backend/src/modules/logistics/jobs/session-email-notification.job.ts — Inngest + Resend email pattern]
- [Source: apps/backend/src/modules/logistics/emails/schedule-change.template.ts — Email template pattern]
- [Source: apps/backend/src/modules/logistics/emails/format-utils.ts — escapeHtml, formatDate utilities]
- [Source: apps/backend/src/modules/student-health/student-health.service.ts — Service class to extend]
- [Source: apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx — Overlay to modify]
- [Source: apps/backend/src/modules/inngest/functions.ts — Inngest function registration]
- [Source: packages/db/prisma/schema.prisma — EmailLog model pattern, User model]
- [Source: packages/types/src/student-health.ts — Existing type patterns]
- [Source: project-context.md — Multi-tenancy rules, layered architecture, testing standards]
- [Source: _bmad-output/implementation-artifacts/6-2-student-profile-overlay.md — Previous story learnings]
- [Source: _bmad-output/implementation-artifacts/6-1-traffic-light-dashboard.md — Epic 6 foundation patterns]

### Previous Story Intelligence

**From Story 6.2 (Student Profile Overlay):**
- Profile overlay already opens from dashboard with full student context loaded
- Root cause alert shows WHY student is at-risk/warning — use these same metrics in email template
- `useStudentProfile` hook exposes `refetch` — call after intervention sent to refresh history
- Student object includes `email` (nullable) — but does NOT include `parentEmail` yet (needs schema migration)
- RBAC: OWNER/ADMIN only for profile access — same gate applies to interventions
- Sheet overlay pattern: SheetContent side="right" className="w-full sm:max-w-xl flex flex-col"
- Tabs pattern: existing TabsList with Trends/Attendance/Assignments — add 4th "Interventions" tab
- Error/loading states already handled via `isLoading`/`isError`/`refetch` pattern

**From Story 6.1 (Traffic Light Dashboard):**
- Health computation algorithm: attendance thresholds (80/90), assignment completion thresholds (50/75)
- Use the exact same metric values in email template pre-fill
- Color scheme: red (at-risk), amber (warning), emerald (on-track) — use in status badges
- Service class pattern: constructor takes PrismaClient, methods take centerId first

**Code review patterns to follow:**
- Always assert both statusCode and message in route tests (use `toMatchObject`)
- Expose `refetch` from hooks for retry functionality
- Use `React.memo` for list items that could re-render frequently

### Git Intelligence

Recent commits show consistent patterns:
- Commit format: `feat: Story X-Y — Title with code review fixes`
- Full-stack stories: types → schema → backend → frontend → tests
- All 787+ backend tests and 860+ frontend tests must continue passing
- Lint must be clean

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (claude-opus-4-6) — BMAD Dev Agent (Amelia)

### Debug Log References
- Fixed `z.string().email()` → `z.email()` for Zod v4 compatibility in `packages/types/src/intervention.ts`
- Fixed `payload.userId` → `payload.uid` in POST /interventions route (jwtPayload uses `uid`)
- Removed unused `senderName` destructuring from `intervention-email.job.ts`
- Fixed `templateUsed` type from `string` to union `"concern-attendance" | "concern-assignments" | "concern-general"` after schema.d.ts regeneration
- Added `useAuth` and `use-intervention` mocks to `StudentHealthDashboard.test.tsx` (broke after StudentProfileOverlay started using useAuth)

### Completion Notes List
- All 5 tasks completed across database, types, backend, frontend, and integration
- Backend: 803 tests pass (32 service + 15 integration for student-health)
- Frontend: 876 tests pass (5 compose modal + 3 history tab + 4 hook + 9 overlay)
- Lint: clean across monorepo
- Schema.d.ts regenerated with new intervention endpoints
- Migration applied: `20260218081939_add_intervention_log_and_parent_email`

### Senior Developer Review (AI)

**Review Date:** 2026-02-18
**Review Outcome:** Changes Requested (7 issues found — all fixed)

**Issues Found:** 2 High, 3 Medium, 2 Low

**Action Items (all resolved):**
- [x] [HIGH] AC2 violation: Email body pre-filled raw HTML in plain text textarea — Fixed: added `buildInterventionEmailPreviewText()` for plain text preview, `wrapPlainTextInEmailHtml()` for send-time HTML wrapping
- [x] [HIGH] Missing error handling in compose modal `handleSend()` — Fixed: added try/catch with `toast.error()` fallback
- [x] [MED] Missing `useSendIntervention` test specified in Dev Notes — Fixed: added send mutation test (frontend tests now 876)
- [x] [MED] Dead `senderName` field in Inngest event payload — Fixed: removed from event type, service sender lookup, and event emission
- [x] [MED] No client-side email validation before submit — Fixed: added regex validation, button disabled for invalid email format
- [x] [LOW] `sentAt` semantics misleading for non-sent records — Accepted (matches story spec, noted for future)
- [x] [LOW] Preview query key hierarchy causes unnecessary invalidation — Accepted (minor, no user impact)

### Change Log
- Added `parentEmail` field to User model for parent contact
- Added `InterventionStatus` enum and `InterventionLog` model with full tenant isolation
- Created HTML email template with 3 concern variants (attendance/assignments/general) in en/vi
- Created Inngest job for reliable email delivery with Resend (RESEND_API_KEY guard)
- Added 3 service methods: sendIntervention, getInterventionHistory, getEmailPreview
- Added 3 API routes: POST /interventions, GET /interventions/:studentId, GET /interventions/:studentId/preview
- Created InterventionComposeModal component with pre-fill from preview API
- Created InterventionHistoryTab component with status badges
- Modified StudentProfileOverlay: "Contact Parent" button (OWNER/ADMIN), 4th "Interventions" tab
- Created use-intervention hooks (history, preview, send mutation)
- Addressed code review findings — 7 items resolved (Date: 2026-02-18)

### File List

**New files:**
- `packages/types/src/intervention.ts` — Zod schemas for intervention types
- `apps/backend/src/modules/student-health/emails/intervention.template.ts` — HTML email template (en/vi, 3 variants)
- `apps/backend/src/modules/student-health/jobs/intervention-email.job.ts` — Inngest email delivery job
- `apps/webapp/src/features/student-health/hooks/use-intervention.ts` — TanStack Query hooks
- `apps/webapp/src/features/student-health/components/InterventionComposeModal.tsx` — Email compose dialog
- `apps/webapp/src/features/student-health/components/InterventionHistoryTab.tsx` — History list component
- `apps/webapp/src/features/student-health/__tests__/InterventionComposeModal.test.tsx` — 5 component tests
- `apps/webapp/src/features/student-health/__tests__/InterventionHistoryTab.test.tsx` — 3 component tests
- `apps/webapp/src/features/student-health/__tests__/use-intervention.test.ts` — 3 hook tests
- `packages/db/prisma/migrations/20260218081939_add_intervention_log_and_parent_email/migration.sql` — DB migration

**Modified files:**
- `packages/db/prisma/schema.prisma` — Added InterventionStatus enum, InterventionLog model, parentEmail on User
- `packages/types/src/index.ts` — Added intervention export
- `apps/backend/src/modules/inngest/functions.ts` — Registered interventionEmailJob
- `apps/backend/src/modules/student-health/student-health.service.ts` — Added 3 service methods
- `apps/backend/src/modules/student-health/student-health.controller.ts` — Added 3 controller methods
- `apps/backend/src/modules/student-health/student-health.routes.ts` — Added 3 routes
- `apps/backend/src/modules/student-health/student-health.service.test.ts` — Added 10 service tests
- `apps/backend/src/modules/student-health/student-health.routes.integration.test.ts` — Added 6 integration tests
- `apps/webapp/src/features/student-health/hooks/student-health-keys.ts` — Added intervention query keys
- `apps/webapp/src/features/student-health/components/StudentProfileOverlay.tsx` — Contact Parent button + Interventions tab
- `apps/webapp/src/features/student-health/__tests__/StudentProfileOverlay.test.tsx` — Added 2 tests + auth mock
- `apps/webapp/src/features/student-health/__tests__/StudentHealthDashboard.test.tsx` — Added auth + intervention mocks
- `apps/webapp/src/schema/schema.d.ts` — Regenerated with intervention endpoints
