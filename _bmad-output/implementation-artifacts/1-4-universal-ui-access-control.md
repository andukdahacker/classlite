# Story 1.4: Universal UI Access Control

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer,
I want to use a universal RBAC wrapper for all UI components,
so that access control is enforced consistently and maintenance is reduced.

## Acceptance Criteria

1. Implement a reusable higher-order component (RBACWrapper).
2. Component conditionally renders children based on `requiredRoles`.
3. Support "Disabled" or "Hidden" states for unauthorized roles via a `mode` prop.
4. Integrate with `useAuth` hook to get current user's role.
5. Provide clear TypeScript definitions for props.

## Tasks / Subtasks

- [x] Create `RBACWrapper` component in `apps/webapp/src/features/auth/components` (AC: 1, 4, 5)
  - [x] Implement `requiredRoles` prop matching `UserRole` type
  - [x] Implement `mode` prop ('hide' | 'disable')
- [x] Implement logic for 'hide' mode (return null if not authorized) (AC: 2, 3)
- [x] Implement logic for 'disable' mode (clone child with `disabled: true` if not authorized) (AC: 3)
- [x] Add unit tests for `RBACWrapper` (AC: 1, 2, 3)
- [x] (Optional) Refactor a dashboard component to use the wrapper for demonstration (AC: 1)
- [x] Address Code Review Findings (Adversarial Review)
  - [x] Fix "Unknown Role" flicker in `DashboardPage.tsx`
  - [x] Implement Fragment support in `RBACWrapper` (mode="disable")
  - [x] Implement Deep Disable logic (recursive) for nested elements
  - [x] Add `fallback` prop to `RBACWrapper` for loading states
  - [x] Add tests for Fragments and Deep Disable

## Dev Notes

### Technical Strategy

- Use the existing `useAuth` hook from `apps/webapp/src/features/auth/auth-context.tsx`.
- The `UserRole` type is defined in `packages/types/src/index.ts` (Owner, Admin, Teacher, Student).
- For 'disable' mode, use `React.Children.map` and `React.cloneElement` to safely inject the `disabled` prop to children.
- **Fragment Support:** If a child is a `React.Fragment`, recurse into its `props.children`.
- **Deep Disable:** Recursively inject `disabled: true` into child props to ensure nested interactive elements are captured.

### Architecture Compliance

- **Multi-Tenancy:** The wrapper itself is role-based, but since `useAuth` provides the `center_id` indirectly via the user object, it remains tenant-aware.
- **Component Placement:** `apps/webapp/src/features/auth/components/RBACWrapper.tsx`.
- **Testing:** Add `RBACWrapper.test.tsx` using Vitest and React Testing Library.

### Project Structure Notes

- Align with the "Feature-First" structure by keeping it in the `auth` feature.
- Ensure consistent naming (PascalCase for components).

### References

- [Source: apps/webapp/src/features/auth/auth-context.tsx] - Current auth context and `useAuth` hook.
- [Source: packages/types/src/index.ts] - `UserRole` definitions.
- [Source: apps/webapp/src/features/auth/protected-route.tsx] - Existing route-level RBAC example.

## Dev Agent Record

### Agent Model Used

claude-3-5-sonnet-20241022

### Debug Log References

- RED Phase: Initial test creation failed as expected (file not found).
- GREEN Phase: `RBACWrapper` implemented and tests passed (7/7).
- REFACTOR Phase: `DashboardPage.tsx` refactored to use `RBACWrapper`, verified with existing tests.
- CODE REVIEW FIXES:
  - Added recursive `deepDisable` to handle Fragments and nested elements.
  - Updated `DashboardPage.tsx` to explicitly check `loading` and show `DashboardSkeleton`.
  - Added 2 new test cases for Fragments and Deep Disable. Total tests: 9/9 passing.

### Completion Notes List

- Implemented `RBACWrapper` with `requiredRoles` (array of `UserRole`) and `mode` ('hide' | 'disable').
- Integrated with `useAuth` hook and handled `loading` state safety with a new `fallback` prop.
- **Robust Disable Mode:** Now supports `React.Fragment` and deep recursion for nested interactive elements.
- Set default `mode` to 'hide' per UX requirements.
- Added comprehensive unit tests in `RBACWrapper.test.tsx` covering all modes, Fragments, and Deep Disable.
- Refactored `DashboardPage.tsx` to eliminate role flicker and properly handle auth loading states.

### File List

- `apps/webapp/src/features/auth/components/RBACWrapper.tsx`
- `apps/webapp/src/features/auth/components/RBACWrapper.test.tsx`
- `apps/webapp/src/features/dashboard/DashboardPage.tsx`
