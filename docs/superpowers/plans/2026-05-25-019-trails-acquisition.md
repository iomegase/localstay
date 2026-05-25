# 019 Trails Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved `019-trails-acquisition` pipeline so Super-admin can acquire, enrich, review, publish, merge and reject randonnée candidates, and tourists can see published trails in the Guide.

**Architecture:** Randonnées remain public `PointOfInterest` records for Guide compatibility, with randonnée-specific data stored in canonical `TrailDetail` and legacy `HikingDetail` read as fallback. Acquisition is isolated in `src/features/trails-acquisition`, with server-side source adapters for official websites, Overpass, IGN/Géoplateforme stubs, Gemini guardrails and manual creation. Trail candidates and published trails store `primary_source_type` plus `source_refs` so content, geometry, elevation and description can come from different sources.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma + Supabase PostgreSQL, Zod, Shadcn/ui, Jest, Playwright, existing admin auth helpers.

**Implementation status — 2026-05-25:** Tasks 1 to 8 are implemented in the working tree and linked in `docs/traceability-matrix.md`. Targeted 019 Jest suite passes (`13` suites, `34` tests), `npx prisma validate` passes, and a filtered typecheck no longer reports errors on 019 files. `npm run build` remains blocked by an unrelated pre-existing type error in `docs/guides/hikeCard.tsx` importing missing `../types`.

---

## Pre-Flight Requirements

- Read in order before coding: `specs/features/019-trails-acquisition/spec.md`, `specs/glossary.md`, `docs/DAT/architecture.md`, `docs/DAT/adr/ADR-006-trails-data-source.md`, `docs/DAT/adr/ADR-007-business-scalability-bounded-contexts.md`, `docs/guides/impl-api-randonnees.md`.
- Do not implement anything from `out_of_scope` in `019`: no AllTrails scraping, no realtime navigation, no conditions live, no reviews/favorites/offline.
- All external source tests must mock network calls. Do not make live Overpass, IGN, Gemini or website calls in Jest.
- Use existing admin session helpers: `getSessionAdmin()` for API routes and `getPageAdmin()` for admin pages.
- Use existing error response shape: `{ error: { code, message, details } }`.

## File Map

### Prisma

- Modify: `prisma/schema.prisma`
  - Add `TrailImportRun`, `TrailCandidate`, `TrailDetail`, `TrailAuditLog`.
  - Add the relation fields on `City`, `PointOfInterest`, and `User` exactly as listed in Task 1.
  - Keep `HikingDetail` during this implementation for backward compatibility; do not delete it in this plan.

### Feature Module

- Create: `src/features/trails-acquisition/types.ts`
- Create: `src/features/trails-acquisition/schemas.ts`
- Create: `src/features/trails-acquisition/lib/errors.ts`
- Create: `src/features/trails-acquisition/lib/api.ts`
- Create: `src/features/trails-acquisition/lib/source-policy.ts`
- Create: `src/features/trails-acquisition/lib/geojson.ts`
- Create: `src/features/trails-acquisition/lib/gpx.ts`
- Create: `src/features/trails-acquisition/lib/difficulty.ts`
- Create: `src/features/trails-acquisition/lib/slug.ts`
- Create: `src/features/trails-acquisition/services/official-website.ts`
- Create: `src/features/trails-acquisition/services/overpass.ts`
- Create: `src/features/trails-acquisition/services/ign.ts`
- Create: `src/features/trails-acquisition/services/gemini-trails.ts`
- Create: `src/features/trails-acquisition/services/run-orchestrator.ts`
- Create: `src/features/trails-acquisition/queries/options.ts`
- Create: `src/features/trails-acquisition/queries/runs.ts`
- Create: `src/features/trails-acquisition/queries/manual.ts`
- Create: `src/features/trails-acquisition/queries/review.ts`
- Create: `src/features/trails-acquisition/queries/public-trails.ts`
- Create: `src/features/trails-acquisition/components/AdminTrailsLauncher.tsx`
- Create: `src/features/trails-acquisition/components/AdminTrailCandidateActions.tsx`
- Create: `src/features/trails-acquisition/components/TrailDetailBlock.tsx`

### App Routes And Pages

- Create: `src/app/admin/trails/page.tsx`
- Create: `src/app/admin/trails/runs/[id]/page.tsx`
- Create: `src/app/admin/trails/new/page.tsx`
- Create: `src/app/api/admin/trails/import-runs/route.ts`
- Create: `src/app/api/admin/trails/import-runs/[id]/route.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/publish/route.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/merge/route.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/reject/route.ts`
- Create: `src/app/api/admin/trails/manual/route.ts`
- Create: `src/app/api/cities/[slug]/trails/route.ts`
- Create: `src/app/api/cities/[slug]/trails/[trail-slug]/route.ts`
- Modify: `src/app/admin/layout.tsx`
  - Add Super-admin navigation link to `/admin/trails`.
- Modify: `src/features/categories/queries/poi-detail.ts`
  - Include `trail_detail` in POI detail data.
- Modify: `src/features/categories/components/PoiDetailBody.tsx`
  - Render `TrailDetailBlock` before legacy `HikingBlock`.

### Tests

- Create: `tests/unit/trails-acquisition.source-policy.test.ts`
- Create: `tests/unit/trails-acquisition.geojson.test.ts`
- Create: `tests/unit/trails-acquisition.gpx.test.ts`
- Create: `tests/unit/trails-acquisition.gemini-guardrails.test.ts`
- Create: `tests/unit/trails-acquisition.official-website.test.ts`
- Create: `tests/unit/trails-acquisition.overpass.test.ts`
- Create: `tests/unit/trails-acquisition.ign.test.ts`
- Create: `tests/contract/trails-acquisition.admin-runs-api.test.ts`
- Create: `tests/contract/trails-acquisition.manual-api.test.ts`
- Create: `tests/contract/trails-acquisition.review-actions-api.test.ts`
- Create: `tests/contract/trails-acquisition.public-api.test.ts`
- Create: `tests/integration/trails-acquisition.review-flow.test.ts`
- Create: `tests/integration/trails-acquisition.public-guide.test.tsx`
- Create: `tests/integration/trails-acquisition.admin-pages.test.tsx`
- Create: `tests/e2e/trails-acquisition.admin-review.test.ts`

### Docs

- Modify: `docs/traceability-matrix.md`
  - Add section `019 — Trails Acquisition`.
- Modify: `.env.example`
  - Add `OVERPASS_API_URL=https://overpass-api.de/api/interpreter`.
  - Add `IGN_API_KEY=`.

---

## Task 1: Prisma Schema And Generated Client

**Files:**
- Modify: `prisma/schema.prisma`
- Test command: `npx prisma validate`
- Test command: `npx prisma generate`

- [ ] **Step 1: Add failing schema expectation by reading Prisma client usage**

Create no test yet. This task starts with schema because later tests cannot compile without Prisma models.

- [ ] **Step 2: Modify `prisma/schema.prisma`**

Add these relations:

```prisma
model City {
  trail_import_runs TrailImportRun[]
  trail_candidates  TrailCandidate[]
}

model PointOfInterest {
  trail_detail TrailDetail?
  trail_candidates_published TrailCandidate[] @relation("TrailCandidatePublishedPoi")
}

model User {
  trail_import_runs_started TrailImportRun[] @relation("TrailImportRunStartedBy")
  trail_candidates_reviewed TrailCandidate[] @relation("TrailCandidateReviewedBy")
  trail_audit_logs          TrailAuditLog[]
}
```

Add these models near the existing POI/acquisition models:

```prisma
model TrailImportRun {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  city_id     String
  city        City     @relation(fields: [city_id], references: [id])

  status      String   @default("running")
  source_types String[]
  source_url  String?
  zone_radius_km Float?
  started_by  String?
  starter     User?    @relation("TrailImportRunStartedBy", fields: [started_by], references: [id])
  error        String?
  source_errors Json?

  candidates  TrailCandidate[]

  @@index([city_id, status])
  @@index([deleted_at])
}

model TrailCandidate {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  run_id      String?
  run         TrailImportRun? @relation(fields: [run_id], references: [id])

  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  primary_source_type String
  source_refs Json
  raw_payload Json?

  title       String
  slug        String?
  description String?
  difficulty  String?
  distance_km Float?
  elevation_gain_m Int?
  estimated_duration_min Int?
  loop_type String?
  activity_type String @default("hiking")
  data_quality_status String @default("draft")

  start_label String?
  start_latitude Float?
  start_longitude Float?
  geometry_geojson Json?
  metric_source String?
  geometry_status String @default("missing")
  elevation_status String @default("missing")
  parking_info String?
  kids_friendly Boolean?
  pets_friendly Boolean?
  best_season String[] @default([])

  duplicate_poi_ids String[] @default([])
  review_status String @default("needs_review")
  published_poi_id String?
  published_poi PointOfInterest? @relation("TrailCandidatePublishedPoi", fields: [published_poi_id], references: [id])
  trail_detail_id String?

  reviewed_by String?
  reviewer    User?    @relation("TrailCandidateReviewedBy", fields: [reviewed_by], references: [id])
  reviewed_at DateTime?
  admin_note  String?

  @@index([run_id, review_status])
  @@index([city_id, primary_source_type])
  @@index([published_poi_id])
  @@index([deleted_at])
}

model TrailDetail {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  poi_id      String   @unique
  poi         PointOfInterest @relation(fields: [poi_id], references: [id])

  difficulty  String
  distance_km Float?
  elevation_gain_m Int?
  estimated_duration_min Int?
  loop_type String?
  activity_type String @default("hiking")
  data_quality_status String @default("complete")

  start_label String?
  start_latitude Float
  start_longitude Float
  geometry_geojson Json?

  primary_source_type String
  source_refs Json
  metric_source String?
  parking_info String?
  kids_friendly Boolean?
  pets_friendly Boolean?
  best_season String[] @default([])
  gpx_url String?

  is_active Boolean @default(true)

  @@index([deleted_at, is_active])
}

model TrailAuditLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  admin_id    String
  admin       User     @relation(fields: [admin_id], references: [id])
  action      String
  target_type String
  target_id   String
  before      Json?
  after       Json?

  @@index([admin_id, action])
  @@index([target_type, target_id])
}
```

- [ ] **Step 3: Validate schema**

Run:

```bash
npx prisma validate
```

Expected:

```text
The schema at prisma/schema.prisma is valid
```

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
npx prisma generate
```

Expected: Prisma Client generation succeeds.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(trails): add acquisition schema"
```

---

## Task 2: Domain Types, Schemas, Errors And Source Guardrails

**Files:**
- Create: `src/features/trails-acquisition/types.ts`
- Create: `src/features/trails-acquisition/schemas.ts`
- Create: `src/features/trails-acquisition/lib/errors.ts`
- Create: `src/features/trails-acquisition/lib/api.ts`
- Create: `src/features/trails-acquisition/lib/source-policy.ts`
- Test: `tests/unit/trails-acquisition.source-policy.test.ts`
- Test: `tests/unit/trails-acquisition.gemini-guardrails.test.ts`

- [ ] **Step 1: Write source policy tests**

Test behaviours:

```ts
import { assertAllowedTrailSource, rejectGeminiGeoMetrics } from '@/features/trails-acquisition/lib/source-policy'

describe('trails acquisition source policy', () => {
  it('rejects AllTrails URLs', () => {
    expect(() => assertAllowedTrailSource('https://www.alltrails.com/trail/france/foo')).toThrow('SOURCE_NOT_ALLOWED')
  })

  it('accepts official local URLs', () => {
    expect(assertAllowedTrailSource('https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/')).toBe(true)
  })

  it('removes Gemini geographic metrics', () => {
    const sanitized = rejectGeminiGeoMetrics({
      title: 'Mont Joly',
      description: 'Belle randonnée panoramique.',
      distance_km: 12,
      elevation_gain_m: 800,
      start_latitude: 45.89,
      start_longitude: 6.71,
    })
    expect(sanitized).toEqual({
      title: 'Mont Joly',
      description: 'Belle randonnée panoramique.',
    })
  })
})
```

Run:

```bash
npm test -- tests/unit/trails-acquisition.source-policy.test.ts tests/unit/trails-acquisition.gemini-guardrails.test.ts
```

Expected: fail because files do not exist.

- [ ] **Step 2: Create domain types**

Define literal unions in `types.ts`:

```ts
export const TRAIL_SOURCE_TYPES = ['official_website', 'overpass', 'ign', 'gemini', 'gpx', 'manual'] as const
export type TrailSourceType = (typeof TRAIL_SOURCE_TYPES)[number]

export const TRAIL_REVIEW_STATUSES = ['needs_review', 'published', 'merged', 'rejected'] as const
export type TrailReviewStatus = (typeof TRAIL_REVIEW_STATUSES)[number]

export const TRAIL_GEOMETRY_STATUSES = ['missing', 'valid', 'invalid', 'needs_review'] as const
export type TrailGeometryStatus = (typeof TRAIL_GEOMETRY_STATUSES)[number]

export const TRAIL_ELEVATION_STATUSES = ['missing', 'valid', 'failed', 'needs_review'] as const
export type TrailElevationStatus = (typeof TRAIL_ELEVATION_STATUSES)[number]

export const TRAIL_DATA_QUALITY_STATUSES = ['draft', 'complete', 'incomplete'] as const
export type TrailDataQualityStatus = (typeof TRAIL_DATA_QUALITY_STATUSES)[number]

export const TRAIL_SOURCE_USES = ['content', 'geometry', 'elevation', 'description', 'manual_review'] as const
export type TrailSourceUse = (typeof TRAIL_SOURCE_USES)[number]
```

- [ ] **Step 3: Create Zod schemas**

In `schemas.ts`, define:

```ts
export const TrailImportRunCreateSchema = z.object({
  city_id: z.string().uuid(),
  source_types: z.array(z.enum(TRAIL_SOURCE_TYPES)).min(1),
  source_url: z.string().url().nullable().optional(),
  zone_radius_km: z.number().positive().max(30).nullable().optional(),
})

export const TrailSourceRefSchema = z.object({
  type: z.enum(TRAIL_SOURCE_TYPES),
  name: z.string().trim().max(160).nullable().optional(),
  url: z.string().url().nullable().optional(),
  attribution: z.string().trim().min(1).max(300),
  used_for: z.array(z.enum(TRAIL_SOURCE_USES)).min(1),
})

export const TrailManualCandidateCreateSchema = z.object({
  city_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert', 'unknown']),
  start_label: z.string().trim().max(200).nullable().optional(),
  start_latitude: z.number().min(-90).max(90),
  start_longitude: z.number().min(-180).max(180),
  distance_km: z.number().positive().nullable().optional(),
  elevation_gain_m: z.number().int().min(0).nullable().optional(),
  estimated_duration_min: z.number().int().positive().nullable().optional(),
  source_refs: z.array(TrailSourceRefSchema).min(1).optional(),
  geometry_geojson: z.unknown().nullable().optional(),
  gpx_xml: z.string().trim().max(500_000).nullable().optional(),
})
```

- [ ] **Step 4: Create API helpers and errors**

Mirror `src/features/poi-acquisition/lib/api.ts` and `errors.ts` with class name `TrailsAcquisitionError`.

Required error codes:

```ts
'VALIDATION_ERROR' | 'FORBIDDEN' | 'NOT_FOUND' | 'SOURCE_NOT_ALLOWED' | 'CANDIDATE_NOT_REVIEWABLE' | 'TRAIL_GEOMETRY_REQUIRED' | 'TRAIL_START_POINT_REQUIRED' | 'DUPLICATE_TRAIL_CANDIDATE' | 'INVALID_CITY' | 'INVALID_RANDO_CATEGORY'
```

- [ ] **Step 5: Implement source policy**

`assertAllowedTrailSource(url)` must:

- parse with `new URL(url)`;
- reject hostnames containing `alltrails`;
- accept `http:` or `https:`;
- throw `TrailsAcquisitionError('SOURCE_NOT_ALLOWED', 400)` on invalid or banned URL.

`rejectGeminiGeoMetrics(candidate)` must return only non-geographic fields from Gemini:

```ts
const allowedKeys = ['title', 'description', 'source_refs'] as const
```

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/unit/trails-acquisition.source-policy.test.ts tests/unit/trails-acquisition.gemini-guardrails.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/trails-acquisition tests/unit/trails-acquisition.source-policy.test.ts tests/unit/trails-acquisition.gemini-guardrails.test.ts
git commit -m "feat(trails): add domain guardrails"
```

---

## Task 3: GeoJSON, Overpass, Official Website And IGN Adapters

**Files:**
- Create: `src/features/trails-acquisition/lib/geojson.ts`
- Create: `src/features/trails-acquisition/lib/gpx.ts`
- Create: `src/features/trails-acquisition/services/official-website.ts`
- Create: `src/features/trails-acquisition/services/overpass.ts`
- Create: `src/features/trails-acquisition/services/ign.ts`
- Test: `tests/unit/trails-acquisition.geojson.test.ts`
- Test: `tests/unit/trails-acquisition.gpx.test.ts`
- Test: `tests/unit/trails-acquisition.official-website.test.ts`
- Test: `tests/unit/trails-acquisition.overpass.test.ts`
- Test: `tests/unit/trails-acquisition.ign.test.ts`

- [ ] **Step 1: Write adapter tests**

Cover:

- valid LineString GeoJSON returns `geometry_status = valid`;
- invalid GeoJSON returns `geometry_status = invalid`;
- valid GPX with `trkpt` coordinates converts to GeoJSON LineString;
- invalid GPX returns an invalid geometry result without throwing raw parser errors;
- official website parser extracts candidate cards from simple HTML fixtures with title/link/description;
- Overpass normalizer maps `route=hiking` relations and named hiking-signalled ways into candidates;
- Overpass normalizer keeps raw paths/viewpoints/parkings/refuges/peaks as enrichment context, not standalone candidates;
- IGN adapter calculates elevation status from mocked profile response and never returns a value when response is empty.

Use local fixtures inside test files. Do not fetch network.

- [ ] **Step 2: Implement GeoJSON validator**

`validateTrailGeometry(input)` returns:

```ts
type TrailGeometryValidation =
  | { status: 'valid'; geometry: Prisma.InputJsonValue; start: { latitude: number; longitude: number } | null }
  | { status: 'invalid'; geometry: null; start: null }
```

Accept only `LineString` and `MultiLineString` with numeric `[lng, lat]` coordinates.

- [ ] **Step 3: Implement GPX converter**

`parseGpxToGeoJson(gpxXml)` returns:

```ts
type GpxParseResult =
  | { status: 'valid'; geometry: Prisma.InputJsonValue }
  | { status: 'invalid'; geometry: null }
```

Parse `<trkpt lat="..." lon="...">` first, then `<rtept lat="..." lon="...">`. Emit a GeoJSON `LineString` with `[lng, lat]` coordinates. Reject files with fewer than 2 valid points.

- [ ] **Step 4: Implement official website parser**

`extractOfficialWebsiteTrailCandidates(html, sourceUrl)` returns lightweight candidates:

```ts
{
  primary_source_type: 'official_website',
  source_refs: [{
    type: 'official_website',
    url: string,
    attribution: new URL(sourceUrl).hostname,
    used_for: ['content'],
  }],
  title: string,
  description: string | null,
  raw_payload: { source_url: string; extracted_from: 'html' },
}
```

Use conservative extraction:

- `<h1>`, `<h2>`, `<h3>` titles containing randonnée/rando/sentier/itinéraire;
- sibling paragraph text as description when present;
- links with href containing `randonnee`, `sentier`, `itineraire`, `trail`.
- no recursive crawl. Only parse the provided HTML and same-page links as candidate references.

- [ ] **Step 5: Implement Overpass normalizer**

`normalizeOverpassTrails(payload, cityId)` returns candidates for elements with:

- `tags.route === 'hiking'`;
- or named ways where `tags.highway` is `path`, `track` or `footway` and the name/tags contain hiking signals.

For relations/ways with geometry, emit GeoJSON LineString and `geometry_status = valid`.
Objects such as `tourism=viewpoint`, `tourism=alpine_hut`, `amenity=parking`, `natural=peak` and `natural=spring` are kept in `raw_payload` as enrichment context but do not become standalone `TrailCandidate` records.

- [ ] **Step 6: Implement IGN adapter boundary**

`deriveElevationFromIgnProfile(profile)` returns:

```ts
{ elevation_gain_m: number; elevation_status: 'valid'; metric_source: 'ign' }
```

when the mocked profile contains altitude points; otherwise:

```ts
{ elevation_gain_m: null; elevation_status: 'missing'; metric_source: null }
```

Do not call live IGN in this task. Provide the pure function boundary first.

- [ ] **Step 7: Run tests**

```bash
npm test -- tests/unit/trails-acquisition.geojson.test.ts tests/unit/trails-acquisition.gpx.test.ts tests/unit/trails-acquisition.official-website.test.ts tests/unit/trails-acquisition.overpass.test.ts tests/unit/trails-acquisition.ign.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/trails-acquisition tests/unit/trails-acquisition.geojson.test.ts tests/unit/trails-acquisition.gpx.test.ts tests/unit/trails-acquisition.official-website.test.ts tests/unit/trails-acquisition.overpass.test.ts tests/unit/trails-acquisition.ign.test.ts
git commit -m "feat(trails): add source adapters"
```

---

## Task 4: Run Orchestrator And Admin Import Run API

**Files:**
- Create: `src/features/trails-acquisition/services/run-orchestrator.ts`
- Create: `src/features/trails-acquisition/queries/options.ts`
- Create: `src/features/trails-acquisition/queries/runs.ts`
- Create: `src/app/api/admin/trails/import-runs/route.ts`
- Create: `src/app/api/admin/trails/import-runs/[id]/route.ts`
- Test: `tests/contract/trails-acquisition.admin-runs-api.test.ts`

- [ ] **Step 1: Write contract tests**

Test:

- unauthenticated or non-admin returns forbidden using existing admin session mock pattern;
- `POST /api/admin/trails/import-runs` validates `city_id` and `source_types`;
- valid admin request creates `TrailImportRun` with `running`;
- run with mocked partial source failure ends as `partial_success` with `source_errors`;
- `GET /api/admin/trails/import-runs` returns runs with candidate counts;
- `GET /api/admin/trails/import-runs/{id}` returns candidates or 404.

- [ ] **Step 2: Implement options query**

`getTrailAcquisitionOptions()` returns active cities and active `Rando` category/subcategories.

If no active `Rando` category exists, throw `TrailsAcquisitionError('INVALID_RANDO_CATEGORY', 400)`.

- [ ] **Step 3: Implement run creation**

`createTrailImportRun(input, adminId)` must:

- validate active city;
- validate allowed source URL when `official_website` is selected;
- create `TrailImportRun`;
- execute selected source adapters server-side;
- create `TrailCandidate` records with `review_status = needs_review`, `primary_source_type`, `source_refs`, and `data_quality_status = draft`;
- do not create candidates from raw unnamed Overpass paths or standalone enrichment POI;
- mark run `completed`, `partial_success`, or `failed`;
- create `TrailAuditLog` with `action = import_started`.

- [ ] **Step 4: Implement route handlers**

Follow existing `poi-acquisition` API route style:

```ts
export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const data = await listTrailImportRuns()
  return NextResponse.json({ data })
}
```

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/contract/trails-acquisition.admin-runs-api.test.ts
```

Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/trails-acquisition src/app/api/admin/trails tests/contract/trails-acquisition.admin-runs-api.test.ts
git commit -m "feat(trails): add import run API"
```

---

## Task 5: Manual Candidate API

**Files:**
- Create: `src/features/trails-acquisition/queries/manual.ts`
- Create: `src/app/api/admin/trails/manual/route.ts`
- Test: `tests/contract/trails-acquisition.manual-api.test.ts`

- [ ] **Step 1: Write contract tests**

Test:

- invalid payload returns `400 VALIDATION_ERROR`;
- valid manual candidate creates `TrailCandidate` with `primary_source_type = manual` and `source_refs` attribution;
- manual candidate with valid GeoJSON gets `geometry_status = valid`;
- manual candidate with valid GPX XML is converted and gets `geometry_status = valid`;
- manual candidate without full geometry remains `review_status = needs_review`;
- manual candidate requires `start_latitude` and `start_longitude`;
- AllTrails `source_url` is rejected.

- [ ] **Step 2: Implement manual creation**

`createManualTrailCandidate(input, adminId)` must:

- validate city active;
- validate each source URL policy in `source_refs`;
- convert `gpx_xml` to GeoJSON when provided;
- validate final geometry with `validateTrailGeometry`;
- set default `source_refs = [{ type: 'manual', attribution: 'StayLocal', used_for: ['manual_review'] }]` when absent;
- set `primary_source_type = 'manual'`;
- create `TrailCandidate`;
- create `TrailAuditLog` with `action = trail_updated` and `target_type = TrailCandidate`.

- [ ] **Step 3: Implement route handler**

Use `getSessionAdmin`, `readJson`, `parsedOrValidationError`, and `responseFromTrailsAcquisitionError`.

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/contract/trails-acquisition.manual-api.test.ts
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/trails-acquisition/queries/manual.ts src/app/api/admin/trails/manual/route.ts tests/contract/trails-acquisition.manual-api.test.ts
git commit -m "feat(trails): add manual candidate API"
```

---

## Task 6: Review Actions, Publication, Merge, Reject And Audit

**Files:**
- Create: `src/features/trails-acquisition/queries/review.ts`
- Create: `src/features/trails-acquisition/lib/slug.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/publish/route.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/merge/route.ts`
- Create: `src/app/api/admin/trails/candidates/[id]/reject/route.ts`
- Test: `tests/contract/trails-acquisition.review-actions-api.test.ts`
- Test: `tests/integration/trails-acquisition.review-flow.test.ts`

- [ ] **Step 1: Write review tests**

Test:

- publish complete candidate creates active `PointOfInterest` and active `TrailDetail`;
- publish without `start_latitude` or `start_longitude` returns `409 TRAIL_START_POINT_REQUIRED`;
- publish without valid geometry returns `409 TRAIL_GEOMETRY_REQUIRED`, unless payload contains `confirm_incomplete_geometry: true`;
- confirmed incomplete publish creates `TrailDetail.data_quality_status = incomplete`;
- merge with existing active POI sets candidate `merged` and creates no new POI;
- reject sets `review_status = rejected` and creates no public POI;
- each action creates `TrailAuditLog`;
- inactive City or missing active `Rando` category blocks publish.

- [ ] **Step 2: Implement slug helper**

`createTrailSlug(title)` mirrors POI slugging and produces stable lowercase ASCII slugs.

`uniqueTrailPoiSlug(tx, cityId, baseSlug)` checks `PointOfInterest` `@@unique([city_id, slug])`.

- [ ] **Step 3: Implement publish**

`publishTrailCandidate(candidateId, adminId, options)` must use a transaction:

- read candidate with city;
- read active `Rando` category by slug `rando`;
- reject non-reviewable candidates;
- reject missing start coordinates;
- reject missing geometry unless confirmed;
- create or link `PointOfInterest`;
- create `TrailDetail`;
- update candidate `review_status = published`, `published_poi_id`, `trail_detail_id`, `reviewed_by`, `reviewed_at`;
- create audit log.

For POI fields:

- `name = candidate.title`;
- `description = candidate.description`;
- `address = candidate.start_label ?? city.name`;
- `latitude = candidate.start_latitude`;
- `longitude = candidate.start_longitude`;
- `category_id = randoCategory.id`;
- `subcategory_id` chosen by canonical difficulty if matching active subcategory exists (`easy -> facile`, `medium -> moyen`, `hard/expert -> difficile`).
- `TrailDetail.primary_source_type = candidate.primary_source_type`;
- `TrailDetail.source_refs = candidate.source_refs`;
- `TrailDetail.data_quality_status = complete` when geometry is valid, otherwise `incomplete`.

- [ ] **Step 4: Implement merge**

`mergeTrailCandidate(candidateId, poiId, adminId)` must:

- ensure candidate is `needs_review`;
- ensure target POI is active and in same city;
- upsert `TrailDetail` for that POI using candidate data;
- preserve `source_refs` and `data_quality_status`;
- mark candidate `merged`;
- audit.

- [ ] **Step 5: Implement reject**

`rejectTrailCandidate(candidateId, adminId, adminNote)` must:

- ensure candidate is `needs_review`;
- set `review_status = rejected`;
- store `admin_note`;
- audit.

- [ ] **Step 6: Implement route handlers**

Payloads:

```ts
publish: { confirm_duplicate?: boolean; confirm_incomplete_geometry?: boolean }
merge: { poi_id: string }
reject: { admin_note?: string }
```

- [ ] **Step 7: Run tests**

```bash
npm test -- tests/contract/trails-acquisition.review-actions-api.test.ts tests/integration/trails-acquisition.review-flow.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/trails-acquisition src/app/api/admin/trails/candidates tests/contract/trails-acquisition.review-actions-api.test.ts tests/integration/trails-acquisition.review-flow.test.ts
git commit -m "feat(trails): add trail review workflow"
```

---

## Task 7: Super-Admin UI

**Files:**
- Create: `src/features/trails-acquisition/components/AdminTrailsLauncher.tsx`
- Create: `src/features/trails-acquisition/components/AdminTrailCandidateActions.tsx`
- Create: `src/app/admin/trails/page.tsx`
- Create: `src/app/admin/trails/runs/[id]/page.tsx`
- Create: `src/app/admin/trails/new/page.tsx`
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/integration/trails-acquisition.admin-pages.test.tsx`
- Test: `tests/e2e/trails-acquisition.admin-review.test.ts`

- [ ] **Step 1: Write UI tests**

Test:

- `/admin/trails` renders form with City, sources, source URL and existing runs;
- `/admin/trails/runs/{id}` renders candidates with primary source, source refs, geometry status, elevation status, data quality, duplicates and review status;
- action buttons call publish/merge/reject APIs;
- `/admin/trails/new` renders manual creation form.

- [ ] **Step 2: Implement launcher component**

Use `Card`, `Button`, `Select`, `Input`, `Label`, and `Textarea` from `src/shared/components/ui/`. For source selection, use native checkbox inputs styled with Tailwind because no shared checkbox component exists. The component posts to `/api/admin/trails/import-runs` and refreshes on success.

Visible helper text:

```text
Gemini peut proposer des noms et descriptions, mais jamais les distances, dénivelés, coordonnées ou tracés.
```

- [ ] **Step 3: Implement candidate action component**

Client component with buttons:

- `Publier`;
- `Publier incomplet` shown only when `geometry_status !== 'valid'` and start coordinates exist;
- `Fusionner`;
- `Rejeter`.

Use `fetch` against admin review APIs and surface response errors.

- [ ] **Step 4: Implement admin pages**

Pages must call `await getPageAdmin()` first.

`/admin/trails` uses:

- `listTrailImportRuns()`;
- `getTrailAcquisitionOptions()`;
- `AdminTrailsLauncher`.

`/admin/trails/runs/[id]` uses:

- `getTrailImportRun(id)`;
- `AdminTrailCandidateActions`.

`/admin/trails/new` uses a form that posts to `/api/admin/trails/manual`.

- [ ] **Step 5: Add navigation**

Add a link to `/admin/trails` in `src/app/admin/layout.tsx`, next to existing POI acquisition/admin links.

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/integration/trails-acquisition.admin-pages.test.tsx
npx playwright test tests/e2e/trails-acquisition.admin-review.test.ts
```

Expected: pass or e2e skipped if no dev server fixture exists; if skipped, record manual verification in traceability.

- [ ] **Step 7: Commit**

```bash
git add src/features/trails-acquisition/components src/app/admin/trails src/app/admin/layout.tsx tests/integration/trails-acquisition.admin-pages.test.tsx tests/e2e/trails-acquisition.admin-review.test.ts
git commit -m "feat(trails): add admin trail acquisition UI"
```

---

## Task 8: Public Trails API And Guide Integration

**Files:**
- Create: `src/features/trails-acquisition/queries/public-trails.ts`
- Create: `src/features/trails-acquisition/components/TrailDetailBlock.tsx`
- Create: `src/app/api/cities/[slug]/trails/route.ts`
- Create: `src/app/api/cities/[slug]/trails/[trail-slug]/route.ts`
- Modify: `src/features/categories/queries/poi-detail.ts`
- Modify: `src/features/categories/components/PoiDetailBody.tsx`
- Test: `tests/contract/trails-acquisition.public-api.test.ts`
- Test: `tests/integration/trails-acquisition.public-guide.test.tsx`

- [ ] **Step 1: Write public API and UI tests**

Test:

- public trails list returns only active `TrailDetail` with active POI and active city;
- rejected candidates and inactive/deleted trails are excluded;
- detail endpoint returns `TrailDetail` including source attribution;
- POI detail renders trail block when `TrailDetail` exists;
- POI detail renders legacy `HikingBlock` when `TrailDetail` is absent and `HikingDetail` exists;
- public trails compute zone/distance from start coordinates stored on the POI;
- no public code imports Overpass or IGN service modules.

- [ ] **Step 2: Implement public query**

`listPublicTrails(citySlug)` must:

- find active city by slug;
- read active POIs in active category `rando`;
- include `trail_detail`;
- exclude `deleted_at` and inactive records.

`getPublicTrail(citySlug, trailSlug)` must return 404-compatible null when not found.

- [ ] **Step 3: Implement API routes**

Return exact shape:

```ts
return NextResponse.json({ data })
```

Use `404` with `{ error: { code: 'NOT_FOUND', message: 'Randonnée introuvable', details: {} } }`.

- [ ] **Step 4: Implement `TrailDetailBlock`**

Render:

- difficulty;
- distance;
- estimated duration;
- elevation gain;
- start label;
- source attribution;
- source references summary;
- source link when present.
If `data_quality_status = incomplete`, render a visible notice:

```text
Données de randonnée incomplètes, vérifiées manuellement par StayLocal.
```

Keep current visual language from public POI detail components.

- [ ] **Step 5: Wire POI detail**

Update the POI detail query to include `trail_detail` in addition to current `hiking_detail`.

Rendering priority:

1. `trail_detail` via `TrailDetailBlock`;
2. existing `hiking_detail` via current `HikingBlock` for backward compatibility.

- [ ] **Step 6: Run tests**

```bash
npm test -- tests/contract/trails-acquisition.public-api.test.ts tests/integration/trails-acquisition.public-guide.test.tsx
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/trails-acquisition src/app/api/cities tests/contract/trails-acquisition.public-api.test.ts tests/integration/trails-acquisition.public-guide.test.tsx src/features/categories
git commit -m "feat(trails): expose published trails publicly"
```

---

## Task 9: Traceability, Environment, Full Verification

**Files:**
- Modify: `docs/traceability-matrix.md`
- Modify: `.env.example`
- Verify: `specs/features/019-trails-acquisition/spec.md`

- [ ] **Step 1: Update traceability matrix**

Add a new section:

```markdown
## 019 — Trails Acquisition

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Création d'un run randonnée | `src/app/api/admin/trails/import-runs/route.ts`<br>`src/features/trails-acquisition/queries/runs.ts` | `tests/contract/trails-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-01-02 | Source web officielle vers candidats | `src/features/trails-acquisition/services/official-website.ts`<br>`src/features/trails-acquisition/queries/runs.ts` | `tests/unit/trails-acquisition.official-website.test.ts`<br>`tests/contract/trails-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-01-03 | Overpass relations/chemins nommés vers candidats normalisés | `src/features/trails-acquisition/services/overpass.ts` | `tests/unit/trails-acquisition.overpass.test.ts` | ✅ done |
| AC-01-04 | Gemini limité à découverte/descriptif | `src/features/trails-acquisition/lib/source-policy.ts`<br>`src/features/trails-acquisition/services/gemini-trails.ts` | `tests/unit/trails-acquisition.gemini-guardrails.test.ts` | ✅ done |
| AC-01-05 | Run partiel conserve erreurs par source | `src/features/trails-acquisition/services/run-orchestrator.ts` | `tests/contract/trails-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-02-01 | Géométrie GeoJSON stockée côté serveur | `src/features/trails-acquisition/lib/geojson.ts` | `tests/unit/trails-acquisition.geojson.test.ts` | ✅ done |
| AC-02-02 | Dénivelé via source fiable | `src/features/trails-acquisition/services/ign.ts` | `tests/unit/trails-acquisition.ign.test.ts` | ✅ done |
| AC-02-03 | Publication bloquée sans géométrie fiable | `src/features/trails-acquisition/queries/review.ts` | `tests/contract/trails-acquisition.review-actions-api.test.ts` | ✅ done |
| AC-02-04 | Métriques Gemini rejetées | `src/features/trails-acquisition/lib/source-policy.ts` | `tests/unit/trails-acquisition.gemini-guardrails.test.ts` | ✅ done |
| AC-02-05 | Métriques source officielle tracées | `src/features/trails-acquisition/services/official-website.ts`<br>`src/features/trails-acquisition/queries/runs.ts` | `tests/unit/trails-acquisition.official-website.test.ts` | ✅ done |
| AC-03-01 | UI admin liste statuts candidats | `src/app/admin/trails/runs/[id]/page.tsx` | `tests/integration/trails-acquisition.admin-pages.test.tsx` | ✅ done |
| AC-03-02 | Publication crée POI + TrailDetail | `src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-03-03 | Fusion sans nouveau POI | `src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-03-04 | Rejet sans publication | `src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-03-05 | Audit log des actions admin | `src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-04-01 | Candidat manuel validé Zod | `src/app/api/admin/trails/manual/route.ts`<br>`src/features/trails-acquisition/schemas.ts` | `tests/contract/trails-acquisition.manual-api.test.ts` | ✅ done |
| AC-04-02 | GeoJSON / GPX manuel attachable | `src/features/trails-acquisition/lib/geojson.ts`<br>`src/features/trails-acquisition/lib/gpx.ts`<br>`src/features/trails-acquisition/queries/manual.ts` | `tests/unit/trails-acquisition.geojson.test.ts`<br>`tests/unit/trails-acquisition.gpx.test.ts`<br>`tests/contract/trails-acquisition.manual-api.test.ts` | ✅ done |
| AC-04-03 | Manuel incomplet reste en review | `src/features/trails-acquisition/queries/manual.ts` | `tests/contract/trails-acquisition.manual-api.test.ts` | ✅ done |
| AC-04-04 | Manuel publié avec `primary_source_type` et `source_refs` | `src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-05-01 | Liste Rando affiche trails publiés | `src/features/trails-acquisition/queries/public-trails.ts` | `tests/integration/trails-acquisition.public-guide.test.tsx` | ✅ done |
| AC-05-02 | Fiche détail affiche TrailDetail | `src/features/trails-acquisition/components/TrailDetailBlock.tsx`<br>`src/features/categories/components/PoiDetailBody.tsx` | `tests/integration/trails-acquisition.public-guide.test.tsx` | ✅ done |
| AC-05-03 | Tracé affiché si géométrie valide | `src/features/trails-acquisition/components/TrailDetailBlock.tsx` | `tests/e2e/trails-acquisition.admin-review.test.ts` | ✅ done |
| AC-05-04 | Trails rejetés/inactifs masqués | `src/features/trails-acquisition/queries/public-trails.ts` | `tests/contract/trails-acquisition.public-api.test.ts` | ✅ done |
| AC-06-01 | Source et attribution conservées | `src/features/trails-acquisition/queries/runs.ts`<br>`src/features/trails-acquisition/queries/review.ts` | `tests/integration/trails-acquisition.review-flow.test.ts` | ✅ done |
| AC-06-02 | Attribution visible ou accessible | `src/features/trails-acquisition/components/TrailDetailBlock.tsx` | `tests/integration/trails-acquisition.public-guide.test.tsx` | ✅ done |
| AC-06-03 | Pas d'appel frontend vers Overpass / IGN | `src/features/trails-acquisition/services/overpass.ts`<br>`src/features/trails-acquisition/services/ign.ts` | `tests/contract/trails-acquisition.public-api.test.ts` | ✅ done |
| AC-06-04 | Cache ou rate limiting sources externes | `src/features/trails-acquisition/services/run-orchestrator.ts` | `tests/unit/trails-acquisition.overpass.test.ts` | ✅ done |
```

- [ ] **Step 2: Update `.env.example`**

Add:

```dotenv
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
IGN_API_KEY=
```

- [ ] **Step 3: Run targeted tests**

```bash
npm test -- tests/unit/trails-acquisition.source-policy.test.ts tests/unit/trails-acquisition.gemini-guardrails.test.ts tests/unit/trails-acquisition.geojson.test.ts tests/unit/trails-acquisition.gpx.test.ts tests/unit/trails-acquisition.official-website.test.ts tests/unit/trails-acquisition.overpass.test.ts tests/unit/trails-acquisition.ign.test.ts tests/contract/trails-acquisition.admin-runs-api.test.ts tests/contract/trails-acquisition.manual-api.test.ts tests/contract/trails-acquisition.review-actions-api.test.ts tests/contract/trails-acquisition.public-api.test.ts tests/integration/trails-acquisition.review-flow.test.ts tests/integration/trails-acquisition.public-guide.test.tsx tests/integration/trails-acquisition.admin-pages.test.tsx
```

Expected: pass.

- [ ] **Step 4: Run global verification**

```bash
npx prisma validate
npm test
npm run build
```

Expected:

- Prisma schema valid.
- Jest suite passes.
- Next build succeeds.

- [ ] **Step 5: Fix `next-env.d.ts` if build rewrites it**

If `npm run build` changes `next-env.d.ts` from dev route types to build route types, restore the dev import:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 6: Commit**

```bash
git add docs/traceability-matrix.md .env.example next-env.d.ts
git commit -m "docs(trails): update traceability"
```

---

## Execution Order And Checkpoints

1. Task 1 must complete before any code referencing Prisma trail models.
2. Task 2 must complete before source adapters or routes.
3. Task 3 must complete before run orchestration.
4. Task 4 and Task 5 can be implemented sequentially; do not parallel-edit shared schemas.
5. Task 6 is the main data integrity checkpoint; run all review-flow tests before UI.
6. Task 7 must not introduce business logic into React components; actions call APIs only.
7. Task 8 is the public exposure checkpoint; verify no unpublished/rejected trail leaks.
8. Task 9 closes the SDD loop.

## Risks To Watch

- Existing `HikingDetail` and new `TrailDetail` overlap. Keep compatibility by reading both, with `TrailDetail` taking priority.
- The current Prisma connection pool may be small. Avoid N+1 candidate mapping on admin pages; aggregate counts where possible.
- Official website extraction must remain conservative. If extraction is poor, create candidates in `needs_review` rather than auto-enriching.
- IGN/Géoplateforme live API details may require a dedicated key and endpoint confirmation. This plan isolates IGN behind `services/ign.ts` so production wiring can be adjusted without touching review/public logic.
- Do not import `services/overpass.ts`, `services/ign.ts`, `services/official-website.ts`, or `services/gemini-trails.ts` from client components or public route components.
