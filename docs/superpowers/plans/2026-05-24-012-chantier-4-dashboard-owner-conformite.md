# Dashboard Owner Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** align the owner dashboard implementation with approved spec `010-dashboard-owner` after amending the spec's internal API/UI contradictions.

**Architecture:** keep the current split between dashboard pages, API routes, query helpers, and Shadcn/ui client components. Fix compliance at the contract boundary first, then fix UI behavior, then update traceability/tests to reflect the real state.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, Supabase Auth, Shadcn/ui, Recharts, Jest

---

## Scope

This chantier covers spec `010-dashboard-owner` only:
- `/dashboard`
- `/dashboard/lodgings`
- `/dashboard/stats`
- `/api/dashboard/overview`
- `/api/dashboard/lodgings`
- `/api/dashboard/lodgings/{id}`
- dashboard owner query/helpers/components directly tied to those routes

Out of scope for this chantier:
- auth plumbing from spec `009` except where required for contract correctness
- lodging QR code feature from spec `011`
- merchant/admin dashboards
- Prisma connection stability work

---

## Current Gaps To Close

1. Overview metrics do not distinguish `zone primaire` and `alentours` although spec `010` requires it.
2. Lodging list UI exposes a `Désactiver` action mentioned in UI behaviour but missing from the PATCH API contract.
3. Lodging list does not clearly expose QR code status as required by `AC-02-01`.
4. `PATCH /api/dashboard/lodgings/{id}` does not validate `city_id` existence before update.
5. Traceability marks parts of spec `010` as `done` even where behavior is only partially implemented.

---

### Task 1: Re-baseline Spec 010 Expectations

**Files:**
- Modify: `docs/traceability-matrix.md`
- Read: `specs/features/010-dashboard-owner/spec.md`
- Read: `src/app/(dashboard)/dashboard/page.tsx`
- Read: `src/app/(dashboard)/dashboard/lodgings/page.tsx`
- Read: `src/features/dashboard-owner/queries/overview.ts`
- Read: `src/features/dashboard-owner/components/LodgingsTable.tsx`

- [ ] **Step 1: Audit every AC / BR in spec 010 against current code**

Checklist:
- `AC-01-01` overview metrics present and zone distinction present
- `AC-01-02` empty state present
- `AC-02-01` lodging list includes `name`, `city`, `QR status`, `scan count`
- `AC-02-02` lodging creation works
- `AC-02-03` lodging edit works
- `AC-03-01` stats page exposes 30-day scans, top 5 categories, top 10 POIs
- `AC-03-02` charts use Shadcn chart/Recharts
- `BR-01` and `BR-02` owner-only data isolation

- [ ] **Step 2: Update traceability status before code changes**

Rules:
- change `✅ done` to `🔵 in progress` for any item not fully compliant
- keep `✅ done` only where code and tests already match the spec exactly
- do not mark future work complete in advance

- [ ] **Step 3: Commit traceability baseline**

Suggested commit:
```bash
git add docs/traceability-matrix.md
git commit -m "docs: rebaseline dashboard owner traceability"
```

---

### Task 2: Fix Dashboard Overview Contract

**Files:**
- Modify: `src/features/dashboard-owner/queries/overview.ts`
- Modify: `src/app/api/dashboard/overview/route.ts`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Test: `tests/contract/dashboard.AC-overview.test.ts`

- [ ] **Step 1: Write failing tests for zone-aware overview output**

Add tests covering:
- response contains separate primary vs nearby top categories/POIs
- owner with only primary events does not get fake nearby values
- owner with no lodgings still gets stable empty arrays

- [ ] **Step 2: Run the overview contract tests to verify failure**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-overview.test.ts
```

Expected:
- fail because response shape does not yet include zone distinction

- [ ] **Step 3: Implement minimal query/model response changes**

Required output shape should explicitly separate zones:
- `top_categories: { primary: MetricItem[], nearby: MetricItem[] }`
- `top_pois: { primary: MetricItem[], nearby: MetricItem[] }`

Implementation notes:
- derive zone from POI / analytics-linked entities already geocoded per approved specs
- keep owner isolation strict
- avoid mixing nearby events into primary arrays

- [ ] **Step 4: Update dashboard page rendering**

Rules:
- show primary and nearby sections distinctly
- keep empty state behavior for zero lodgings
- if a nearby section has no items, do not render noise

- [ ] **Step 5: Re-run overview tests**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-overview.test.ts
```

Expected:
- PASS

- [ ] **Step 6: Commit overview compliance**

```bash
git add src/features/dashboard-owner/queries/overview.ts src/app/api/dashboard/overview/route.ts src/app/'(dashboard)'/dashboard/page.tsx tests/contract/dashboard.AC-overview.test.ts
git commit -m "feat: align dashboard overview with spec 010"
```

---

### Task 3: Fix Lodgings List Contract And QR Status

**Files:**
- Modify: `src/features/dashboard-owner/queries/lodgings.ts`
- Modify: `src/app/api/dashboard/lodgings/route.ts`
- Modify: `src/features/dashboard-owner/components/LodgingsTable.tsx`
- Modify: `src/app/(dashboard)/dashboard/lodgings/page.tsx`
- Test: `tests/contract/dashboard.AC-lodgings.test.ts`

- [ ] **Step 1: Write failing tests for lodging item contract**

Add tests for:
- each lodging item includes a QR status field matching spec intent
- `GET /api/dashboard/lodgings` returns spec fields only
- QR generation/regeneration/download remains owned by spec `011`

- [ ] **Step 2: Run lodging contract tests to verify failure**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-lodgings.test.ts
```

Expected:
- fail because current response does not expose QR code status explicitly

- [ ] **Step 3: Implement QR status in the query layer**

Rules:
- derive status from active QR code presence for each lodging
- expose a stable field such as `qr_code_status: 'generated' | 'missing'`
- keep scan count behavior

- [ ] **Step 4: Keep `Désactiver` visible but make it contract-backed**

Rules:
- `Désactiver` calls `PATCH /api/dashboard/lodgings/{id}` with `{ is_active: false }`
- the API performs a soft delete with `is_active = false` and `deleted_at = now()`
- no reactivation flow is introduced in this chantier

- [ ] **Step 5: Update the table labels/UI**

Rules:
- show clear QR status column/value
- keep mobile/desktop readability
- stay within Shadcn/ui patterns

- [ ] **Step 6: Re-run lodging contract tests**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-lodgings.test.ts
```

Expected:
- PASS

- [ ] **Step 7: Commit lodging list compliance**

```bash
git add src/features/dashboard-owner/queries/lodgings.ts src/app/api/dashboard/lodgings/route.ts src/features/dashboard-owner/components/LodgingsTable.tsx src/app/'(dashboard)'/dashboard/lodgings/page.tsx tests/contract/dashboard.AC-lodgings.test.ts
git commit -m "feat: align owner lodgings list with spec 010"
```

---

### Task 4: Harden Lodging Mutation Contract

**Files:**
- Modify: `src/app/api/dashboard/lodgings/[id]/route.ts`
- Modify: `src/features/dashboard-owner/schemas.ts`
- Modify: `src/features/dashboard-owner/components/LodgingDialog.tsx`
- Test: `tests/contract/dashboard.AC-lodgings.test.ts`

- [ ] **Step 1: Write failing tests for PATCH city validation**

Add tests for:
- updating `city_id` with an unknown UUID returns `404 CITY_NOT_FOUND`
- empty body stays `400`
- owner cannot mutate another owner lodging
- `is_active: false` soft-deactivates the lodging
- `is_active: true` is rejected

- [ ] **Step 2: Run lodging contract tests to verify failure**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-lodgings.test.ts
```

Expected:
- fail because PATCH currently updates `city_id` without explicit city existence check

- [ ] **Step 3: Implement minimal API fix**

Rules:
- validate candidate city before update
- return spec-compatible error payload
- allow only `is_active: false` for deactivation

- [ ] **Step 4: Verify LodgingDialog still matches API expectations**

Rules:
- create sends `name + city_id`
- edit sends only supported fields
- keep error reporting simple and deterministic

- [ ] **Step 5: Re-run lodging contract tests**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-lodgings.test.ts
```

Expected:
- PASS

- [ ] **Step 6: Commit mutation hardening**

```bash
git add src/app/api/dashboard/lodgings/'[id]'/route.ts src/features/dashboard-owner/schemas.ts src/features/dashboard-owner/components/LodgingDialog.tsx tests/contract/dashboard.AC-lodgings.test.ts
git commit -m "fix: validate owner lodging updates against spec 010"
```

---

### Task 5: Verify Stats Page Compliance

**Files:**
- Read/Modify: `src/app/api/dashboard/stats/route.ts`
- Read/Modify: `src/features/dashboard-owner/queries/stats.ts`
- Read/Modify: `src/features/dashboard-owner/components/StatsCharts.tsx`
- Test: `tests/contract/dashboard.AC-stats.test.ts`

- [ ] **Step 1: Audit stats route against `AC-03-01` and `AC-03-02`**

Checklist:
- 30-day scan series exists
- top 5 categories exists
- top 10 POIs exists
- chart output is consumed through Shadcn chart/Recharts

- [ ] **Step 2: Add or update failing tests only if gaps are found**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-stats.test.ts
```

Expected:
- either PASS with no code change required, or FAIL exposing concrete missing fields

- [ ] **Step 3: Implement minimal compliance fixes if required**

Rules:
- no redesign beyond approved spec
- keep data owner-scoped

- [ ] **Step 4: Commit only if code changed**

```bash
git add src/app/api/dashboard/stats/route.ts src/features/dashboard-owner/queries/stats.ts src/features/dashboard-owner/components/StatsCharts.tsx tests/contract/dashboard.AC-stats.test.ts
git commit -m "fix: complete dashboard stats compliance"
```

---

### Task 6: Final Verification And Traceability Closure

**Files:**
- Modify: `docs/traceability-matrix.md`
- Verify: `tests/contract/dashboard.AC-overview.test.ts`
- Verify: `tests/contract/dashboard.AC-lodgings.test.ts`
- Verify: `tests/contract/dashboard.AC-stats.test.ts`
- Verify: `tests/unit/dashboard.AC-01-02.empty-state.test.tsx`

- [ ] **Step 1: Run the focused dashboard owner test suite**

Run:
```bash
npm test -- --runTestsByPath tests/contract/dashboard.AC-overview.test.ts tests/contract/dashboard.AC-lodgings.test.ts tests/contract/dashboard.AC-stats.test.ts tests/unit/dashboard.AC-01-02.empty-state.test.tsx
```

Expected:
- all PASS

- [ ] **Step 2: Re-open traceability and mark only verified items `done`**

Update:
- `010` ACs and BRs touched by this chantier
- any item still partially implemented remains `🔵 in progress`

- [ ] **Step 3: Capture residual risks**

Document separately if still open:
- auth/session helper fragility
- Prisma connection instability
- spec `003` still `draft`

- [ ] **Step 4: Commit closure**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: close dashboard owner compliance chantier"
```

---

## Exit Criteria

The chantier is complete only when all of the following are true:
- lodging deactivation is backed by the amended spec and API contract
- overview distinguishes primary vs nearby in code, API, and UI
- lodging list exposes QR status explicitly
- lodging create/edit routes match spec and error contracts
- focused dashboard owner tests pass
- `docs/traceability-matrix.md` reflects the actual verified state

---

## Dependencies For The Next Chantiers

After this chantier, the next implementation wave should be:
1. `011-qr-code-owner` consolidation
2. auth/session helper hardening from `009-auth-owner`
3. Prisma/Supabase stability work
4. spec-status cleanup for `003-poi-list`
