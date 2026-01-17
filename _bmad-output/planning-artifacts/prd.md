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
---

# Product Requirements Document - classlite

**Author:** Ducdo
**Date:** 2026-01-17

## Executive Summary

**ClassLite** is a B2B SaaS Learning Management System tailored for small to medium-sized IELTS centers in Vietnam. It solves the operational friction of fragmented tools (spreadsheets, Docs) by providing a unified "Lite" platform for scheduling, roster management, and AI-assisted grading.

**Core Value Proposition:**

- **For Owners:** Visibility into student health and center operations without manual data aggregation.
- **For Teachers:** 50% reduction in grading time via an AI Grading Workbench that drafts feedback for teacher review.
- **Differentiation:** "Methodology Guardian" (AI Style Cloning) allows centers to scale their unique teaching method, preventing the "generic AI" quality drop.

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

### Journey 1: The "Sunday Night Setup" (Admin / Owner)

**Persona:** Minh, Center Owner.
**Goal:** Setup weekly logistics and ensure staffing.

1.  **Scene:** Sunday, 9 PM. Minh logs in.
2.  **Roster:** Invites new student "Linh" via email and assigns her to "IELTS 6.0".
3.  **Scheduling:** Drags "Speaking Club" to Room B to resolve a visual conflict with Room A.
4.  **Health Check:** Checks Dashboard, sees "Tuan" is Red (missing homework), and messages Tuan's teacher.

### Journey 2: The "Skeptical Grader" (Expert Teacher)

**Persona:** Sarah, Senior Teacher (8 years exp).
**Goal:** Grade 15 essays efficiently without compromising quality.

1.  **Scene:** Sarah has 1 hour between classes. Opens Grading Workbench.
2.  **AI Assessment:** View's Bao's essay. AI has marked grammar errors and suggested Band 6.5.
3.  **Expert Touch:** Sarah accepts grammar fixes but lowers score to 6.0 because the argument logic is weak. Adds a custom comment: _"Your logic contradicts paragraph 2."_
4.  **Outcome:** Finishes grading in 45 mins (vs 2 hours).

### Journey 3: The "Last Minute Submission" (Student)

**Persona:** Bao, Student.
**Goal:** Submit homework on the bus before class.

1.  **Scene:** On the bus, 20 mins before class.
2.  **Access:** Opens ClassLite mobile web. Sees "Due Soon" alert.
3.  **Submission:** Pastes essay text into the mobile-responsive editor.
4.  **Success:** Hits submit. Data auto-saves even on shaky 4G.

---

## Functional Requirements

### 1. Authentication & Center Management

- **FR1**: Users can sign up and login using Google OAuth or Email/Password.
- **FR2**: Platform Admins can provision new Center tenants (`center_id`).
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
- **FR19**: System must auto-save student work-in-progress.
- **FR20**: System must trigger AI analysis on submission (Auto-grade Reading/Listening; Suggest scores for Writing/Speaking).
- **FR21**: Teachers can view the Grading Workbench (Submission + AI Suggestions).
- **FR22**: Teachers can edit/override AI scores and corrections.
- **FR23**: Teachers can add custom rich-text comments.
- **FR24**: Teachers can publish grades to students.

### 5. Student Success

- **FR25**: Center Owners can view "Student Health Dashboard" (At-risk flags).
- **FR26**: Center Owners can filter performance by Class/Teacher.
- **FR27**: Students can view their personal Gradebook.

### 6. Innovation Features (Phase 1.5)

- **FR28 (Zalo)**: System can send automated "Micro-win" notifications to linked parent Zalo accounts.
- **FR29 (Zalo)**: Parents can manage Zalo notification preferences.
- **FR30 (Guardian)**: Center Owners can upload "Golden Sample" feedback to tune AI style.
- **FR31 (Guardian)**: System must prioritize Golden Samples when generating AI feedback for that tenant.

---

## SaaS B2B Requirements

### Technical Architecture

- **Tenant Model**: Logical Separation (Single DB, `center_id` column).
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

- **NFR1**: Page loads **< 3s** on standard 4G mobile networks.
- **NFR2**: AI Grading suggestions appear **< 10s** after submission.
- **NFR3**: Input latency **< 50ms** in Editor.
- **NFR4**: **99.9% uptime** during peak hours (5 PM - 10 PM GMT+7).
- **NFR5**: Student work auto-saved every **30s**.

### Security

- **NFR6 (Isolation)**: API rejects cross-tenant resource access (403 Forbidden).
- **NFR7**: Sensitive data (grades, PII) encrypted at rest.

### Usability

- **NFR8 (Mobile First)**: 100% of Student/Teacher flows functional on 375px+ viewports.
- **NFR9 (i18n)**: UI supports **English** and **Vietnamese** from launch.
