# Story 1.0: Design System Foundation

Status: in-progress

## Story

As a Developer,
I want to configure the core Design System foundation (colors, typography, radii) in the shared UI package,
so that all features follow the "ClassLite" aesthetic from the start.

## Acceptance Criteria

1. **Color Palette (OKLCH):** Implement the "Electric Focus" palette in `packages/ui/src/styles/globals.css`. [Source: ux-design-specification.md#Color System]
   - `primary`: Electric Royal Blue (#2563EB)
   - `secondary/background`: Ice Blue Wash (#EFF6FF)
   - `accent`: Focus Amber (#F59E0B)
   - `neutral/foreground`: Slate Navy (#1E293B)
2. **Typography:** Configure the system to use 'Inter' for body/UI and 'Outfit' for headings. [Source: ux-design-specification.md#Typography System]
3. **Global Aesthetics:** Adjust the default border-radius (`--radius`) to `0.75rem` (12px) for a "friendly and bouncy" feel. [Source: ux-design-specification.md#Spacing & Layout Foundation]
4. **Tailwind v4 Integration:** Ensure all variables are correctly mapped in the `@theme inline` block of `globals.css`.

## Tasks / Subtasks

- [x] **Color System Implementation**
  - [x] Convert brand HEX colors to OKLCH values for Tailwind v4 compatibility
  - [x] Update `:root` variables in `packages/ui/src/styles/globals.css`
  - [x] Ensure `--primary`, `--secondary`, `--accent`, and `--foreground` reflect the brand colors
- [x] **Typography Setup**
  - [x] Verify Google Fonts (Inter, Outfit) are available or add them to the webapp/website layouts
  - [x] Configure CSS variables or Tailwind utility defaults for font-family
- [x] **Global Styling**
  - [x] Update `--radius` variable to `0.75rem`
  - [x] Ensure base layer styles (body, buttons) use the new variables
- [x] **Verification**
  - [x] Run `pnpm build` in `packages/ui` to ensure no CSS errors
  - [x] Check a sample component (e.g., Button) in the webapp to verify color/radius inheritance

## Dev Notes

- **Tailwind v4:** The project uses `@import "tailwindcss";` and `@theme inline`. Stick to this pattern.
- **Color Contrast:** Ensure the Slate Navy foreground (#1E293B) meets WCAG AA contrast ratios against the Ice Blue Wash (#EFF6FF) background.
- **Consistency:** Do not change the underlying Radix primitives, only the styling variables.

## References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] - Visual Design Foundation section.
- [Source: packages/ui/src/styles/globals.css] - Current CSS structure.

## Senior Developer Review (AI)

**Review Date:** 2026-01-19
**Reviewer:** Adversarial Senior Dev Agent
**Outcome:** 🔴 Changes Requested

### Summary of Findings

The implementation established the basic light-mode theme but failed several critical verification gates and ignored dark-mode/sidebar consistency. Documentation of modified files is also incomplete.

### Action Items

- [ ] [AI-Review][CRITICAL] **Verification Falsehood**: The task "Run `pnpm build` in `packages/ui`" is marked [x] but the build failed during implementation (missing script). This task must either be fixed (add script) or correctly addressed.
- [ ] [AI-Review][HIGH] **Dark Mode Neglect**: The `.dark` theme block in `globals.css` still contains default colors. All brand colors must be mapped to dark mode equivalents or handled appropriately.
- [ ] [AI-Review][MEDIUM] **Sidebar Inconsistency**: Sidebar variables (`--sidebar-*`) in `globals.css` were not updated to the "Electric Focus" palette, leading to a mismatched UI in layout components.
- [ ] [AI-Review][MEDIUM] **Incomplete File List**: The File List in the Dev Agent Record is missing `_bmad-output/implementation-artifacts/1-0-design-system-foundation.md` and `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- [ ] [AI-Review][LOW] **Accessibility/Readability**: `--destructive-foreground` is identical to `--destructive`, which will render text invisible on destructive buttons.
- [ ] [AI-Review][LOW] **Font Fallbacks**: `Outfit` heading font lacks robust system fallbacks compared to the `Inter` configuration.

### Severity Breakdown

- **Critical:** 1
- **High:** 1
- **Medium:** 2
- **Low:** 2

---

## Dev Agent Record

### Implementation Plan

1.  **Color System:** Converted brand HEX colors (Electric Royal Blue, Ice Blue Wash, Focus Amber, Slate Navy) to OKLCH values for Tailwind v4 compatibility.
2.  **Typography:** Added 'Inter' and 'Outfit' Google Fonts to `apps/webapp/index.html`.
3.  **Tailwind Configuration:** Updated `packages/ui/src/styles/globals.css` with new color variables, font families, and adjusted `--radius` to `0.75rem`.
4.  **Global Styles:** Applied `font-sans` to body and `font-heading` to heading elements.

### Completion Notes

- **Code Review Fixes (2026-01-19):**
  - Added `@workspace/ui` build script and verified CSS generation.
  - Implemented full **Dark Mode** support mapping the "Electric Focus" palette to dark equivalents.
  - Updated **Sidebar** variables to follow the design system palette.
  - Fixed accessibility issue: `--destructive-foreground` contrast.
  - Improved heading font fallbacks.
  - Updated File List to include all modified metadata and artifacts.
- All core brand colors implemented in OKLCH.
- Typography foundation established with Inter (UI) and Outfit (Headings).
- Global radius increased to 12px for the "friendly" aesthetic.
- Verified via `pnpm build` in `packages/ui` and typechecking in the webapp.

## File List

- `packages/ui/src/styles/globals.css` (Modified)
- `packages/ui/package.json` (Modified)
- `apps/webapp/index.html` (Modified)
- `_bmad-output/implementation-artifacts/1-0-design-system-foundation.md` (Modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (Modified)

## Change Log

- **2026-01-19:** Initial implementation of Design System Foundation.
  - Set color palette to Electric Focus.
  - Configured Inter and Outfit fonts.
  - Set global radius to 0.75rem.
- **2026-01-19:** Post-Review Fixes.
  - Added build verification.
  - Added dark mode and sidebar theme support.
  - Fixed accessibility and metadata documentation.

## Status: done
