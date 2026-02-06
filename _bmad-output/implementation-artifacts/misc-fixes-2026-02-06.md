# Miscellaneous Fixes & Improvements (2026-02-06)

Status: done

## Summary

Collection of bug fixes, UX improvements, and infrastructure changes implemented outside the formal story workflow.

---

## 1. Auth Signup Race Condition Fix

**Related Story:** 1-6-login-page-session-management

**Problem:** Google signup flow had a race condition where `onAuthStateChanged` would call `login()` before the backend user was created, causing auth failures.

**Solution:**
- Changed `signupInProgressRef` from React ref to module-level variable `_signupInProgress`
- Module-level flag survives React StrictMode double-mounting
- Signup flow: Set flag → Google auth → Sign out → Create backend user → Clear flag → Re-authenticate
- `onAuthStateChanged` checks flag and skips `login()` during signup

**Files:**
- `apps/webapp/src/features/auth/auth-context.tsx` — Module-level `_signupInProgress` flag, exported `setSignupInProgress()`
- `apps/webapp/src/features/auth/components/signup-center-form.tsx` — Updated signup flow with proper sequencing

---

## 2. Classes Page - Courses Tab

**Related Story:** 2-1-course-class-management

**Enhancement:** Added Courses management tab alongside Classes tab on the Classes page, providing CRUD for courses without navigating to a separate page.

**Files:**
- `apps/webapp/src/features/logistics/classes-page.tsx` — Added Tabs component, Courses tab with table, CourseDrawer integration

---

## 3. Navigation Highlighting Fix

**Related Story:** 1-11-navigation-structure

**Problem:** Parent nav items (e.g., `/dashboard`) stayed highlighted when on child routes (e.g., `/dashboard/schedule`).

**Solution:** Find the most specific matching nav item by comparing URL lengths.

**Files:**
- `apps/webapp/src/core/components/common/nav-main.tsx` — Added `activeUrl` calculation using reduce

---

## 4. Accessibility Fix - SheetDescription

**Related Story:** 1-5-unified-dashboard-shell

**Problem:** AI sidebar Sheet was missing `SheetDescription`, causing accessibility warnings.

**Files:**
- `apps/webapp/src/core/components/layout/DashboardShell.tsx` — Added `SheetDescription` to AI sidebar

---

## 5. TypeScript Fixes

**Files:**
- `apps/webapp/src/features/auth/components/RBACWrapper.tsx` — Fixed `children` type casting for React.cloneElement
- `apps/webapp/src/features/auth/components/login-form.tsx` — Formatting improvements

---

## 6. WeeklyCalendar Hook Order Fix

**Related Story:** 2-2-visual-weekly-scheduler

**Problem:** `weekDays` memo was defined after callbacks that referenced it, causing potential issues.

**Files:**
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx` — Moved `weekDays` useMemo before callbacks

---

## 7. Dev Setup - Auto-Start Firebase Emulator

**Enhancement:** Added convenience scripts to auto-start Firebase Auth emulator alongside dev servers.

**Changes:**
- Added `concurrently` dev dependency at root
- New scripts:
  - `pnpm dev:full` — Starts Firebase emulator + backend + webapp
  - `pnpm emu` — Starts Firebase emulator only
  - `pnpm dev` — Apps only (unchanged, emulator must be running separately)

**Files:**
- `package.json` — Added `dev:full` and `emu` scripts, added `concurrently` dependency

---

## File Summary

**Modified:**
- `apps/webapp/src/core/components/common/nav-main.tsx`
- `apps/webapp/src/core/components/layout/DashboardShell.tsx`
- `apps/webapp/src/features/auth/auth-context.tsx`
- `apps/webapp/src/features/auth/components/RBACWrapper.tsx`
- `apps/webapp/src/features/auth/components/login-form.tsx`
- `apps/webapp/src/features/auth/components/signup-center-form.tsx`
- `apps/webapp/src/features/logistics/classes-page.tsx`
- `apps/webapp/src/features/logistics/components/WeeklyCalendar.tsx`
- `package.json`
- `pnpm-lock.yaml`
