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
  ]
lastEdited: "2026-01-24"
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

| Epic       | Description                           | Functional Requirements Covered          |
| :--------- | :------------------------------------ | :--------------------------------------- |
| **Epic 1** | Tenant & User Management              | FR1, FR2, FR3, FR4, FR5, FR6             |
| **Epic 2** | Logistics & Scheduling                | FR7, FR8, FR9, FR10, FR11, FR12          |
| **Epic 3** | Exercise Builder & Content            | FR13, FR14, FR15, FR16, FR17             |
| **Epic 4** | Student Submission & Offline-Proofing | FR18, FR19, FR34, FR35                   |
| **Epic 5** | AI Grading Workbench                  | FR20, FR21, FR22, FR23, FR24, FR25, FR26 |
| **Epic 6** | Student Health & Intervention         | FR27, FR28, FR29                         |
| **Epic 7** | Zalo Integration & Notifications      | FR30, FR31                               |
| **Epic 8** | Platform Compliance & Methodology     | FR32, FR33, FR36                         |

---

## 3. Epic List

### Epic 1: Tenant & User Management

**Summary:** Provides the foundation for multi-tenancy, authentication, and access control. Ensures that center owners can setup their environment and manage their staff/students securely within isolated data boundaries.

### Epic 2: Logistics & Scheduling

**Summary:** Streamlines center operations through visual class management and scheduling. Includes automated conflict detection and real-time notifications to ensure logistical harmony.

### Epic 3: Exercise Builder & Content

**Summary:** Empowers teachers to create and distribute pedagogical materials. Features AI-assisted generation from document uploads to reduce content preparation time from hours to minutes.

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

---

### Epic 3: Exercise Builder & Content

#### Story 3.1: Manual Exercise Builder (FR13, FR16)

**As a** Teacher,
**I want to** build interactive exercises with various question types,
**So that** I can assess student skills digitally.

- **AC1:** User can add "Rich Text" blocks, "Multiple Choice Questions", and "Fill-in-the-Blank" inputs.
- **AC2:** User can set correct answers for automated grading of Reading/Listening tasks.
- **AC3:** Exercises can be assigned to a Class with a specific due date.

#### Story 3.2: AI Content Architect (FR14, FR15)

**As a** Teacher,
**I want to** upload a PDF article and have the AI generate questions,
**So that** I can save time on content preparation.

- **AC1:** User can upload a PDF/Word file (max 10MB).
- **AC2:** System extracts text and generates 5-10 MCQ/True-False questions within 30 seconds.
- **AC3:** Teacher can edit or delete AI-generated questions before they are assigned to students.

#### Story 3.3: Student Assignment Dashboard (FR17)

**As a** Student,
**I want to** see a list of my pending assignments,
**So that** I can prioritize my homework.

- **AC1:** Dashboard displays "Due Soon" and "Overdue" assignments with priority labels.
- **AC2:** Clicking an assignment opens the submission interface.

---

### Epic 4: Student Submission & Offline-Proofing

#### Story 4.1: Mobile Submission Interface (FR18, NFR7)

**As a** Student,
**I want to** submit my work easily from my smartphone,
**So that** I can do my homework anywhere.

- **AC1:** UI is optimized for viewports down to 375px (no horizontal scrolling).
- **AC2:** Input fields and buttons are touch-friendly (min 44px height).
- **AC3:** Support for photo uploads (camera integration) for handwritten tasks.

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
