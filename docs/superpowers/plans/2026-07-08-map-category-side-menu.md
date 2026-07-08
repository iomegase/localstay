# Map Category Side Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-first side menu on `/map` so guests can filter owner-recommended POI markers by category.

**Architecture:** Keep filtering entirely client-side in `GuestMap`; the server continues sending all recommended POIs. Derive categories from the POI payload, render a left drawer, filter the markers and counter from local state, and refit the Mapbox viewport when the filter changes.

**Tech Stack:** Next.js 16 App Router, React client component, TypeScript strict, Tailwind CSS, Lucide React, Jest + Testing Library.

---

### Task 1: Spec And Traceability

**Files:**
- Modify: `specs/features/005-map/spec.md`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update `005-map`**

Add a fourth user story for category filtering on the lodging recommendation map:

```markdown
### US-04 — Filtrer la carte par catégorie

**As a** Tourist en séjour actif
**I want to** filtrer les POI recommandés sur la carte par Category
**So that** je repère rapidement les restaurants, randonnées ou services qui m'intéressent

#### Acceptance Criteria

- **AC-04-01**: Given la carte `/map` des recommandations Owner, When le Tourist ouvre le menu filtre, Then un side menu liste "Tous" puis chaque Category présente dans les POI visibles avec icône, couleur et compteur.
- **AC-04-02**: Given une Category du side menu, When le Tourist la sélectionne, Then seuls les markers de cette Category restent affichés, le compteur reflète les POI filtrés et la carte se recentre sur ces POI.
- **AC-04-03**: Given un filtre Category actif, When le Tourist sélectionne "Tous" ou ferme le menu, Then tous les markers recommandés sont de nouveau disponibles sans nouveau chargement Mapbox.
```

- [ ] **Step 2: Update traceability**

Add the new AC rows under section `005 — Map`:

```markdown
| AC-04-01 | Side menu catégories sur `/map` avec "Tous", icône, couleur et compteur | `src/app/(public)/map/_components/GuestMap.tsx` | `tests/unit/guest-map.category-filter.test.tsx` | ✅ done |
| AC-04-02 | Sélection catégorie filtre les markers, compteur et recentrage carte | `src/app/(public)/map/_components/GuestMap.tsx` | `tests/unit/guest-map.category-filter.test.tsx` | ✅ done |
| AC-04-03 | Retour à "Tous" restaure tous les markers sans nouveau fetch | `src/app/(public)/map/_components/GuestMap.tsx` | `tests/unit/guest-map.category-filter.test.tsx` | ✅ done |
```

### Task 2: Category Filter Test

**Files:**
- Create: `tests/unit/guest-map.category-filter.test.tsx`
- Modify: `src/app/(public)/map/_components/GuestMap.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/guest-map.category-filter.test.tsx` with mocked `react-map-gl/mapbox`, render `GuestMap` with three POIs across two categories, open the filter menu, select `Restaurant`, assert only restaurant markers remain and the counter updates, then select `Tous` and assert all markers return.

- [ ] **Step 2: Run the focused test**

Run:

```bash
npm test -- tests/unit/guest-map.category-filter.test.tsx
```

Expected before implementation: FAIL because the filter button and side menu do not exist.

- [ ] **Step 3: Implement minimal filtering**

In `GuestMap.tsx`, add `selectedCategorySlug`, `isFilterOpen`, derived `categoryFilters`, derived `visiblePois`, marker rendering from `visiblePois`, and a `fitToPois(visiblePois)` effect. Add a floating filter button plus left drawer with `Tous` and category buttons.

- [ ] **Step 4: Run the focused test again**

Run:

```bash
npm test -- tests/unit/guest-map.category-filter.test.tsx
```

Expected after implementation: PASS.

### Task 3: Verification And Commit

**Files:**
- Verify: `src/app/(public)/map/_components/GuestMap.tsx`
- Verify: `tests/unit/guest-map.category-filter.test.tsx`

- [ ] **Step 1: Run focused and related checks**

Run:

```bash
npm test -- tests/unit/guest-map.category-filter.test.tsx tests/unit/mapbox-css-global.test.ts
npx tsc --noEmit
npm run build
```

- [ ] **Step 2: Run lint and record current behavior**

Run:

```bash
npm run lint
```

Expected current repo behavior: command may fail before linting with `Invalid project directory provided, no such directory: /Users/daviddevillers/sites/staylocal /lint`.

- [ ] **Step 3: Clean generated artifacts**

If `next-env.d.ts` or `tsconfig.tsbuildinfo` changed during verification, restore them:

```bash
git restore next-env.d.ts tsconfig.tsbuildinfo
```

- [ ] **Step 4: Commit and push**

Run:

```bash
git add docs/superpowers/plans/2026-07-08-map-category-side-menu.md specs/features/005-map/spec.md docs/traceability-matrix.md src/app/'(public)'/map/_components/GuestMap.tsx tests/unit/guest-map.category-filter.test.tsx
git commit -m "feat(map): add category side filter"
git push origin main
```
