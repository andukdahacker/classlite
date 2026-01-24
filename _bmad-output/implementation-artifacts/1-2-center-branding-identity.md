# Story 1.2: Center Branding & Identity

Status: review

## Story

As a Center Owner,
I want to configure my center's name, logo, and timezone,
so that the platform reflects my brand to students and staff.

## Acceptance Criteria

1. **Logo Upload:** Owner can upload a logo (max 2MB, PNG/JPG). [FR6, AC1]
2. **Dynamic Branding:** UI updates primary CSS variables (e.g., `--primary`) to match brand identity upon save. [FR6, AC2]
3. **Consistent Identity:** Center name and logo appear in the navigation rail for all users of that tenant. [FR6, AC3]
4. **Timezone Configuration:** Owner can select the center's timezone to ensure all schedules are displayed correctly. [FR6]
5. **Data Persistence:** Branding and settings are saved to the `Center` record and scoped by `centerId`.

## Tasks / Subtasks

- [x] **Database & Schema Updates** (AC: 5)
  - [x] Add `logoUrl`, `timezone` (default: 'UTC'), and `brandColor` (default: '#2563EB') fields to `Center` model in `schema.prisma`.
- [x] **Backend Implementation** (AC: 1, 4, 5)
  - [x] Update `packages/types` with `UpdateCenterSchema` including Zod validation for hex colors and IANA timezones.
  - [x] Implement `PATCH /api/v1/tenants/:id` in `apps/backend/src/modules/tenants/tenant.controller.ts` with strict `OWNER`/`ADMIN` role checks.
  - [x] Implement `updateTenant` in `apps/backend/src/modules/tenants/tenant.service.ts` using `getTenantedClient(centerId)`.
  - [x] Integrate Firebase Storage for logo uploads using path: `tenants/${centerId}/branding/logo.png`.
- [x] **Frontend Implementation** (AC: 1, 2, 3, 4)
  - [x] Create `apps/webapp/src/features/tenants` directory.
  - [x] Implement `CenterSettingsPage` with forms for Name, Logo, Timezone (IANA), and Brand Color (Hex).
  - [x] Create/Update `TenantContext` to provide center branding data and handle query invalidation (e.g., `['tenant', centerId]`) on update.
  - [x] Update `NavigationRail` component to display the dynamic center logo and name.
  - [x] Implement CSS variable injection logic to apply `brandColor` to `--primary` and related variables.

## Dev Notes

- **Multi-Tenancy:** Ensure all operations use `getTenantedClient(centerId)` to prevent cross-tenant leakage.
- **RBAC:** Restrict branding settings to users with `OWNER` or `ADMIN` roles.
- **File Storage:** Use **Firebase Storage** for logo uploads. Path format: `tenants/${centerId}/branding/logo.png`.
- **CORS:** Ensure Firebase Storage is configured to allow requests from the webapp domain.
- **CSS Variables:** shadcn/ui uses Tailwind CSS variables in `globals.css`. Override `--primary`, `--primary-foreground`, etc., dynamically on `document.documentElement.style`.
- **Timezones:** Use IANA strings (e.g., `Asia/Ho_Chi_Minh`) for consistency. Default to `Intl.DateTimeFormat().resolvedOptions().timeZone` in the UI.

### Project Structure Notes

- Backend logic should reside in `apps/backend/src/modules/tenants`.
- Frontend logic should reside in `apps/webapp/src/features/tenants`.
- Shared schemas should be in `packages/types/src/tenant/dto.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219

### Debug Log References

- Updated `schema.prisma` with `logoUrl`, `timezone`, `brandColor`.
- Implemented `PATCH /api/v1/tenants/:id` and `POST /api/v1/tenants/:id/logo`.
- Implemented `TenantContext` for global branding state.
- Created `CenterSettingsPage` for owner configuration.
- Updated `AppSidebar` to consume dynamic branding.

### Completion Notes List

- All backend tasks completed and verified via `pnpm build`.
- Frontend components implemented and typechecked.
- Multi-tenancy and RBAC enforced at the API level.

### File List

- `packages/db/prisma/schema.prisma`
- `packages/types/src/tenant/dto.ts`
- `apps/backend/src/modules/tenants/tenant.service.ts`
- `apps/backend/src/modules/tenants/tenant.controller.ts`
- `apps/backend/src/modules/tenants/tenant.routes.ts`
- `apps/backend/src/app.ts`
- `apps/webapp/src/App.tsx`
- `apps/webapp/src/features/tenants/tenant-context.tsx`
- `apps/webapp/src/features/tenants/center-settings-page.tsx`
- `apps/webapp/src/core/components/common/app-sidebar.tsx`
- `apps/backend/src/modules/tenants/tenant.service.test.ts`
- `apps/backend/src/modules/tenants/tenant.controller.test.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
