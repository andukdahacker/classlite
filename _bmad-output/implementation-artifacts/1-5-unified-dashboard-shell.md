# Story 1.5: Unified Dashboard Shell

Status: done

## Story

As a User (Owner, Admin, Teacher, Student),
I want to land on a dashboard tailored to my role after login,
so that I can immediately see the most important information for my daily tasks.

## Acceptance Criteria

1. **3-Column Responsive Layout:** Implement a shell with a **Navigation Rail** (Left), **Main Content Area** (Center), and a collapsible **AI Sidebar** (Right). Sidebar collapses on tablets; Navigation Rail moves to a **Bottom Bar** on mobile (< 768px). [Epic 1, Story 1.5, AC1]
2. **Role-Based Routing:** Configure `/:centerId/dashboard` to dynamically render role-specific layouts based on the `role` claim (Owner: Health, Teacher: Queue, Student: Tasks). [Epic 1, Story 1.5, AC2]
3. **Global Status & Identity:** Display Center Logo/Name (from Story 1.2) and the **Offline/Sync Status Indicator** in the top bar with the "Writing Feather" animation. [Epic 1, Story 1.5, AC3]
4. **Design System Fidelity:** Apply the "Electric Focus" theme (Royal Blue #2563EB) and `Outfit/Inter` font stacks with a `0.75rem` (12px) border radius. [Epic 1, Story 1.5, AC4]
5. **Performance:** Ensure the shell renders in < 300ms (pre-widget load) with professional empty states for new tenants. [Epic 1, Story 1.5, AC5]
6. **Navigation Integration:** Integrate the existing `AppSidebar` (from Story 1.2) into the Navigation Rail section of the new shell.

## Tasks / Subtasks

- [x] **Core Layout Implementation**
  - [x] Create `DashboardShell` component in `apps/webapp/src/core/components/layout/`.
  - [x] Implement responsive 3-column grid using Tailwind CSS.
  - [x] Implement collapsible logic for the AI Sidebar (Right pane) using `shadcn/ui` Sheet or custom state.
  - [x] Implement Mobile Navigation Bottom Bar for viewports < 768px.
- [x] **Role-Based Content Orchestration**
  - [x] Create placeholder dashboard components for each role: `OwnerDashboard`, `TeacherDashboard`, `StudentDashboard`.
  - [x] Implement logic in `DashboardPage` to select the sub-component based on the `role` claim from `useAuth()`.
  - [x] Configure TanStack Router (or React Router) for `/:centerId/dashboard` route.
- [x] **Global UI Elements**
  - [x] Implement `TopBar` component with Center Logo/Name and `OfflineIndicator`.
  - [x] Create `OfflineIndicator` component with "Writing Feather" animation (CSS or Framer Motion).
  - [x] Ensure `OfflineIndicator` reflects state from TanStack Query's `online` status.
- [x] **Design System & Branding**
  - [x] Verify `globals.css` reflects `Outfit` and `Inter` fonts.
  - [x] Ensure all containers use `rounded-xl` (0.75rem) border radius as per UX Spec.
  - [x] Integrate with `TenantContext` to ensure brand colors are applied to the shell.

## Dev Notes

- **Layout Grid:** Use `grid-cols-[auto_1fr_auto]` or similar for the 3-column layout. The AI Sidebar (right) should be collapsible to maximize screen space for the main content.
- **Responsive Design:**
  - Desktop (>1024px): Rail (Left) + Main (Center) + AI Sidebar (Right).
  - Tablet (768px-1024px): Rail (Left) + Main (Center). AI Sidebar becomes a toggleable Drawer/Sheet.
  - Mobile (<768px): TopBar + Main (Center). Navigation moves to a fixed Bottom Bar.
- **Offline Indicator:** Use `window.navigator.onLine` and TanStack Query's `useOnlineManager` to drive the status.
- **Animation:** Use `framer-motion` for the "Writing Feather" animation and sidebar transitions for a premium feel.
- **Performance:** Use `React.lazy` for role-specific dashboard components to keep the initial shell bundle small and fast (< 300ms rendering).

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#6. Component Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision Impact Analysis]
- [Context: Story 1.2 provided `TenantContext` and `AppSidebar`]

## Technical Requirements

- **Frontend:** React (Vite), Tailwind CSS, shadcn/ui, Framer Motion.
- **State Management:** `useAuth` hook for role data, `TenantContext` for branding.
- **Routing:** TanStack Router or React Router (as established in previous stories).

## Architecture Compliance

- Follow the **Feature-First** directory structure.
- Adhere to the **Clean Architecture** (Route -> Controller -> Service) where applicable, though this is primarily a UI story.
- Use shared types from `@workspace/types` if any new DTOs are required for dashboard summaries.

## Testing Requirements

- **Unit Tests:** Test the role-based component selection logic in `DashboardPage`.
- **E2E Tests:** Verify the responsive layout at different breakpoints (Mobile, Tablet, Desktop) using Playwright.
- **Accessibility:** Ensure the Navigation Rail and AI Sidebar are keyboard accessible.

## File List

- `apps/webapp/src/core/components/layout/DashboardShell.tsx`
- `apps/webapp/src/core/components/layout/TopBar.tsx`
- `apps/webapp/src/core/components/layout/OfflineIndicator.tsx`
- `apps/webapp/src/features/dashboard/DashboardPage.tsx`
- `apps/webapp/src/features/dashboard/DashboardPage.test.tsx`
- `apps/webapp/src/features/dashboard/components/OwnerDashboard.tsx`
- `apps/webapp/src/features/dashboard/components/TeacherDashboard.tsx`
- `apps/webapp/src/features/dashboard/components/StudentDashboard.tsx`
- `apps/webapp/src/features/auth/auth.utils.ts`
- `apps/webapp/src/App.tsx`
- `apps/webapp/src/core/components/common/app-sidebar.tsx`

## Change Log

### 2026-01-24: Initial Implementation

- Implemented `DashboardShell` with 3-column responsive layout.
- Implemented `TopBar` with Center Logo/Name and `OfflineIndicator`.
- Implemented `OfflineIndicator` with "Writing Feather" animation using `framer-motion`.
- Implemented `DashboardPage` with role-based orchestration.
- Configured unified route `/:centerId/dashboard`.
- Integrated `AppSidebar` with dynamic URLs based on `centerId`.
- Added unit tests for `DashboardPage`.

### 2026-01-24: Code Review Fixes

- **Navigation**: Centralized in `navigation.ts`, role-aware, and used consistently across `AppSidebar` and `DashboardShell`.
- **AI Sidebar**: Fixed tablet responsiveness by implementing a `Sheet` (drawer) instead of hiding it. Added auto-collapse logic for screen widths < 1280px.
- **Routing**: Unified all dashboard-related routes under `/:centerId/dashboard` in `App.tsx`, supporting nested routes like settings and users.
- **Animation**: Refined `OfflineIndicator` logic - the "Writing Feather" now animates only when syncing (Online + active fetching/mutating) and remains static when offline.
- **Security**: Fixed RBAC visibility leak in mobile/sidebar navigation by filtering items based on user role.
- **Testing**: Added validation for role-based navigation filtering in `DashboardPage.test.tsx`.

## Dev Agent Record

### Implementation Plan

1.  **Layout Infrastructure:** Created `DashboardShell` as the main wrapper for all authenticated pages. It handles the 3-column layout (Rail, Main, AI Sidebar) and responsiveness (Bottom Bar on mobile).
2.  **Global Elements:** Built `TopBar` and `OfflineIndicator`. The latter uses a custom `useIsOnline` hook and `framer-motion` for the required animation.
3.  **Role Orchestration:** Created `DashboardPage` which uses `React.lazy` to load role-specific dashboard placeholders based on the user's role claim.
4.  **Routing:** Updated `App.tsx` and `auth.utils.ts` to support the `/:centerId/dashboard` pattern, ensuring users are redirected correctly after login.
5.  **Branding:** Linked shell elements to `TenantContext` to ensure brand colors and center identity are preserved.

### Completion Notes

- All ACs satisfied.
- Unit tests for role-based redirection pass.
- Layout is responsive across mobile, tablet, and desktop breakpoints.
- Offline animation implemented and active when network is lost.
