# Outstanding Action Items

**Created:** 2026-02-14
**Owner:** Bob (SM)
**Purpose:** Single source of truth for all unfinished retro commitments, deferred work, and future UX improvements. Replaces scattered tracking across retro files.
**Team Agreement:** No more carry-forwards. Items live here or get dropped with rationale.

---

## Active — Before Epic 4 Starts

These must be completed or explicitly dropped before beginning Epic 4 stories.

### ~~1. Create onBlur lint rule~~ DONE

- **Origin:** Epic 3 Retro A1 / Epic 3.5 Retro A2
- **Status:** DONE (2026-02-14)
- **Owner:** Dev (Charlie)
- **Resolution:** Custom ESLint rule `classlite/require-onblur-with-onchange` created in `packages/eslint-config/rules/`. Flags JSX elements with `onChange` but no `onBlur`. Spread operators (`{...field}`) bypass correctly — zero false positives on react-hook-form usage. Set as `warn` — 0 errors, catches the pattern at build time.

### ~~2. Create pre-review checklist~~ DONE

- **Origin:** Epic 3 Retro A1 / Epic 3.5 Retro A2
- **Status:** DONE (2026-02-14)
- **Owner:** SM (Bob) + Dev (Charlie)
- **Resolution:** Created `_bmad-output/implementation-artifacts/pre-review-checklist.md`. Covers all 4 recurring categories: onBlur handlers, edge-case tests, type safety, dead code/imports.

### ~~3. Amend Epic 2 retro file~~ DONE

- **Origin:** Epic 3 Retro A4 / Epic 3.5 Retro A2
- **Status:** DONE (2026-02-15)
- **Owner:** SM (Bob)
- **Resolution:** Amendment section added to `epic-2-retro-2026-02-06.md`. Corrected A1 (Gemini audit) and A6 (E2E foundation) to Done. Noted that Epic 1 follow-through items A3/A4 were also inaccurately assessed.

### ~~4. Triage 4 deferred items from Epic 3~~ DONE

- **Origin:** Epic 3 Retro A7 / Epic 3.5 Retro A2
- **Status:** DONE (2026-02-15)
- **Owner:** Dev (Charlie)
- **Dispositions:**
  - **(a)** Task 3 validation endpoint (Story 3.2) — **WON'T-FIX.** Frontend Zod validation via `QuestionEditorFactory.tsx` `safeParse()` is sufficient for MVP. Server-side validation endpoint is a nice-to-have; not worth delaying Epic 4. Can revisit if data integrity issues surface in production.
  - **(b)** Matching answer utility (Story 3.3) — **ALREADY IMPLEMENTED.** `matchesExactMapping()` exists in `apps/backend/src/modules/exercises/answer-utils.ts:76-91` with tests. Delivered early during Epic 3 implementation. No action needed.
  - **(c)** AC8 mock test display (Story 3.16) — **DEFER TO FUTURE STORY.** Requires schema change (`mockTestId` on Assignment model or junction table). Out of scope for any current story. TODO marker exists in `StudentDashboard.tsx`. Will be picked up when mock test assignment support is planned.
  - **(d)** Low-priority review items (various stories) — **DEFER TO EPIC 4 (most are already scoped there).** Investigation found: submission count display, progress indicators, submission protection on delete, progressive audio playback — all have `// TODO: Epic 4` markers in code and are dependencies of the submission system. TipTap rich editor deferred to future UX pass. Story 3.1 component tests are low-priority backlog.

---

## Active — During Epic 4

### ~~5. Document Prisma `$transaction` + `getTenantedClient` workaround~~ DONE

- **Origin:** Epic 3.5 Retro A3
- **Status:** DONE (2026-02-15)
- **Owner:** Dev (Charlie)
- **Resolution:** Added as Rule #5 in `project-context.md` under Critical Implementation Rules. Documents: never call `getTenantedClient()` inside `$transaction`; use `tx` with explicit `where: { centerId }` instead.

---

## Deferred — Future Epics

### 6. Rich text editor evaluation

- **Origin:** Epic 2 Retro A9
- **Status:** DEFERRED (low priority)
- **Owner:** Unassigned
- **Description:** Evaluate TipTap or Lexical for exercise builder notes/description fields. Currently using plain textarea.
- **Trigger:** When a story requires rich text editing (likely post-MVP).

---

## UX Items — Post-Epic 6 or First Customer Onboarding

Captured during retros. Non-blocking for current development.

| # | Item | Notes |
|---|------|-------|
| U1 | AI assistant dialog — disable auto-open, make opt-in | Currently auto-opens; should be user-initiated |
| U2 | Create course/class UX — simplify flow, improve clarity | Reduce steps and cognitive load |
| U3 | General UX improvements | To be specified during UX review pass |
| U4 | User guide / onboarding documentation | First-time user experience |

---

## Completed Items Log

Resolved items kept for audit trail. Proves the team closes what it commits to.

| Item | Resolved In | Date |
|------|-------------|------|
| eslint-plugin-jsx-a11y setup | Story 3.5.4 | 2026-02-12 |
| Error boundaries on all 16 routes | Story 3.5.4 | 2026-02-12 |
| Prisma @@map cleanup (all 30 models) | Story 3.5.2 | 2026-02-12 |
| E2E-per-epic gate established | Story 3.5.5 | 2026-02-13 |
| Deploy to staging + production (Railway) | Story 3.5.1 / 3.5.3 | 2026-02-12 |
| Status tracking drift fixed | Story 3.5.1 | 2026-02-11 |
| STAFF_ROLES constant | Epic 2 | 2026-02-05 |
| Gemini code audit (foundations) | Pre-Epic 3 | ~2026-02-07 |
| Playwright infrastructure + 184 E2E tests | Story 3.5.5 | 2026-02-13 |
| Frontend component test discipline | Epic 3 (all 16 stories) | 2026-02-10 |
| Exercise data model design | Story 3.1 | 2026-02-07 |
| Prisma migration workflow (replaces db push) | Story 3.5.2 | 2026-02-12 |
| onBlur lint rule (`classlite/require-onblur-with-onchange`) | Action Items punch list | 2026-02-14 |
| Pre-review checklist (4 categories) | Action Items punch list | 2026-02-14 |
| Epic 2 retro amendment (A1, A6 corrected) | Action Items punch list | 2026-02-15 |
| Triage 4 deferred Epic 3 items | Action Items punch list | 2026-02-15 |
| Prisma `$transaction` + `getTenantedClient` workaround | Action Items punch list | 2026-02-15 |

---

## Team Agreements (from Epic 3.5 Retro)

- **No more carry-forwards** — unfinished items go in this file or get dropped with rationale
- **Research folded into stories** — no separate prep sprints; spike during implementation
- **Railway handles deploys** — no custom GitHub Actions deploy workflows; Railway GitHub integration is the standard
- **Lean retro commitments** — 3-5 action items max per retro, concrete and trackable
