# Marketing homepage regression reconciliation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the current marketing homepage approved by the Product Owner and make its approved spec and regression tests describe that version.

**Architecture:** This is a contract-and-test correction, not a UI rewrite. The existing `MarketingHome` component remains unchanged; tests assert its public semantics and current hero dimensions rather than removed editorial sections and test IDs.

**Tech Stack:** Next.js 16, React Testing Library, Jest, Tailwind CSS.

---

### Task 1: Record the approved current homepage contract

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md`

- [ ] Replace AC-01-05's former 560 px hero/numbered-card contract with the approved current 580 px hero, `xl:px-[52px] xl:pt-[64px] xl:pb-[48px]`, visible local-presence/service/guide sections and their text-first cards.
- [ ] Align BR-36 and `UI Behaviour` with that contract, explicitly keeping the current public homepage and not reinstating the old numbered-card layout.
- [ ] Check the amended spec for contradictory active homepage dimensions or numbered-card requirements.

### Task 2: Update the homepage component regression test

**Files:**
- Modify: `tests/integration/public-marketing.AC-01-01.home.test.tsx`

- [ ] Reproduce the current failing test: `npx jest --runInBand --runTestsByPath tests/integration/public-marketing.AC-01-01.home.test.tsx --silent`.
- [ ] Replace the stale H1 and section-heading assertions with the visible headings `Votre logement, géré localement. Vos voyageurs, mieux accompagnés.`, `Nous connaissons les logements que nous accompagnons.`, `Une gestion concrète, avant, pendant et après chaque séjour.` and `Une conciergerie prolongée par le digital.`.
- [ ] Keep the invitation-gate absence, empty-state, hero image absence and final CTA assertions. Assert `min-h-[580px]`, `xl:px-[52px]`, `xl:pt-[64px]` and `xl:pb-[48px]` on the existing hero nodes.
- [ ] Remove assertions for deleted `editorial-intro-copy`, `editorial-highlight-grid`, `editorial-service-01` and `editorial-process-card-0` markers; assert the current visible service and guide content instead.
- [ ] Rerun the same Jest command and require all tests in the file to pass.

### Task 3: Update the root-route regression test

**Files:**
- Modify: `tests/unit/public-home.anonymous.test.tsx`

- [ ] Reproduce the failing test: `npx jest --runInBand --runTestsByPath tests/unit/public-home.anonymous.test.tsx --silent`.
- [ ] Replace the old H1 expectation with the approved current H1 while retaining the assertion that `/` never shows city selection for an active lodging cookie.
- [ ] Rerun the same Jest command and require it to pass.

### Task 4: Verify and trace

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] Record that 031 AC-01-01 and AC-01-05 are covered by the updated homepage regression tests.
- [ ] Run both updated suites together, then `npx tsc --noEmit`, then `git diff --check`.
- [ ] Report the actual results and any remaining failing suites without claiming the global suite is green.
