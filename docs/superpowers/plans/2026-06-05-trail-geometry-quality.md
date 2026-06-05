# Trail Geometry Quality (A + B + C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop showing wrong/unreliable hiking traces (straight lines, broken shortcuts, inherited-from-wrong-trail geometry) to public users — by (A) badging unreliable traces, (B) hardening what counts as a "complete" geometry and killing the title-based geometry inheritance, and (C) snapping/densifying geometries on the real path network via OpenRouteService.

**Architecture:** A single pure classifier (`geometry-quality.ts`) is the source of truth for "is this trace reliable?". Phase A surfaces the **stored** `data_quality_status` to the public DTO + a UI badge (no geometry loaded in list queries — cheap, ships first). Phase B makes that stored status actually reflect geometry quality at publish time (using the classifier) and removes the inheritance that fabricates wrong traces; a backfill reclassifies existing rows. Phase C adds an ORS `foot-hiking` re-route service that snaps sparse/broken geometry onto real trails, backs up the raw geometry, and re-runs the Phase B classification so refined trails get promoted back to `complete`.

**Tech Stack:** Next.js 16 (App Router), Prisma (Postgres/Supabase, pgbouncer), TypeScript, Jest, OpenRouteService (`ORS_API_KEY`, `foot-hiking` profile — already integrated in `src/features/trails-acquisition/services/ors.ts`), Vercel Cron (`/api/internal/*` guarded by `INTERNAL_API_SECRET`).

**Standing constraints for the executor:**
- TDD: red → green → refactor, every behavior change.
- The **user commits code themselves** — do NOT run `git commit` on source changes. "Commit" steps below mean "stage the diff and tell the user it's ready to commit". The ONE exception is THIS plan file, which is committed immediately per project convention.
- Path has a TRAILING SPACE: `/Users/daviddevillers/sites/staylocal ` — quote it.
- Verify types with: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"` (empty = clean for src).
- Run tests with: `npx jest <pattern>`.

---

## Background — root causes (from code audit)

| # | Cause | Evidence |
|---|-------|----------|
| 1 | Any geometry with **≥2 points** is accepted as `valid` → 2-point traces render as straight lines | `lib/geojson.ts:42` |
| 2 | Candidates with `geometry_status !== 'valid'` are **publishable** via `confirm_incomplete_geometry`, stored `data_quality_status: 'incomplete'`, and the public query **does not filter** it | `queries/review.ts:43`, `queries/public-trails.ts` |
| 3 | **Title-based geometry inheritance**: a trail with no geometry borrows the trace of a *similarly-named different* trail (score ≥ 0.75) → wrong path | `lib/geometry-inheritance.ts:42` |
| 4 | OSM relations assembled member-by-member with no connectivity ordering → disjoint/misordered segments draw straight "shortcut" connectors | `services/overpass.ts:104` |
| 5 | Official geometry rendered **raw** (no snap, no densify) on the nav map | `components/TrailNavigationMap.tsx:407` |

Phases: **A** mitigates #2 (surface + badge), **B** fixes #1, #2, #3 (stricter classification + kill inheritance), **C** fixes #1, #4, #5 (snap/densify on real network).

---

## File Structure

**New files**
- `src/features/trails-acquisition/lib/geometry-quality.ts` — pure classifier (assess metrics + reliability verdict). Shared by A, B, C.
- `tests/unit/trails.geometry-quality.test.ts` — classifier tests.
- `tests/unit/trails.public-reliability.test.ts` — public DTO mapping reliability (A).
- `tests/unit/trails.geometry-inheritance-disabled.test.ts` — inheritance neutralised (B).
- `tests/unit/trails.refine-geometry.test.ts` — ORS refine service (C).
- `tests/contract/trails.refine-cron.api.test.ts` — internal cron route (C).
- `src/features/trails-acquisition/services/refine-geometry.ts` — ORS `foot-hiking` snap/densify (C).
- `src/features/trails-acquisition/queries/refine-geometry.ts` — batch selection + persistence + reclassify (C).
- `src/app/api/internal/refine-trail-geometry/route.ts` — cron-triggered batch (C).
- `scripts/reclassify-trail-geometry.ts` — one-off backfill of `data_quality_status` (B).
- `prisma/migrations/<ts>_trail_geometry_refine/migration.sql` — add `geometry_raw_geojson`, `geometry_refined_at` (C).

**Modified files**
- `prisma/schema.prisma` — `TrailDetail` gains `geometry_raw_geojson Json?`, `geometry_refined_at DateTime?` (C).
- `src/features/trails-acquisition/types.ts` — add `TrailReliability` + `reliability` on public DTOs (A).
- `src/features/trails-acquisition/queries/public-trails.ts` — select `data_quality_status` in the list query; map `reliability` (A).
- `src/features/trails-acquisition/queries/review.ts` — compute `data_quality_status` from the classifier at publish (B).
- `src/features/trails-acquisition/services/run-orchestrator.ts` — stop calling `inheritGeometryByTitle` (B).
- `src/features/trail-navigation/components/TrailPreviewMap.tsx` — "Tracé indicatif" badge (A).
- `src/features/trail-navigation/components/TrailPoiDetailBody.tsx` (or trail detail body) — reliability notice (A).
- `vercel.json` — cron entry for refine (C).
- `src/app/admin/trails/page.tsx` (or candidate detail) — manual "Affiner les tracés" trigger (C).

---

## PHASE A — Badge unreliable traces on the public side (fastest win)

Relies only on the **already-stored** `data_quality_status` (`complete` | `incomplete` | `needs_review`). No geometry loaded in list queries.

### Task A1: Public reliability type + pure mapping

**Files:**
- Modify: `src/features/trails-acquisition/types.ts`
- Create: `tests/unit/trails.public-reliability.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/trails.public-reliability.test.ts
import { reliabilityFromQualityStatus } from '@/features/trails-acquisition/lib/geometry-quality'

describe('reliabilityFromQualityStatus', () => {
  it('treats only "complete" as reliable', () => {
    expect(reliabilityFromQualityStatus('complete')).toBe('reliable')
  })
  it('treats incomplete / needs_review / unknown as indicative', () => {
    expect(reliabilityFromQualityStatus('incomplete')).toBe('indicative')
    expect(reliabilityFromQualityStatus('needs_review')).toBe('indicative')
    expect(reliabilityFromQualityStatus('whatever')).toBe('indicative')
  })
})
```

- [ ] **Step 2: Run test, expect FAIL** (`reliabilityFromQualityStatus` undefined)

Run: `npx jest tests/unit/trails.public-reliability.test.ts`
Expected: FAIL — module/function not found.

- [ ] **Step 3: Create the helper file with the minimal export** (full classifier comes in B; this is the cheap status→verdict map)

```ts
// src/features/trails-acquisition/lib/geometry-quality.ts
export type TrailReliability = 'reliable' | 'indicative'

/** Public verdict derived from the stored data_quality_status (cheap, no geometry needed). */
export function reliabilityFromQualityStatus(status: string): TrailReliability {
  return status === 'complete' ? 'reliable' : 'indicative'
}
```

- [ ] **Step 4: Add `reliability` to the public DTO types**

In `src/features/trails-acquisition/types.ts`, add `TrailReliability` import/export and extend the public list/detail item types with `reliability: TrailReliability`. (These types live in `queries/public-trails.ts` as `PublishedTrailListItem` — if so, edit there instead; keep the field name `reliability`.)

- [ ] **Step 5: Run test, expect PASS**

Run: `npx jest tests/unit/trails.public-reliability.test.ts`
Expected: PASS.

- [ ] **Step 6: Stage for commit (user commits)** — `geometry-quality.ts`, `types.ts`, test.

### Task A2: Surface `reliability` from public queries

**Files:**
- Modify: `src/features/trails-acquisition/queries/public-trails.ts`

- [ ] **Step 1: Add `data_quality_status: true` to the `listPublishedTrails` select** (the detail query already selects it).

- [ ] **Step 2: Map `reliability` in `mapPublishedTrailListItem`**

```ts
import { reliabilityFromQualityStatus } from '../lib/geometry-quality'
// ...
return {
  // ...existing fields...
  reliability: reliabilityFromQualityStatus(trail.data_quality_status ?? 'incomplete'),
}
```

Pass `data_quality_status` into `mapPublishedTrailListItem` (extend its param type). For `getPublishedTrail`, set `reliability` on the returned detail using `trailDetail.data_quality_status`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"`
Expected: empty.

- [ ] **Step 4: Run the existing public-trails tests (if any) to ensure no regression**

Run: `npx jest trails`
Expected: PASS (update any snapshot/shape assertions to include `reliability`).

- [ ] **Step 5: Stage for commit (user commits).**

### Task A3: "Tracé indicatif" badge in the UI

**Files:**
- Modify: `src/features/trail-navigation/components/TrailPreviewMap.tsx`
- Modify: trail detail body (`src/features/trail-navigation/components/TrailPoiDetailBody.tsx`)

- [ ] **Step 1:** Thread a `reliability` prop (default `'reliable'`) into `TrailPreviewMap`. When `reliability === 'indicative'`, render a small amber pill: `⚠ Tracé indicatif` over the map (top-right), and render the map line **dashed** (preview overlay `stroke-dasharray` is not supported by Mapbox Static — instead lower `stroke-opacity` to ~0.6 and keep the pill). For the interactive nav map, keep the line but show the same notice above it.

- [ ] **Step 2:** In the trail detail body, when `reliability === 'indicative'`, show a one-line notice: « Tracé approximatif — suivez le balisage sur le terrain. » (charcoal/amber, non-blocking).

- [ ] **Step 3:** Wire `reliability` from the page (`getPublishedTrail`) down to these components.

- [ ] **Step 4:** Manual smoke: `npm run dev`, open an `incomplete` trail → badge visible; a `complete` trail → no badge.

- [ ] **Step 5: Stage for commit (user commits).**

**Phase A ships here:** users now see a clear warning on every non-`complete` trace. Cheap, no data migration.

---

## PHASE B — Make `data_quality_status` mean it, and kill wrong-trace inheritance

### Task B1: Geometry quality assessment (pure)

**Files:**
- Modify: `src/features/trails-acquisition/lib/geometry-quality.ts`
- Create: `tests/unit/trails.geometry-quality.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/trails.geometry-quality.test.ts
import { assessGeometryQuality, classifyTrailQuality } from '@/features/trails-acquisition/lib/geometry-quality'

const lineString = (coords: Array<[number, number]>) => ({ type: 'LineString', coordinates: coords })

describe('assessGeometryQuality', () => {
  it('returns null for missing/degenerate geometry', () => {
    expect(assessGeometryQuality(null)).toBeNull()
    expect(assessGeometryQuality(lineString([[6.7, 45.8]]))).toBeNull() // 1 point
  })

  it('flags a 2-point straight line as a huge gap, low density', () => {
    // ~2 km straight between two points
    const q = assessGeometryQuality(lineString([[6.70, 45.80], [6.70, 45.82]]))!
    expect(q.point_count).toBe(2)
    expect(q.max_gap_m).toBeGreaterThan(1000)
    expect(q.density_per_km).toBeLessThan(2)
  })

  it('reports good density for a dense track', () => {
    const coords: Array<[number, number]> = []
    for (let i = 0; i <= 100; i += 1) coords.push([6.70 + i * 0.0001, 45.80 + i * 0.0001])
    const q = assessGeometryQuality(lineString(coords))!
    expect(q.point_count).toBe(101)
    expect(q.max_gap_m).toBeLessThan(50)
    expect(q.density_per_km).toBeGreaterThan(20)
  })
})

describe('classifyTrailQuality', () => {
  const dense = () => {
    const coords: Array<[number, number]> = []
    for (let i = 0; i <= 100; i += 1) coords.push([6.70 + i * 0.0001, 45.80 + i * 0.0001])
    return lineString(coords)
  }

  it('marks a dense, non-inherited geometry as complete', () => {
    expect(classifyTrailQuality({ geometry: dense(), sourceRefs: [] })).toBe('complete')
  })

  it('marks a 2-point straight line as indicative', () => {
    expect(classifyTrailQuality({ geometry: lineString([[6.70, 45.80], [6.70, 45.82]]), sourceRefs: [] }))
      .toBe('indicative')
  })

  it('marks inherited geometry as indicative regardless of density', () => {
    expect(classifyTrailQuality({ geometry: dense(), sourceRefs: [{ type: 'inherited' }] }))
      .toBe('indicative')
  })

  it('marks missing geometry as incomplete', () => {
    expect(classifyTrailQuality({ geometry: null, sourceRefs: [] })).toBe('incomplete')
  })
})
```

- [ ] **Step 2: Run, expect FAIL** (`assessGeometryQuality`/`classifyTrailQuality` undefined).

Run: `npx jest tests/unit/trails.geometry-quality.test.ts`

- [ ] **Step 3: Implement the assessment + classifier**

```ts
// append to src/features/trails-acquisition/lib/geometry-quality.ts

type Coord = [number, number]

export type GeometryQuality = {
  point_count: number
  total_length_km: number
  max_gap_m: number
  density_per_km: number
  segment_count: number
}

export type TrailQualityStatus = 'complete' | 'incomplete' | 'indicative'

// Tunables — a hiking trace below these is treated as approximate.
export const MAX_ACCEPTABLE_GAP_M = 350      // straight jump between two points
export const MIN_DENSITY_PER_KM = 6          // points per km

function haversineM(a: Coord, b: Coord): number {
  const R = 6_371_000
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function segmentsOf(geometry: unknown): Coord[][] {
  if (!geometry || typeof geometry !== 'object') return []
  const g = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(g.coordinates)) return []
  const toPairs = (vals: unknown[]): Coord[] =>
    vals.flatMap(p =>
      Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1])
        ? [[p[0], p[1]] as Coord]
        : [],
    )
  if (g.type === 'LineString') { const s = toPairs(g.coordinates); return s.length >= 2 ? [s] : [] }
  if (g.type === 'MultiLineString') return g.coordinates.map(l => (Array.isArray(l) ? toPairs(l) : [])).filter(s => s.length >= 2)
  return []
}

export function assessGeometryQuality(geometry: unknown): GeometryQuality | null {
  const segments = segmentsOf(geometry)
  if (segments.length === 0) return null
  const pointCount = segments.reduce((n, s) => n + s.length, 0)
  if (pointCount < 2) return null

  let totalM = 0
  let maxGap = 0
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i += 1) {
      const d = haversineM(seg[i - 1], seg[i])
      totalM += d
      if (d > maxGap) maxGap = d
    }
  }
  const totalKm = totalM / 1000
  return {
    point_count: pointCount,
    total_length_km: totalKm,
    max_gap_m: maxGap,
    density_per_km: totalKm > 0 ? pointCount / totalKm : pointCount,
    segment_count: segments.length,
  }
}

function hasInheritedRef(sourceRefs: unknown): boolean {
  return Array.isArray(sourceRefs) && sourceRefs.some(r => (r as { type?: string })?.type === 'inherited')
}

/** Persisted status used by Phase A's badge. */
export function classifyTrailQuality(input: { geometry: unknown; sourceRefs: unknown }): TrailQualityStatus {
  const q = assessGeometryQuality(input.geometry)
  if (!q) return 'incomplete'
  if (hasInheritedRef(input.sourceRefs)) return 'indicative'
  if (q.max_gap_m > MAX_ACCEPTABLE_GAP_M) return 'indicative'
  if (q.density_per_km < MIN_DENSITY_PER_KM) return 'indicative'
  return 'complete'
}
```

> Note: this introduces a 3rd status value `'indicative'` alongside `'complete'`/`'incomplete'`. Phase A's `reliabilityFromQualityStatus` already maps anything ≠ `'complete'` to `'indicative'`, so the badge works unchanged.

- [ ] **Step 4: Run, expect PASS.** `npx jest tests/unit/trails.geometry-quality.test.ts`

- [ ] **Step 5: Stage for commit (user commits).**

### Task B2: Compute `data_quality_status` from the classifier at publish

**Files:**
- Modify: `src/features/trails-acquisition/queries/review.ts`

- [ ] **Step 1: Write a failing test** asserting that publishing a candidate with a sparse 2-point geometry stores `data_quality_status: 'indicative'` (extend the existing review test file or create `tests/unit/trails.publish-classifies-quality.test.ts`, mocking prisma like the existing taxonomy unit tests). The test mocks the candidate row + asserts the `create`/`update` `data` carries `data_quality_status: 'indicative'`.

- [ ] **Step 2: Run, expect FAIL** (currently `qualityStatus = geometry_status === 'valid' ? 'complete' : 'incomplete'`).

- [ ] **Step 3: Replace the status derivation** at `review.ts:58`:

```ts
import { classifyTrailQuality } from '../lib/geometry-quality'
// ...
const qualityStatus = classifyTrailQuality({
  geometry: candidate.geometry_geojson,
  sourceRefs: candidate.source_refs,
})
```

Keep the `confirm_incomplete_geometry` gate as-is (admin can still force-publish; the trace will simply be badged `indicative` on the public side).

- [ ] **Step 4: Run, expect PASS.** `npx jest trails`

- [ ] **Step 5: Type-check + stage for commit.**

### Task B3: Neutralise title-based geometry inheritance

**Files:**
- Modify: `src/features/trails-acquisition/services/run-orchestrator.ts`
- Create: `tests/unit/trails.geometry-inheritance-disabled.test.ts`

- [ ] **Step 1: Write failing test** — run the orchestrator's candidate-processing path (or the smallest unit that called `inheritGeometryByTitle`) and assert a candidate with no geometry **stays** without geometry (no `inherited` source_ref added). If the orchestrator is hard to unit-test, instead assert at the integration seam: export the step and test that inheritance is not invoked.

- [ ] **Step 2: Run, expect FAIL** (inheritance currently fills it).

- [ ] **Step 3: Remove the `inheritGeometryByTitle(...)` call** from `run-orchestrator.ts`. Leave the function + its unit tests in `lib/geometry-inheritance.ts` (dead but tested) OR delete both — prefer deleting the call only and adding a short comment: `// Inheritance désactivé : produisait des tracés faux (rando homonyme). Voir plan 2026-06-05.`

- [ ] **Step 4: Run, expect PASS.** Run the full trails suite to catch fallout: `npx jest trails`

- [ ] **Step 5: Stage for commit (user commits).**

### Task B4: Backfill — reclassify existing published trails

**Files:**
- Create: `scripts/reclassify-trail-geometry.ts`

- [ ] **Step 1: Write the script** (read-only by default, `--apply` to write), mirroring `scripts/cleanup-legacy-public-pois.ts` conventions:

```ts
import { PrismaClient } from '@prisma/client'
import { classifyTrailQuality } from '../src/features/trails-acquisition/lib/geometry-quality'

const prisma = new PrismaClient()

async function main() {
  const apply = process.argv.includes('--apply')
  const trails = await prisma.trailDetail.findMany({
    where: { deleted_at: null },
    select: { id: true, geometry_geojson: true, source_refs: true, data_quality_status: true },
  })

  let changed = 0
  const plan: Array<{ id: string; from: string; to: string }> = []
  for (const t of trails) {
    const to = classifyTrailQuality({ geometry: t.geometry_geojson, sourceRefs: t.source_refs })
    if (to !== t.data_quality_status) {
      plan.push({ id: t.id, from: t.data_quality_status, to })
      changed += 1
      if (apply) {
        await prisma.trailDetail.update({ where: { id: t.id }, data: { data_quality_status: to } })
      }
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', total: trails.length, changed, sample: plan.slice(0, 50) }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Dry-run** `npx tsx scripts/reclassify-trail-geometry.ts` → review counts with the user.
- [ ] **Step 3: Apply** (only after user confirms) `npx tsx scripts/reclassify-trail-geometry.ts --apply`.
- [ ] **Step 4: Stage for commit (user commits the script).**

**Phase B ships here:** the badge now reflects real geometry quality, and no new wrong traces are fabricated.

---

## PHASE C — Snap + densify geometry on the real trail network (ORS)

### Task C1: DB fields — back up raw geometry + refine timestamp

**Files:**
- Modify: `prisma/schema.prisma` (`TrailDetail`)
- Create: migration

- [ ] **Step 1:** Add to `TrailDetail`:

```prisma
  geometry_raw_geojson Json?
  geometry_refined_at  DateTime?
```

- [ ] **Step 2:** Create migration: `npx prisma migrate dev --name trail_geometry_refine` (dev DB) — review generated SQL adds two nullable columns.
- [ ] **Step 3:** `npx prisma generate`.
- [ ] **Step 4:** Type-check. Stage for commit (user commits migration + schema).

### Task C2: ORS refine service (pure-ish, mocked fetch in tests)

**Files:**
- Create: `src/features/trails-acquisition/services/refine-geometry.ts`
- Create: `tests/unit/trails.refine-geometry.test.ts`

- [ ] **Step 1: Write failing tests** (mock `fetch`): given a sparse LineString, `refineTrailGeometry` calls ORS `foot-hiking/geojson`, returns a denser LineString + provenance ref `{ type: 'ors_match', used_for: ['geometry'] }`; returns `null` when `ORS_API_KEY` absent or ORS fails.

- [ ] **Step 2: Run, expect FAIL.**

- [ ] **Step 3: Implement** using the same auth/endpoint pattern as `services/ors.ts`. Sample input coords to ≤ `ORS_MAX_WAYPOINTS` (50), POST to `foot-hiking/geojson`, parse `features[0].geometry` LineString. Guard: if ORS total distance deviates from the original by more than ~40%, return `null` (re-route went wrong — don't trust it).

```ts
// src/features/trails-acquisition/services/refine-geometry.ts
const ENDPOINT = 'https://api.openrouteservice.org/v2/directions/foot-hiking/geojson'
const MAX_WAYPOINTS = 50

export type RefinedGeometry = {
  geometry: { type: 'LineString'; coordinates: Array<[number, number]> }
  source_ref: { type: 'ors_match'; attribution: string; used_for: string[] }
}

export async function refineTrailGeometry(geometry: unknown): Promise<RefinedGeometry | null> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) return null
  const coords = flatten(geometry)
  if (coords.length < 2) return null
  const waypoints = sample(coords, MAX_WAYPOINTS)

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' },
    body: JSON.stringify({ coordinates: waypoints }),
  })
  if (!res.ok) return null
  const payload = await res.json() as { features?: Array<{ geometry?: { type?: string; coordinates?: unknown } }> }
  const geom = payload.features?.[0]?.geometry
  if (!geom || geom.type !== 'LineString' || !Array.isArray(geom.coordinates)) return null
  const out = flatten(geom)
  if (out.length < 2) return null
  return {
    geometry: { type: 'LineString', coordinates: out },
    source_ref: { type: 'ors_match', attribution: 'OpenRouteService foot-hiking (map-matching)', used_for: ['geometry'] },
  }
}

// flatten() + sample() helpers: copy the toPairs/sampleCoordinates pattern from services/ors.ts.
```

- [ ] **Step 4: Run, expect PASS.** `npx jest tests/unit/trails.refine-geometry.test.ts`
- [ ] **Step 5: Stage for commit (user commits).**

### Task C3: Batch query — select, refine, persist, reclassify

**Files:**
- Create: `src/features/trails-acquisition/queries/refine-geometry.ts`

- [ ] **Step 1:** Write `refinePendingTrailGeometries(limit = 10)`:
  - Select `TrailDetail` where `deleted_at: null`, `geometry_refined_at: null`, `geometry_geojson` not null, ordered by `updated_at asc`, take `limit`.
  - For each: `refineTrailGeometry(geometry)`. On success, in a transaction: set `geometry_raw_geojson = old geometry` (only if not already backed up), `geometry_geojson = refined`, append `source_ref`, `geometry_refined_at = now`, and `data_quality_status = classifyTrailQuality({ geometry: refined, sourceRefs: newRefs })`. On `null`: set `geometry_refined_at = now` anyway (so we don't loop forever) but leave geometry + status untouched.
  - Return `{ processed, refined, skipped }`.
- [ ] **Step 2:** Unit test with mocked prisma + mocked `refineTrailGeometry` (assert raw backed up once, status recomputed). `npx jest`
- [ ] **Step 3:** Stage for commit (user commits).

### Task C4: Internal cron route

**Files:**
- Create: `src/app/api/internal/refine-trail-geometry/route.ts`
- Create: `tests/contract/trails.refine-cron.api.test.ts`
- Modify: `vercel.json`

- [ ] **Step 1:** Write contract test (mock `refinePendingTrailGeometries`): GET without valid `INTERNAL_API_SECRET` → 401; with it → 200 `{ data: { processed, refined, skipped } }`. Follow the auth pattern of the other `/api/internal/*` routes (read the secret check used by `geocode-pois`).
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement the route (secret guard → `refinePendingTrailGeometries(10)` → JSON).
- [ ] **Step 4:** Add cron to `vercel.json` (daily, off-peak, distinct minute):

```json
{ "path": "/api/internal/refine-trail-geometry", "schedule": "15 3 * * *" }
```

- [ ] **Step 5:** Run, expect PASS. Type-check. Stage for commit.

### Task C5: Admin manual trigger

**Files:**
- Modify: `src/app/admin/trails/page.tsx` (or candidate detail) + a small client button calling the internal route via an admin-guarded proxy, OR reuse the cron route behind an admin-session check.

- [ ] **Step 1:** Add an admin-guarded POST endpoint (or extend the cron route to accept `getSessionAdmin()` as an alternative to the secret) and a "Affiner les tracés (ORS)" button on the trails admin page that triggers a batch and shows `{ refined }`.
- [ ] **Step 2:** Manual smoke in `npm run dev`.
- [ ] **Step 3:** Stage for commit (user commits).

**Phase C ships here:** sparse/broken traces get snapped to the real path network over successive cron runs; refined trails are auto-promoted back to `complete` and lose the badge. Raw geometry is preserved in `geometry_raw_geojson` for rollback.

---

## Self-Review

**Spec coverage:**
- A (badge unreliable) → A1–A3. ✔
- B (harden valid threshold) → B1 (`assessGeometryQuality` + density/gap), B2 (publish uses it). ✔
- B (kill inheritance — wrong traces) → B3. ✔
- B (reclassify existing) → B4. ✔
- C (map-match/snap + densify) → C2 (ORS), C3 (persist+reclassify), C4 (cron), C5 (admin). ✔
- C (preserve original) → C1 (`geometry_raw_geojson`). ✔
- #4 straight connectors: partly mitigated by C (re-route ignores disjoint ordering) and by B's `max_gap_m` badge; full MultiLineString-ordering fix is out of scope (note for later).

**Placeholder scan:** none — all helper code, thresholds, and commands are concrete.

**Type consistency:** `reliabilityFromQualityStatus` (A) and `classifyTrailQuality` (B) both live in `geometry-quality.ts`; the 3rd status `'indicative'` is consumed by A's `≠ 'complete'` mapping. `refineTrailGeometry` (C2) → `RefinedGeometry.source_ref.type === 'ors_match'`; classifier treats only `'inherited'` refs as indicative, so an `'ors_match'` ref with good density classifies `complete` (intended). `geometry_raw_geojson` / `geometry_refined_at` names match between C1, C3.

**Open decisions to confirm with user during execution:**
- B1 thresholds (`MAX_ACCEPTABLE_GAP_M=350`, `MIN_DENSITY_PER_KM=6`) — tune against real data after the B4 dry-run.
- C2 deviation guard (40%) — tune if ORS rejects too many.
- Whether to *hide* (vs badge) the worst traces on public — current plan badges only.
