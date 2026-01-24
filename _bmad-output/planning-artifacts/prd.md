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
  ]
inputDocuments:
  [
    "_bmad-output/planning-artifacts/product-brief-classlite-2026-01-16.md",
    "README.md",
    "AGENTS.md",
    "package.json",
  ]
workflowType: "prd"
classification:
  projectType: saas_b2b
  domain: edtech
  complexity: medium
  projectContext: brownfield
lastEdited: "2026-01-24"
editHistory:
  - date: "2026-01-17"
    changes: "Updated Executive Summary, User Journeys, Functional Requirements, and NFRs based on UX Design Specification (High-Velocity Pedagogy, Offline-Proofing, Grading Workbench details)."
  - date: "2026-01-24"
    changes: "Narrative expansion (Admin & Content journeys), domain compliance (Decree 13), RBAC matrix addition, and structural hardening of FRs/NFRs to remove implementation leakage and improve SMART alignment."
---

# Product Requirements Document - classlite

**Author:** Ducdo
**Date:** 2026-01-24

## Executive Summary

**ClassLite** is a B2B SaaS Learning Management System tailored for small to medium-sized IELTS centers in Vietnam. It streamlines operations by unifying administrative logistics (scheduling, rosters) and pedagogical delivery (AI-assisted grading, exercise building) into a single "Lite" platform.

The core vision is **"High-Velocity Pedagogy"**. By automating 80% of the grading drudgery through an AI-assisted workbench ("Review -> Adjust -> Approve"), ClassLite empowers expert teachers to double their feedback speed without sacrificing quality. For owners, it offers **"Glanceable Intelligence"**—immediate visibility into center health ("Done by 5 PM" philosophy) without complex reporting tools.

### Target Users

- **Teaching Owner:** Requires **"Clarity & Calm"**. Needs instant "Traffic Light" visibility into student performance and business health to make data-driven decisions without manual spreadsheets.
- **Expert Teacher:** Values **"Respect & Support"**. Needs a "Grading Workbench" that acts as a humble assistant, drafting feedback and scores that they can validate in seconds ("3-Minute Loop") while retaining full editorial control.
- **Student:** Needs to feel **"Safe & Seen"**. Requires a friction-free, offline-first mobile interface ("Login-Free feeling") to submit work reliably from anywhere, even with unstable internet.
- **Center Admin:** Needs **"Operational Efficiency"**. Responsible for the logistical backbone—rosters, schedules, and resource allocation—ensuring the center runs without friction.

---

## Success Criteria

### User Success

- **Teaching Owner (Visibility Guarantee)**:
  - **Metric:** "Time to Insight"
  - **Target:** Generate a "Student Health Report" (at-risk students + actions) in **< 1 minute**.
  - **Baseline:** Currently takes hours of manual aggregation.
- **Expert Teacher (Efficiency Guarantee)**:
  - **Metric:** "Grading Time Reduction"
  - **Target:** **50% reduction** in time spent grading Writing/Speaking assignments compared to manual process.
  - **Constraint:** Must maintain feedback depth (no generic "good job" comments).
- **Student (Frictionless Submission)**:
  - **Metric:** "Submission Friction"
  - **Target:** Student can submit homework in **< 3 clicks** from login.
  - **Outcome:** Zero student complaints about submission complexity during pilot.

### Business Success

- **Pilot Launch Penetration**:
  - **Goal:** Validated deployment in **3 pilot centers**.
  - **Target:** **100% of teachers** use the platform for **every class** for a continuous **2-week period**.
- **Retention**:
  - **Target:** Zero "Student Churn" flagged due to missed performance signals during the pilot.

### Technical Success

- **AI Performance**:
  - **Target:** Teachers accept **> 70%** of AI-suggested grammar corrections and scoring without edit.
  - **Target:** Teachers accept **> 80%** of AI-parsed questions from PDF uploads.
- **Stability**:
  - **Target:** Zero "Class Stopping" bugs (bugs preventing class operations) during pilot.

---

## Product Scope & Roadmap

### MVP Strategy (Phase 1)

**Focus:** The "Painkiller" MVP. Robust, autonomous operations for the two biggest pains: **Grading Efficiency** and **Scheduling Logistics**.

- **Administration**: Auth (Fixed Roles), Center Config, Roster Management, Visual Scheduler.
- **Pedagogy**: Manual Exercise Builder, Student Submission (Mobile Web).
- **AI Core**: AI Grading Workbench (Generic AI models) to prove efficiency.

### Phase 1.5 (Differentiation Update)

**Focus:** Innovation and Retention. De-risked features deployed shortly after stability is proven.

- **Innovation**: **Zalo Integration** (Parent Loop) and **Methodology Guardian** (Style Cloning).

### Phase 2 (Growth)

**Focus:** Scale and Ecosystem.

- **Features**: Knowledge Hub (Asset Library), Gamification (Badges/Points), Native Mobile Apps.

---

## User Journeys

### Journey 1: The "3-Minute Grading Loop" (Teacher)

**Goal:** Reduce grading time per essay from 15 mins to < 3 mins while increasing feedback quality.

- **Trigger:** Teacher opens "Grading Workbench" (Deep link or Dashboard).
- **Step 1 (Auto-Load):** System auto-loads the first "Ready" submission in < 500ms.
- **Step 2 (Review):** Teacher sees split-screen view: Student Essay (Left) vs AI Analysis (Right). AI highlights grammar errors and suggests band scores.
- **Step 3 (Verify):** Teacher hovers over AI comments; "Evidence Anchors" visually connect comments to text. Teacher swipes to reject bad suggestions or clicks to accept/edit.
- **Step 4 (Completion):** Teacher clicks "Approve & Next". "Stamp" animation plays. Next submission slides in automatically.
- **Validation:** Teacher feels in "Flow". No manual file opening/closing.

### Journey 2: The "3 Clicks to Rescue" (Owner)

**Goal:** Identify and save at-risk students before they churn.

- **Trigger:** Owner sees "Red Light" indicator on Dashboard.
- **Step 1 (Scan):** Click Red indicator. Student Profile Overlay opens (no page reload).
- **Step 2 (Diagnose):** Root cause displayed immediately (e.g., "Missed 3 Homeworks").
- **Step 3 (Act):** Click "Message Parent". System opens Zalo deep-link with pre-filled "Concern Template".
- **Validation:** Intervention logged. Owner feels "in control".

### Journey 3: The "Offline-Proof" Submission (Student)

**Goal:** Submit homework reliably regardless of network quality.

- **Trigger:** Student finishes typing/uploading photo on mobile web.
- **Step 1 (Attempt):** Student clicks "Submit". Network check fails (Offline).
- **Step 2 (Safeguard):** UI shows "Saved Locally" banner with "Do Not Close Tab" warning. Amber status icon rotates.
- **Step 3 (Sync):** Student walks to better signal. Background worker detects connection.
- **Step 4 (Success):** Data uploads automatically. Green "Success" checkmark appears.
- **Validation:** Zero data loss. Student trusts the platform.

### Journey 4: The Logistics Master (Admin/Owner)

**Goal:** Setup a new center and class schedule in under 10 minutes.

- **Trigger:** New center sign-up.
- **Step 1 (Setup):** Owner configures center name and timezone.
- **Step 2 (Roster):** Owner uploads student/teacher CSV or invites via email.
- **Step 3 (Schedule):** Owner uses drag-and-drop scheduler to create class sessions. System highlights a teacher conflict in red.
- **Step 4 (Resolution):** Owner adjusts the time; conflict clears.
- **Validation:** Roster and schedule are live. No spreadsheets needed.

### Journey 5: The Content Architect (Teacher)

**Goal:** Create a high-quality exercise set using AI in under 5 minutes.

- **Trigger:** Teacher needs a new Reading exercise.
- **Step 1 (Source):** Teacher uploads a news article PDF.
- **Step 2 (Generate):** Teacher selects "Multiple Choice" and "True/False" formats. AI generates questions in 15 seconds.
- **Step 3 (Refine):** Teacher edits Question 3 to make it harder.
- **Step 4 (Assign):** Teacher clicks "Assign to Class 10A" with a Friday deadline.
- **Validation:** Exercise is published. Teacher saved 40 minutes of manual typing.

---

## Functional Requirements

### 1. Authentication & Center Management

_Traces to: Journey 4_

- **FR1**: [Visitor] can [sign up their own center or login via Google/Email].
- **FR2**: [Platform Admin] can [manually provision new tenants].
- **FR3**: [Center Owner/Admin] can [invite users via email].
- **FR4**: [System] can [enforce RBAC based on Role (Owner, Admin, Teacher, Student)].
- **FR5**: [System] can [enforce logical data isolation via tenant identifiers].
- **FR6**: [Center Owner/Admin] can [configure center settings (Name, Logo, Timezone)].

### 2. Class Logistics & Scheduling

_Traces to: Journey 4_

- **FR7**: [Admin] can [manage Courses and Class Sessions].
- **FR8**: [Admin] can [assign Teachers and Students to Classes].
- **FR9**: [User] can [view a visual Weekly Schedule of assigned classes].
- **FR10**: [System] can [detect and warn of resource conflicts (Room/Teacher double-booking) during scheduling].
- **FR11**: [Teacher] can [mark attendance (Present/Absent)].
- **FR12**: [System] can [notify participants of schedule changes via in-app notification and email within 30 seconds of update].

### 3. Pedagogy & Exercise Builder

_Traces to: Journey 5_

- **FR13**: [Teacher] can [create exercises using a Manual Builder (Rich Text, Multiple Choice, Fill-in-Blank)].
- **FR14**: [Teacher] can [upload PDF/Word docs to trigger AI exercise generation].
- **FR15**: [Teacher] can [edit AI-generated content before publishing].
- **FR16**: [Teacher] can [assign exercises with due dates].
- **FR17**: [Student] can [view "Due Soon" assignments dashboard].

### 4. Grading Workbench

_Traces to: Journey 1_

- **FR18**: [Student] can [submit assignments via mobile-responsive interface].
- **FR19**: [System] can [auto-save student work-in-progress to persistent client-side storage every 3 seconds].
- **FR20**: [System] can [trigger AI analysis within 5 seconds of submission (Auto-grade Reading/Listening; Suggest scores for Writing/Speaking)].
- **FR21**: [Teacher] can [use a split-screen interface (Student Work / AI Analysis) for grading].
- **FR22**: [Teacher] can [view visual "Evidence Anchors" connecting AI comments to text evidence on hover].
- **FR23**: [Teacher] can [apply AI suggestions (score + grammar fix) with one click].
- **FR24**: [System] can [maintain comment anchors if < 20% of text is modified; it shall orphan the comment if modified by > 50%].
- **FR25**: [Teacher] can [reject AI suggestions, removing them from the final feedback].
- **FR26**: [System] can [auto-advance to the next submission upon approval (with an optional "Breather" pause after 5 items)].

### 5. Student Success

_Traces to: Journey 2_

- **FR27**: [Owner/Admin] can [view "Student Health Dashboard" with real-time updates based on attendance and submission data].
- **FR28**: [Owner/Admin] can [open Student Profile Overlay from the dashboard without a page reload].
- **FR29**: [Owner/Admin] can [initiate interventions via Zalo Deep Links with pre-filled templates].

### 6. Innovation & Reliability (Phase 1.5)

_Traces to: Journey 1, 2, 3_

- **FR30**: [System] can [send automated Zalo notifications for Personal Bests or 7-day assignment streaks].
- **FR31**: [Parent] can [manage Zalo notification preferences].
- **FR32**: [Owner] can [upload "Golden Sample" feedback to tune AI style].
- **FR33**: [System] can [utilize Few-Shot Prompting using Golden Samples to target > 85% style alignment].
- **FR34**: [System] can [detect offline status and display a persistent "Do Not Close" warning banner during submission attempts].
- **FR35**: [System] can [queue failed submissions and auto-retry upon network reconnection via Background Sync].

---

## Domain Compliance & Security

### Section 7: Domain Compliance

- **Data Sovereignty (Vietnam Decree 13/2023/ND-CP):** Personal data of Vietnamese citizens must be stored and processed in compliance with local regulations. The system must support local hosting or provide data residency guarantees for the Vietnamese market.
- **Content Moderation:** AI-generated content and student submissions must be screened for prohibited content (political, sensitive, or offensive) as per Vietnamese internet regulations (Decree 72/2013/ND-CP).

### Section 8: RBAC Matrix

| Feature                  | Owner | Admin |     Teacher      | Student |
| :----------------------- | :---: | :---: | :--------------: | :-----: |
| Center Settings          | CRUD  | CRUD  |        R         |    -    |
| User Management          | CRUD  | CRUD  |        -         |    -    |
| Class Scheduling         | CRUD  | CRUD  |        R         |    R    |
| Attendance               | CRUD  | CRUD  |       CRUD       |    R    |
| Exercise Creation        | CRUD  | CRUD  |       CRUD       |    -    |
| Assignment               | CRUD  | CRUD  |       CRUD       |    -    |
| Submission               |   -   |   -   |        -         |  CRUD   |
| AI Grading Workbench     | CRUD  | CRUD  |       CRUD       |    -    |
| Student Health Dashboard |   R   |   R   | R (Own Students) |    -    |
| Zalo Integration Config  | CRUD  | CRUD  |        -         |    -    |

---

## SaaS B2B Requirements

### Technical Architecture

- **Tenant Model**: Logical Separation (Logical data isolation via tenant identifiers).
- **Layering**: Clean architecture (Route -> Controller -> Service) to ensure testability and logic decoupling.
- **Enforcement**: Middleware-level security enforcement.
- **Subscription**: Freemium model (MVP) with future billing integration.

### Integrations

- **Primary**: Zalo (Notification API).
- **Secondary**: Google Calendar (One-way sync), Google Meet (Link generation).

---

## Non-Functional Requirements

### Performance & Reliability

- **NFR1**: [Performance, < 500ms latency, P95 Server Response Time, Grading Workbench auto-advance].
- **NFR2**: [Performance, < 1 second, UI rendering, Dashboard "Traffic Light" widgets].
- **NFR3**: [Availability, 99.9% uptime, Monitoring, Business hours 8 AM - 10 PM GMT+7].
- **NFR4**: [Data Integrity, 3s interval, background sync, persistent client-side storage during student submissions].

### Security & Privacy

- **NFR5**: [Security, Cross-tenant access prevention, Middleware validation, Unauthorized access attempts].
- **NFR6**: [Privacy, AES-256 (or similar), Encryption-at-rest, Sensitive PII and grades].

### Usability & Accessibility

- **NFR7**: [Accessibility, 100% viewport compliance, Audit, Viewports >= 375px].
- **NFR8**: [i18n, Multi-language support, User toggle, English/Vietnamese UI].
- **NFR9**: [Accessibility, WCAG 2.1 Level AA, Audit, All public-facing interfaces].
- **NFR10**: [Usability, Keyboard-only operation, Audit, Grading Loop workflow].
- **NFR11**: [Usability, High-contrast visual focus indicators, Audit, All interactive elements].
