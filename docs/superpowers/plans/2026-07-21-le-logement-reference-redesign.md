# `/le-logement` Reference Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le carrousel de `/le-logement` par un guide vertical coloré fidèle à la référence, avec menu mobile contextuel limité à cette route et sans changement backend.

**Architecture:** Le Server Component existant conserve les requêtes Prisma et compose quatre sections sémantiques. Deux petits Client Components gèrent respectivement la navigation d'ancrage et la checklist locale ; `PublicMenu` sélectionne le tiroir logement à partir de `usePathname()` sans modifier le menu des autres routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Lucide React, Jest et Testing Library.

---

## File Map

- Modify `specs/features/012-guide-customization/spec.md`: contrat produit approuvé.
- Create `docs/superpowers/specs/2026-07-21-le-logement-reference-redesign-design.md`: design validé.
- Modify `src/features/city-guide/components/PublicMenu.tsx`: tiroir contextuel de `/le-logement`.
- Create `src/app/(public)/le-logement/_components/LodgingSectionNav.tsx`: navigation sticky d'ancrage.
- Create `src/app/(public)/le-logement/_components/DepartureChecklist.tsx`: checklist locale non persistée.
- Modify `src/app/(public)/le-logement/page.tsx`: nouveau flux vertical et nouvelle présentation.
- Modify `tests/unit/public-layout.mockup-menu.test.tsx`: non-régression du menu global.
- Create `tests/unit/public-menu.lodging-guide-menu.test.tsx`: contrat du tiroir contextuel.
- Create `tests/unit/le-logement.interactions.test.tsx`: navigation et checklist.
- Modify `tests/integration/le-logement.practical-blocks.test.tsx`: contrat vertical et mapping des données.
- Modify `docs/traceability-matrix.md`: lien AC-04-04 vers code et tests.

### Task 1: Contextual lodging menu

**Files:**
- Modify: `src/features/city-guide/components/PublicMenu.tsx`
- Create: `tests/unit/public-menu.lodging-guide-menu.test.tsx`
- Modify: `tests/unit/public-layout.mockup-menu.test.tsx`

- [ ] **Step 1: Write failing route-scope tests**

Mock `usePathname()` with a mutable pathname. Assert that `/le-logement` opens an overlay labelled `Guide du logement` containing four links to `#bienvenue`, `#infos-pratiques`, `#bon-a-savoir`, and `#depart`, with the labels `Bienvenue`, `Infos pratiques`, `Bon à savoir`, and `Départ`. Assert the same component on `/` still renders `Navigation` and the existing lodging links.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/public-menu.lodging-guide-menu.test.tsx tests/unit/public-layout.mockup-menu.test.tsx --runInBand`  
Expected: FAIL because the route-specific menu is absent.

- [ ] **Step 3: Implement the minimal route-specific branch**

Add a `LODgingSectionItems` constant with icon components from Lucide. In `PublicMenu`, compute `const isLodgingGuide = pathname === '/le-logement'`. Keep the trigger unchanged. When open and `isLodgingGuide`, render the MYSTAY heading, close button, `Guide du logement` eyebrow and four anchor rows; each anchor calls `setIsOpen(false)`. For every other pathname, render the current overlay unchanged.

- [ ] **Step 4: Verify GREEN**

Run the same Jest command. Expected: both suites PASS.

### Task 2: Section navigation and departure checklist

**Files:**
- Create: `src/app/(public)/le-logement/_components/LodgingSectionNav.tsx`
- Create: `src/app/(public)/le-logement/_components/DepartureChecklist.tsx`
- Create: `tests/unit/le-logement.interactions.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Render `LodgingSectionNav` and assert four accessible links with the exact anchors. Render `DepartureChecklist` with `['Vider le réfrigérateur', 'Fermer les fenêtres']`, click the first item, and assert it becomes checked while the second remains unchecked. Assert the progress label changes from `0 / 2` to `1 / 2`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/unit/le-logement.interactions.test.tsx --runInBand`  
Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement minimal accessible components**

`LodgingSectionNav` exports the shared four-item configuration and renders a sticky horizontally scrollable `<nav aria-label="Sections du guide logement">`. `DepartureChecklist` stores a `Set<number>` in local state, exposes real checkbox inputs, renders a progress bar with `aria-valuenow`, and performs no network or storage write.

- [ ] **Step 4: Verify GREEN**

Run the same Jest command. Expected: PASS.

### Task 3: Replace the pager with the vertical page

**Files:**
- Modify: `src/app/(public)/le-logement/page.tsx`
- Modify: `tests/integration/le-logement.practical-blocks.test.tsx`

- [ ] **Step 1: Rewrite integration assertions for the approved contract**

Remove carousel interaction assertions. Assert that all four `<section>` elements exist simultaneously with the stable IDs, that their content is in document order, that `Arrivée` is paired with `À partir de 16 h`, and that `Départ` is paired with `10 h`. Assert hero photo, Owner message, map URL, video ordering, Wi-Fi, emergency number, custom blocks, checkout and bins. Add a sparse-data case asserting absent optional cards are omitted and no fabricated owner content appears.

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx --runInBand`  
Expected: FAIL because the current page renders one pager panel instead of four simultaneous sections.

- [ ] **Step 3: Implement the vertical composition**

Keep `getActiveLodgingContext()` and both Prisma queries unchanged. Remove the `LodgingPager` import and rendering. Render:

1. a rounded hero using `cover_photo_url`, lodging name, `cityName`, the Owner message and a Maps CTA when `lodging_address` exists;
2. three quick fact cards for fixed arrival/departure times and conditional Wi-Fi;
3. `LodgingSectionNav`;
4. four semantic sections using the existing data ordering;
5. colorful bento cards with route-local Tailwind values for blue, amber, green and coral accents;
6. `DepartureChecklist` only when `checkout_instructions` contains Markdown list items, otherwise the existing sanitized Markdown rendering;
7. the existing empty state when there is no Owner content.

Preserve `Image`, `YouTubeEmbed`, `WifiCredentials`, `MarkdownText`, trash-bin icons and safe Maps URL construction. Do not modify Prisma, API routes, public layout, bottom navigation or other pages.

- [ ] **Step 4: Verify GREEN and regression coverage**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx tests/unit/le-logement.interactions.test.tsx tests/unit/public-menu.lodging-guide-menu.test.tsx tests/unit/public-layout.mockup-menu.test.tsx --runInBand`  
Expected: PASS.

### Task 4: Traceability and verification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update traceability**

Replace the old AC-04-01 carousel wording and sources with the vertical page, section navigation, route-specific menu and new tests. Add AC-04-04/BR-18/BR-19 explicitly.

- [ ] **Step 2: Run focused tests**

Run the four Jest suites from Task 3. Expected: PASS with zero failed tests.

- [ ] **Step 3: Run broader static verification**

Run: `npm run lint`  
Expected: exit 0, or record an existing repository-tooling failure without claiming lint success.

Run: `npm run build`  
Expected: exit 0, or report unrelated pre-existing failures with exact output.

- [ ] **Step 4: Visual verification**

Start the local app with its existing environment, open `/le-logement` in a 390 px viewport with an active lodging session, and compare hero, menu, anchors, color rhythm and card layout against the supplied public reference. Correct only discrepancies inside the approved page scope.

- [ ] **Step 5: Commit**

Stage only the spec, design, plan, page, page-scoped components, menu, tests and traceability changes. Commit with `feat: redesign le-logement from approved reference`.
