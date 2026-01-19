---
status: "complete"
completedAt: "2026-01-18"
lastStep: 4

inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# classlite - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for classlite, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can sign up and login using Google OAuth or Email/Password.
FR2: Platform Admins can provision new Center tenants (`center_id`).
FR3: Center Owners can invite users (Teachers, Students) via email.
FR4: System must restrict access based on Role (Owner, Teacher, Student).
FR5: System must enforce logical data isolation (users access only their `center_id` data).
FR6: Center Owners can configure center settings (Name, Logo, Timezone).
FR7: Center Admins can manage Courses and Class Sessions.
FR8: Center Admins can assign Teachers and Students to Classes.
FR9: Users can view a visual Weekly Schedule of assigned classes.
FR10: System must detect and warn of resource conflicts (Room/Teacher double-booking).
FR11: Teachers can mark attendance (Present/Absent).
FR12: System must notify participants of schedule changes.
FR13: Teachers can create exercises using a Manual Builder (Rich Text, Multiple Choice, Fill-in-Blank).
FR14: Teachers can upload PDF/Word docs to trigger AI exercise generation.
FR15: Teachers can edit AI-generated content before publishing.
FR16: Teachers can assign exercises with due dates.
FR17: Students can view "Due Soon" assignments dashboard.
FR18: Students can submit assignments via mobile-responsive interface (text or image).
FR19: System must auto-save student work-in-progress to LocalStorage every 3 seconds (Offline-Proof).
FR20: System must trigger AI analysis on submission (Auto-grade Reading/Listening; Suggest scores for Writing/Speaking).
FR21: The system shall provide a split-screen interface (Student Work / AI Analysis) for grading.
FR22: The system shall display "Evidence Anchors" (visual lines) connecting AI comments to specific text ranges on hover.
FR23: The system shall allow teachers to "One-Click Accept" AI suggestions (score + grammar fix).
FR24: The system shall support "Range-Aware" comments that gracefully detach or re-attach if the underlying text is edited.
FR24b: The system shall allow teachers to "Reject" AI suggestions, removing them from the final feedback.
FR24c: The system shall auto-advance to the next submission upon approval (with an optional "Breather" pause after 5 items).
FR25: Center Owners can view "Student Health Dashboard" (At-risk flags via Traffic Light system).
FR26: Center Owners can click a flag to open the Student Profile Overlay (no page reload).
FR27: Center Owners can initiate interventions via Zalo Deep Links with pre-filled templates.
FR28 (Zalo): System can send automated "Micro-win" notifications to linked parent Zalo accounts.
FR29 (Zalo): Parents can manage Zalo notification preferences.
FR30 (Guardian): Center Owners can upload "Golden Sample" feedback to tune AI style.
FR31 (Guardian): System must prioritize Golden Samples when generating AI feedback for that tenant.
FR32 (Offline): The system shall detect offline status and display a persistent "Do Not Close" warning banner during submission attempts.
FR33 (Offline): The system shall queue failed submissions and auto-retry upon network reconnection (Background Sync).

### NonFunctional Requirements

NFR1: The Grading Workbench shall load the next submission in **< 500ms** (perceived instant) for 95th percentile of users (utilizing pre-fetching).
NFR2: The Dashboard shall render "Traffic Light" status widgets in **< 1 second**.
NFR3: AI Grading suggestions appear **< 10s** after submission.
NFR4: **99.9% uptime** during business hours (8 AM - 10 PM GMT+7).
NFR5: Student work auto-saved every **3s** to LocalStorage.
NFR6 (Isolation): API rejects cross-tenant resource access (403 Forbidden).
NFR7: Sensitive data (grades, PII) encrypted at rest.
NFR8 (Mobile First): 100% of Student/Teacher flows functional on 375px+ viewports.
NFR9 (i18n): UI supports **English** and **Vietnamese** from launch.
NFR10 (WCAG): The system shall comply with **WCAG 2.1 Level AA** standards.
NFR11 (Keyboard): Critical workflows (Grading Loop) shall be fully operable via **Keyboard Navigation** (Tab, Enter, Shortcuts).
NFR12 (Focus): Input fields in the Grading Workbench shall support "Click-to-Edit" behavior with prominent `:focus-visible` indicators.

### Additional Requirements

- **Starter Template:** Custom Brownfield Scaffold (Fastify + React + Astro + Turbo).
- **Multi-Tenancy:** Logical Isolation via Prisma Client Extensions (`center_id`).
- **Auth:** Firebase Auth with Custom Claims (`center_id`, `role`).
- **Offline Strategy:** TanStack Query `persistQueryClient` + `idb-keyval` for offline reads and queueing mutations.
- **AI Orchestration:** Inngest for background jobs (avoid browser timeouts).
- **Infrastructure:** Railway deployment (Docker/Node.js).
- **Testing:** Vitest (Unit) + Playwright (E2E).
- **API Response:** Standard wrapper `{ data: T, error: ... }`.
- **Validation:** Zod schemas in `packages/types`.
- **Split-Screen Editor:** `GradingEditor` with `ProseMirror` (Left) and AI Card List (Right).
- **Evidence Anchoring:** `ConnectionLine` SVG layer connecting AI comments to text ranges.
- **Offline Indicator:** Visual states (Saving, Saved, Offline banner).
- **Mobile First:** Student flows optimized for 375px+ devices.
- **Keyboard Navigation:** Shortcuts for grading loop (`Cmd+Enter`, `Tab`).
- **One-Click Accept:** Single click/keystroke to approve AI suggestions.
- **Zalo Integration:** Deep links with Copy fallback for parent messaging.
- **Performance:** Grading next-item load < 500ms via pre-fetching.

### FR Coverage Map

### FR Coverage Map

FR1: Epic 1 - Authentication & Login
FR2: Epic 1 - Tenant Provisioning
FR3: Epic 1 - User Invitations
FR4: Epic 1 - Role Based Access
FR5: Epic 1 - Data Isolation
FR6: Epic 1 - Center Configuration
FR7: Epic 2 - Course Management
FR8: Epic 2 - Class Roster Management
FR9: Epic 2 - Visual Schedule
FR10: Epic 2 - Conflict Detection
FR11: Epic 2 - Attendance Tracking
FR12: Epic 2 - Schedule Notifications
FR13: Epic 3 - Manual Exercise Builder
FR14: Epic 3 - AI Exercise Generation
FR15: Epic 3 - Content Editing
FR16: Epic 3 - Assignment Creation
FR17: Epic 3 - Student Due Dashboard
FR18: Epic 4 - Student Submission Interface
FR19: Epic 4 - Offline Auto-save
FR20: Epic 4 - AI Analysis Trigger
FR21: Epic 4 - Split-Screen Workbench
FR22: Epic 4 - Evidence Anchors
FR23: Epic 4 - One-Click Accept
FR24: Epic 4 - Range-Aware Comments
FR24b: Epic 4 - Reject Suggestion
FR24c: Epic 4 - Auto-Advance
FR25: Epic 5 - Student Health Dashboard
FR26: Epic 5 - Student Profile Overlay
FR27: Epic 5 - Zalo Intervention
FR28: Epic 6 - Zalo Micro-wins
FR29: Epic 6 - Notification Preferences
FR30: Epic 6 - Golden Sample Upload
FR31: Epic 6 - AI Style Tuning
FR32: Epic 4 - Offline Warning
FR33: Epic 4 - Background Sync

## Epic List

## Epic List

### Epic 1: Center Establishment & Access Control

**Goal:** Establish secure, multi-tenant foundations where Owners can manage their digital school and users can access their specific roles.
**Value:** Secure, isolated environments for each center to operate independently.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

### Epic 2: Class Management & Logistics

**Goal:** Operationalize the schedule, ensuring teachers, students, and rooms are coordinated without conflicts.
**Value:** Eliminates scheduling chaos and double-booking errors; provides clarity on "Where should I be?"
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12

### Epic 3: Curriculum & Assignment Creation

**Goal:** Enable teachers to build and assign diverse learning materials (Manual + AI) that students can track.
**Value:** Teachers can create content quickly (with AI help) and students have a clear "Due Soon" dashboard.
**FRs covered:** FR13, FR14, FR15, FR16, FR17

### Epic 4: The Intelligent Grading Loop

**Goal:** Transform the core pedagogical interaction—from frictionless student submission (offline-proof) to high-velocity AI-assisted teacher feedback.
**Value:** Delivers the "3-Minute Grading Loop" (50% time reduction) and "Offline-Proof" reliability.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR24b, FR24c, FR32, FR33

### Epic 5: Retention Intelligence Dashboard

**Goal:** Provide Owners with "Glanceable Intelligence" on student health to prevent churn via immediate intervention.
**Value:** Enables the "3 Clicks to Rescue" workflow to save at-risk students.
**FRs covered:** FR25, FR26, FR27

### Epic 6: Ecosystem Innovation (Phase 1.5)

**Goal:** Deepen engagement through Zalo parent loops and personalized AI tuning (Golden Samples).
**Value:** Differentiates the center with high-touch parent communication and personalized AI style.
**FRs covered:** FR28, FR29, FR30, FR31

## Epic 1: Center Establishment & Access Control

**Goal:** Establish secure, multi-tenant foundations where Owners can manage their digital school and users can access their specific roles.

### Story 1.1: Tenant Provisioning System

As a Platform Admin,
I want to provision new Center tenants with a unique `center_id`,
So that new customers can have their own isolated environment.

**Acceptance Criteria:**

**Given** a valid request with Center Name and Owner Email
**When** the provisioning script or API is executed
**Then** a new Center record is created in the database with a unique `center_id`
**And** an Owner user is created and linked to this center
**And** a default "Welcome" email is triggered to the Owner

### Story 1.2: User Authentication with Firebase

As a User,
I want to log in using Google OAuth or Email/Password, and as a new Center Owner, I want to sign up my center directly,
So that I can securely access the platform and start managing my school immediately.

**Acceptance Criteria:**

**Given** a user on the login or signup page
**When** they authenticate via Firebase (Google or Email) or complete the Center Signup form
**Then** the system verifies their identity and creates the Center/Owner records if necessary
**And** retrieves/sets their custom claims (`center_id`, `role`)
**And** redirects them to their role-specific dashboard (Owner, Teacher, or Student)

### Story 1.3: Role-Based Access Control (RBAC)

As a Developer (System),
I want to enforce role-based permissions at the API level,
So that users can only access features authorized for their role.

**Acceptance Criteria:**

**Given** an authenticated user with role 'Student'
**When** they attempt to access an 'Owner' only API endpoint (e.g., `POST /api/centers`)
**Then** the system returns a 403 Forbidden error
**And** logs the unauthorized attempt

### Story 1.4: Multi-Tenant Data Isolation

As a Center Owner,
I want my data to be completely isolated from other centers,
So that I comply with privacy laws and prevent data leaks.

**Acceptance Criteria:**

**Given** an authenticated user from Center A
**When** they query for a list of Users or Classes
**Then** the system automatically filters the query by `center_id = 'Center A'` via the Prisma Extension
**And** no data from Center B is ever returned

### Story 1.5: User Invitation System

As a Center Owner,
I want to invite Teachers and Students via email,
So that they can join my center without public signup.

**Acceptance Criteria:**

**Given** an Owner on the "Users" management page
**When** they enter an email address and select a role (e.g., Teacher)
**Then** an invitation email is sent to that address
**And** a "Pending" user record is created in the database
**And** the user can complete signup using that email to join the correct center

## Epic 2: Class Management & Logistics

**Goal:** Operationalize the schedule, ensuring teachers, students, and rooms are coordinated without conflicts.

### Story 2.1: Course & Class Management

As a Center Owner,
I want to create Courses and Class Sessions,
So that I can structure my educational offerings.

**Acceptance Criteria:**

**Given** an Owner on the "Courses" page
**When** they create a new Class (e.g., "IELTS Prep 101")
**Then** they can define start/end dates and default times
**And** the class appears in the system active list

### Story 2.2: Roster Management

As a Center Owner,
I want to assign Teachers and Students to Classes,
So that everyone knows who is teaching and learning.

**Acceptance Criteria:**

**Given** a specific Class
**When** the Owner selects "Edit Roster"
**Then** they can search and add existing Teachers and Students to the class
**And** assigned users immediately see this class in their dashboard

### Story 2.3: Visual Weekly Schedule

As a User,
I want to view a weekly calendar of my assigned classes,
So that I know where I need to be.

**Acceptance Criteria:**

**Given** an authenticated User (Teacher or Student)
**When** they view the "Schedule" tab
**Then** they see a calendar view of only their assigned sessions
**And** clicking a session shows details (Room, Topic, Zoom Link)

### Story 2.4: Schedule Conflict Detection

As a Center Owner,
I want to be warned if I double-book a room or teacher,
So that I can avoid logistical chaos.

**Acceptance Criteria:**

**Given** a proposed schedule change (e.g., moving Class A to Monday 10am)
**When** the Owner attempts to save
**Then** the system checks for existing sessions for that Room or Teacher at that time
**And** displays a warning if a conflict exists "Room 101 is already booked"

## Epic 3: Curriculum & Assignment Creation

**Goal:** Enable teachers to build and assign diverse learning materials (Manual + AI) that students can track.

### Story 3.1: Manual Exercise Builder

As a Teacher,
I want to create exercises manually (Rich Text, Multiple Choice),
So that I can digitize my specific curriculum.

**Acceptance Criteria:**

**Given** a Teacher in the "Exercise Builder"
**When** they add a "Multiple Choice" question block
**Then** they can input the question text, options, and mark the correct answer
**And** save the exercise to the Course library

### Story 3.2: AI Exercise Generation (PDF Upload)

As a Teacher,
I want to upload a PDF worksheet and have AI convert it into a digital exercise,
So that I save hours of manual data entry.

**Acceptance Criteria:**

**Given** a PDF file containing a reading passage and questions
**When** the Teacher uploads it to the "AI Builder"
**Then** the system parses the text and identifies questions
**And** presents a draft exercise for the teacher to review/edit within 10 seconds

### Story 3.3: Assignment Distribution

As a Teacher,
I want to assign an exercise to a specific class with a due date,
So that students know what to do and when.

**Acceptance Criteria:**

**Given** a created Exercise
**When** the Teacher clicks "Assign"
**Then** they can select the target Class and set a Due Date/Time
**And** all students in that class receive a "New Assignment" notification

### Story 3.4: Student Due Dashboard

As a Student,
I want to see a list of assignments due soon,
So that I can prioritize my homework.

**Acceptance Criteria:**

**Given** a Student on their dashboard
**When** they look at the "To Do" list
**Then** they see assignments ordered by Due Date (soonest first)
**And** overdue assignments are visually highlighted (Red)

## Epic 4: The Intelligent Grading Loop

**Goal:** Transform the core pedagogical interaction—from frictionless student submission (offline-proof) to high-velocity AI-assisted teacher feedback.

### Story 4.1: Student Submission Interface (Mobile First)

As a Student,
I want a simple mobile interface to submit text or photos of my work,
So that I can turn in homework from anywhere.

**Acceptance Criteria:**

**Given** a Student on a mobile device
**When** they open an assignment
**Then** they can type a response or select a photo from their camera roll
**And** the UI is responsive and easy to use on a small screen (375px)

### Story 4.2: Offline-Proof Auto-Save

As a Student,
I want my work to save automatically even if I lose internet,
So that I never lose my progress.

**Acceptance Criteria:**

**Given** a Student typing an essay
**When** their internet connection drops
**Then** the system continues to save their work to LocalStorage every 3 seconds
**And** a visual indicator shows "Saved Locally"
**And** syncs to the server automatically when connection returns

### Story 4.3: Grading Workbench UI (Split-Screen)

As a Teacher,
I want a split-screen interface with Student Work on the left and Grading Tools on the right,
So that I can grade efficiently without tab switching.

**Acceptance Criteria:**

**Given** a Teacher opening a submission
**When** the workbench loads
**Then** the Student's essay/image is displayed on the left pane
**And** the Grading/AI panel is displayed on the right pane
**And** both panes scroll independently

### Story 4.4: AI Analysis Pipeline

As a System,
I want to trigger an AI analysis job upon student submission,
So that the grading suggestions are ready when the teacher opens the workbench.

**Acceptance Criteria:**

**Given** a new student submission
**When** it is saved to the database
**Then** an asynchronous Inngest job is triggered
**And** the AI analyzes the text for grammar errors and band score
**And** the results are stored as "Draft Feedback"

### Story 4.5: Evidence Anchors

As a Teacher,
I want to see visual lines connecting AI comments to specific text in the student's work,
So that I trust the AI's feedback.

**Acceptance Criteria:**

**Given** a Teacher viewing AI-suggested feedback
**When** they hover over a grammar comment
**Then** a visual line is drawn connecting the comment card to the specific sentence in the essay
**And** the relevant text is highlighted

### Story 4.6: One-Click Accept/Reject

As a Teacher,
I want to quickly accept or reject AI suggestions,
So that I can finalize grading in seconds.

**Acceptance Criteria:**

**Given** a list of AI suggestions
**When** the Teacher clicks the "Accept" checkmark on a suggestion
**Then** it is added to the Final Feedback report
**When** the Teacher clicks "Reject", it is removed from the view

## Epic 5: Retention Intelligence Dashboard

**Goal:** Provide Owners with "Glanceable Intelligence" on student health to prevent churn via immediate intervention.

### Story 5.1: Student Health Logic

As a System,
I want to calculate a "Health Score" for each student based on attendance and submission rates,
So that at-risk students are flagged.

**Acceptance Criteria:**

**Given** a nightly cron job
**When** it analyzes student data (e.g., >2 missed classes or >3 missed assignments)
**Then** it updates the student's status to "At Risk" (Red) or "Warning" (Yellow)

### Story 5.2: Traffic Light Dashboard

As a Center Owner,
I want to see a dashboard of students color-coded by health status,
So that I can instantly identify who needs help.

**Acceptance Criteria:**

**Given** an Owner on the Dashboard
**When** the page loads
**Then** they see a list of students with Red/Yellow/Green indicators
**And** the Red (At Risk) students are sorted to the top

### Story 5.3: Intervention Workflow

As a Center Owner,
I want to click a student to see why they are at risk and message their parent,
So that I can save the customer.

**Acceptance Criteria:**

**Given** an Owner clicking a "Red" student
**When** the Profile Overlay opens
**Then** it shows the specific reasons (e.g., "Missed 3 assignments")
**And** a "Message Parent" button generates a Zalo deep link with a pre-filled concern message

## Epic 6: Ecosystem Innovation (Phase 1.5)

**Goal:** Deepen engagement through Zalo parent loops and personalized AI tuning (Golden Samples).

### Story 6.1: Zalo Notification Integration

As a System,
I want to send automated "Micro-win" notifications to parents via Zalo,
So that they feel the value of their investment.

**Acceptance Criteria:**

**Given** a student receives a high score (e.g., >8.0)
**When** the grade is published
**Then** a "Micro-win" message is sent to the linked Parent's Zalo account
**And** the parent receives it immediately

### Story 6.2: Golden Sample Upload

As a Center Owner,
I want to upload "Golden Sample" essays with my own grading,
So that the AI learns my specific marking style.

**Acceptance Criteria:**

**Given** an Owner in the "AI Settings"
**When** they upload a graded essay as a "Golden Sample"
**Then** the system stores it as a few-shot example
**And** future AI grading prompts include this example for style alignment
