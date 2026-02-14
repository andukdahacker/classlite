# Epic 3.5 Retrospective: Deployment & Infrastructure (Railway)

**Date:** 2026-02-13
**Facilitator:** Bob (SM)
**Epic:** Epic 3.5 — Deployment & Infrastructure on Railway (5 stories: 3.5.1–3.5.5)
**Previous Retro:** Epic 3 Retro (2026-02-10)

---

## Stories Reviewed

| Story | Title | Tests Added | Review Issues Fixed |
|-------|-------|-------------|---------------------|
| 3.5.1 | Dockerfiles, CI/CD & Railway Staging | 28 backend infra tests | — |
| 3.5.2 | Database Migration Strategy | 19 db + schema compliance tests | CI shadow DB, seed safeguard, JSON cleanup |
| 3.5.3 | Production Environment & Deployment Workflow | 13 tests (health check + security) | Rate limit exclusion, README docs |
| 3.5.4 | Error Boundaries & Accessibility Enforcement | 8 error boundary tests | ErrorBoundary placement, directory convention |
| 3.5.5 | Epic 3 E2E Tests | 184 E2E tests (0 failures) | 12 issues (3H/6M/3L) — all fixed |

**Model discipline:** All 5 stories built with Claude Opus 4.6.

---

## Delivery Metrics

- **Completed:** 5/5 stories (100%)
- **Duration:** ~3 days (2026-02-11 → 2026-02-13)
- **Execution pattern:** Stories 3.5.1→3.5.2→3.5.3 sequential (dependency chain), 3.5.4 and 3.5.5 in parallel
- **Production incidents:** 0

## Test Suite Growth

| Suite | Before Epic 3.5 | After Epic 3.5 | Change |
|-------|-----------------|----------------|--------|
| Backend | 569 | 610+ | +7% |
| Webapp | 524 | 532+ | +2% |
| E2E | 0 | 184 | New |
| **Total** | **~1,093** | **~1,326+** | **+21%** |

---

## What Went Well

1. **First deployment to production** — Three epics of undeployed code (33+ stories) finally live at `my.classlite.app` and `api.classlite.app`. Staging at `staging.classlite.app`. Zero incidents.
2. **E2E-per-epic gate proven** — 184 E2E tests built from zero. Caught 3 real bugs hiding since earlier epics: Firebase UID vs DB User ID mismatch in `/me/*` endpoints (since Epic 1), student assignments Date serialization, ExerciseEditor useEffect overwriting user edits.
3. **Three-epic carry-forwards resolved** — a11y linting enforcement (Story 3.5.4), error boundaries on all 16 routes (Story 3.5.4), and Prisma @@map cleanup (Story 3.5.2) all completed. These had been flagged since Epic 1.
4. **Railway GitHub integration simplification** — Replaced custom GitHub Actions deploy workflows with Railway's native "watch branch + wait for CI" integration. Simpler, zero maintenance.
5. **Security hardening** — Rate limiting (`@fastify/rate-limit`), helmet headers, CSP on nginx, CORS locked to production domains, Firebase service account keys in `.gitignore`.
6. **Migration workflow established** — Prisma Migrate replaces `db push`. CI drift check catches schema-migration mismatches. Staging seed creates comprehensive test data.
7. **100% story completion** — All 5 stories delivered with full acceptance criteria met.

## What Didn't Go Well

1. **Prisma v7 friction in 3/5 stories** — `@prisma/client-runtime-utils` resolution bug (3.5.1), `--to-schema` flag change from v6 (3.5.2), `$transaction` clients don't support `$extends` breaking `getTenantedClient` pattern (3.5.5). Prisma continues to be a recurring friction source.
2. **Redundant CI/CD workflows** — Built `deploy-staging.yml` (3.5.1) and `deploy-production.yml` (3.5.3), then deleted both when Railway's native integration proved sufficient. Wasted effort from not researching the platform first.
3. **Infrastructure tasks can't be automated** — Railway dashboard setup, Firebase Console projects, DNS configuration are all manual. Not version-controlled or reproducible. Risk if infrastructure needs rebuilding.
4. **Retro action item follow-through still ~40%** — Epic 3→3.5: 3/7 done, 2/7 partial, 2/7 not done. Deferred items register (A2) and triage (A7) not completed for the third consecutive retro.
5. **Story 3.5.5 scope growth** — Grew from 7 tasks to 9 tasks organically. Added user profile, settings, and dashboard E2E tests plus 3 backend bug fixes. Largest story in the epic by far.

## Key Patterns Identified

### E2E Tests as Bug Detection
- E2E tests found 3 bugs that unit/integration tests missed
- All 3 bugs existed since earlier epics but were never exercised end-to-end
- Firebase UID bug affected 7 controller methods — would have caused 404s on every profile update in production
- Validates the E2E-per-epic gate commitment from Epic 3 retro

### Platform-Native > Custom CI/CD
- Railway's GitHub integration handles branch-based deploys with CI gating out of the box
- Custom GitHub Actions workflows added complexity without added value
- Lesson: research platform capabilities before building custom solutions

### Prisma as Recurring Friction
- Every epic has had Prisma-specific issues
- Epic 3.5 added a new pattern: `getTenantedClient` (core multi-tenancy) breaks in `$transaction`
- Workaround exists (use `tx` directly with explicit `centerId`) but needs documentation

### Action Item Decay
- Follow-through rate across 3 retros: 45% → 40% → 43%
- Root cause: too many items, buried in retro docs, no single tracking location
- Decision: consolidate all outstanding items into one file, reduce future commitments to 3-5 max

---

## Epic 3 Action Items Follow-Through

| # | Action Item | Priority | Status | Evidence |
|---|-------------|----------|--------|----------|
| A1 | Codify recurring review findings into prevention (onBlur lint, checklist) | P0 | ⏳ Partial | a11y linting and error boundaries resolved (related carry-forwards). Specific onBlur lint rule and pre-review checklist not created. |
| A2 | Create deferred items register (DEFERRED.md) | P0 | ❌ Not Done | No register created. Epic 3's 4 deferred items still untracked. |
| A3 | Fix all status tracking drift | P0 | ✅ Done | Sprint-status.yaml clean — all Epic 3.5 stories and epic status accurate. |
| A4 | Document completed work retroactively | P1 | ⏳ Partial | Story files well-documented. Epic 2 retro file not amended as committed. |
| A5 | Establish E2E-per-epic gate | P1 | ✅ Done | Story 3.5.5 — 184 E2E tests. Process proven and documented. |
| A6 | Resolve Prisma @@map legacy cleanup | P1 | ✅ Done | Story 3.5.2 — all 30 models audited, 2 fixed, migration created. |
| A7 | Triage 4 deferred items from Epic 3 | P1 | ❌ Not Done | No triage documented. |

**Score: 3/7 Done, 2/7 Partial, 2/7 Not Done**

---

## Action Items

### Before Epic 4 Starts

| # | Action | Owner | Success Criteria |
|---|--------|-------|------------------|
| A1 | Create `outstanding-action-items.md` — consolidate ALL unfinished retro commitments + UX items into one trackable file | Bob (SM) | Single file in implementation-artifacts with every item listed, dispositioned, and assigned |
| A2 | Execute the outstanding items punch list: onBlur lint rule, pre-review checklist, triage 4 Epic 3 deferred items, amend Epic 2 retro | Team | All items either completed or explicitly dropped with rationale |

### During Epic 4

| # | Action | Owner | Success Criteria |
|---|--------|-------|------------------|
| A3 | Document Prisma `$transaction` + `getTenantedClient` workaround in project-context.md | Charlie (Dev) | Pattern documented: use `tx` with explicit `centerId` inside transactions. Future devs won't hit this unexpectedly. |
| A4 | Reduce retro action items to 3-5 max going forward | Team Agreement | This retro: 4 items. Future retros: same discipline. |

### UX Items Captured (Post-Epic 6 or First Customer Onboarding)

- AI assistant dialog: disable auto-open, make opt-in
- Create course/class UX: simplify flow, improve clarity
- General UX improvements (to be specified)
- User guide / onboarding documentation

### Team Agreements

- **No more carry-forwards** — unfinished items go in outstanding-action-items.md or get dropped with rationale
- **Research folded into stories** — no separate prep sprints; spike during implementation
- **Railway handles deploys** — no custom GitHub Actions deploy workflows; Railway GitHub integration is the standard
- **Lean retro commitments** — 3-5 action items max per retro, concrete and trackable

---

## Readiness Assessment

| Dimension | Status | Notes |
|-----------|--------|-------|
| Story completion | ✅ DONE | 5/5 stories complete |
| Backend test coverage | ✅ GOOD | 610+ tests |
| Webapp test coverage | ✅ GOOD | 532+ tests |
| E2E test coverage | ✅ GOOD | 184 tests, 0 failures |
| Deployment | ✅ LIVE | Staging + production deployed, SSL active |
| Security hardening | ✅ DONE | Rate limiting, helmet, CSP, CORS locked down |
| Technical health | ✅ STABLE | Best codebase state to date |
| Unresolved blockers | ✅ NONE | UX items captured for later, non-blocking |

**Overall: Epic 3.5 is COMPLETE. Infrastructure foundation solid. Ready to proceed to Epic 4 after outstanding action items punch list.**

---

## Epic 4 Preview: Student Submission & Offline-Proofing

- **3 stories** (4.1–4.3) — small epic, new technical territory
- Story 4.1: Mobile Submission Interface (responsive, touch-friendly, camera integration)
- Story 4.2: Local Auto-save & Persistent Storage (3-second background save)
- Story 4.3: Offline Safeguards & Sync (offline queue, auto-retry, confirmation after server receipt)

**Dependencies on Epic 3.5 — ALL MET:**
- Staging environment ✅
- CI/CD pipeline ✅
- Error boundaries ✅
- E2E testing framework ✅

**New Technical Patterns (research folded into stories):**
- TanStack Query `persistQueryClient` + `idb-keyval` for offline reads
- `mutationCache` + `onOnline` + `resumePausedMutations()` for offline writes
- Camera API for photo uploads
- Playwright offline simulation for E2E testing

---

## Critical Path

```
Create outstanding-action-items.md (A1)
        ↓
  Execute punch list (A2)
        ↓
  Begin Epic 4: Student Submission & Offline-Proofing
        ↓
  Document $transaction workaround during Story 4.1 (A3)
```

---

## Retrospective Metadata

- **Agent:** Claude Opus 4.6
- **Workflow:** `_bmad/bmm/workflows/4-implementation/retrospective`
- **Duration:** Interactive session
- **Participants:** Bob (SM), Alice (PO), Charlie (Senior Dev), Dana (QA), Elena (Junior Dev), Ducdo (Project Lead)
- **Key Decisions:** Consolidate all outstanding items into one file; fold research into stories; UX improvements deferred to post-Epic 6
