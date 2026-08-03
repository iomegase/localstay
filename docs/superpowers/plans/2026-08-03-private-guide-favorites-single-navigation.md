# Private Guide Favorites Single Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the rapid double render of `/sejour/coups-de-coeur` while preserving local navigation back from the unrouted map view.

**Architecture:** `GuideApp` distinguishes a real App Router transition from an in-place guide view change. A routed destination that differs from the current pathname delegates exclusively to `router.push`; an unrouted view or a destination matching the current pathname updates local state. Re-tapping the active heart resets filters and scroll position without forcing a React remount.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Jest, Testing Library

---

### Task 1: Prevent optimistic duplicate rendering for routed views

**Files:**
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx:1-150`

- [x] **Step 1: Write the failing routed-navigation regression test**

Mock `usePathname` with `let mockPathname = '/sejour'`. Render the private `GuideApp`, click Explorer, assert that `router.push('/sejour/coups-de-coeur')` occurs, and assert that the `Nos coups de cœur` heading is not rendered before the route transition completes.

- [x] **Step 2: Run test to verify RED**

```bash
npm test -- --runInBand tests/integration/private-guide-app.AC-01-03.navigation.test.tsx
```

Expected: FAIL because `setActiveView('favorites')` currently renders the heading before `router.push` completes.

- [x] **Step 3: Implement minimal route-aware navigation**

Import `usePathname`. Make `onOpenRoute` return `true` after pushing a pathname that differs from the current pathname, and `false` for the current pathname. In `navigate`, return before `setActiveView` when `onOpenRoute` returns `true`; otherwise update local state for same-path or unrouted views.

- [x] **Step 4: Run the focused test to verify GREEN**

Run the Task 1 command again. Expected: PASS, including the existing map-to-favorites regression.

### Task 2: Reset active Favorites without remounting it

**Files:**
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx:85-190`

- [x] **Step 1: Write the failing remount regression test**

Set `mockPathname` to `/sejour/coups-de-coeur`, render `initialView="favorites"`, retain the original `favorites-bento-grid` DOM node, click the heart tab, then assert that the grid is still the same node and that `router.push` was not called.

- [x] **Step 2: Run test to verify RED**

Run the focused navigation test. Expected: FAIL because `favoritesRefreshKey` replaces the grid DOM node.

- [x] **Step 3: Remove the forced remount**

Delete `favoritesRefreshKey`, remove `setFavoritesRefreshKey`, and render `GuideFavoritesPage` without a changing key. Keep category reset and smooth scroll intact.

- [x] **Step 4: Run the focused test to verify GREEN**

Run the focused navigation test. Expected: PASS.

### Task 3: Verify and update traceability

**Files:**
- Modify: `docs/traceability-matrix.md:632`

- [x] **Step 1: Update traceability**

Record that routed navigation renders once, while same-route map return remains local, and include `GuideApp.tsx` in the 035 source files.

- [x] **Step 2: Run the feature regression suite**

```bash
npm test -- --runInBand tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/private-guide-favorites.AC-01-01-05.page.test.tsx tests/integration/private-guide-app.AC-01-01-04.home.test.tsx
```

Expected: all suites PASS.

- [x] **Step 3: Run lint**

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 4: Commit scoped files**

```bash
git add docs/superpowers/plans/2026-08-03-private-guide-favorites-single-navigation.md docs/traceability-matrix.md src/features/guide-app/components/GuideApp.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx
git commit -m "fix: prevent duplicate favorites render"
```
