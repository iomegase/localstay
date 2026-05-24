# 018 POI Acquisition Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved `018-poi-acquisition-pipeline` spec: supervised hybrid POI acquisition, admin review, manual POI creation, and merchant missing-POI requests.

**Architecture:** Keep the public `PointOfInterest` model as the published source of truth. Add acquisition-specific models and services under `src/features/poi-acquisition/`, with Google Places used only for matching/place IDs and temporary review payloads, Mapbox used for persisted coordinates, Gemini used only for discovery/descriptions. All admin mutations go through `/api/admin/*`, all merchant missing-POI submission goes through `/api/merchant/*`, and all review actions write audit logs.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma/Supabase PostgreSQL, Zod, Shadcn/ui, Tailwind, Gemini, Mapbox Geocoding, Google Places Text Search.

---

## Scope Decision

`018` is large enough to split into five executable lots. Each lot must be independently testable and must keep the app buildable.

1. **Lot 1 — Data Model + Policy-Safe Services:** Prisma models, types, Google/Mapbox wrappers, duplicate detection helpers.
2. **Lot 2 — Admin Acquisition Runs:** create/list/detail runs and convert Gemini results into candidates.
3. **Lot 3 — Admin Review Actions:** publish, merge, reject candidates with audit.
4. **Lot 4 — Manual Admin POI Creation:** `/admin/pois/new` and `POST /api/admin/pois`.
5. **Lot 5 — Merchant Missing POI:** onboarding UI + `MissingPoiRequest` creation and admin handling.

This plan intentionally avoids a bulk Google Places import. Google Places is used only for matching and `google_place_id`, as required by `018` and Google Places policy.

## Files

### Create

- `src/features/poi-acquisition/types.ts` — DTOs and strict TypeScript types.
- `src/features/poi-acquisition/lib/google-places.ts` — policy-safe Google Places Text Search wrapper.
- `src/features/poi-acquisition/lib/google-policy.ts` — payload sanitizer and expiry helpers.
- `src/features/poi-acquisition/lib/duplicate-detection.ts` — duplicate candidate detection.
- `src/features/poi-acquisition/lib/geocode.ts` — candidate/manual/missing Mapbox geocoding helper.
- `src/features/poi-acquisition/lib/slug.ts` — POI slug generation.
- `src/features/poi-acquisition/queries/runs.ts` — run create/list/detail orchestration.
- `src/features/poi-acquisition/queries/review.ts` — publish/merge/reject candidate.
- `src/features/poi-acquisition/queries/manual-poi.ts` — admin manual POI creation.
- `src/features/poi-acquisition/queries/missing-poi.ts` — merchant missing POI creation.
- `src/features/poi-acquisition/components/AdminAcquisitionRunsClient.tsx` — admin run list UI.
- `src/features/poi-acquisition/components/AdminAcquisitionRunDetail.tsx` — candidate review UI.
- `src/features/poi-acquisition/components/AdminManualPoiForm.tsx` — manual create UI.
- `src/app/admin/poi-acquisition/page.tsx`.
- `src/app/admin/poi-acquisition/runs/[id]/page.tsx`.
- `src/app/admin/pois/new/page.tsx`.
- `src/app/api/admin/poi-acquisition/runs/route.ts`.
- `src/app/api/admin/poi-acquisition/runs/[id]/route.ts`.
- `src/app/api/admin/poi-acquisition/candidates/[id]/publish/route.ts`.
- `src/app/api/admin/poi-acquisition/candidates/[id]/merge/route.ts`.
- `src/app/api/admin/poi-acquisition/candidates/[id]/reject/route.ts`.
- `src/app/api/admin/pois/route.ts`.
- `src/app/api/merchant/onboarding/missing-poi/route.ts`.
- `src/app/api/internal/cleanup-google-review-payloads/route.ts`.
- `tests/unit/poi-acquisition.AC-05.google-policy.test.ts`.
- `tests/unit/poi-acquisition.BR-09.duplicate-detection.test.ts`.
- `tests/contract/poi-acquisition.admin-runs-api.test.ts`.
- `tests/contract/poi-acquisition.review-actions-api.test.ts`.
- `tests/contract/poi-acquisition.manual-poi-api.test.ts`.
- `tests/contract/poi-acquisition.missing-poi-api.test.ts`.
- `tests/integration/poi-acquisition.admin-pages.test.tsx`.
- `tests/unit/merchant-onboarding.AC-03-01.missing-poi-ui.test.tsx`.

### Modify

- `prisma/schema.prisma` — add `PoiAcquisitionRun`, `PoiAcquisitionCandidate`, `MissingPoiRequest`, `PoiAcquisitionAuditLog`; add relations from `City`, `Category`, `SubCategory`, `PointOfInterest`, `User`.
- `.env.example` — add `GOOGLE_PLACES_API_KEY=your-google-places-key`.
- `src/app/admin/layout.tsx` — add links to `Acquisition POI` and `Créer POI`.
- `src/features/merchant/components/MerchantOnboardingClient.tsx` — add missing-POI CTA/form after no satisfactory results.
- `src/features/merchant/types.ts` — add missing-POI DTOs.
- `src/features/merchant/queries/onboarding.ts` — ensure manually created POIs are claimable under `018 AC-04-06`.
- `vercel.json` — add centralized cleanup cron for expired Google review payloads.
- `docs/traceability-matrix.md` — map `018` AC/BR to source and tests.

---

## Task 1: Data Model + Prisma

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/contract/poi-acquisition.admin-runs-api.test.ts`

- [ ] **Step 1: Write failing contract test for model-backed run creation**

```ts
// tests/contract/poi-acquisition.admin-runs-api.test.ts
import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreateAcquisitionRun = jest.fn()
const mockListAcquisitionRuns = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  createAcquisitionRun: (...args: unknown[]) => mockCreateAcquisitionRun(...args),
  listAcquisitionRuns: (...args: unknown[]) => mockListAcquisitionRuns(...args),
}))

import { GET, POST } from '@/app/api/admin/poi-acquisition/runs/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/poi-acquisition/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('018 admin acquisition runs API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-01-01: creates a running acquisition run for active city/category', async () => {
    mockCreateAcquisitionRun.mockResolvedValue({ id: 'run-1', status: 'running' })

    const res = await POST(request({ city_id: 'city-1', category_id: 'cat-1' }))

    expect(res.status).toBe(201)
    expect(mockCreateAcquisitionRun).toHaveBeenCalledWith({ city_id: 'city-1', category_id: 'cat-1' }, 'admin-1')
  })

  it('lists acquisition runs for admins', async () => {
    mockListAcquisitionRuns.mockResolvedValue([{ id: 'run-1', status: 'completed' }])

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'run-1', status: 'completed' }] })
  })
})
```

- [ ] **Step 2: Run red test**

Run: `npm test -- tests/contract/poi-acquisition.admin-runs-api.test.ts`

Expected: FAIL because `/api/admin/poi-acquisition/runs/route` and `features/poi-acquisition` do not exist.

- [ ] **Step 3: Add Prisma models**

Add models from `018` to `prisma/schema.prisma`, with explicit relations and soft delete:

```prisma
model PoiAcquisitionRun {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  category_id String
  category    Category @relation(fields: [category_id], references: [id])
  status      String   @default("running")
  source      String   @default("hybrid")
  started_by  String?
  starter     User?    @relation("PoiAcquisitionRunsStarted", fields: [started_by], references: [id])
  error       String?
  candidates  PoiAcquisitionCandidate[]
  audit_logs  PoiAcquisitionAuditLog[]
}

model PoiAcquisitionCandidate {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  run_id      String
  run         PoiAcquisitionRun @relation(fields: [run_id], references: [id])
  source      String
  name        String
  address     String
  description String?
  phone       String?
  website     String?
  category_id String
  category    Category @relation(fields: [category_id], references: [id])
  subcategory_id String?
  subcategory SubCategory? @relation(fields: [subcategory_id], references: [id])
  google_place_id String?
  google_review_payload Json?
  google_review_expires_at DateTime?
  latitude    Float?
  longitude   Float?
  geocode_status String @default("pending")
  geocode_provider String?
  geocode_confidence Float?
  duplicate_poi_ids String[]
  match_status String @default("unmatched")
  review_status String @default("needs_review")
  published_poi_id String?
  published_poi PointOfInterest? @relation(fields: [published_poi_id], references: [id])
  reviewed_by String?
  reviewer User? @relation("PoiAcquisitionCandidateReviews", fields: [reviewed_by], references: [id])
  reviewed_at DateTime?
  admin_note String?
  audit_logs PoiAcquisitionAuditLog[]
}

model MissingPoiRequest {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  merchant_id String
  merchant    User     @relation("MissingPoiRequests", fields: [merchant_id], references: [id])
  name        String
  address     String
  phone       String?
  website     String?
  city_id     String
  city        City     @relation(fields: [city_id], references: [id])
  category_id String?
  category    Category? @relation(fields: [category_id], references: [id])
  google_place_id String?
  google_review_payload Json?
  google_review_expires_at DateTime?
  latitude    Float?
  longitude   Float?
  geocode_status String @default("pending")
  status      String @default("pending")
  linked_poi_id String?
  linked_poi PointOfInterest? @relation(fields: [linked_poi_id], references: [id])
  reviewed_by String?
  reviewer User? @relation("MissingPoiRequestReviews", fields: [reviewed_by], references: [id])
  reviewed_at DateTime?
  admin_note String?
}

model PoiAcquisitionAuditLog {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?
  admin_id    String
  admin       User     @relation("PoiAcquisitionAuditLogs", fields: [admin_id], references: [id])
  action      String
  target_type String
  target_id   String?
  run_id      String?
  run         PoiAcquisitionRun? @relation(fields: [run_id], references: [id])
  candidate_id String?
  candidate PoiAcquisitionCandidate? @relation(fields: [candidate_id], references: [id])
  before      Json?
  after       Json?
}
```

- [ ] **Step 4: Generate and validate Prisma**

Run:

```bash
npx prisma generate
npx prisma validate
```

Expected: PASS.

---

## Task 2: Policy-Safe Google Places + Mapbox Services

**Files:**
- Create: `src/features/poi-acquisition/lib/google-policy.ts`
- Create: `src/features/poi-acquisition/lib/google-places.ts`
- Create: `src/features/poi-acquisition/lib/geocode.ts`
- Create: `tests/unit/poi-acquisition.AC-05.google-policy.test.ts`

- [ ] **Step 1: Write failing Google policy test**

```ts
import { sanitizeGoogleReviewPayload, googleReviewExpiry } from '@/features/poi-acquisition/lib/google-policy'

describe('018 Google Places policy', () => {
  it('AC-05-01: stores only place_id durably and strips public content from permanent payloads', () => {
    const sanitized = sanitizeGoogleReviewPayload({
      place_id: 'place-123',
      displayName: { text: 'Google Name' },
      formattedAddress: 'Google Address',
      rating: 4.8,
    })

    expect(sanitized.google_place_id).toBe('place-123')
    expect(sanitized.review_payload).toEqual({
      displayName: { text: 'Google Name' },
      formattedAddress: 'Google Address',
      rating: 4.8,
      attribution: 'Google Maps',
    })
  })

  it('AC-05-02: computes short-lived review expiry', () => {
    const now = new Date('2026-05-24T00:00:00.000Z')
    expect(googleReviewExpiry(now).toISOString()).toBe('2026-06-23T00:00:00.000Z')
  })
})
```

- [ ] **Step 2: Implement policy helper**

`sanitizeGoogleReviewPayload` returns `{ google_place_id, review_payload }`; `review_payload` is temporary only and must never be copied to public POI fields.

- [ ] **Step 3: Implement Google Places Text Search wrapper**

Use `GOOGLE_PLACES_API_KEY`. Request minimal fields only: `places.id`, `places.displayName`, `places.formattedAddress`, `places.attributions`. Return an empty array if no key is set in dev/test. Never write Google names/addresses to `PointOfInterest`.

- [ ] **Step 4: Implement Mapbox helper**

Wrap existing `geocodeAddress()` and classify:

```ts
type AcquisitionGeocode =
  | { status: 'success'; latitude: number; longitude: number; confidence: number }
  | { status: 'pending_review'; latitude: number; longitude: number; confidence: number; reason: string }
  | { status: 'failed'; reason: string }
  | { status: 'rejected'; reason: string }
```

---

## Task 3: Acquisition Runs

**Files:**
- Create: `src/features/poi-acquisition/queries/runs.ts`
- Create: `src/app/api/admin/poi-acquisition/runs/route.ts`
- Create: `src/app/api/admin/poi-acquisition/runs/[id]/route.ts`
- Test: `tests/contract/poi-acquisition.admin-runs-api.test.ts`

- [ ] **Step 1: Implement `createAcquisitionRun()`**

Validation:
- City active + `deleted_at = null`
- Category active + `deleted_at = null`
- run starts `running`
- Gemini returns raw POIs
- each raw POI becomes candidate with `source = gemini`
- Google match can set `google_place_id`, `match_status = matched`
- Mapbox can set `latitude`, `longitude`, `geocode_status`
- duplicate or ambiguous candidates remain `review_status = needs_review`

- [ ] **Step 2: Implement API routes**

`POST /api/admin/poi-acquisition/runs` uses admin session, Zod body `{ city_id, category_id }`, returns `201 { data }`.

`GET /api/admin/poi-acquisition/runs` lists runs with city/category names and counts.

`GET /api/admin/poi-acquisition/runs/{id}` returns candidates and review metadata.

---

## Task 4: Admin Review Actions

**Files:**
- Create: `src/features/poi-acquisition/queries/review.ts`
- Create: review API routes under `src/app/api/admin/poi-acquisition/candidates/[id]/`
- Test: `tests/contract/poi-acquisition.review-actions-api.test.ts`

- [ ] **Step 1: Write contract tests**

Cover:
- publish creates `PointOfInterest` only if geocode is not `rejected`
- publish requires City/Category/SubCategory active
- merge marks candidate `merged` and creates no POI
- reject marks candidate `rejected` and creates no POI
- every action creates `PoiAcquisitionAuditLog`

- [ ] **Step 2: Implement review service**

Use Prisma transactions. Never physically delete candidates. Use generated StayLocal content only for public POI fields.

---

## Task 5: Admin UI

**Files:**
- Create pages/components listed above.
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/integration/poi-acquisition.admin-pages.test.tsx`

- [ ] **Step 1: Add navigation**

Add sidebar links:
- `/admin/poi-acquisition` label `Acquisition POI`
- `/admin/pois/new` label `Créer POI`

- [ ] **Step 2: Implement run list and run detail**

Use Shadcn tables/cards. Candidate rows must show Google attribution text `Google Maps` when temporary Google review payload is displayed.

---

## Task 6: Manual Admin POI Creation

**Files:**
- Create: `src/features/poi-acquisition/queries/manual-poi.ts`
- Create: `src/app/api/admin/pois/route.ts`
- Create: `src/app/admin/pois/new/page.tsx`
- Test: `tests/contract/poi-acquisition.manual-poi-api.test.ts`

- [ ] **Step 1: Validate with Zod**

Required fields: `name`, `address`, `city_id`, `category_id`.

- [ ] **Step 2: Geocode with Mapbox before create**

If confidence is reliable, create with `geocode_status = success`.
If ambiguous, return `409 MAPBOX_GEOCODE_AMBIGUOUS` unless `confirm_geocode_pending_review = true`.

- [ ] **Step 3: Duplicate detection**

If duplicate candidates exist, return `409 DUPLICATE_POI_CANDIDATE` unless `confirm_duplicate = true`.

---

## Task 7: Merchant Missing POI

**Files:**
- Modify: `src/features/merchant/components/MerchantOnboardingClient.tsx`
- Create: `src/app/api/merchant/onboarding/missing-poi/route.ts`
- Create: `src/features/poi-acquisition/queries/missing-poi.ts`
- Test: `tests/unit/merchant-onboarding.AC-03-01.missing-poi-ui.test.tsx`
- Test: `tests/contract/poi-acquisition.missing-poi-api.test.ts`

- [ ] **Step 1: Add missing-POI CTA**

Show `Mon établissement n'apparaît pas` after a completed search with no satisfactory result.

- [ ] **Step 2: Submit missing request**

Create `MissingPoiRequest` with `status = pending`. Run Google matching and Mapbox geocoding server-side. Do not create public POI.

---

## Task 8: Cleanup Expired Google Review Payloads

**Files:**
- Create: `src/app/api/internal/cleanup-google-review-payloads/route.ts`
- Modify: `vercel.json`
- Test: `tests/contract/poi-acquisition.google-cleanup.test.ts`

- [ ] **Step 1: Add cleanup route**

Auth via `INTERNAL_API_SECRET`. Set `google_review_payload = Prisma.JsonNull` where `google_review_expires_at < now`.

- [ ] **Step 2: Add cron**

Add to `vercel.json`:

```json
{
  "path": "/api/internal/cleanup-google-review-payloads",
  "schedule": "0 4 * * *",
  "description": "Nettoyage quotidien des payloads temporaires Google Places"
}
```

---

## Task 9: Verification and Traceability

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Run targeted tests**

```bash
npm test -- tests/unit/poi-acquisition.AC-05.google-policy.test.ts tests/unit/poi-acquisition.BR-09.duplicate-detection.test.ts tests/contract/poi-acquisition.admin-runs-api.test.ts tests/contract/poi-acquisition.review-actions-api.test.ts tests/contract/poi-acquisition.manual-poi-api.test.ts tests/contract/poi-acquisition.missing-poi-api.test.ts tests/integration/poi-acquisition.admin-pages.test.tsx tests/unit/merchant-onboarding.AC-03-01.missing-poi-ui.test.tsx
```

- [ ] **Step 2: Run project verification**

```bash
npx prisma validate
npm run build
npm test
```

- [ ] **Step 3: Update traceability**

Add a `## 018 — POI Acquisition Pipeline` section mapping every AC and BR to code/tests.

---

## Current External-Policy Notes

- Google Places policy states that Places API content must not be prefetched, cached, or stored beyond allowed exceptions, while `place_id` is exempt from caching restrictions.
- Google Places UI content requires Google Maps attribution when displayed without a Google Map.
- Therefore implementation must keep Google-derived display data temporary and admin-only, never as public StayLocal POI fields.

