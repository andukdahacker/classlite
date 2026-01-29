---
stepsCompleted:
  [
    step-01-init,
    step-02-discovery,
    step-03-success,
    step-04-journeys,
    step-05-domain,
    step-06-innovation,
    step-07-project-type,
    step-08-scoping,
    step-09-functional,
    step-10-nonfunctional,
    step-11-polish,
    step-12-complete,
    step-13-epics-generation,
    step-14-stories-refinement,
    step-15-completeness-review,
  ]
lastEdited: "2026-01-29"
editHistory:
  - date: "2026-01-29"
    changes: "Added 15 new stories and updated 5 existing stories to close gaps: Login/Auth (1.6-1.7), User Management (1.8-1.10), Navigation (1.11), Session CRUD (2.5), Email Notifications (2.6), Exercise Library (3.4-3.5), Grading Queue (5.5), Student Feedback View (5.6), Teacher Health View (6.4), Zalo Linking (7.3), i18n (8.4), Golden Sample UI (8.5)."
  - date: "2026-01-29"
    changes: "Major Epic 3 expansion for IELTS Exercise Builder: Added FR37-FR42 to inventory. Expanded from 5 to 16 stories covering all IELTS question types (Reading R1-R14, Listening L1-L6, Writing W1-W3, Speaking S1-S3), audio upload/playback, timer functionality, answer key variants, skill/band tagging, AI content generation, and mock test assembly."
inputDocuments:
  [
    "_bmad-output/planning-artifacts/prd.md",
    "_bmad-output/planning-artifacts/information-architecture.md",
    "_bmad-output/planning-artifacts/ux-design-specification.md",
  ]
---

# Epics & User Stories - ClassLite

This document defines the high-level Epics and granular User Stories for ClassLite, ensuring 100% coverage of functional and non-functional requirements.

---

## 1. Requirements Inventory

### 1.1 Functional Requirements (FR)

| ID       | Actor              | Action | Requirement                                                                   |
| :------- | :----------------- | :----- | :---------------------------------------------------------------------------- |
| **FR1**  | Visitor            | Can    | Sign up their own center or login via Google/Email.                           |
| **FR2**  | Platform Admin     | Can    | Manually provision new tenants.                                               |
| **FR3**  | Center Owner/Admin | Can    | Invite users via email with auto-expiring links.                              |
| **FR4**  | System             | Shall  | Enforce RBAC based on Role (Owner, Admin, Teacher, Student).                  |
| **FR5**  | System             | Shall  | Enforce logical data isolation via tenant identifiers.                        |
| **FR6**  | Center Owner/Admin | Can    | Configure center settings (Name, Logo, Timezone).                             |
| **FR7**  | Admin              | Can    | Manage Courses and Class Sessions (CRUD).                                     |
| **FR8**  | Admin              | Can    | Assign Teachers and Students to Classes.                                      |
| **FR9**  | User               | Can    | View a visual Weekly Schedule of assigned classes.                            |
| **FR10** | System             | Shall  | Detect and warn of resource conflicts (Room/Teacher) during scheduling.       |
| **FR11** | Teacher            | Can    | Mark student attendance (Present/Absent).                                     |
| **FR12** | System             | Shall  | Notify participants of schedule changes within 30 seconds.                    |
| **FR13** | Teacher            | Can    | Create exercises using a Manual Builder (Rich Text, MCQ, Fill-in-Blank).      |
| **FR14** | Teacher            | Can    | Upload PDF/Word docs to trigger AI exercise generation.                       |
| **FR15** | Teacher            | Can    | Edit AI-generated content before publishing.                                  |
| **FR16** | Teacher            | Can    | Assign exercises to classes or individuals with due dates.                    |
| **FR17** | Student            | Can    | View "Due Soon" assignments on their dashboard.                               |
| **FR18** | Student            | Can    | Submit assignments via a mobile-responsive interface.                         |
| **FR19** | System             | Shall  | Auto-save student work-in-progress every 3 seconds to local storage.          |
| **FR20** | System             | Shall  | Trigger AI analysis within 5 seconds of submission.                           |
| **FR21** | Teacher            | Can    | Use a split-screen interface (Student Work / AI Analysis) for grading.        |
| **FR22** | Teacher            | Can    | View visual "Evidence Anchors" connecting AI comments to text evidence.       |
| **FR23** | Teacher            | Can    | Apply AI suggestions (score + grammar fix) with one click.                    |
| **FR24** | System             | Shall  | Maintain comment anchors if < 20% of text is modified; orphan if > 50%.       |
| **FR25** | Teacher            | Can    | Reject AI suggestions, removing them from final feedback.                     |
| **FR26** | System             | Shall  | Auto-advance to the next submission upon approval.                            |
| **FR27** | Owner/Admin        | Can    | View "Student Health Dashboard" with Traffic Light (Red/Yellow/Green) status. |
| **FR28** | Owner/Admin        | Can    | Open Student Profile Overlay from dashboard without page reload.              |
| **FR29** | Owner/Admin        | Can    | Initiate interventions via Zalo Deep Links with pre-filled templates.         |
| **FR30** | System             | Shall  | Send automated Zalo notifications for Personal Bests or streaks.              |
| **FR31** | Parent/User        | Can    | Manage Zalo notification preferences.                                         |
| **FR32** | Owner              | Can    | Upload "Golden Sample" feedback to tune AI pedagogical style.                 |
| **FR33** | System             | Shall  | Utilize Few-Shot Prompting using Golden Samples for > 85% style alignment.    |
| **FR34** | System             | Shall  | Display persistent "Do Not Close" warning banner during offline submissions.  |
| **FR35** | System             | Shall  | Queue failed submissions and auto-retry upon network reconnection.            |
| **FR36** | System             | Shall  | Screen content for compliance with local regulations (Decree 72/2013/ND-CP).  |
| **FR37** | Teacher            | Can    | Upload audio files (MP3/WAV/M4A, max 100MB) for Listening exercises.          |
| **FR38** | Teacher            | Can    | Set time limits on exercises with auto-submit on expiry.                      |
| **FR39** | Teacher            | Can    | Assemble exercises into Mock Tests with sections and unified scoring.         |
| **FR40** | Teacher            | Can    | Define answer keys with acceptable variants for auto-grading.                 |
| **FR41** | Teacher            | Can    | Tag exercises by Skill, Target Band Level, and Topic.                         |
| **FR42** | System             | Shall  | Provide IELTS band descriptor rubrics for Writing/Speaking scoring.           |

### 1.2 Non-Functional Requirements (NFR)

| ID        | Criterion      | Metric         | Method                | Context                                         |
| :-------- | :------------- | :------------- | :-------------------- | :---------------------------------------------- |
| **NFR1**  | Performance    | < 500ms        | P95 Response Time     | Grading Workbench auto-advance load.            |
| **NFR2**  | Performance    | < 1 second     | UI Rendering Time     | Dashboard "Traffic Light" widget updates.       |
| **NFR3**  | Availability   | 99.9%          | Uptime Monitoring     | Business hours (8 AM - 10 PM GMT+7).            |
| **NFR4**  | Data Integrity | 3s Interval    | Background Sync       | Persistent client-side storage for submissions. |
| **NFR5**  | Security       | 100% Isolation | Middleware Validation | Prevention of cross-tenant data access.         |
| **NFR6**  | Privacy        | AES-256        | Encryption-at-rest    | Protection of sensitive PII and student grades. |
| **NFR7**  | Accessibility  | 100% Compliant | Viewport Audit        | Responsiveness for viewports >= 375px.          |
| **NFR8**  | i18n           | Dual-Language  | User Toggle           | Support for English and Vietnamese UI.          |
| **NFR9**  | Accessibility  | WCAG 2.1 AA    | Accessibility Audit   | All public-facing interfaces and forms.         |
| **NFR10** | Usability      | Keyboard-Only  | Workflow Audit        | Entire Grading Loop executable via keyboard.    |
| **NFR11** | Usability      | High-Contrast  | Visual Audit          | Focus indicators on all interactive elements.   |

---

## 2. FR Coverage Map

| Epic       | Description                           | Functional Requirements Covered                    |
| :--------- | :------------------------------------ | :------------------------------------------------- |
| **Epic 1** | Tenant & User Management              | FR1, FR2, FR3, FR4, FR5, FR6                       |
| **Epic 2** | Logistics & Scheduling                | FR7, FR8, FR9, FR10, FR11, FR12                    |
| **Epic 3** | IELTS Exercise Builder & Content      | FR13, FR14, FR15, FR16, FR17, FR37, FR38, FR39, FR40, FR41, FR42 |
| **Epic 4** | Student Submission & Offline-Proofing | FR18, FR19, FR34, FR35                             |
| **Epic 5** | AI Grading Workbench                  | FR20, FR21, FR22, FR23, FR24, FR25, FR26           |
| **Epic 6** | Student Health & Intervention         | FR27, FR28, FR29                                   |
| **Epic 7** | Zalo Integration & Notifications      | FR30, FR31                                         |
| **Epic 8** | Platform Compliance & Methodology     | FR32, FR33, FR36                                   |

---

## 3. Epic List

### Epic 1: Tenant & User Management

**Summary:** Provides the foundation for multi-tenancy, authentication, and access control. Ensures that center owners can setup their environment and manage their staff/students securely within isolated data boundaries.

### Epic 2: Logistics & Scheduling

**Summary:** Streamlines center operations through visual class management and scheduling. Includes automated conflict detection and real-time notifications to ensure logistical harmony.

### Epic 3: IELTS Exercise Builder & Content

**Summary:** A comprehensive IELTS-focused exercise builder supporting all official question types for Reading (13 types), Listening (6 types with audio), Writing (3 task types with rubrics), and Speaking (3 parts). Features AI-assisted question generation, flexible answer key management with variant support, time limits, skill/band tagging, and mock test assembly for realistic test simulation.

### Epic 4: Student Submission & Offline-Proofing

**Summary:** Delivers a bulletproof submission experience for students. Focuses on mobile responsiveness and robust offline-first safeguards to ensure zero data loss on unstable networks.

### Epic 5: AI Grading Workbench

**Summary:** The core "High-Velocity Pedagogy" feature. A specialized interface for rapid-fire grading where AI drafts feedback and teachers validate it through a highly optimized "Review -> Adjust -> Approve" loop.

### Epic 6: Student Health & Intervention

**Summary:** Provides owners with "Glanceable Intelligence" via a Traffic Light dashboard. Enables 3-click interventions by connecting performance data to communication channels.

### Epic 7: Zalo Integration & Notifications

**Summary:** Automates student and parent engagement through Vietnam's primary messaging platform. Focuses on positive reinforcement (streaks, personal bests) and preference management.

### Epic 8: Platform Compliance & Methodology

**Summary:** Ensures the platform adheres to local regulations (Decree 13, Decree 72) and maintains the center's specific teaching style through AI customization (Golden Samples).

---

## 4. User Stories

### Epic 1: Tenant & User Management

#### Story 1.1: Multi-tenant Onboarding (FR1, FR2, FR5)

**As a** new Teaching Owner,
**I want to** register my center and receive a logically isolated environment,
**So that** my data is never visible to other centers.

- **AC1:** User can sign up via Email/Password or Google OAuth.
- **AC2:** System creates a unique tenant identifier (centerId) for the new center.
- **AC3:** All database queries and API requests are automatically scoped by centerId via middleware.
- **AC4:** Unauthorized users receive 403 Forbidden when attempting to access a different center's data.

#### Story 1.2: Center Branding & Identity (FR6)

**As a** Center Owner,
**I want to** configure my center's name, logo, and timezone,
**So that** the platform reflects my brand to students and staff.

- **AC1:** Owner can upload a logo (max 2MB, PNG/JPG).
- **AC2:** UI updates primary CSS variables to match brand identity upon save.
- **AC3:** Center name and logo appear in the navigation rail for all users of that tenant.

#### Story 1.3: User Invitation & RBAC (FR3, FR4)

**As a** Center Admin,
**I want to** invite staff and students via email with specific roles,
**So that** they can access the platform with appropriate permissions.

- **AC1:** Admin can send an invitation link to an email with a selected role (Teacher, Student, Admin).
- **AC2:** Invitation links expire after 48 hours.
- **AC3:** System restricts access to UI elements and API routes based on the assigned role.
- **AC4:** Admin can deactivate a user, immediately revoking their access tokens.

#### Story 1.4: Universal UI Access Control (RBACWrapper)

**As a** Developer,
**I want to** use a universal RBAC wrapper for all UI components,
**So that** access control is enforced consistently and maintenance is reduced.

- **AC1:** Implement a reusable higher-order component (RBACWrapper).
- **AC2:** Component conditionally renders children based on `requiredPermission`.
- **AC3:** Support "Disabled" or "Hidden" states for unauthorized roles.

#### Story 1.5: Unified Dashboard Shell (FR9, FR17, FR27)

**As a** User (Owner, Admin, Teacher, Student),
**I want to** land on a dashboard tailored to my role after login,
**So that** I can immediately see the most important information for my daily tasks.

- **AC1: 3-Column Responsive Layout:** Implement a shell with a **Navigation Rail** (Left), **Main Content Area** (Center), and a collapsible **AI Sidebar** (Right). Sidebar collapses on tablets; Navigation Rail moves to a **Bottom Bar** on mobile (< 768px).
- **AC2: Role-Based Routing:** Configure `/:centerId/dashboard` to dynamically render role-specific layouts based on the `role` claim (Owner: Health, Teacher: Queue, Student: Tasks).
- **AC3: Global Status & Identity:** Display Center Logo/Name (from Story 1.2) and the **Offline/Sync Status Indicator** in the top bar with the "Writing Feather" animation.
- **AC4: Design System Fidelity:** Apply the "Electric Focus" theme (Royal Blue #2563EB) and `Outfit/Inter` font stacks with a `0.75rem` (12px) border radius.
- **AC5: Performance:** Ensure the shell renders in < 300ms (pre-widget load) with professional empty states for new tenants.
- **AC6: User Menu:** Top bar displays user avatar/name with dropdown containing: My Profile, Language (EN/VI toggle), Log Out.

#### Story 1.6: Login Page & Session Management (FR1)

**As a** returning User,
**I want to** log into ClassLite with my credentials,
**So that** I can access my center's dashboard securely.

- **AC1: Login Form:** Display login page at `/login` with Email/Password fields and "Sign in with Google" button.
- **AC2: Credential Validation:** On valid credentials, issue JWT access token (15min) + refresh token (7 days). Redirect to `/:centerId/dashboard`.
- **AC3: Error States:** Display inline error for invalid credentials ("Email or password is incorrect"). Lock account after 5 failed attempts for 15 minutes.
- **AC4: Session Persistence:** "Remember me" checkbox extends refresh token to 30 days.
- **AC5: Session Expiry Handling:** When access token expires mid-session, silently refresh using refresh token. If refresh fails, redirect to `/login` with "Session expired" message.
- **AC6: Logout:** User menu contains "Log out" action that invalidates tokens and redirects to `/login`.
- **AC7: Auth Redirects:** Unauthenticated users accessing protected routes are redirected to `/login?redirect={original_path}`.

#### Story 1.7: Password Reset Flow (FR1)

**As a** User who forgot their password,
**I want to** reset my password via email,
**So that** I can regain access to my account.

- **AC1: Forgot Password Link:** Login page displays "Forgot password?" link leading to `/forgot-password`.
- **AC2: Email Request:** User enters email. System sends reset link if account exists. Always display "If an account exists, you'll receive an email" (prevent enumeration).
- **AC3: Reset Link:** Email contains single-use link valid for 1 hour. Link format: `/reset-password?token={secure_token}`.
- **AC4: New Password Form:** Reset page requires new password (min 8 chars, 1 uppercase, 1 number) with confirmation field.
- **AC5: Token Validation:** Expired or already-used tokens display "This link has expired. Please request a new one."
- **AC6: Success Confirmation:** After successful reset, redirect to `/login` with "Password updated successfully" toast.

#### Story 1.8: User Management Interface (FR3, FR4)

**As a** Center Admin,
**I want to** view and manage all users in my center from a dedicated screen,
**So that** I can oversee access and roles efficiently.

- **AC1: User List View:** Display paginated table at `/:centerId/settings/users` with columns: Name, Email, Role, Status (Active/Deactivated), Last Active, Actions.
- **AC2: Search & Filter:** Provide search by name/email and filter by role (Owner, Admin, Teacher, Student) and status.
- **AC3: Invite User Action:** "Invite User" button opens modal with email input, role dropdown, and optional personal message.
- **AC4: Pending Invitations Tab:** Display list of outstanding invitations with status (Pending/Expired), sent date, and actions (Resend, Revoke).
- **AC5: User Actions Menu:** Each row has actions: View Profile, Change Role (Owner only), Deactivate, Reactivate.
- **AC6: Role Change Confirmation:** Changing a user's role requires confirmation modal explaining permission changes.
- **AC7: Deactivation Effect:** Deactivated users immediately lose access; their sessions are invalidated; they appear greyed out in the list.
- **AC8: Bulk Selection:** Checkbox selection enables bulk actions (Deactivate, Send Reminder Email).

#### Story 1.9: User Profile Self-Service

**As a** User,
**I want to** view and edit my own profile information,
**So that** I can keep my details current without admin help.

- **AC1: Profile Access:** User menu contains "My Profile" link leading to `/:centerId/profile`.
- **AC2: Editable Fields:** User can edit: Display Name, Profile Photo (max 1MB), Phone Number, Preferred Language (EN/VI).
- **AC3: Read-Only Fields:** Email and Role are displayed but not editable (email change requires admin).
- **AC4: Password Change:** "Change Password" section requires current password + new password with confirmation.
- **AC5: Save Confirmation:** Changes save immediately with success toast. Password change triggers logout of other sessions.
- **AC6: Delete Account:** "Delete My Account" button (for non-Owners) triggers confirmation flow with 7-day grace period.

#### Story 1.10: CSV Bulk User Import (FR3)

**As a** Center Owner,
**I want to** import users from a CSV file,
**So that** I can onboard an entire class roster quickly.

- **AC1: Import Access:** "Import CSV" button appears in User Management (Story 1.8) for Owner/Admin roles.
- **AC2: Template Download:** Provide downloadable CSV template with columns: Email, Name, Role (Teacher/Student).
- **AC3: File Upload:** Accept .csv files up to 5MB. Display parsing preview showing first 5 rows.
- **AC4: Validation Report:** Before import, display validation summary: X valid, Y duplicates (existing emails), Z errors (invalid format).
- **AC5: Selective Import:** User can deselect invalid/duplicate rows before confirming import.
- **AC6: Batch Invitations:** On confirm, system sends invitation emails to all valid new users. Display progress indicator.
- **AC7: Import History:** Log imports in an audit table showing date, user count, imported by.

#### Story 1.11: Navigation Structure & Information Architecture

**As a** User,
**I want to** navigate the application intuitively based on my role,
**So that** I can find features without confusion.

- **AC1: Navigation Rail Items by Role:**

| Nav Item | Owner | Admin | Teacher | Student |
|----------|-------|-------|---------|---------|
| Dashboard | Yes | Yes | Yes | Yes |
| Schedule | Yes | Yes | Yes | Yes |
| Classes | Yes | Yes | Yes (Read) | No |
| Exercises | Yes | Yes | Yes | No |
| Grading | Yes | Yes | Yes | No |
| Students | Yes | Yes | Own Only | No |
| Settings | Yes | Yes | No | No |
| My Profile | Yes | Yes | Yes | Yes |

- **AC2: Active State:** Current nav item is highlighted with Royal Blue (#2563EB) background.
- **AC3: Mobile Bottom Bar:** On viewports < 768px, nav rail converts to bottom bar showing top 4 items + "More" overflow menu.
- **AC4: Breadcrumbs:** Sub-pages display breadcrumb trail (e.g., Settings > Users > John Doe).
- **AC5: Settings Sub-Navigation:** Settings page has sidebar tabs: General, Users, Integrations, Privacy, Billing (future).

---

### Epic 2: Logistics & Scheduling

#### Story 2.1: Course & Class Management (FR7, FR8)

**As a** Center Admin,
**I want to** define courses and create specific class rosters,
**So that** I can organize students into learning cohorts.

- **AC1:** User can CRUD Courses (e.g., "IELTS Foundation") and Classes (e.g., "Class 10A").
- **AC2:** User can assign a primary teacher and multiple students to a Class.
- **AC3:** Rosters are searchable and filterable by name or enrollment status.

#### Story 2.2: Visual Weekly Scheduler (FR9, FR12)

**As a** Teacher or Student,
**I want to** see a visual calendar of my upcoming classes,
**So that** I can plan my week without checking spreadsheets.

- **AC1:** System displays a weekly grid view (Monday-Sunday) populated with assigned class sessions.
- **AC2:** Clicking a session displays location (Room/Link), time, and roster size.
- **AC3:** If a session time is updated, all participants receive an in-app notification in < 30 seconds.
- **AC4: Admin Edit Mode:** When viewed by Admin, sessions are clickable/draggable to edit (triggers Story 2.5). When viewed by Teacher/Student, sessions are read-only with view-only click behavior.

#### Story 2.3: Conflict Detection (FR10)

**As a** Center Admin,
**I want to** be warned if I double-book a teacher or room,
**So that** I avoid logistical failures during class hours.

- **AC1:** During session creation/edit, system checks for overlaps in the same room or for the same teacher.
- **AC2:** A non-blocking visual warning banner appears if a conflict is detected.
- **AC3:** System suggests the next available time slot or alternative room.

#### Story 2.4: Attendance Tracking (FR11)

**As a** Teacher,
**I want to** mark attendance for my class sessions,
**So that** student engagement records are kept up to date.

- **AC1:** Teacher can toggle "Present", "Absent", or "Late" status for each student in a session.
- **AC2:** Attendance data is saved immediately and reflects on the Student Health Dashboard.
- **AC3: Attendance Access:** Teacher accesses attendance from: (a) clicking a session on the Weekly Scheduler, or (b) Class detail page > Sessions tab.
- **AC4: Bulk Attendance:** "Mark All Present" and "Mark All Absent" buttons for quick bulk actions.

#### Story 2.5: Class Session CRUD (FR7, FR10)

**As a** Center Admin,
**I want to** create, edit, and delete class sessions,
**So that** I can build and maintain the weekly schedule.

- **AC1: Create Session:** From weekly scheduler (Story 2.2), Admin can click empty time slot or "Add Session" button to open session form.
- **AC2: Session Form Fields:** Form includes: Class (dropdown), Date, Start Time, End Time, Room (text or dropdown of saved rooms), Teacher (dropdown), Recurrence (None, Weekly, Bi-weekly).
- **AC3: Drag-to-Create:** Admin can click-and-drag on the calendar grid to create a session with pre-filled date/time.
- **AC4: Edit Session:** Clicking existing session opens edit modal. Changes trigger conflict detection (Story 2.3).
- **AC5: Delete Session:** Delete action requires confirmation. Recurring sessions prompt: "Delete this session only" or "Delete all future sessions".
- **AC6: Recurring Sessions:** Creating a recurring session generates instances for 12 weeks. Each instance can be individually modified.
- **AC7: Room Management:** Settings includes a "Rooms" sub-section where Admin can define room names for dropdown population.
- **AC8: Participant Sync:** Creating/editing sessions automatically updates participant schedules (Teachers and Students assigned to the Class).

#### Story 2.6: Schedule Change Notifications - Email (FR12)

**As a** Class participant (Teacher/Student),
**I want to** receive an email when my class schedule changes,
**So that** I don't miss updates even when not logged in.

- **AC1: Email Trigger:** When a session's date, time, or room is modified, system queues email to all assigned participants.
- **AC2: Email Content:** Email includes: Class name, Old datetime, New datetime, Room, and deep-link to schedule view.
- **AC3: Delivery Timing:** Email is sent within 5 minutes of the change (batch to prevent spam for rapid edits).
- **AC4: Cancellation Notice:** Deleted sessions trigger "Class Cancelled" email with original session details.
- **AC5: Email Preferences:** User Profile (Story 1.9) includes toggle "Email me schedule changes" (default: On).
- **AC6: Delivery Logging:** System logs email delivery status for admin troubleshooting.

---

### Epic 3: IELTS Exercise Builder & Content

#### Story 3.1: Exercise Builder Core & Passage Management (FR13)

**As a** Teacher,
**I want to** create IELTS exercises with reading passages and question sections,
**So that** I can build realistic test-like content.

- **AC1: Exercise Structure:** An exercise consists of: Title, Instructions, optional Passage (for Reading/Listening), and one or more Question Sections.
- **AC2: Passage Editor:** Rich text editor for Reading passages with paragraph numbering (A, B, C...) for Matching Headings/Information questions.
- **AC3: Question Section:** Each section has a type (from IELTS taxonomy), instructions, and questions. Multiple sections per exercise allowed.
- **AC4: Preview Mode:** Teacher can preview exercise exactly as students will see it, including all interactions.
- **AC5: Save States:** Auto-save every 30 seconds. Manual "Save Draft" and "Publish" actions.
- **AC6: Skill Selection:** Exercise creation starts with skill selection: Reading, Listening, Writing, or Speaking.

#### Story 3.2: Reading Question Types - Basic (FR13, FR40)

**As a** Teacher,
**I want to** create standard IELTS Reading question types,
**So that** students can practice the most common formats.

**MVP Question Types (R1-R8):**

- **AC1: Multiple Choice Single (R1):** Create questions with 4 options (A-D). Teacher marks one correct answer. Student sees radio buttons.
- **AC2: Multiple Choice Multi (R2):** Create questions requiring 2-3 correct selections from 5-7 options. Teacher specifies how many to select. Student sees checkboxes with selection limit enforced.
- **AC3: True/False/Not Given (R3):** Create statement list. Teacher marks each as T, F, or NG. Student sees 3-option radio per statement.
- **AC4: Yes/No/Not Given (R4):** Identical UI to TFNG but with Y/N/NG labels. Used for opinion-based passages.
- **AC5: Sentence Completion (R5):** Create sentences with blanks. Teacher provides correct answers with word limit (1-3 words). Student sees text inputs.
- **AC6: Short Answer (R6):** Create questions requiring brief answers from passage. Teacher sets word limit and correct answers.
- **AC7: Summary Completion - Word Bank (R7):** Create summary with blanks + word bank. Teacher defines blank positions and correct word for each. Student sees dropdowns or drag-drop.
- **AC8: Summary Completion - Passage (R8):** Create summary with blanks (no word bank). Teacher provides answers. Student types words from passage.

#### Story 3.3: Reading Question Types - Matching (FR13, FR40)

**As a** Teacher,
**I want to** create IELTS Matching question types,
**So that** students can practice paragraph and feature matching.

**Phase 1.5 Question Types (R9-R12):**

- **AC1: Matching Headings (R9):** Teacher creates list of headings (more than paragraphs). Links each paragraph to correct heading. Student sees drag-drop or dropdown per paragraph.
- **AC2: Matching Information (R10):** Teacher creates statements and links each to a paragraph letter. Student matches statements to paragraphs.
- **AC3: Matching Features (R11):** Teacher creates items (e.g., researchers) and categories (e.g., findings). Maps items to categories. Student sees dropdowns.
- **AC4: Matching Sentence Endings (R12):** Teacher creates sentence beginnings and endings (more endings than beginnings). Links correct pairs. Student completes sentences.
- **AC5: Distractor Management:** For all matching types, teacher can add extra options (distractors) that aren't correct answers.

#### Story 3.4: Reading Question Types - Advanced (FR13, FR40)

**As a** Teacher,
**I want to** create diagram and flow-chart questions,
**So that** students can practice visual-based IELTS questions.

**Phase 2 Question Types (R13-R14):**

- **AC1: Note/Table/Flow-chart Completion (R13):** Teacher creates visual structure (table/flowchart) with blank cells. Defines answers per blank. Student fills text inputs in visual layout.
- **AC2: Diagram Labelling (R14):** Teacher uploads image, positions label markers on it, and defines correct labels. Student types labels or selects from bank.
- **AC3: Visual Editor:** Drag-and-drop editor for positioning blanks on images/diagrams.

#### Story 3.5: Answer Key Management (FR40)

**As a** Teacher,
**I want to** define flexible answer keys with acceptable variants,
**So that** auto-grading handles spelling differences and synonyms fairly.

- **AC1: Primary Answer:** Each blank/question has one primary correct answer.
- **AC2: Accepted Variants:** Teacher can add alternative accepted answers (e.g., "19" also accepts "nineteen", "UK" also accepts "United Kingdom").
- **AC3: Case Sensitivity:** Toggle per exercise: case-sensitive or case-insensitive matching (default: insensitive).
- **AC4: Whitespace Handling:** Leading/trailing spaces automatically trimmed. Internal spacing normalized.
- **AC5: Word Order:** For multi-word answers, toggle for strict order vs any order.
- **AC6: Partial Credit:** Optional partial credit for multi-select questions (e.g., 2/3 correct = 66%).
- **AC7: Bulk Variant Import:** Paste comma-separated variants for quick entry.

#### Story 3.6: Listening Exercise Builder (FR13, FR37)

**As a** Teacher,
**I want to** create Listening exercises with audio files,
**So that** students can practice IELTS Listening skills.

- **AC1: Audio Upload:** Upload MP3, WAV, or M4A files (max 100MB). System shows waveform preview and duration.
- **AC2: Audio Sections:** Teacher can mark section timestamps (e.g., "Section 1: 0:00-3:45") for multi-part audio.
- **AC3: Playback Modes:** Configure per exercise:
  - **Test Mode:** Single play only (audio plays once, then locks). Students cannot replay.
  - **Practice Mode:** Unlimited replay with seek bar and speed control (0.75x, 1x, 1.25x).
- **AC4: Transcript:** Optional transcript upload/paste. Can be revealed to student after submission.
- **AC5: Question Timing:** Questions can be linked to audio sections (appear after that section plays).

#### Story 3.7: Listening Question Types (FR13, FR37, FR40)

**As a** Teacher,
**I want to** create all IELTS Listening question types,
**So that** students experience realistic Listening test formats.

**Listening Types (L1-L6):**

- **AC1: Form/Note/Table Completion (L1):** Create structured form with blanks. Student fills while listening. Auto-graded with variants.
- **AC2: Multiple Choice (L2):** Same as R1/R2 but questions appear synchronized with audio sections.
- **AC3: Matching (L3):** Match speakers or items to options based on audio. Same UI as R11.
- **AC4: Map/Plan Labelling (L4):** Upload map/plan image. Student drags labels or selects from dropdown per location.
- **AC5: Sentence Completion (L5):** Complete sentences based on audio. Word limit enforced.
- **AC6: Short Answer (L6):** Brief answers from audio content.
- **AC7: Question Display Timing:** Questions can appear all at once, or progressively as audio sections complete.

#### Story 3.8: Writing Task Builder (FR13, FR42)

**As a** Teacher,
**I want to** create IELTS Writing tasks with proper rubrics,
**So that** AI grading aligns with IELTS band descriptors.

**Writing Types (W1-W3):**

- **AC1: Task 1 Academic (W1):** Upload visual stimulus (chart/graph/table/diagram/map/process). Add task prompt. Set word count guidance (minimum 150 words).
- **AC2: Task 1 General (W2):** Create letter prompt with situation and bullet points. Specify tone (formal/informal/semi-formal).
- **AC3: Task 2 Essay (W3):** Create essay prompt. Set word count guidance (minimum 250 words).
- **AC4: Rubric Display:** Show IELTS band descriptors (Task Achievement, Coherence, Lexical Resource, Grammar) in grading interface.
- **AC5: Sample Response:** Teacher can add a model answer for reference (visible to teacher only during grading, optionally revealed to student after grading).
- **AC6: Word Count Enforcement:** Display live word count to student. Optional hard limit or soft warning.

#### Story 3.9: Speaking Exercise Builder (FR13) - Phase 2

**As a** Teacher,
**I want to** create IELTS Speaking exercises,
**So that** students can practice with audio recording.

**Speaking Parts (S1-S3):**

- **AC1: Part 1 Questions (S1):** Create list of short questions (4-5 questions, ~1 min each). Student records answer per question.
- **AC2: Part 2 Cue Card (S2):** Create cue card with topic and bullet points. Configure 1-min prep timer + 1-2 min speaking timer. Single recording.
- **AC3: Part 3 Discussion (S3):** Create follow-up discussion questions (4-5 questions). Student records per question.
- **AC4: Audio Recording:** Student interface has record/stop/playback. Recordings saved as MP3.
- **AC5: Recording Limits:** Set maximum recording duration per question. Auto-stop at limit.
- **AC6: Transcript Generation:** Optional AI transcription of recordings for grading assistance.

#### Story 3.10: Timer & Test Conditions (FR38)

**As a** Teacher,
**I want to** set time limits on exercises,
**So that** students practice under realistic test conditions.

- **AC1: Exercise Time Limit:** Set total time limit (e.g., 60 minutes for Reading).
- **AC2: Section Time Limits:** Optionally set per-section limits within an exercise.
- **AC3: Timer Display:** Student sees countdown timer. Configurable position (top bar or floating).
- **AC4: Warning Alerts:** Alert at configurable intervals (e.g., "10 minutes remaining", "5 minutes remaining").
- **AC5: Auto-Submit:** When time expires, exercise auto-submits with current answers. Student sees "Time's up" message.
- **AC6: Grace Period:** Optional 1-minute grace period to review before final submission.
- **AC7: Pause Option:** Teacher can enable/disable pause functionality. Paused time is logged.

#### Story 3.11: Exercise Tagging & Organization (FR41)

**As a** Teacher,
**I want to** tag and categorize exercises,
**So that** I can organize my content library and track student progress by skill.

- **AC1: Skill Tag (Required):** Every exercise must be tagged: Reading, Listening, Writing, or Speaking.
- **AC2: Band Level Tag:** Optional target band level: 4-5, 5-6, 6-7, 7-8, 8-9.
- **AC3: Topic Tags:** Free-form topic tags (e.g., "Environment", "Technology", "Health").
- **AC4: Question Type Tags:** Auto-generated based on question types used (e.g., "TFNG", "Matching Headings").
- **AC5: Filter by Tags:** Exercise library (Story 3.14) can filter by any combination of tags.
- **AC6: Tag Management:** Settings page for managing custom tags (add, rename, merge, delete).

#### Story 3.12: AI Content Generation for Reading (FR14, FR15)

**As a** Teacher,
**I want to** upload a passage and have AI generate questions,
**So that** I can create exercises faster.

- **AC1: Document Upload:** Upload PDF, Word, or paste text directly. Max 10MB for files.
- **AC2: Text Extraction:** System extracts and displays passage text. Teacher can edit before proceeding.
- **AC3: Question Type Selection:** Teacher selects which question types to generate (e.g., "5 TFNG + 4 Matching Headings").
- **AC4: AI Generation:** System generates questions within 30 seconds. Shows loading state with progress.
- **AC5: Question Preview:** AI-generated questions displayed in editable preview. Teacher can modify, delete, or regenerate individual questions.
- **AC6: Answer Key Generation:** AI suggests correct answers. Teacher must verify/adjust before finalizing.
- **AC7: Difficulty Adjustment:** Teacher can request "make harder" or "make easier" regeneration for specific questions.

#### Story 3.13: Mock Test Assembly (FR39)

**As a** Teacher,
**I want to** combine exercises into a full mock test,
**So that** students can simulate complete IELTS test conditions.

- **AC1: Mock Test Creation:** Create mock test by selecting existing exercises for each section.
- **AC2: Section Structure:** Configure sections: Listening (4 sections), Reading (3 passages), Writing (Task 1 + Task 2), Speaking (Parts 1-3).
- **AC3: Section Timing:** Set time per section. Sections are sequential (must complete one before next).
- **AC4: Unified Scoring:** System calculates overall band score using IELTS conversion tables.
- **AC5: Band Score Calculation:**
  - Reading/Listening: Raw score (out of 40) → Band conversion
  - Writing: Average of 4 criteria bands
  - Speaking: Average of 4 criteria bands
  - Overall: Average of 4 skills (rounded to nearest 0.5)
- **AC6: Progress Saving:** Student can save progress and resume within deadline period.
- **AC7: Results Report:** After completion, student sees band score per skill + overall + detailed breakdown.

#### Story 3.14: Exercise Library Management (FR13, FR15, FR16)

**As a** Teacher,
**I want to** browse, organize, and manage my exercises,
**So that** I can reuse content across classes and semesters.

- **AC1: Exercise List View:** Display paginated grid/list at `/:centerId/exercises` showing: Title, Skill, Type(s), Band Level, Status, Last Modified, Assignments Count.
- **AC2: Status Workflow:** Exercises have states: Draft (editable, not assignable) → Published (assignable, limited editing) → Archived (hidden from assignment).
- **AC3: Search & Filter:** Search by title/content. Filter by skill, question type, band level, status, tags.
- **AC4: Duplicate Exercise:** "Duplicate" action creates a copy in Draft state for modification.
- **AC5: Archive/Restore:** Archived exercises are hidden from main list but accessible via "Show Archived" toggle. Can be restored to Draft.
- **AC6: Delete:** Only Draft exercises can be permanently deleted. Published/Archived exercises with submissions cannot be deleted (only archived).
- **AC7: Bulk Actions:** Checkbox selection enables bulk Archive, Duplicate, Tag, or Assign to Class.
- **AC8: Usage Analytics:** Show how many times each exercise has been assigned and average student scores.

#### Story 3.15: Exercise Assignment Management (FR16)

**As a** Teacher,
**I want to** manage exercise assignments separately from exercise creation,
**So that** I can assign the same exercise to multiple classes with different due dates.

- **AC1: Assignment List:** `/:centerId/assignments` shows all assignments with: Exercise Title, Skill, Class, Due Date, Time Limit, Submissions (X/Y), Status (Open/Closed/Graded).
- **AC2: Create Assignment:** "Assign Exercise" opens modal: Select Exercise → Select Class(es) or Individual Students → Set Due Date/Time → Set Time Limit (or use exercise default) → Optional Instructions.
- **AC3: Multi-Class Assignment:** Single exercise can be assigned to multiple classes simultaneously, creating separate assignment records per class.
- **AC4: Edit Assignment:** Due date can be extended. Time limit can be adjusted before first submission.
- **AC5: Close Assignment:** "Close" action prevents new submissions. Useful for grace period expiry.
- **AC6: Delete Assignment:** Assignments with submissions can only be archived, not deleted.
- **AC7: Student Notification:** Creating an assignment triggers in-app notification to all assigned students.
- **AC8: Reopen Assignment:** Archived assignments can be reopened with new due date.

#### Story 3.16: Student Assignment Dashboard (FR17)

**As a** Student,
**I want to** see a list of my pending assignments organized by urgency,
**So that** I can prioritize my homework.

- **AC1: Dashboard Sections:** Display assignments in sections: "Due Today", "Due This Week", "Upcoming", "Overdue".
- **AC2: Assignment Card:** Each card shows: Exercise title, Skill icon, Due date/time, Time limit, Status (Not Started/In Progress/Submitted/Graded).
- **AC3: Skill Icons:** Visual icons for Reading (book), Listening (headphones), Writing (pen), Speaking (microphone).
- **AC4: Progress Indicator:** For in-progress assignments, show completion percentage.
- **AC5: Quick Actions:** "Start" button for new, "Continue" for in-progress, "View Results" for graded.
- **AC6: Dashboard Location:** This dashboard is the Student's role-specific home content on the Unified Dashboard (Story 1.5 AC2).
- **AC7: Filtering:** Filter by skill type, due date range, status.
- **AC8: Mock Test Display:** Mock tests appear as single card with "Full Test" label and breakdown of sections.

---

### Epic 4: Student Submission & Offline-Proofing

#### Story 4.1: Mobile Submission Interface (FR18, NFR7)

**As a** Student,
**I want to** submit my work easily from my smartphone,
**So that** I can do my homework anywhere.

- **AC1:** UI is optimized for viewports down to 375px (no horizontal scrolling).
- **AC2:** Input fields and buttons are touch-friendly (min 44px height).
- **AC3:** Support for photo uploads (camera integration) for handwritten tasks.
- **AC4: Question Type Rendering:** MCQ renders as large tap-friendly buttons. Fill-in-blank renders as expandable text input. Rich text uses mobile-optimized editor.
- **AC5: Navigation:** Multi-question submissions have "Previous/Next" navigation with progress indicator (e.g., "3 of 10").

#### Story 4.2: Local Auto-save & Persistent Storage (FR19, NFR4)

**As a** Student,
**I want to** have my work saved automatically while I type,
**So that** I don't lose progress if my browser closes.

- **AC1:** System triggers a background save to persistent client-side storage every 3 seconds.
- **AC2:** A "Saved" indicator appears in the UI to confirm local persistence.

#### Story 4.3: Offline Safeguards & Sync (FR34, FR35)

**As a** Student,
**I want to** be able to submit even if my internet is unstable,
**So that** my deadline is met without stress.

- **AC1:** If offline during submission, system displays a persistent "Do Not Close Tab" warning banner.
- **AC2:** The submission is queued and automatically retried once a network connection is detected.
- **AC3:** User receives a success celebration/notification only after the server confirms receipt.

---

### Epic 5: AI Grading Workbench

#### Story 5.1: Automated Submission Analysis (FR20)

**As a** Teacher,
**I want to** see AI-generated score suggestions as soon as a student submits,
**So that** I have a draft ready for my review.

- **AC1:** System triggers AI analysis immediately upon submission.
- **AC2:** For Writing/Speaking, AI provides band score suggestions and grammar highlights within 5 seconds of the teacher opening the submission.

#### Story 5.2: Split-Screen Grading Interface (FR21, NFR1)

**As a** Teacher,
**I want to** see student work and AI feedback side-by-side,
**So that** I can grade efficiently without switching tabs.

- **AC1:** Workspace is divided into a Left pane (Student Work) and Right pane (AI Feedback Cards).
- **AC2:** The next submission in the queue pre-fetches in < 500ms to ensure zero lag between items.

#### Story 5.3: Evidence Anchoring (FR22, FR24)

**As a** Teacher,
**I want to** see exactly where the AI found an error in the text,
**So that** I can verify the feedback accuracy.

- **AC1:** Hovering over an AI feedback card draws a visual "tether" line to the relevant text segment.
- **AC2:** If the teacher edits < 20% of the surrounding text, the anchor remains attached.
- **AC3:** If > 50% of text is changed, the anchor is "orphaned" and marked for teacher review.

#### Story 5.4: One-Click Approval Loop (FR23, FR25, FR26, NFR10)

**As a** Teacher,
**I want to** quickly accept or reject AI suggestions,
**So that** I can finish my grading stack efficiently.

- **AC1:** Teacher can accept an AI suggestion (score/comment) with a single click or keyboard shortcut.
- **AC2:** Rejecting a suggestion removes it from the final feedback sent to the student.
- **AC3:** Upon clicking "Approve & Next", the system plays a "Stamped" animation and loads the next item.
- **AC4:** A "Breather" summary is shown after every 5 items to prevent teacher fatigue.

#### Story 5.5: Grading Queue Management (FR21, FR26)

**As a** Teacher,
**I want to** view and manage my grading queue before entering the workbench,
**So that** I can prioritize which submissions to grade first.

- **AC1: Queue View:** `/:centerId/grading` displays submissions awaiting grading with columns: Student, Assignment, Submitted At, Status (Pending AI/Ready/In Progress), Priority.
- **AC2: Status Definitions:** Pending AI = awaiting analysis; Ready = AI complete, awaiting teacher; In Progress = teacher has started.
- **AC3: Filter & Sort:** Filter by Class, Assignment, Status. Sort by Submitted At (default), Due Date, Student Name.
- **AC4: Priority Flagging:** Teacher can flag submissions as "Priority" (e.g., for struggling students). Flagged items appear at top.
- **AC5: Enter Workbench:** Clicking a submission or "Start Grading" enters the split-screen workbench (Story 5.2) starting with that item.
- **AC6: Progress Indicator:** Queue header shows "X of Y graded" with progress bar for current assignment.
- **AC7: Assignment Filter Shortcut:** Clicking an assignment from Assignment List (Story 3.5) navigates directly to filtered queue.

#### Story 5.6: Student Feedback View (FR20)

**As a** Student,
**I want to** view my graded assignment with teacher feedback,
**So that** I can learn from my mistakes and improve.

- **AC1: Notification:** Student receives in-app notification when their submission is graded.
- **AC2: Access Path:** From Student Dashboard (Story 3.3), clicking a "Graded" assignment opens feedback view.
- **AC3: Feedback Layout:** Display student's original submission with:
  - Overall score prominently displayed
  - Inline comments anchored to specific text (teacher-approved AI comments)
  - General feedback section at bottom
- **AC4: Comment Visibility:** Only teacher-approved comments appear (rejected AI suggestions are hidden).
- **AC5: Grammar Highlights:** Grammar corrections are shown as tracked-changes style (strikethrough + correction).
- **AC6: Score Breakdown:** For multi-criteria rubrics (e.g., IELTS Writing: Task Achievement, Coherence, Lexical Resource, Grammar), show individual scores.
- **AC7: Submission History:** If resubmission is allowed, display version history with previous scores.
- **AC8: Mobile Optimized:** Feedback view must work well on mobile (tap to expand comments, scrollable sections).

---

### Epic 6: Student Health & Intervention

#### Story 6.1: Traffic Light Dashboard (FR27, NFR2)

**As a** Teaching Owner,
**I want to** see a high-level summary of student performance,
**So that** I can identify at-risk students in seconds.

- **AC1:** Dashboard displays student cards with color-coded status: Red (At-Risk), Yellow (Warning), Green (On Track).
- **AC2:** Status is calculated based on attendance (e.g., < 80% = Red) and assignment completion.
- **AC3:** Widget data updates in < 1 second on page load.

#### Story 6.2: Student Profile Overlay (FR28)

**As a** Teaching Owner,
**I want to** see a student's history without leaving the dashboard,
**So that** I maintain my workflow context.

- **AC1:** Clicking a student card opens a slide-over/overlay with detailed attendance and grade trends.
- **AC2:** The overlay does not trigger a full page reload and preserves the background scroll position.

#### Story 6.3: Zalo Intervention Loop (FR29)

**As a** Teaching Owner,
**I want to** message a parent via Zalo when a student falls behind,
**So that** I can prevent churn with a personal touch.

- **AC1:** Profile view contains a "Message Parent" button.
- **AC2:** Clicking the button opens a Zalo deep-link with a pre-filled template (e.g., "Hi [Parent], [Student] has missed 3 classes...").
- **AC3:** Intervention action is logged in the student's activity history.

#### Story 6.4: Teacher Student Health View (FR27)

**As a** Teacher,
**I want to** see health indicators for students in my classes,
**So that** I can proactively support struggling students.

- **AC1: Scoped Access:** Teachers see Student Health data only for students enrolled in their assigned classes (per RBAC matrix).
- **AC2: Teacher Dashboard Widget:** Teacher dashboard includes "My Students at Risk" widget showing Red/Yellow students from their classes.
- **AC3: Limited Actions:** Teachers can view Student Profile Overlay (Story 6.2) but cannot initiate Zalo intervention (Owner/Admin only).
- **AC4: Class-Level View:** Teacher can view health status grouped by class from their Class detail page.
- **AC5: Note to Admin:** Teachers can flag a student for admin attention with a note (e.g., "Parent meeting needed").

---

### Epic 7: Zalo Integration & Notifications

#### Story 7.1: Engagement Notifications (FR30)

**As a** Student,
**I want to** receive Zalo alerts for my achievements,
**So that** I feel motivated to keep studying.

- **AC1:** System sends an automated Zalo message when a student hits a "7-day streak" or a "Personal Best" score improvement.
- **AC2:** Messages include encouraging copy and a link to view the achievement in ClassLite.

#### Story 7.2: Notification Management (FR31)

**As a** Parent or User,
**I want to** control which notifications I receive on Zalo,
**So that** I don't feel overwhelmed by messages.

- **AC1:** User settings include a toggle for Zalo notifications (On/Off).
- **AC2:** Users can select specific categories (Grades, Attendance, Streaks) to receive via Zalo.

#### Story 7.3: Zalo Account Linking

**As a** User (Student/Parent),
**I want to** link my Zalo account to ClassLite,
**So that** I can receive notifications through my preferred messaging app.

- **AC1: Link Prompt:** User Profile (Story 1.9) contains "Connect Zalo" section with explanation of notification types.
- **AC2: OAuth Flow:** "Connect" button initiates Zalo OAuth flow. User authorizes ClassLite to send messages.
- **AC3: Link Confirmation:** On successful OAuth, display linked Zalo display name and profile picture.
- **AC4: Test Message:** "Send Test Message" button sends a verification message to confirm connection works.
- **AC5: Unlink:** "Disconnect Zalo" button removes authorization. Requires confirmation.
- **AC6: Parent Linking:** For Student accounts, Parent can link their own Zalo via a separate invitation flow (Parent receives link to connect their Zalo to student's account).
- **AC7: Multiple Recipients:** A student can have both their own Zalo and a Parent Zalo linked (both receive notifications).

---

### Epic 8: Platform Compliance & Methodology

#### Story 8.1: Methodology Guardian (FR32, FR33)

**As a** Teaching Owner,
**I want to** train the AI on my center's specific feedback style,
**So that** the AI sounds like one of our teachers.

- **AC1:** Owner can upload 5-10 "Golden Samples" (Student Work + Teacher Feedback).
- **AC2:** System uses Few-Shot Prompting using Golden Samples to target > 85% style alignment.
- **AC3:** AI-generated feedback adopts the tone and vocabulary established in the samples.

#### Story 8.2: Data Sovereignty & Privacy Center (NFR5, NFR6)

**As a** User,
**I want to** ensure my data is stored according to local laws (Decree 13),
**So that** my privacy is protected.

- **AC1:** All personal data is encrypted-at-rest using AES-256.
- **AC2:** Settings includes a "Privacy Center" where users can request a copy of their data or account deletion.
- **AC3:** Every AI data processing event displays a transparent indicator explaining the data usage.

#### Story 8.3: Content Moderation System (Compliance) (FR36)

**As a** Center Admin,
**I want** the system to flag AI-generated or student-submitted content that violates local regulations,
**So that** we remain compliant with Vietnamese internet laws.

- **AC1:** System screens content for prohibited political/sensitive terms.
- **AC2:** Flagged content is locked with a "Compliance Review" overlay.
- **AC3:** Admins can approve, redact, or delete flagged items in a dedicated workspace.

#### Story 8.4: Language Preference & i18n (NFR8)

**As a** User,
**I want to** switch the interface language between English and Vietnamese,
**So that** I can use ClassLite in my preferred language.

- **AC1: Language Selector Location:** Language toggle appears in: (a) Login page footer, (b) User Profile settings, (c) Footer of all pages.
- **AC2: Supported Languages:** English (en) and Vietnamese (vi).
- **AC3: Persistence:** Selected language is stored in user profile (when logged in) or localStorage (when logged out).
- **AC4: Instant Switch:** Changing language immediately updates all UI text without page reload.
- **AC5: Translation Coverage:** 100% of UI strings are translatable. No hardcoded text in components.
- **AC6: Date/Time Localization:** Dates display in locale-appropriate format (e.g., "25/01/2026" for vi, "01/25/2026" for en).
- **AC7: Content vs UI:** User-generated content (exercises, feedback) is NOT translated - only system UI text.
- **AC8: RTL Consideration:** Design system should not break if RTL language is added in future (no hardcoded directional margins).

#### Story 8.5: Golden Sample Management Interface (FR32)

**As a** Center Owner,
**I want to** manage my Golden Samples through a dedicated interface,
**So that** I can refine AI behavior over time.

- **AC1: Access Path:** Settings > AI Customization > Golden Samples.
- **AC2: Sample List:** Display uploaded samples with: Title, Upload Date, Type (Writing/Speaking), Status (Active/Inactive).
- **AC3: Upload Flow:** "Add Sample" opens form: Upload Student Work (PDF/Text) + Upload/Paste Ideal Teacher Feedback + Categorize by skill type.
- **AC4: Preview:** Before saving, display side-by-side preview of student work and teacher feedback.
- **AC5: Edit Sample:** Existing samples can have feedback edited to refine guidance.
- **AC6: Toggle Active:** Samples can be deactivated without deletion (excluded from AI prompting).
- **AC7: Sample Limit:** Display "X/10 samples used" with explanation that 5-10 samples recommended.
- **AC8: Delete:** Samples can be permanently deleted with confirmation.
