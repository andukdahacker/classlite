# Story 1.0: Design System Foundation

Status: ready-for-dev

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

- [ ] **Color System Implementation**
  - [ ] Convert brand HEX colors to OKLCH values for Tailwind v4 compatibility
  - [ ] Update `:root` variables in `packages/ui/src/styles/globals.css`
  - [ ] Ensure `--primary`, `--secondary`, `--accent`, and `--foreground` reflect the brand colors
- [ ] **Typography Setup**
  - [ ] Verify Google Fonts (Inter, Outfit) are available or add them to the webapp/website layouts
  - [ ] Configure CSS variables or Tailwind utility defaults for font-family
- [ ] **Global Styling**
  - [ ] Update `--radius` variable to `0.75rem`
  - [ ] Ensure base layer styles (body, buttons) use the new variables
- [ ] **Verification**
  - [ ] Run `pnpm build` in `packages/ui` to ensure no CSS errors
  - [ ] Check a sample component (e.g., Button) in the webapp to verify color/radius inheritance

## Dev Notes

- **Tailwind v4:** The project uses `@import "tailwindcss";` and `@theme inline`. Stick to this pattern.
- **Color Contrast:** Ensure the Slate Navy foreground (#1E293B) meets WCAG AA contrast ratios against the Ice Blue Wash (#EFF6FF) background.
- **Consistency:** Do not change the underlying Radix primitives, only the styling variables.

## References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] - Visual Design Foundation section.
- [Source: packages/ui/src/styles/globals.css] - Current CSS structure.
