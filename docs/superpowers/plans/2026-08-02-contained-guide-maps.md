# Contained Guide Maps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the private guide bottom-navigation map and hiking navigation map inside the shared white smartphone frame, while reusing the demo guide map interface.

**Architecture:** Extract the private guide viewport into a reusable `PrivateGuideFrame`. Let `GuideApp` own the private bottom-nav map view by removing the legacy `/map` route override, while retaining `/map` itself for backward compatibility. Add an explicit contained rendering mode to the hiking map and use it in both direct and intercepted hiking start routes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Mapbox GL, Vitest, Testing Library.

---

### Task 1: Extract the shared private guide frame

**Files:**
- Create: `src/features/guide-app/components/PrivateGuideFrame.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`
- Test: `tests/integration/private-guide-frame.AC-02-01-04.shell.test.tsx`

**Step 1: Write the failing test**

Assert that `PrivateGuideFrame` exposes the approved phone dimensions, five-pixel white border, rounded clipping, shadow, and an inner full-height scroll viewport.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/private-guide-frame.AC-02-01-04.shell.test.tsx`
Expected: FAIL because `PrivateGuideFrame` does not exist.

**Step 3: Write minimal implementation**

Create `PrivateGuideFrame` and replace the duplicated stage/shell markup in `PrivateGuidePage` without changing its data loading or authorization behavior.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/private-guide-frame.AC-02-01-04.shell.test.tsx`
Expected: PASS.

### Task 2: Keep the private bottom-nav map inside GuideApp

**Files:**
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`
- Test: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`

**Step 1: Write the failing test**

Assert that the production `PRIVATE_GUIDE_ROUTES` has no `map` override and that clicking the bottom navigation map tab switches to the internal map view without calling `router.push('/map')`.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
Expected: FAIL because `PRIVATE_GUIDE_ROUTES.map` still points to `/map`.

**Step 3: Write minimal implementation**

Remove only the map route override from `PRIVATE_GUIDE_ROUTES`. Keep all private lodging routes and the legacy `/map` page unchanged.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
Expected: PASS.

### Task 3: Constrain hiking maps to the shared frame

**Files:**
- Modify: `src/features/guide-app/components/TrailNavigationMap.tsx`
- Modify: `src/features/guide-app/components/TrailStartModal.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/start/page.tsx`
- Test: `tests/unit/trail-navigation.start-map.test.tsx`
- Test: `tests/integration/private-guide-contained-maps.AC-03-05.shell.test.tsx`

**Step 1: Write the failing tests**

Assert that `TrailNavigationMap` uses `h-full` and not `h-screen` in contained mode, and that both the direct page and intercepted modal wrap it in `PrivateGuideFrame` with `contained` enabled.

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/trail-navigation.start-map.test.tsx tests/integration/private-guide-contained-maps.AC-03-05.shell.test.tsx`
Expected: FAIL because contained mode and shared wrappers are absent.

**Step 3: Write minimal implementation**

Add `contained?: boolean` to `TrailNavigationMap`, preserve legacy full-screen rendering by default, and render contained maps from both hiking start entry points inside `PrivateGuideFrame`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/trail-navigation.start-map.test.tsx tests/integration/private-guide-contained-maps.AC-03-05.shell.test.tsx`
Expected: PASS.

### Task 4: Traceability and complete verification

**Files:**
- Modify: `docs/traceability-matrix.md`

**Step 1: Update traceability**

Map spec 040 acceptance criteria to the frame, private navigation, hiking map, and corresponding test files.

**Step 2: Run focused tests**

Run: `npm test -- tests/integration/private-guide-frame.AC-02-01-04.shell.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/unit/trail-navigation.start-map.test.tsx tests/integration/private-guide-contained-maps.AC-03-05.shell.test.tsx`

**Step 3: Run static checks**

Run: `npm run lint`
Run: `npx tsc --noEmit`

**Step 4: Run production build**

Run: `npm run build`

**Step 5: Run the relevant complete guide test group**

Run: `npm test -- tests/unit/guide-* tests/integration/private-guide-* tests/unit/trail-navigation.start-map.test.tsx`

**Step 6: Commit intentionally**

Commit only spec-040 implementation, tests, plan, and traceability changes. Do not include `next-env.d.ts` or Claude's audit file.
