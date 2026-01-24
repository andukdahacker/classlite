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
lastEdited: "2026-01-17"
editHistory:
  - date: "2026-01-17"
    changes: "Updated Executive Summary, User Journeys, Functional Requirements, and NFRs based on UX Design Specification (High-Velocity Pedagogy, Offline-Proofing, Grading Workbench details)."
---

# Product Requirements Document - classlite

**Author:** Ducdo
**Date:** 2026-01-17

## Executive Summary

**ClassLite** is a B2B SaaS Learning Management System tailored for small to medium-sized IELTS centers in Vietnam. It streamlines operations by unifying administrative logistics (scheduling, rosters) and pedagogical delivery (AI-assisted grading, exercise building) into a single "Lite" platform.

The core vision is **"High-Velocity Pedagogy"**. By automating 80% of the grading drudgery through an AI-assisted workbench ("Review -> Adjust -> Approve"), ClassLite empowers expert teachers to double their feedback speed without sacrificing quality. For owners, it offers **"Glanceable Intelligence"**—immediate visibility into center health ("Done by 5 PM" philosophy) without complex reporting tools.

### Target Users

- **Teaching Owner:** Requires **"Clarity & Calm"**. Needs instant "Traffic Light" visibility into student performance and business health to make data-driven decisions without manual spreadsheets.
- **Expert Teacher:** Values **"Respect & Support"**. Needs a "Grading Workbench" that acts as a humble assistant, drafting feedback and scores that they can validate in seconds ("3-Minute Loop") while retaining full editorial control.
- **Student:** Needs to feel **"Safe & Seen"**. Requires a friction-free, offline-first mobile interface ("Login-Free feeling") to submit work reliably from anywhere, even with unstable internet.

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

### Phase 3 (Expansion)

**Focus:** Enterprise and New Verticals.

- **Features**: Multi-Subject Support (STEM), Enterprise Analytics (Financials/Payroll).

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

---

## Functional Requirements

### 1. Authentication & Center Management

- **FR1**: Users can sign up their own center (Self-Service) or login using Google OAuth or Email/Password.
- **FR2**: Platform Admins can manually provision new Center tenants (`center_id`) for enterprise or managed accounts.
- **FR3**: Center Owners can invite users (Teachers, Students) via email.
- **FR4**: System must restrict access based on Role (Owner, Teacher, Student).
- **FR5**: System must enforce logical data isolation (users access only their `center_id` data).
- **FR6**: Center Owners can configure center settings (Name, Logo, Timezone).

### 2. Class Logistics & Scheduling

- **FR7**: Center Admins can manage Courses and Class Sessions.
- **FR8**: Center Admins can assign Teachers and Students to Classes.
- **FR9**: Users can view a visual Weekly Schedule of assigned classes.
- **FR10**: System must detect and warn of resource conflicts (Room/Teacher double-booking).
- **FR11**: Teachers can mark attendance (Present/Absent).
- **FR12**: System must notify participants of schedule changes.

### 3. Pedagogy & Exercise Builder

- **FR13**: Teachers can create exercises using a Manual Builder (Rich Text, Multiple Choice, Fill-in-Blank).
- **FR14**: Teachers can upload PDF/Word docs to trigger AI exercise generation.
- **FR15**: Teachers can edit AI-generated content before publishing.
- **FR16**: Teachers can assign exercises with due dates.
- **FR17**: Students can view "Due Soon" assignments dashboard.

### 4. Grading Workbench

- **FR18**: Students can submit assignments via mobile-responsive interface (text or image).
- **FR19**: System must auto-save student work-in-progress to LocalStorage every 3 seconds (Offline-Proof).
- **FR20**: System must trigger AI analysis on submission (Auto-grade Reading/Listening; Suggest scores for Writing/Speaking).
- **FR21**: The system shall provide a split-screen interface (Student Work / AI Analysis) for grading.
- **FR22**: The system shall display "Evidence Anchors" (visual lines) connecting AI comments to specific text ranges on hover.
- **FR23**: The system shall allow teachers to "One-Click Accept" AI suggestions (score + grammar fix).
- **FR24**: The system shall support "Range-Aware" comments that gracefully detach or re-attach if the underlying text is edited.
- **FR24b**: The system shall allow teachers to "Reject" AI suggestions, removing them from the final feedback.
- **FR24c**: The system shall auto-advance to the next submission upon approval (with an optional "Breather" pause after 5 items).

### 5. Student Success

- **FR25**: Center Owners can view "Student Health Dashboard" (At-risk flags via Traffic Light system).
- **FR26**: Center Owners can click a flag to open the Student Profile Overlay (no page reload).
- **FR27**: Center Owners can initiate interventions via Zalo Deep Links with pre-filled templates.

### 6. Innovation Features (Phase 1.5)

- **FR28 (Zalo)**: System can send automated "Micro-win" notifications to linked parent Zalo accounts.
- **FR29 (Zalo)**: Parents can manage Zalo notification preferences.
- **FR30 (Guardian)**: Center Owners can upload "Golden Sample" feedback to tune AI style.
- **FR31 (Guardian)**: System must prioritize Golden Samples when generating AI feedback for that tenant.
- **FR32 (Offline)**: The system shall detect offline status and display a persistent "Do Not Close" warning banner during submission attempts.
- **FR33 (Offline)**: The system shall queue failed submissions and auto-retry upon network reconnection (Background Sync).

---

## SaaS B2B Requirements

### Technical Architecture

- **Tenant Model**: Logical Separation (Single DB, `center_id` column).
- **Layering**: Clean architecture (Route -> Controller -> Service) to ensure testability and framework independence of business logic.
- **Enforcement**: Middleware-level security hooks.
- **Subscription**: Freemium model (MVP) with in-app billing integration capability.

### Integrations

- **Primary**: Zalo (Notification API).
- **Secondary**: Google Calendar (One-way sync), Google Meet (Link generation).

---

## Innovation Analysis

### 1. "The Methodology Guardian" (Style Cloning)

- **Concept**: AI grades using the _Center Director's_ specific voice/rubric, not generic rules.
- **Value**: Solves "Junior Teacher Quality" consistency issues.
- **Validation**: Turing Test (Can Owner distinguish AI feedback from their own?).

### 2. "The 'Dinner Table' Loop" (Zalo)

- **Concept**: Push "Micro-wins" to parents daily (e.g., "Ask Bao to use 'once in a blue moon' at dinner").
- **Value**: High-frequency retention loop for the payer (Parent).

---

## Non-Functional Requirements

### Performance & Reliability

- **NFR1**: The Grading Workbench shall load the next submission in **< 500ms** (perceived instant) for 95th percentile of users (utilizing pre-fetching).
- **NFR2**: The Dashboard shall render "Traffic Light" status widgets in **< 1 second**.
- **NFR3**: AI Grading suggestions appear **< 10s** after submission.
- **NFR4**: **99.9% uptime** during business hours (8 AM - 10 PM GMT+7).
- **NFR5**: Student work auto-saved every **3s** to LocalStorage.

### Security

- **NFR6 (Isolation)**: API rejects cross-tenant resource access (403 Forbidden).
- **NFR7**: Sensitive data (grades, PII) encrypted at rest.

### Usability & Accessibility

- **NFR8 (Mobile First)**: 100% of Student/Teacher flows functional on 375px+ viewports.
- **NFR9 (i18n)**: UI supports **English** and **Vietnamese** from launch.
- **NFR10 (WCAG)**: The system shall comply with **WCAG 2.1 Level AA** standards.
- **NFR11 (Keyboard)**: Critical workflows (Grading Loop) shall be fully operable via **Keyboard Navigation** (Tab, Enter, Shortcuts).
- **NFR12 (Focus)**: Input fields in the Grading Workbench shall support "Click-to-Edit" behavior with prominent `:focus-visible` indicators.
