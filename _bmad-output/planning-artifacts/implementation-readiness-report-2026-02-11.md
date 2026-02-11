---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
includedFiles:
  prd: prd.md
  architecture: architecture.md
  information_architecture: information-architecture.md
  epics: epics.md
  ux: ux-design-specification.md
  ux_epic2: ux-design-specification-epic-2.md
---

# Implementation Readiness Assessment Report

**Date:** 2026-02-11
**Project:** classlite

## PRD Analysis

### Functional Requirements

| ID | Actor | Action | Requirement |
|:---|:------|:-------|:------------|
| **FR1** | Visitor | Can | Sign up their own center or login via Google/Email |
| **FR2** | Platform Admin | Can | Manually provision new tenants |
| **FR3** | Center Owner/Admin | Can | Invite users via email |
| **FR4** | System | Shall | Enforce RBAC based on Role (Owner, Admin, Teacher, Student) |
| **FR5** | System | Shall | Enforce logical data isolation via tenant identifiers |
| **FR6** | Center Owner/Admin | Can | Configure center settings (Name, Logo, Timezone) |
| **FR7** | Admin | Can | Manage Courses and Class Sessions |
| **FR8** | Admin | Can | Assign Teachers and Students to Classes |
| **FR9** | User | Can | View a visual Weekly Schedule of assigned classes |
| **FR10** | System | Shall | Detect and warn of resource conflicts during scheduling |
| **FR11** | Teacher | Can | Mark attendance (Present/Absent) |
| **FR12** | System | Shall | Notify participants of schedule changes within 30 seconds |
| **FR13** | Teacher | Can | Create exercises using IELTS Exercise Builder |
| **FR14** | Teacher | Can | Upload PDF/Word docs to trigger AI exercise generation |
| **FR15** | Teacher | Can | Edit AI-generated content before publishing |
| **FR16** | Teacher | Can | Assign exercises with due dates and time limits |
| **FR17** | Student | Can | View "Due Soon" assignments dashboard |
| **FR18** | Student | Can | Submit assignments via mobile-responsive interface |
| **FR19** | System | Shall | Auto-save student work every 3 seconds to client-side storage |
| **FR20** | System | Shall | Trigger AI analysis within 5 seconds of submission |
| **FR21** | Teacher | Can | Use split-screen interface for grading |
| **FR22** | Teacher | Can | View visual "Evidence Anchors" connecting AI comments to text |
| **FR23** | Teacher | Can | Apply AI suggestions with one click |
| **FR24** | System | Shall | Maintain comment anchors with text change rules (<20% keep, >50% orphan) |
| **FR25** | Teacher | Can | Reject AI suggestions, removing from final feedback |
| **FR26** | System | Shall | Auto-advance to next submission upon approval |
| **FR27** | Owner/Admin | Can | View Student Health Dashboard with Traffic Light status |
| **FR28** | Owner/Admin | Can | Open Student Profile Overlay without page reload |
| **FR29** | Owner/Admin | Can | Initiate parent interventions via email with pre-filled templates |
| **FR30** | System | Shall | Send automated email notifications to parents for achievements |
| **FR31** | Parent | Can | Manage email notification preferences |
| **FR32** | Owner | Can | Upload "Golden Sample" feedback to tune AI style |
| **FR33** | System | Shall | Utilize Few-Shot Prompting for > 85% style alignment |
| **FR34** | System | Shall | Detect offline status and display "Do Not Close" warning banner |
| **FR35** | System | Shall | Queue failed submissions and auto-retry on reconnection |
| ~~FR36~~ | — | — | **MISSING FROM PRD** (exists in epics.md: content moderation for Decree 72) |
| **FR37** | Teacher | Can | Upload audio files (MP3/WAV/M4A, max 100MB) for Listening exercises |
| **FR38** | Teacher | Can | Set time limits with auto-submit on expiry |
| **FR39** | Teacher | Can | Assemble Mock Tests with sections and unified scoring |
| **FR40** | Teacher | Can | Define answer keys with acceptable variants for auto-grading |
| **FR41** | Teacher | Can | Tag exercises by Skill, Band Level, and Topic |
| **FR42** | System | Shall | Provide IELTS band descriptor rubrics for Writing/Speaking |
| **FR43** | Center Owner | Can | View billing dashboard with student count and payment history |
| **FR44** | System | Shall | Track enrolled student count per center per billing cycle |
| **FR45** | System | Shall | Process self-serve payments via Polar.sh |
| **FR46** | System | Shall | Send billing reminders via email 7 days before renewal |
| **FR47** | System | Shall | Enforce grace period on payment lapse, restricting enrollments |
| **FR48** | Center Owner | Can | Upgrade/downgrade subscription tier from Billing Dashboard |

**Total FRs: 47** (FR1-FR35, FR37-FR48; FR36 missing from PRD)

### Non-Functional Requirements

| ID | Criterion | Metric | Method | Context |
|:---|:----------|:-------|:-------|:--------|
| **NFR1** | Performance | < 500ms | P95 Response Time | Grading Workbench auto-advance |
| **NFR2** | Performance | < 1 second | UI Rendering | Dashboard "Traffic Light" widgets |
| **NFR3** | Availability | 99.9% | Uptime Monitoring | Business hours 8AM-10PM GMT+7 |
| **NFR4** | Data Integrity | 3s interval | Background Sync | Client-side storage for submissions |
| **NFR5** | Security | 100% isolation | Middleware Validation | Cross-tenant access prevention |
| **NFR6** | Privacy | AES-256 | Encryption-at-rest | Sensitive PII and grades |
| **NFR7** | Accessibility | 100% compliant | Viewport Audit | Viewports >= 375px |
| **NFR8** | i18n | Dual-language | User Toggle | English/Vietnamese UI |
| **NFR9** | Accessibility | WCAG 2.1 AA | Accessibility Audit | All public-facing interfaces |
| **NFR10** | Usability | Keyboard-only | Workflow Audit | Grading Loop workflow |
| **NFR11** | Usability | High-contrast | Visual Audit | Focus indicators on all interactive elements |

**Total NFRs: 11**

### Additional Requirements

- **Domain Compliance:** Decree 13/2023 (data sovereignty), Decree 72/2013 (content moderation)
- **RBAC Matrix:** 13 feature rows x 4 roles (Owner, Admin, Teacher, Student)
- **IELTS Exercise Type Taxonomy:** 13 Reading, 6 Listening, 3 Writing, 3 Speaking types
- **Billing Model:** Per-active-student, volume tiers (1-30, 31-100, 100+), Polar.sh
- **Integrations:** Google Calendar, Google Meet, Polar.sh, Email

### PRD Completeness Assessment

**Overall:** Strong. The PRD is well-structured with clear role-based requirements, SMART success criteria, and comprehensive IELTS taxonomy.

**Gap Found:** FR36 (content moderation for Decree 72 compliance) is referenced in epics.md FR inventory but missing from the PRD's numbered functional requirements. The Domain Compliance section discusses Decree 72 but doesn't formalize it as a numbered FR. Recommendation: Add FR36 to PRD Section 6 or create a separate compliance FR section.

**Strengths:**
- Clear phase separation (MVP → 1.5 → 2)
- Billing section (Section 9) is well-defined with pricing model and provider
- RBAC matrix is comprehensive
- All journeys have validation criteria

**Note:** Course correction applied 2026-02-11 (Zalo removal, billing addition, Polar.sh). All references are internally consistent post-correction.

## Epic Coverage Validation

### Coverage Matrix

| FR | Epic | Story | Status |
|:---|:-----|:------|:-------|
| FR1 | Epic 1 | 1.1 Multi-tenant Onboarding | ✓ |
| FR2 | Epic 1 | 1.1 Multi-tenant Onboarding | ✓ |
| FR3 | Epic 1 | 1.3 User Invitation & RBAC | ✓ |
| FR4 | Epic 1 | 1.3, 1.4 RBAC | ✓ |
| FR5 | Epic 1 | 1.1 Multi-tenant Onboarding | ✓ |
| FR6 | Epic 1 | 1.2 Center Branding | ✓ |
| FR7 | Epic 2 | 2.1, 2.5 Course & Session CRUD | ✓ |
| FR8 | Epic 2 | 2.1 Course & Class Mgmt | ✓ |
| FR9 | Epic 2 | 2.2 Visual Weekly Scheduler | ✓ |
| FR10 | Epic 2 | 2.3 Conflict Detection | ✓ |
| FR11 | Epic 2 | 2.4 Attendance Tracking | ✓ |
| FR12 | Epic 2 | 2.2, 2.6 Email Notifications | ✓ |
| FR13 | Epic 3 | 3.1-3.9 (all question types) | ✓ |
| FR14 | Epic 3 | 3.12 AI Content Generation | ✓ |
| FR15 | Epic 3 | 3.12 AI Content Generation | ✓ |
| FR16 | Epic 3 | 3.15 Assignment Management | ✓ |
| FR17 | Epic 3 | 3.16 Student Assignment Dashboard | ✓ |
| FR18 | Epic 4 | 4.1 Mobile Submission Interface | ✓ |
| FR19 | Epic 4 | 4.2 Local Auto-save | ✓ |
| FR20 | Epic 5 | 5.1 Automated Submission Analysis | ✓ |
| FR21 | Epic 5 | 5.2 Split-Screen Interface | ✓ |
| FR22 | Epic 5 | 5.3 Evidence Anchoring | ✓ |
| FR23 | Epic 5 | 5.4 One-Click Approval | ✓ |
| FR24 | Epic 5 | 5.3 Evidence Anchoring | ✓ |
| FR25 | Epic 5 | 5.4 One-Click Approval | ✓ |
| FR26 | Epic 5 | 5.4, 5.5 Grading Queue | ✓ |
| FR27 | Epic 6 | 6.1, 6.4 Traffic Light + Teacher View | ✓ |
| FR28 | Epic 6 | 6.2 Student Profile Overlay | ✓ |
| FR29 | Epic 6 | 6.3 Email Intervention Loop | ✓ |
| FR30 | Epic 7 | 7.1 Engagement Email Notifications | ✓ |
| FR31 | Epic 7 | 7.2 Notification Preferences | ✓ |
| FR32 | Epic 8 | 8.1, 8.5 Methodology Guardian | ✓ |
| FR33 | Epic 8 | 8.1 Methodology Guardian | ✓ |
| FR34 | Epic 4 | 4.3 Offline Safeguards | ✓ |
| FR35 | Epic 4 | 4.3 Offline Safeguards | ✓ |
| FR36 | Epic 8 | 8.3 Content Moderation | ⚠️ In epics, not in PRD |
| FR37 | Epic 3 | 3.6 Listening Exercise Builder | ✓ |
| FR38 | Epic 3 | 3.10 Timer & Test Conditions | ✓ |
| FR39 | Epic 3 | 3.13 Mock Test Assembly | ✓ |
| FR40 | Epic 3 | 3.5 Answer Key Management | ✓ |
| FR41 | Epic 3 | 3.11 Exercise Tagging | ✓ |
| FR42 | Epic 3 | 3.8 Writing Task Builder | ✓ |
| FR43 | Epic 9 | 9.1 Billing Dashboard | ✓ |
| FR44 | Epic 9 | 9.1 Billing Dashboard | ✓ |
| FR45 | Epic 9 | 9.2 Polar.sh Integration | ✓ |
| FR46 | Epic 9 | 9.3 Billing Reminders | ✓ |
| FR47 | Epic 9 | 9.3 Billing Reminders | ✓ |
| FR48 | Epic 9 | 9.4 Subscription Tier Mgmt | ✓ |

### NFR Coverage

| NFR | Coverage Path | Status |
|:----|:-------------|:-------|
| NFR1 (< 500ms) | Story 5.2 prefetch | ✓ |
| NFR2 (< 1s dashboard) | Story 6.1 widget load | ✓ |
| NFR3 (99.9% uptime) | Epic 3.5 infrastructure | ✓ |
| NFR4 (3s auto-save) | Story 4.2 explicit | ✓ |
| NFR5 (tenant isolation) | Story 1.1 middleware | ✓ |
| NFR6 (AES-256) | Story 8.2 Privacy Center | ✓ |
| NFR7 (viewport >= 375px) | Story 4.1 mobile | ✓ |
| NFR8 (EN/VI i18n) | Story 8.4 Language | ✓ |
| NFR9 (WCAG 2.1 AA) | Story 3.5-4 a11y | ✓ |
| NFR10 (keyboard grading) | Story 5.4 shortcuts | ✓ |
| NFR11 (focus indicators) | Story 3.5-4 a11y | ✓ |

### Coverage Statistics

- **Total PRD FRs:** 47
- **FRs covered in epics:** 47/47 (100%)
- **Extra FR in epics:** FR36 (content moderation — in epics, not numbered in PRD)
- **Total NFRs:** 11
- **NFRs with coverage path:** 11/11 (100%)
- **Overall FR Coverage: 100%**

### Missing Requirements

No functional requirements are missing from epic coverage. The only anomaly is FR36, which exists in epics (Story 8.3) but is not a numbered FR in the PRD. Recommendation: add FR36 to PRD for complete traceability.

## UX Alignment Assessment

### UX Document Status

**Found:** Two UX documents identified:

1. `ux-design-specification.md` — Main UX specification (13 steps completed, covering all epics)
2. `ux-design-specification-epic-2.md` — Detailed Epic 2 UX (Logistics & Scheduling wireframes and interactions)

### UX ↔ PRD Alignment

| UX Section | PRD FRs | Alignment |
|:-----------|:--------|:----------|
| Grading Workbench (Sec 2, 5.1) | FR20-FR26 | ✓ Split-screen, evidence anchors, one-click accept, auto-advance |
| Student Submission (Sec 5.2) | FR18-FR19, FR34-FR35 | ✓ Offline auto-save, "Do Not Close" warning, background sync |
| Owner Insight Flow (Sec 5.3) | FR27-FR29 | ✓ Traffic Light, Student Profile Overlay, email intervention |
| Admin Logistics (Sec 5.4) | FR7-FR12 | ✓ Master Calendar, conflict detection, drag-and-drop |
| Content Architect (Sec 5.5) | FR13-FR15 | ✓ Manual builder, AI generation, editing |
| Design System (Sec 4, 6) | Architecture | ✓ shadcn/ui, Inter/Outfit fonts, Electric Royal Blue (#2563EB) |
| Accessibility (Sec 8) | NFR7, NFR9-NFR11 | ✓ WCAG 2.1 AA, 375px+, keyboard navigation, focus indicators |
| Mobile-First Students (Sec 8) | NFR7 | ✓ Responsive strategy with 375px/768px/1024px breakpoints |
| i18n (Sec 9.2) | NFR8 | ✓ English/Vietnamese toggle |
| Epic 2 UX Detail | FR7-FR12 | ✓ Weekly Scheduler wireframes, attendance sheet, conflict drawer |

**Post-Course Correction Consistency:** All Zalo references in UX have been updated to email. The "Rescue Moment" (Sec 5.3) now correctly references email intervention. Platform resilience principle updated.

### UX ↔ Architecture Alignment

| UX Requirement | Architecture Support | Status |
|:---------------|:--------------------|:-------|
| shadcn/ui design system | Architecture specifies shadcn (Radix + Tailwind) | ✓ |
| Offline-Proof submissions | TanStack Query v5 + `persistQueryClient` (idb-keyval) | ✓ |
| AI Grading speed (< 500ms next-item) | Inngest for background AI processing + pre-fetching | ✓ |
| Persistent Client-Side Storage | IndexedDB via idb-keyval | ✓ |
| ProseMirror rich text (GradingEditor) | Not explicitly in architecture, but frontend component concern | ✓ |
| ConnectionLine SVG overlay | Frontend rendering concern, no architectural conflict | ✓ |
| Responsive breakpoints | Architecture supports static SPA deployment | ✓ |

### Warnings

1. **No UX specification for Epic 9 (Billing).** Low risk — Polar.sh handles checkout via hosted portal. The Billing Dashboard (Story 9.1) is a standard settings page following existing patterns. No custom billing UI design needed for MVP.

2. **No UX specification for Epics 3-5 (Exercise Builder, Submission, Grading Workbench).** The main UX spec covers these at a strategic level (component strategy, interaction patterns) but no dedicated wireframe document exists for these epics. The main spec's component strategy (GradingEditor, ConnectionLine, OfflineIndicator) provides sufficient design direction for implementation.

## Epic Quality Review

### Best Practices Compliance Checklist

| Check | Result |
|:------|:-------|
| Epics deliver user value (no technical milestones) | ✓ Pass (1 minor exception: Story 1.4) |
| Epics can function independently | ✓ Pass (correct sequential dependency chain) |
| Stories appropriately sized | ✓ Pass (some large but logically grouped) |
| No forward dependencies | ✓ Pass |
| Database tables created when needed | ✓ Pass |
| Clear acceptance criteria | ✓ Pass (specific, testable ACs throughout) |
| Traceability to FRs maintained | ✓ Pass (all FRs mapped to stories) |

### Epic Independence Validation

| Epic | Dependencies | Forward Deps | Status |
|:-----|:------------|:-------------|:-------|
| Epic 1 | None (foundation) | None | ✓ |
| Epic 2 | Epic 1 (tenants, users, RBAC) | None | ✓ |
| Epic 3 | Epic 1 (auth, tenant), Epic 2 (classes for assignment) | None | ✓ |
| Epic 4 | Epic 3 (exercises to submit) | None | ✓ |
| Epic 5 | Epic 4 (submissions to grade) | None | ✓ |
| Epic 6 | Epics 2, 4, 5 (attendance, submission, grade data) | None | ✓ |
| Epic 7 | Epic 6 (intervention data), Epic 1 (users) | None | ✓ |
| Epic 8 | Epic 5 (AI grading for golden samples), Epic 1 (users) | None | ✓ |
| Epic 9 | Epic 1 (tenant management) | None | ✓ |

No circular dependencies. No forward dependencies (Epic N never requires Epic N+1).

### Quality Findings

#### 🟠 Major Issues

1. **Missing "Build Verification" Story (Carry-Forward from Jan 2026 IR)**

   The January 2026 implementation readiness report identified a missing Story 1.0 for Build Verification & Dependency Cleanup. This has **not been added** to epics.md. Epic 1 starts with Story 1.1 (Multi-tenant Onboarding) without verifying the existing brownfield scaffold builds correctly.

   **Risk:** Implementers may encounter build failures or dependency conflicts when starting Epic 1.
   **Recommendation:** Add Story 1.0 to Epic 1: "Verify existing monorepo build pipeline (`pnpm build`), clean up unused dependencies, and ensure CI checks pass."

2. **Story 5.6 AC2 Cross-Reference Error**

   Story 5.6 (Student Feedback View) AC2 states: *"From Student Dashboard (Story 3.3), clicking a 'Graded' assignment opens feedback view."* However, Story 3.3 is "Reading Question Types - Matching." The Student Assignment Dashboard is **Story 3.16**.

   **Risk:** Implementers may look for the wrong story when building the navigation path.
   **Recommendation:** Update AC2 to reference "Story 3.16" instead of "Story 3.3".

#### 🟡 Minor Concerns

1. **Story 1.4 Uses "Developer" Actor**

   Story 1.4 (Universal UI Access Control) uses *"As a Developer"* — not a business/end-user actor. While the RBACWrapper delivers real value (consistent permission enforcement), it violates the user story principle of having a human business actor.

   **Recommendation:** Consider reframing: *"As a Center Admin, I want the system to enforce my role permissions consistently across all UI elements, so that I only see actions appropriate to my role."*

2. **"As a System" Stories**

   Stories 5.1 (Automated Submission Analysis) and implicit system behaviors in billing stories use system-level actors. These are acceptable since they describe backend behaviors tested through user-facing outcomes (e.g., "Teacher sees draft feedback" verifies "System runs AI analysis").

3. **Epic 8 Bundles Mixed Concerns**

   Epic 8 combines compliance (Decree 13, Decree 72), methodology (Golden Samples), and i18n under "Platform Compliance & Methodology." These serve different user needs but share the characteristic of being platform-level, non-core-workflow features. Acceptable given their relatively small scope (5 stories).

4. **Story 3.9 (Speaking Exercise Builder) Phase 2 Marker**

   Story 3.9 is explicitly marked as "Phase 2" but lives within Epic 3. This is handled correctly with clear phase annotation, but implementers should be aware not to include it in MVP sprints.

## Summary and Recommendations

### Overall Readiness Status

**READY FOR IMPLEMENTATION** (With Minor Updates)

The planning artifacts are in excellent condition following the 2026-02-11 course correction (Zalo removal, billing addition, Polar.sh integration). All six planning documents (PRD, Architecture, UX, UX Epic 2, Information Architecture, Epics) are internally consistent with zero stale Zalo/VNPay references.

### Key Metrics

| Metric | Value |
|:-------|:------|
| Total PRD FRs | 47 |
| FR Coverage in Epics | 47/47 (100%) |
| Total NFRs | 11 |
| NFR Coverage Paths | 11/11 (100%) |
| Total Epics | 9 |
| Total Stories | 43 |
| UX Documents | 2 |
| UX-PRD Alignment Issues | 0 |
| UX-Architecture Alignment Issues | 0 |
| Major Issues Found | 2 |
| Minor Concerns Found | 4 |
| Traceability Gaps | 1 (FR36) |

### Critical Issues Requiring Immediate Action

None. The 2 major issues are procedural (epic structure) rather than fundamental gaps. They can be addressed during the first sprint planning.

### Recommended Next Steps

1. **Add FR36 to PRD:** Formalize content moderation (Decree 72/2013) as a numbered functional requirement in PRD Section 6 for complete traceability. The requirement already exists in epics.md (Story 8.3) and is covered — it just lacks a PRD number.

2. **Add Story 1.0 (Build Verification) to Epic 1:** Before starting feature work, verify the existing brownfield monorepo scaffold builds correctly. This was identified in the Jan 2026 IR and remains unresolved.

3. **Fix Story 5.6 AC2 Cross-Reference:** Change "Story 3.3" to "Story 3.16" in the Student Feedback View acceptance criteria.

4. **Proceed to Implementation:** The project is well-scoped and ready for coding. Continue the current development path (Epic 3.5 deployment → Epic 4 → Epic 5).

### Final Note

This assessment identified **2 major issues** and **4 minor concerns** across 6 planning artifacts. All issues are low-risk and procedural — no fundamental architectural, UX, or requirements gaps were found. The course correction (Zalo → email, billing via Polar.sh) has been applied cleanly across all artifacts with full internal consistency. The project is in excellent shape to proceed.
