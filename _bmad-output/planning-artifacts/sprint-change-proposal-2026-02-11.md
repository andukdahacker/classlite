# Sprint Change Proposal — 2026-02-11

## Section 1: Issue Summary

**Trigger:** Strategic pivot by product owner (Ducdo) based on market validation findings during pre-pilot preparation.

**Three changes identified:**

1. **Zalo Removal:** Business registration cost, approval timeline, and legal requirements block Zalo integration. Poor API documentation compounds the issue. Customer validation showed parent communication via Zalo is "nice to have," not a painkiller. Decision: remove entirely unless actual demand materializes.

2. **Parent Communication Downgrade:** Parent communication demoted from Phase 1.5 differentiator to Phase 2 "Parent Portal" (native app approach). Interim: email-based notifications for parent interventions.

3. **Billing Addition (Phase 1.5):** Per-active-student pricing model with self-serve checkout via Polar.sh. Not MVP scope — free during pilot, defined for Phase 1.5 to allow timely preparation. Polar.sh selected over VNPay/SePay to avoid Vietnamese business registration requirements.

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Action |
|:-----|:-------|:-------|
| Epic 6 (Student Health) | Moderate | Story 6.3 rewritten (Zalo → email intervention). Story 6.4 AC3 updated. |
| Epic 7 (was Zalo Integration) | **Complete rewrite** | Renamed to "Email Notifications & Parent Communication." All 3 stories (7.1-7.3) rewritten for email-based system. |
| Epic 9 (NEW — Billing) | **New epic** | 4 stories (9.1-9.4) covering billing dashboard, Polar.sh integration, reminders/grace period, tier management. |
| Epics 1-5, 8 | None | No impact. Core MVP and compliance epics unchanged. |

### Artifact Changes Applied

| Artifact | Changes | Status |
|:---------|:--------|:-------|
| **prd.md** | Removed Zalo from Phase 1.5, journeys, FRs, RBAC, integrations. Added Parent Portal to Phase 2. Added Section 9 (Billing) with FR43-FR48. Updated to Polar.sh. | Done |
| **epics.md** | Rewrote FR29-31. Added FR43-48. Rewrote Epic 7 summary + stories. Added Epic 9 summary + 4 stories. Updated FR Coverage Map. Rewrote Story 6.3, updated 6.4. | Done |
| **architecture.md** | Removed Zalo API reference. Added Polar.sh billing service reference. | Done |
| **ux-design-specification.md** | Updated "Rescue Moment" to email. Simplified Mermaid flowchart. Updated platform resilience principle. | Done |
| **information-architecture.md** | Removed Zalo from notification preferences. Replaced Zalo constraint row with billing. | Done |
| **sprint-status.yaml** | Renamed Story 6.3. Rewrote Epic 7 stories. Added Epic 9 with 4 stories. Added changelog entry. | Done |
| **IntegrationsPage.tsx** | Updated placeholder text (removed Zalo mention). | Done |
| **implementation-readiness-report** | Added deprecation note (historical document). | Done |

### Technical Impact

- **No code changes required** beyond IntegrationsPage.tsx placeholder text (already applied).
- No database schema impact — billing tables will be added when Epic 9 is implemented.
- No CI/CD impact.
- No infrastructure impact.

## Section 3: Recommended Approach

**Selected: Direct Adjustment**

- All Zalo stories were in backlog (zero implementation). No rollback needed.
- MVP scope (Epics 1-5) is completely unaffected.
- Document updates applied incrementally with owner approval on each change.
- No timeline impact on current development (Epic 3.5 deployment is next in queue).

**Effort:** Medium (15 document edits across 8 files). All completed in this session.
**Risk:** Low. Zero implemented features affected.

## Section 4: Detailed Change Log

### Changes Applied (15 proposals, all approved)

1. **epics.md** — FR29-31 rewritten (Zalo → email)
2. **epics.md** — FR43-48 added (billing)
3. **epics.md** — FR Coverage Map updated (Epic 7 renamed, Epic 9 added)
4. **epics.md** — Epic 7 summary rewritten
5. **epics.md** — Epic 9 summary added
6. **epics.md** — Story 6.3 rewritten (Zalo → email intervention)
7. **epics.md** — Story 6.4 AC3 updated
8. **epics.md** — Stories 7.1-7.3 fully rewritten for email
9. **epics.md** — Epic 9 stories 9.1-9.4 added (billing)
10. **architecture.md** — External services updated (Zalo → Polar.sh)
11. **architecture.md** — Service file reference updated
12. **ux-design-specification.md** — 3 Zalo references removed/rewritten
13. **information-architecture.md** — 2 Zalo references replaced
14. **sprint-status.yaml** — Epic 7 + Epic 9 stories updated
15. **IntegrationsPage.tsx** — Placeholder text updated

### PRD changes (applied prior to checklist)

- Phase 1.5 roadmap: Zalo removed, billing added
- Journey 2: Rewritten for email
- FR29-31: Rewritten for email
- FR30-31: Tied to email/Parent Portal
- RBAC: Zalo row → Billing row
- Integrations: Zalo removed, Polar.sh + Email added
- Section 9: Full billing specification added
- Edit history: Updated

## Section 5: Implementation Handoff

**Scope Classification: Minor**

All changes are documentary. No architectural rearchitecting needed.

**Handoff:**

| Role | Responsibility |
|:-----|:--------------|
| PM (completed) | All document edits applied and approved |
| SM | Sprint status already updated. No backlog reorganization needed — new stories added to backlog. |
| Dev team | IntegrationsPage.tsx already updated. No further code action until Epic 7/9 are scheduled. |
| Architect | No action needed. Architecture changes are minor (one service reference swap). |

**Success Criteria:**
- Zero Zalo references in active planning artifacts (confirmed via grep)
- Zero VNPay references anywhere (confirmed via grep)
- All new billing stories traceable to FR43-FR48
- PRD, epics, architecture, UX, IA, and sprint status all internally consistent

**Next Steps:**
- Continue current development path (Epic 3.5 → Epic 4 → Epic 5)
- Epic 7 (email notifications) and Epic 9 (billing) will be scheduled per normal sprint planning
- No urgent action required — billing is Phase 1.5, email notifications are Phase 1.5
