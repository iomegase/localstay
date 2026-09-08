# Mutualized Concierge Landings Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Render every published `/conciergerie/[city-slug]` page with one shared mobile-first conversion architecture while keeping destination-specific SEO copy, local sectors, FAQ, guide URL, and verified reviews.

**Architecture:** A static editorial catalog provides the destination-specific landing fields. `LocalConciergeLanding` owns the shared JSX, services, four-step process, lodging cards, guide preview, reviews, and CTAs. The server route validates publication, loads up to three published lodgings, selects reviews by slug, and renders the shared component for Saint-Gervais-les-Bains and Saint-Nicolas-de-Véroce.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Specify and test the shared behavior

**Files:**
- Modify: `specs/features/046-local-seo-city-cluster/spec.md`
- Create: `tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx`
- Delete: `tests/integration/local-seo.AC-06.saint-nicolas-conversion.test.tsx`
- Modify: `tests/integration/local-seo.AC-01-02.service-pages.test.tsx`

1. Extend approved AC-06 and UI behavior so every published concierge destination uses the shared owner landing.
2. Add a test rendering Saint-Gervais and Saint-Nicolas with the same sections, three-card query limit, distinct local headings, and destination guide URLs.
3. Run the test and confirm it fails because Saint-Gervais still renders the legacy generic component.

Run: `NEXT_PUBLIC_BASE_URL=https://www.mystay.city npm test -- tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx --runInBand`

### Task 2: Extract the destination editorial contract

**Files:**
- Create: `src/features/local-seo/content/concierge-landings.ts`
- Modify: `src/features/local-seo/content/guest-reviews.ts`

1. Define a strict `LocalConciergeLandingContent` type for promise, owner copy, local copy, local sectors, and FAQ.
2. Add reviewed, unique entries for Saint-Gervais-les-Bains and Saint-Nicolas-de-Véroce.
3. Replace the single-city reviews export with a slug-based selector that returns an empty collection when no verified reviews exist.

### Task 3: Create the shared landing and route all published cities through it

**Files:**
- Create: `src/features/local-seo/components/LocalConciergeLanding.tsx`
- Delete: `src/features/local-seo/components/SaintNicolasConciergeLanding.tsx`
- Modify: `src/app/(public)/conciergerie/[city-slug]/page.tsx`

1. Move the shared visual architecture into `LocalConciergeLanding`.
2. Read all local strings, H1, FAQ, and guide path from props/catalog instead of hardcoding Saint-Nicolas.
3. Query `listPublishedLodgings({ limit: 3 })` for every published concierge destination.
4. Render the shared component for every published city; retain 404 behavior for unpublished cities.
5. Run the new integration test until green, then run existing service-page tests.

Run: `NEXT_PUBLIC_BASE_URL=https://www.mystay.city npm test -- tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx tests/integration/local-seo.AC-01-02.service-pages.test.tsx --runInBand`

### Task 4: Traceability and verification

**Files:**
- Modify: `docs/traceability-matrix.md`

1. Link AC-06-01 through AC-06-03 to the shared component, catalog, route, and mutualization test.
2. Run focused lint on changed TypeScript files.
3. Run the local SEO integration suite and production build.

Run: `npx eslint 'src/app/(public)/conciergerie/[city-slug]/page.tsx' src/features/local-seo/components/LocalConciergeLanding.tsx src/features/local-seo/content/concierge-landings.ts src/features/local-seo/content/guest-reviews.ts tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx tests/integration/local-seo.AC-01-02.service-pages.test.tsx`

Run: `NEXT_PUBLIC_BASE_URL=https://www.mystay.city npm test -- tests/integration/local-seo.AC-06.concierge-mutualization.test.tsx tests/integration/local-seo.AC-01-02.service-pages.test.tsx tests/unit/local-seo.content.test.ts --runInBand`

Run: `NEXT_PUBLIC_BASE_URL=https://www.mystay.city npm run build`
