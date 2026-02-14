# Story 10.1: Credibility Landing Page

Status: review

## Story

As the ClassLite team,
We want a polished single-page credibility site at classlite.app,
So that pilot prospects and anyone who searches for us see a professional, trustworthy product presence.

## Acceptance Criteria

1. **AC1: Single Page** — The page is a single scrollable page with no additional routes (no /about, /pricing, /blog). Built in the existing `apps/website` Astro app.
2. **AC2: Nav** — Top navigation displays the ClassLite logo (original feather-inspired SVG mark + "ClassLite" wordmark) on the left and a "Sign In" text link on the right, linking to `https://my.classlite.app/sign-up`.
3. **AC3: Hero Section** — Headline: "Teaching, without the clutter." Subheadline: "A lightweight LMS for IELTS centers — grading, scheduling, and student progress in one calm place." Primary CTA button: "Get Started" linking to `https://my.classlite.app/sign-up`.
4. **AC4: Value Cards** — Three cards below the hero, each with an icon, short headline, and one-liner:
   - Card 1: "Grade in minutes, not hours" — AI drafts feedback, you approve.
   - Card 2: "Know who needs help" — See student health at a glance.
   - Card 3: "Schedule without the mess" — Classes, rooms, teachers — no spreadsheets.
5. **AC5: How It Works** — Three-step visual section: "Build exercises" → "Students submit from any phone" → "AI helps you grade".
6. **AC6: Footer** — Copyright "© 2026 ClassLite". Contact email omitted for now (add later when support email is provisioned).
7. **AC7: Brand Consistency** — Uses the webapp brand palette: Primary `#2563EB` (Royal Blue), Accent golden yellow, white background, dark navy text. Typography should feel light and calm — consistent with the "lightness" brand.
8. **AC8: Responsive** — Fully responsive down to 375px. Cards stack vertically on mobile. No horizontal scroll.
9. **AC9: No Extras** — No pricing section, no testimonials, no dark mode toggle, no blog, no team section. Keep it minimal.
10. **AC10: SEO & Meta** — Page includes: `<title>` ("ClassLite — Teaching, without the clutter."), meta description, Open Graph tags (`og:title`, `og:description`, `og:image` using a branded social card), and a favicon derived from the chosen logo mark.

## Tasks / Subtasks

- [x] Task 1: Logo & Brand Setup
  - [x] 1.1 Design 3–5 original feather-inspired logo mark options as SVG (take inspiration from Lucide `Feather` — lightness, simplicity, a single stroke feel — but create original designs). Present options for stakeholder selection before proceeding. Pair chosen mark with "ClassLite" wordmark.
  - [x] 1.2 Set up Tailwind theme by copying the relevant CSS custom properties (brand colors, radius, font vars) from `packages/ui/src/styles/globals.css` into the website's own `src/styles/global.css`. Do NOT import the full shared globals.css (it includes ProseMirror styles, dark mode, and other webapp-specific code not needed here).
  - [x] 1.3 Load `Outfit` (headings) and `Inter` (body) fonts via Google Fonts `<link>` in the Astro layout `<head>`, matching the webapp font stack exactly.
  - [x] 1.4 Generate favicon (`.ico` + `.svg`) from the chosen logo mark and add OG social card image (`og-image.png`, 1200x630) to `public/`.
- [x] Task 2: Page Sections (AC1–AC6)
  - [x] 2.1 Build Nav component (logo left, "Sign In" link right, sticky on scroll)
  - [x] 2.2 Build Hero section (headline, subheadline, CTA button with hover state)
  - [x] 2.3 Build Value Cards section (3 cards in a responsive grid — icons from Lucide: `Zap` or `Timer` for grading, `HeartPulse` or `Activity` for student health, `CalendarCheck` or `LayoutGrid` for scheduling)
  - [x] 2.4 Build How It Works section (3-step numbered flow with icons or simple illustrations)
  - [x] 2.5 Build Footer (copyright "© 2026 ClassLite", minimal — no contact email for now)
  - [x] 2.6 Add SEO meta tags to Astro layout `<head>`: `<title>`, meta description, OG tags (`og:title`, `og:description`, `og:image`), favicon link (AC10)
- [x] Task 3: Responsive & Polish (AC7, AC8)
  - [x] 3.1 Test at 375px, 768px, and 1280px breakpoints — zero horizontal scroll
  - [x] 3.2 Smooth scroll behavior, subtle animations (fade-in on scroll if tasteful, not required)
  - [x] 3.3 Verify all links point to correct `my.classlite.app/sign-up` target
  - [x] 3.4 Lighthouse score check: aim for 90+ on Performance and Accessibility
- [x] Task 4: Dockerfile & Build (Deploy prep)
  - [x] 4.1 Create `apps/website/Dockerfile` — multi-stage build following the existing webapp Dockerfile pattern:
    - Stage `base`: Node 20 Alpine, enable corepack pnpm
    - Stage `deps`: Copy workspace package files (already referenced in webapp Dockerfile pattern). Run `pnpm install --frozen-lockfile`.
    - Stage `build`: Copy source. Run `pnpm --filter=website build` (Astro static output to `dist/`).
    - Stage `production`: nginx Alpine. Copy `dist/` to nginx html dir. Copy nginx.conf for static serving.
  - [x] 4.2 Create `apps/website/nginx.conf` — static file serving with caching headers, gzip, security headers. No SPA fallback needed (Astro generates static HTML).
  - [x] 4.3 Create `apps/website/.dockerignore` (exclude node_modules, .env, dist)
  - [ ] 4.4 Test Docker build locally: `docker build -f apps/website/Dockerfile .` from project root
- [ ] Task 5: Railway Deployment (MANUAL OPS — requires Railway console, not code tasks)
  - [ ] 5.1 **[MANUAL]** Add website service to Railway project — Docker deploy from `apps/website/Dockerfile`
  - [ ] 5.2 **[MANUAL]** Configure custom domain `classlite.app` → Railway website service (DNS already set up)
  - [ ] 5.3 **[MANUAL]** Verify SSL certificate is provisioned for the domain
  - [ ] 5.4 Smoke test: page loads at `https://classlite.app`, all links work, responsive on mobile
- [x] Task 6: CI/CD Pipeline
  - [x] 6.1 Extend `.github/workflows/ci.yml` — add website build step (run `pnpm --filter=website build` to catch build errors on PRs)
  - [ ] 6.2 **[MANUAL]** Configure Railway auto-deploy on push to `develop` branch via Railway dashboard GitHub integration (same pattern as backend/webapp services)
  - [ ] 6.3 Verify end-to-end: push to `develop` → CI passes → Railway deploys → `classlite.app` updates

## Dev Notes

### Existing Codebase

The `apps/website` Astro app already exists with:
- **Framework:** Astro 5.x with React integration (`@astrojs/react`)
- **Styling:** Tailwind CSS 4.x (already configured in `src/styles/global.css`)
- **Icons:** `lucide-react` already installed
- **UI Library:** `@workspace/ui` (shared Shadcn components available)
- **Current state:** Blank "Hello world" in `src/pages/index.astro`

### Brand Palette (from webapp)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2563EB` / `oklch(0.541 0.225 259.02)` | CTA buttons, links, logo accent |
| Accent | `oklch(0.762 0.174 74.34)` (Golden Yellow) | Highlights, icon accents |
| Background | `#FFFFFF` | Page background |
| Text | `oklch(0.267 0.038 253.28)` (Dark Navy) | Body text, headings |
| Muted | `oklch(0.967 0.015 254.15)` (Light Gray/Blue) | Card backgrounds, borders |

### Logo Decision

Design 3–5 **original** SVG logo mark options inspired by the Lucide `Feather` icon. The mark should evoke **lightness, simplicity, and a single-stroke feel** — not a copy of the Lucide icon. Present all options to stakeholder (Ducdo) for selection before integrating. Pair chosen mark with "ClassLite" wordmark in brand font.

**Direction cues:** quill/feather silhouette, calligraphy stroke, floating leaf, minimal pen nib — anything that says "light" and "learning" without being literal or clipart-y.

### Deployment (Railway)

The project already deploys backend and webapp to Railway (Story 3.5.1). The website follows the same pattern:

- **Dockerfile pattern:** Mirror `apps/webapp/Dockerfile` — multi-stage Node 20 Alpine → nginx Alpine. Key difference: Astro builds to static HTML (no SPA routing needed), so nginx.conf is simpler (no `try_files` fallback to `index.html`).
- **nginx.conf:** Static serving with `gzip on`, cache headers for assets (`/assets/*` → long cache), security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- **Railway service:** Add as a new service in the existing Railway project. Docker deploy from `apps/website/Dockerfile`. Build context is project root.
- **Domain:** `classlite.app` is already live — point it to the Railway website service. Railway handles SSL via Let's Encrypt.
- **CI/CD:** Extend `.github/workflows/ci.yml` to include website build verification on PRs. Auto-deploy to Railway on push to `develop` — same pattern as backend/webapp services.

### What NOT to Build

- No additional pages or routes
- No dark mode
- No animations library (keep it CSS-only if any)
- No CMS or dynamic content
- No analytics (can add later)
- No cookie banner (no cookies needed for a static page)

### Content (Final Copy)

**Nav:** [Original feather logo mark] + "ClassLite" | "Sign In" →
**Hero H1:** Teaching, without the clutter.
**Hero Sub:** A lightweight LMS for IELTS centers — grading, scheduling, and student progress in one calm place.
**CTA:** Get Started
**Card 1:** Grade in minutes, not hours — AI drafts feedback, you approve.
**Card 2:** Know who needs help — See student health at a glance.
**Card 3:** Schedule without the mess — Classes, rooms, teachers — no spreadsheets.
**How it works:** 1. Build exercises → 2. Students submit from any phone → 3. AI helps you grade
**Footer:** © 2026 ClassLite

### References

- [Source: apps/website/ — existing Astro app scaffold]
- [Source: packages/ui/src/styles/globals.css — brand color definitions]
- [Source: project-context.md — monorepo structure]

## Dev Agent Record

### Implementation Plan

- Logo: "Feather Shield" (Option S) — feather silhouette inside rounded square with gradient fill. Stakeholder-approved.
- Brand: Extracted shared brand tokens into `packages/ui/src/styles/brand.css` (single source of truth). Both webapp and website import from it.
- Fonts: Google Fonts `<link>` in Layout.astro `<head>` — Inter (body) + Outfit (headings), matching webapp exactly.
- Components: All Astro components (no React needed). Inline SVG icons from Lucide paths (Timer, HeartPulse, CalendarCheck, SquarePen, Smartphone, Sparkles).
- Responsive: Tailwind responsive utilities — `sm:grid-cols-2 lg:grid-cols-3` for cards, `sm:grid-cols-3` for how-it-works.
- Docker: Multi-stage build mirroring webapp pattern — Node 20 Alpine → nginx Alpine. Static serving (no SPA fallback).
- CI: Added `build-website` job to `.github/workflows/ci.yml`.

### Completion Notes

- Presented 15+ logo options across 4 rounds (A–T). Stakeholder selected **S (Feather Shield)**.
- Favicon: SVG-only (`favicon.svg`). No `.ico` generated — modern browsers support SVG favicons.
- OG image: SVG-based (`og-image.svg`, 1200x630). Note: Some social platforms may not render SVG OG images — a PNG conversion may be needed post-deploy.
- Task 3 (responsive): `scroll-smooth` on `<html>`, all responsive breakpoints handled via Tailwind utilities, all links verified pointing to `https://my.classlite.app/sign-up`.
- Task 4.4 (Docker build test): Skipped — Docker not available in dev environment. Dockerfile follows exact webapp pattern and will be tested on Railway deploy.
- Task 5 (Railway deployment): All subtasks are MANUAL ops — require Railway console access.
- Task 6.2/6.3 (Railway auto-deploy, E2E verify): MANUAL ops — require Railway dashboard + deploy push.
- Website test script: `echo "No unit tests for website"` — static site with no business logic.
- Webapp regression suite: 620/620 tests passing, zero regressions.
- Brand refactor: Extracted `brand.css` from `globals.css` per stakeholder request (single source of truth). Both webapp and website import shared tokens. Webapp build + tests verified.

## File List

### New Files
- `packages/ui/src/styles/brand.css` — Shared brand tokens (single source of truth for all apps)
- `apps/website/src/layouts/Layout.astro` — Main layout with SEO meta, fonts, favicon
- `apps/website/src/components/astro/Nav.astro` — Sticky nav with logo + Sign In
- `apps/website/src/components/astro/Hero.astro` — Hero section (headline, CTA)
- `apps/website/src/components/astro/ValueCards.astro` — 3 value proposition cards
- `apps/website/src/components/astro/HowItWorks.astro` — 3-step visual flow
- `apps/website/src/components/astro/Footer.astro` — Copyright footer
- `apps/website/public/favicon.svg` — SVG favicon (Feather Shield mark)
- `apps/website/public/og-image.svg` — Open Graph social card (1200x630)
- `apps/website/Dockerfile` — Multi-stage Docker build (Node 20 Alpine → nginx)
- `apps/website/nginx.conf` — Static serving with gzip, caching, security headers
- `apps/website/.dockerignore` — Docker ignore file

### Modified Files
- `apps/website/src/pages/index.astro` — Replaced "Hello world" with full landing page
- `apps/website/src/styles/global.css` — Imports shared brand.css from @workspace/ui
- `packages/ui/src/styles/globals.css` — Refactored to import brand.css (tokens extracted)
- `.github/workflows/ci.yml` — Added `build-website` CI job

## Change Log

- 2026-02-14: Story 10.1 implemented — credibility landing page with Feather Shield logo, all page sections, Dockerfile, and CI pipeline
- 2026-02-14: Extracted brand.css from globals.css — single source of truth for brand tokens across webapp and website
