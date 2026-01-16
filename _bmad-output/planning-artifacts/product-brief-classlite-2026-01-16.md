---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: ["user-feature-request.md"]
date: 2026-01-16
author: Ducdo
---

# Product Brief: classlite

## Executive Summary

ClassLite is a specialized Learning Management System tailored for small to medium-sized IELTS English centers in Vietnam, with future expansion to other STEM subjects. It enables these centers to modernize their operations and improve teaching quality by providing an affordable, all-in-one platform that handles everything from administrative logistics (scheduling, attendance) to pedagogical delivery (specialized IELTS exercises, AI-assisted grading), without the complexity or cost of enterprise enterprise solutions.

---

## Core Vision

### Problem Statement

Small and medium-sized IELTS centers in the Vietnamese market lack a unified, affordable platform that addresses both their specific administrative needs (flexible scheduling, role-based management) and their unique academic requirements (IELTS-specific exercise formats, speaking/writing feedback).

### Problem Impact

Without a dedicated solution, centers are forced to stitch together fragmented tools (Google Sheets, calendar apps, generic file sharing), leading to high administrative overhead, a disjointed student experience, and an inability to build and protect their own intellectual property (Knowledge Hubs). This operational friction limits their ability to scale and focus on their core value: teaching.

### Why Existing Solutions Fall Short

- **Enterprise LMSs**: Too complex, expensive, and rigid for agile, smaller centers.
- **Generic Admin Tools**: Lack specific educational features like grading or exercise builders giving no support for the actual teaching process.
- **Fragmented Workflows**: Using disparate tools for scheduling, content, and grading creates data silos and manual work.

### Proposed Solution

ClassLite provides a "Lite" yet powerful ecosystem designed specifically for this market. It integrates:
- **Streamlined Admin**: OAuth, role-based permissions, and intuitive scheduling.
- **Academic Focus**: A dynamic Exercise Builder supporting IELTS formats (import from PDF/Word with AI processing).
- **AI-Powered Assessment**: Automated grading for Reading/Listening and AI-assisted feedback for Writing/Speaking.
- **Knowledge Retention**: A centralized Knowledge Hub for centers to build and own their long-term educational assets.

### Key Differentiators

- **Vertical Specialization**: Deeply tailored workflows for IELTS centers in Vietnam, not a one-size-fits-all tool.
- **AI-First Pedagogy**: Native AI grading and exercise generation significantly reduce teacher workload.
- **Cost-Effective Scalability**: A "Lite" architecture that grows with the center, from a single classroom to a multi-subject school.
- **Content Sovereignty**: Empowers centers to build and retain their own digital library (Knowledge Hub).

## Target Users

### Primary Users

#### 1. The "Teaching Owner" (Center Owner & Head Teacher)
*   **Context**: Owns a small-to-medium center and actively teaches classes. They wear two hats: business operator and educator.
*   **Core Friction**: They lack visibility into student progress. They want to be data-driven advisors but are stuck manually aggregating data from spreadsheets and disparate tools.
*   **The Goal**: To offer personalized, data-backed recommendations to students (retention) without spending hours crunching numbers.
*   **Success Moment**: Instantly seeing a "Student Health" dashboard that highlights who is falling behind and generating a personalized improvement plan for them in one click.

#### 2. The Expert IELTS Teacher
*   **Context**: deeply invested in student success and their own teaching method. They see AI as a *tool*, not a replacement.
*   **Core Friction (Grading)**: Grading Writing/Speaking is their biggest bottleneck, but they reject "fully auto" grading because it lacks the personal touch that justifies their tuition.
*   **Core Friction (Prep)**: Sourcing high-quality, level-appropriate Reading/Listening materials without copyright risks is difficult and slow.
*   **The Goal**: "AI-Assisted Efficiency." They want AI to do the heavy lifting (grammar check, initial score estimation, exercise generation) so they can focus on high-value feedback and coaching.

### Secondary Users

#### 3. The Student (Consumer)
*   *Note: Not the primary focus for MVP features, but the end-consumer of the value.*
*   **Role**: completes assigned exercises and views feedback.
*   **Needs**: A frictionless interface to submit work and receive the high-quality, personalized feedback that the teachers are generating.

### User Journey (The "Feedback Loop")

1.  **Preparation**: Teacher uses the *Exercise Builder* to generate a level-appropriate Reading passage + questions from a raw text (AI processing), ensuring no copyright issues.
2.  **Assignment**: Teacher assigns the reading task + a Writing essay prompt to the class.
3.  **Submission**: Student submits the work.
4.  **AI-Assisted Review**:
    *   *Reading/Listening*: Auto-graded instantly.
    *   *Writing*: Teacher opens the submission. AI has already highlighted grammar errors and suggested a "Band 6.0" score. Teacher reviews, adds a personal note on "argument structure," adjusts score to "6.5," and sends.
5.  **Advisory**: Weeks later, the *Teaching Owner* looks at the *Knowledge Hub* analytics, sees the student is struggling with "Coherence," and recommends a specific supplementary course.

5.  **Advisory**: Weeks later, the *Teaching Owner* looks at the *Knowledge Hub* analytics, sees the student is struggling with "Coherence," and recommends a specific supplementary course.

## Success Metrics

### User Success Metrics

*   **For Teaching Owners (Visibility Guarantee)**:
    *   *Metric*: "Time to Insight"
    *   *Target*: A Teaching Owner can generate a comprehensive "Student Health Report" (identifying at-risk students + recommended actions) in **< 1 minute**. (Baseline: Currently takes hours of manual spreadsheet aggregation).

*   **For Expert Teachers (Efficiency Guarantee)**:
    *   *Metric*: "Grading Time Reduction"
    *   *Target*: Teachers spend **50% less time** on grading Writing/Speaking assignments compared to their manual process, while maintaining or increasing the depth of feedback provided.

### Business Objectives (MVP)

*   **Pilot Launch Penetration**:
    *   *Goal*: Validated deployment in **3 pilot centers**.
    *   *Acceptance Criteria*: **100% Teacher Activation** within those centers (meaning every teacher in the pilot center actively uses the platform for their classes, not just a subset). This proves the UX is intuitive enough to replace their existing habits.

### Key Performance Indicators (KPIs)

*   **Adoption**: % of Daily Active Teachers (DAT) vs Total Registered Teachers in pilot centers.
*   **Engagement**: # of AI-assisted feedback sessions completed per week.
*   **Retention**: Zero "Student Churn" flagged due to missed performance signals during the pilot period.

*   **Retention**: Zero "Student Churn" flagged due to missed performance signals during the pilot period.

## MVP Scope

### Core Features (The "Lite" Promise)

#### 1. Administration & Logistics
*   **Auth & Roles**: Google/Facebook OAuth + Role-based access (Owner, Expert Teacher, Student).
*   **Class Management**: Create courses/classes, invite students via email, manage rosters.
*   **Visual Scheduling**: A Google Calendar-like view for drag-and-drop class scheduling.
*   **Simple Attendance**: Basic "Present/Absent" toggles per class session. **Technical Note**: Must store timestamps for future analytics.

#### 2. The Pedagogy Engine & Exercise Builder
*   **Manual Exercise Builder (Priority #1)**:
    *   **"Google Forms-like" Editor**: Full manual control for teachers to create questions (Multiple Choice, Fill-in-the-blank, Essay).
    *   **The "Escape Hatch"**: Necessary for custom content or when AI/PDF import is insufficient.
    *   **Technical Constraint (Architect's Rec)**: The underlying data schema must be **future-proofed** to support AI attributes (semantic tags, difficulty) even if the V1 UI is simple. No "simple" hardcoded structures.
*   **AI Content Generator**:
    *   Input: Upload PDF/Word documents.
    *   Process: AI processes text to *draft* questions into the Manual Builder for review.
*   **AI-Assisted Grading Workbench**:
    *   Interface for specific Writing/Speaking feedback.
    *   AI pre-fills grammar corrections and score suggestions for teacher validation.

#### 3. Student Success & Visibility
*   **Student Health Dashboard**: A simple, traffic-light coded list (Red/Yellow/Green) for Owners to identify at-risk students based on recent grades/attendance.
*   **Student Portal**: A clean, mobile-responsive web view for students to check schedules, submit work, and view feedback.

### Out of Scope for MVP (Deferred to V2)
*   **Full Knowledge Hub**: Lesson notes will be simple attachments for now, not a structured wiki/library.
*   **Financials**: No tuition tracking, invoicing, or payroll.
*   **Complex Logistics**: No leave requests, make-up class logic, or complex conflict detection.
*   **Native Mobile App**: We will build a responsive Web App first.
*   **Gamification**: No badges, leaderboards, or points yet.

### MVP Success Criteria
*   **Technical Stability**: Zero "Class Stopping" bugs during the pilot phase.
*   **Feature Completeness**: Teachers can perform the "Create -> Assign -> Grade" loop without external workaround tools.
*   **Pilot Validation**: 3 Centers successfully running their daily operations (Scheduling + Grading) exclusively on ClassLite for > 2 weeks.
*   **Architectural Health**: Exercise Data Schema successfully accommodates V2 AI attributes without migration pain.

### Future Vision
*   **Multi-Subject Expansion**: Extending the data model to support Math, Physics, and STEM subjects.
*   **IP Fortress**: Launching the full **Knowledge Hub** to help centers build and protect their proprietary curriculum assets.
*   **Enterprise Growth**: Features for managing multi-branch networks and advanced financial analytics.

<!-- Content will be appended sequentially through collaborative workflow steps -->
