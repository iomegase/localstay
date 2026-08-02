# POI Navigation and Native Swipe Implementation Plan

> **For Codex:** Use `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Make the private guide POI back button restore its originating view, add native horizontal photo swipe without arrows to the shared modern guide, and ship the already completed private-guide fixes to production.

**Architecture:** Keep `GuideApp` as the internal mini-application router. Closing a POI changes local guide state instead of pushing the current Next.js URL. Extend the shared hero carousel with an opt-in native scroll-snap mode used by `GuidePoiDetails`; preserve the legacy arrow mode as the default for other consumers.

**Tech Stack:** Next.js 16, React, TypeScript, Tailwind CSS, Vitest/Testing Library.

---

### Task 1: Lock the POI back behavior with a regression test

**Files:**
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Modify: `src/components/guide/GuideApp.tsx`

- [ ] Add a test that opens a POI from the favorites view, activates the top-left back button, and expects the favorites view to be restored without a same-route `router.push`.
- [ ] Run the targeted test and verify it fails for the current implementation.
- [ ] Add a `closePoi` state transition that clears the selected POI and restores `poiOrigin` directly.
- [ ] Run the targeted test and verify it passes.

### Task 2: Add native photo swipe to modern guide POIs

**Files:**
- Modify: `src/features/categories/components/PoiDetailHeroCarousel.tsx`
- Modify: `src/components/guide/GuidePoiDetails.tsx`
- Modify: `tests/integration/poi-detail.hero-image.test.tsx`
- Modify: `tests/integration/public-guide-demo.poi-detail-content.test.tsx`

- [ ] Add failing tests for a scroll-snap gallery, the absence of arrows, and active-dot synchronization.
- [ ] Add an opt-in `navigation="swipe"` variant using horizontal native overflow, mandatory scroll snap, touch pan preservation, and hidden scrollbar.
- [ ] Make dots interactive and scroll to their slide; keep the existing arrow gallery as the default.
- [ ] Activate the swipe variant only from `GuidePoiDetails`.
- [ ] Run both targeted test files and verify all legacy and modern behaviors pass.

### Task 3: Update traceability and run full verification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] Trace POI detail criteria AC-01-07 and AC-01-08 to source and tests.
- [ ] Run targeted integration tests.
- [ ] Run lint.
- [ ] Run TypeScript validation.
- [ ] Run the production build.
- [ ] Inspect the final diff and confirm `next-env.d.ts` is excluded.

### Task 4: Integrate and publish

- [ ] Commit the implementation on the isolated branch.
- [ ] Merge it into `agent/private-guide-practical` and push that branch.
- [ ] Merge the complete private-guide branch into `main`.
- [ ] Re-run critical verification on merged `main`.
- [ ] Push `main` so production receives the active trail button, modern map, working POI back navigation, and swipe gallery.
