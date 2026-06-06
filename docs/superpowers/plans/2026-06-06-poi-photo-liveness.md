# POI Photo Liveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect dead POI photo URLs (404 / non-image), remove them, flag the POI for admin review, and best-effort re-acquire website photos — via a hybrid of reactive (client `onError`) and proactive (internal cron) detection.

**Architecture:** A new `src/features/poi-photos` feature holds **pure logic** (`isDeadPhotoResponse`, `removeDeadPhotos`, `belongsToPoi`) and thin I/O services (`checkPhotoUrl`, `healPoiPhotos`, `checkPhotoLivenessBatch`). Two routes call them: a public reactive endpoint and a Bearer-secured internal cron. Re-acquisition reuses the existing `official-website-photos` service. The admin POI list surfaces a `needs_refresh` flag.

**Tech Stack:** Next 16 App Router (route handlers, `MetadataRoute` n/a), Prisma, Zod, Jest. Reuses `@/features/poi-acquisition/services/official-website-photos`.

**Standing constraints:** TDD (red→green). **The USER commits source code** — executors `git add` (stage) only and leave the commit to the user; do NOT `git commit` source. This plan file is committed immediately by the assistant. Quote the trailing-space repo path. Verify with `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"` and `npx jest <pattern>`. Spec: [2026-06-06-poi-photo-liveness-design.md](../specs/2026-06-06-poi-photo-liveness-design.md).

**Design refinement vs spec:** the reactive endpoint **server-confirms** a URL is dead (`checkPhotoUrl`) before removing it. This closes an abuse hole (a client could otherwise report a *live* URL as dead and force its removal). Both reactive and cron paths thus remove only server-confirmed-dead URLs.

---

## File structure

**New (feature):**
- `src/features/poi-photos/lib/liveness.ts` — pure: `isDeadPhotoResponse`, `removeDeadPhotos`, `belongsToPoi`.
- `src/features/poi-photos/lib/report-dead-photo.ts` — client fire-and-forget `reportDeadPhoto(poiId, url)`.
- `src/features/poi-photos/services/check-photo-url.ts` — `checkPhotoUrl(url)` (HEAD→GET, classify).
- `src/features/poi-photos/services/heal-poi-photos.ts` — `healPoiPhotos({ poiId, deadUrls })`.
- `src/features/poi-photos/queries/check-photo-liveness-batch.ts` — `checkPhotoLivenessBatch(limit)`.

**New (routes):**
- `src/app/api/pois/[id]/report-dead-photo/route.ts` — reactive (public, guarded).
- `src/app/api/internal/check-photo-liveness/route.ts` — cron (Bearer).

**New (migration):**
- `prisma/migrations/20260606120000_poi_photo_liveness/migration.sql`.

**Modified:**
- `prisma/schema.prisma` — `PointOfInterest`: `photos_status`, `photos_checked_at`, index.
- `src/features/categories/components/PoiCard.tsx` — foreground `<Image onError>` + dead-photo local hide.
- `src/features/categories/components/PoiDetailBody.tsx` — hero `<Image onError>` + fallback.
- `src/features/admin-pois/queries/admin-pois.ts` — `adminPoiSelect` + list mapper add `photos_status`.
- `src/features/admin-pois/types.ts` — `AdminPoiListItem.photos_status`.
- `src/app/admin/pois/page.tsx` — `needs_refresh` badge.

**Tests:**
- `tests/unit/poi-photos.liveness.test.ts`, `tests/unit/poi-photos.check-photo-url.test.ts`,
  `tests/unit/poi-photos.heal.test.ts`, `tests/unit/poi-photos.batch.test.ts`,
  `tests/contract/poi-photos.report-dead-photo.api.test.ts`,
  `tests/contract/poi-photos.check-liveness-cron.api.test.ts`,
  `tests/integration/poi-photos.client-onerror.test.tsx`.

---

## Task 1: Schema — photo liveness columns

**Files:**
- Modify: `prisma/schema.prisma` (`PointOfInterest`, after `photos String[]` / `tags String[]`)
- Create: `prisma/migrations/20260606120000_poi_photo_liveness/migration.sql`

- [ ] **Step 1: Add columns to the Prisma model**

In `model PointOfInterest`, after `tags String[]` (line ~101), add:

```prisma
  photos_status     String    @default("ok") // ok | needs_refresh
  photos_checked_at DateTime?
```

And add this index alongside the existing `@@index` lines (before the closing `}`):

```prisma
  @@index([photos_status, photos_checked_at])
```

- [ ] **Step 2: Write the migration SQL** (surgical — shadow DB is broken in this repo)

```sql
-- prisma/migrations/20260606120000_poi_photo_liveness/migration.sql
ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "photos_status" TEXT NOT NULL DEFAULT 'ok';
ALTER TABLE "PointOfInterest" ADD COLUMN IF NOT EXISTS "photos_checked_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "PointOfInterest_photos_status_photos_checked_at_idx"
  ON "PointOfInterest"("photos_status", "photos_checked_at");
```

- [ ] **Step 3: Apply migration + regenerate client**

Run: `npx prisma db execute --file prisma/migrations/20260606120000_poi_photo_liveness/migration.sql --schema prisma/schema.prisma`
Then: `npx prisma generate`
Expected: both succeed; `photos_status` is now on the Prisma client type.

- [ ] **Step 4: Verify tsc**

Run: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"`
Expected: no output.

- [ ] **Step 5: Stage** (user commits)

```bash
git add prisma/schema.prisma prisma/migrations/20260606120000_poi_photo_liveness
```

---

## Task 2: Pure liveness logic

**Files:**
- Create: `src/features/poi-photos/lib/liveness.ts`
- Test: `tests/unit/poi-photos.liveness.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/poi-photos.liveness.test.ts
import { isDeadPhotoResponse, removeDeadPhotos, belongsToPoi } from '@/features/poi-photos/lib/liveness'

describe('isDeadPhotoResponse', () => {
  it('is alive for a 200 image response', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: 'image/jpeg' })).toBe(false)
  })
  it('is dead for a 404', () => {
    expect(isDeadPhotoResponse({ status: 404, contentType: 'image/jpeg' })).toBe(true)
  })
  it('is dead for a 200 that is not an image (e.g. an HTML error page)', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: 'text/html; charset=utf-8' })).toBe(true)
  })
  it('is dead for a 403 (gone / blocked)', () => {
    expect(isDeadPhotoResponse({ status: 403, contentType: 'image/png' })).toBe(true)
  })
  it('is dead when content-type is missing', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: null })).toBe(true)
  })
})

describe('removeDeadPhotos', () => {
  it('removes only the dead urls, preserving order', () => {
    expect(removeDeadPhotos(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
  })
  it('is a no-op when nothing is dead', () => {
    expect(removeDeadPhotos(['a', 'b'], [])).toEqual(['a', 'b'])
  })
})

describe('belongsToPoi', () => {
  it('is true only for a url already in the photos array', () => {
    expect(belongsToPoi(['a', 'b'], 'a')).toBe(true)
    expect(belongsToPoi(['a', 'b'], 'x')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/unit/poi-photos.liveness.test.ts`
Expected: FAIL — "Cannot find module '@/features/poi-photos/lib/liveness'".

- [ ] **Step 3: Implement**

```typescript
// src/features/poi-photos/lib/liveness.ts

/** Une photo est "morte" si la réponse n'est pas un 2xx, ou n'est pas une image. */
export function isDeadPhotoResponse(input: { status: number; contentType: string | null }): boolean {
  const { status, contentType } = input
  if (status < 200 || status >= 300) return true
  if (!contentType || !contentType.toLowerCase().startsWith('image/')) return true
  return false
}

/** Retire les URLs mortes d'une liste de photos (ordre préservé). */
export function removeDeadPhotos(photos: string[], deadUrls: string[]): string[] {
  const dead = new Set(deadUrls)
  return photos.filter(url => !dead.has(url))
}

/** Garde anti-abus : n'agir que sur une URL déjà présente dans le POI. */
export function belongsToPoi(photos: string[], url: string): boolean {
  return photos.includes(url)
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/unit/poi-photos.liveness.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Stage**

```bash
git add src/features/poi-photos/lib/liveness.ts tests/unit/poi-photos.liveness.test.ts
```

---

## Task 3: `checkPhotoUrl` service (network)

**Files:**
- Create: `src/features/poi-photos/services/check-photo-url.ts`
- Test: `tests/unit/poi-photos.check-photo-url.test.ts`

- [ ] **Step 1: Write the failing tests** (mock global `fetch`)

```typescript
// tests/unit/poi-photos.check-photo-url.test.ts
import { checkPhotoUrl } from '@/features/poi-photos/services/check-photo-url'

function res(status: number, contentType: string | null): Response {
  return { status, headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) } } as unknown as Response
}

describe('checkPhotoUrl', () => {
  const realFetch = global.fetch
  afterEach(() => { global.fetch = realFetch })

  it('returns alive when HEAD is a 200 image', async () => {
    global.fetch = jest.fn().mockResolvedValue(res(200, 'image/jpeg')) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('alive')
  })

  it('returns dead when HEAD is a 404', async () => {
    global.fetch = jest.fn().mockResolvedValue(res(404, null)) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('dead')
  })

  it('falls back to GET when HEAD is unsupported (405)', async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(res(405, null))
      .mockResolvedValueOnce(res(200, 'image/png'))
    global.fetch = fetchMock as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('alive')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns dead on a network error / timeout', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND')) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('dead')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/unit/poi-photos.check-photo-url.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/features/poi-photos/services/check-photo-url.ts
import { isDeadPhotoResponse } from '../lib/liveness'

const USER_AGENT = 'Mozilla/5.0 (compatible; StayLocalBot/1.0; +https://staylocal.app)'
const TIMEOUT_MS = 5000

function classify(res: Response): 'alive' | 'dead' {
  return isDeadPhotoResponse({ status: res.status, contentType: res.headers.get('content-type') })
    ? 'dead'
    : 'alive'
}

async function safeFetch(url: string, method: 'HEAD' | 'GET'): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Vérifie la vivacité d'une URL de photo (HEAD, repli GET si HEAD non supporté). */
export async function checkPhotoUrl(url: string): Promise<'alive' | 'dead'> {
  const head = await safeFetch(url, 'HEAD')
  if (head && head.status !== 405 && head.status !== 501) {
    return classify(head)
  }
  const get = await safeFetch(url, 'GET')
  return get ? classify(get) : 'dead'
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/unit/poi-photos.check-photo-url.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage**

```bash
git add src/features/poi-photos/services/check-photo-url.ts tests/unit/poi-photos.check-photo-url.test.ts
```

---

## Task 4: `healPoiPhotos` service

Removes confirmed-dead URLs, best-effort re-acquires website photos, sets the flag.

**Files:**
- Create: `src/features/poi-photos/services/heal-poi-photos.ts`
- Test: `tests/unit/poi-photos.heal.test.ts`

- [ ] **Step 1: Write the failing tests** (mock prisma + official-photos service)

```typescript
// tests/unit/poi-photos.heal.test.ts
const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findUnique: (...a: unknown[]) => mockFindUnique(...a), update: (...a: unknown[]) => mockUpdate(...a) } },
}))

const mockFetch = jest.fn()
jest.mock('@/features/poi-acquisition/services/official-website-photos', () => ({
  fetchOfficialWebsitePhotoEnrichmentDetailed: (...a: unknown[]) => mockFetch(...a),
  mergeOfficialWebsitePhotos: (existing: string[], extra: string[]) =>
    Array.from(new Set([...existing, ...extra])),
}))

import { healPoiPhotos } from '@/features/poi-photos/services/heal-poi-photos'

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({ id: 'p1' })
})

it('removes the dead url, keeps remaining photos, and stays ok (>=1 photo)', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['alive.jpg', 'dead.jpg'], website: null })
  mockFetch.mockResolvedValue({ status: 'no_website' })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result).toEqual({ removed: 1, status: 'ok' })
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'p1' },
    data: expect.objectContaining({ photos: ['alive.jpg'], photos_status: 'ok' }),
  }))
})

it('flags needs_refresh when the POI is left with zero photos and re-acquire finds none', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['dead.jpg'], website: 'https://x' })
  mockFetch.mockResolvedValue({ status: 'no_photos_extracted', canonicalUrl: 'https://x' })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result).toEqual({ removed: 1, status: 'needs_refresh' })
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ photos: [], photos_status: 'needs_refresh' }),
  }))
})

it('re-acquires website photos and recovers to ok', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['dead.jpg'], website: 'https://x' })
  mockFetch.mockResolvedValue({ status: 'ok', enrichment: { photos: ['fresh.jpg'], canonical_url: 'https://x' } })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result.status).toBe('ok')
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ photos: ['fresh.jpg'], photos_status: 'ok' }),
  }))
})

it('no-ops when the POI is missing', async () => {
  mockFindUnique.mockResolvedValue(null)
  const result = await healPoiPhotos({ poiId: 'missing', deadUrls: ['x'] })
  expect(result).toEqual({ removed: 0, status: 'ok' })
  expect(mockUpdate).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/unit/poi-photos.heal.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/features/poi-photos/services/heal-poi-photos.ts
import { prisma } from '@/shared/lib/prisma'
import { removeDeadPhotos } from '../lib/liveness'
import {
  fetchOfficialWebsitePhotoEnrichmentDetailed,
  mergeOfficialWebsitePhotos,
} from '@/features/poi-acquisition/services/official-website-photos'

export type HealResult = { removed: number; status: 'ok' | 'needs_refresh' }

/**
 * Retire les URLs (confirmées) mortes d'un POI, tente une ré-acquisition best-effort
 * des photos du site officiel, et pose le flag : `ok` si le POI garde ≥1 photo, sinon
 * `needs_refresh` (revue manuelle admin).
 */
export async function healPoiPhotos(input: { poiId: string; deadUrls: string[] }): Promise<HealResult> {
  const poi = await prisma.pointOfInterest.findUnique({
    where: { id: input.poiId },
    select: { photos: true, website: true },
  })
  if (!poi) return { removed: 0, status: 'ok' }

  const cleaned = removeDeadPhotos(poi.photos, input.deadUrls)
  const removed = poi.photos.length - cleaned.length

  let photos = cleaned
  const fetchResult = await fetchOfficialWebsitePhotoEnrichmentDetailed(poi.website)
  if (fetchResult.status === 'ok') {
    photos = mergeOfficialWebsitePhotos(cleaned, fetchResult.enrichment.photos)
  }

  const status: HealResult['status'] = photos.length > 0 ? 'ok' : 'needs_refresh'

  await prisma.pointOfInterest.update({
    where: { id: input.poiId },
    data: { photos, photos_status: status, photos_checked_at: new Date() },
    select: { id: true },
  })

  return { removed, status }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/unit/poi-photos.heal.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage**

```bash
git add src/features/poi-photos/services/heal-poi-photos.ts tests/unit/poi-photos.heal.test.ts
```

---

## Task 5: `checkPhotoLivenessBatch` query (cron core)

**Files:**
- Create: `src/features/poi-photos/queries/check-photo-liveness-batch.ts`
- Test: `tests/unit/poi-photos.batch.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/poi-photos.batch.test.ts
const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findMany: (...a: unknown[]) => mockFindMany(...a), update: (...a: unknown[]) => mockUpdate(...a) } },
}))

const mockCheck = jest.fn()
jest.mock('@/features/poi-photos/services/check-photo-url', () => ({
  checkPhotoUrl: (...a: unknown[]) => mockCheck(...a),
}))

const mockHeal = jest.fn()
jest.mock('@/features/poi-photos/services/heal-poi-photos', () => ({
  healPoiPhotos: (...a: unknown[]) => mockHeal(...a),
}))

import { checkPhotoLivenessBatch } from '@/features/poi-photos/queries/check-photo-liveness-batch'

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({ id: 'p' })
})

it('only stamps photos_checked_at for a POI with all-alive photos (no heal)', async () => {
  mockFindMany.mockResolvedValue([{ id: 'p1', photos: ['a.jpg', 'b.jpg'] }])
  mockCheck.mockResolvedValue('alive')

  const result = await checkPhotoLivenessBatch(10)

  expect(mockHeal).not.toHaveBeenCalled()
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'p1' }, data: expect.objectContaining({ photos_checked_at: expect.any(Date) }),
  }))
  expect(result).toEqual({ processed: 1, poisFlagged: 0, photosRemoved: 0 })
})

it('heals a POI with a dead photo and counts a flagged POI', async () => {
  mockFindMany.mockResolvedValue([{ id: 'p1', photos: ['a.jpg', 'dead.jpg'] }])
  mockCheck.mockImplementation((url: string) => Promise.resolve(url === 'dead.jpg' ? 'dead' : 'alive'))
  mockHeal.mockResolvedValue({ removed: 1, status: 'needs_refresh' })

  const result = await checkPhotoLivenessBatch(10)

  expect(mockHeal).toHaveBeenCalledWith({ poiId: 'p1', deadUrls: ['dead.jpg'] })
  expect(result).toEqual({ processed: 1, poisFlagged: 1, photosRemoved: 1 })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/unit/poi-photos.batch.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// src/features/poi-photos/queries/check-photo-liveness-batch.ts
import { prisma } from '@/shared/lib/prisma'
import { checkPhotoUrl } from '../services/check-photo-url'
import { healPoiPhotos } from '../services/heal-poi-photos'

export type LivenessBatchResult = { processed: number; poisFlagged: number; photosRemoved: number }

/** Balaye un lot de POIs (les moins récemment vérifiés d'abord), retire les photos mortes. */
export async function checkPhotoLivenessBatch(limit = 25): Promise<LivenessBatchResult> {
  const pois = await prisma.pointOfInterest.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { photos_checked_at: { sort: 'asc', nulls: 'first' } },
    take: limit,
    select: { id: true, photos: true },
  })

  let poisFlagged = 0
  let photosRemoved = 0

  for (const poi of pois) {
    const deadUrls: string[] = []
    for (const url of poi.photos) {
      if ((await checkPhotoUrl(url)) === 'dead') deadUrls.push(url)
    }

    if (deadUrls.length === 0) {
      await prisma.pointOfInterest.update({
        where: { id: poi.id },
        data: { photos_checked_at: new Date() },
        select: { id: true },
      })
      continue
    }

    const result = await healPoiPhotos({ poiId: poi.id, deadUrls })
    photosRemoved += result.removed
    if (result.status === 'needs_refresh') poisFlagged += 1
  }

  return { processed: pois.length, poisFlagged, photosRemoved }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/unit/poi-photos.batch.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage**

```bash
git add src/features/poi-photos/queries/check-photo-liveness-batch.ts tests/unit/poi-photos.batch.test.ts
```

---

## Task 6: Reactive endpoint — `POST /api/pois/[id]/report-dead-photo`

Public, guarded: only acts on a URL already in the POI **and** server-confirmed dead.

**Files:**
- Create: `src/app/api/pois/[id]/report-dead-photo/route.ts`
- Test: `tests/contract/poi-photos.report-dead-photo.api.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/contract/poi-photos.report-dead-photo.api.test.ts
import { NextRequest } from 'next/server'

const mockFindUnique = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findUnique: (...a: unknown[]) => mockFindUnique(...a) } },
}))
const mockCheck = jest.fn()
jest.mock('@/features/poi-photos/services/check-photo-url', () => ({
  checkPhotoUrl: (...a: unknown[]) => mockCheck(...a),
}))
const mockHeal = jest.fn()
jest.mock('@/features/poi-photos/services/heal-poi-photos', () => ({
  healPoiPhotos: (...a: unknown[]) => mockHeal(...a),
}))

import { POST } from '@/app/api/pois/[id]/report-dead-photo/route'

function req(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/pois/p1/report-dead-photo', {
    method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
  })
}
const ctx = { params: Promise.resolve({ id: 'p1' }) }

beforeEach(() => jest.clearAllMocks())

it('ignores a url that does not belong to the POI', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['a.jpg'] })
  const res = await POST(req({ url: 'https://evil/x.jpg' }), ctx)
  expect(res.status).toBe(200)
  await expect(res.json()).resolves.toEqual({ data: { acted: false } })
  expect(mockHeal).not.toHaveBeenCalled()
})

it('ignores a url that is actually still alive (anti-abuse server confirm)', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['a.jpg'] })
  mockCheck.mockResolvedValue('alive')
  const res = await POST(req({ url: 'a.jpg' }), ctx)
  await expect(res.json()).resolves.toEqual({ data: { acted: false } })
  expect(mockHeal).not.toHaveBeenCalled()
})

it('heals when the url belongs to the POI and is confirmed dead', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['a.jpg'] })
  mockCheck.mockResolvedValue('dead')
  mockHeal.mockResolvedValue({ removed: 1, status: 'needs_refresh' })
  const res = await POST(req({ url: 'a.jpg' }), ctx)
  await expect(res.json()).resolves.toEqual({ data: { acted: true, removed: 1, status: 'needs_refresh' } })
  expect(mockHeal).toHaveBeenCalledWith({ poiId: 'p1', deadUrls: ['a.jpg'] })
})

it('rejects an invalid body with 400', async () => {
  const res = await POST(req({ nope: true }), ctx)
  expect(res.status).toBe(400)
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/contract/poi-photos.report-dead-photo.api.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement**

```typescript
// src/app/api/pois/[id]/report-dead-photo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { belongsToPoi } from '@/features/poi-photos/lib/liveness'
import { checkPhotoUrl } from '@/features/poi-photos/services/check-photo-url'
import { healPoiPhotos } from '@/features/poi-photos/services/heal-poi-photos'

type RouteContext = { params: Promise<{ id: string }> }

const BodySchema = z.object({ url: z.string().url() })

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const poi = await prisma.pointOfInterest.findUnique({ where: { id }, select: { photos: true } })
  if (!poi || !belongsToPoi(poi.photos, parsed.data.url)) {
    return NextResponse.json({ data: { acted: false } })
  }

  // Anti-abus : on ne retire que si NOTRE serveur confirme aussi que l'URL est morte.
  if ((await checkPhotoUrl(parsed.data.url)) === 'alive') {
    return NextResponse.json({ data: { acted: false } })
  }

  const result = await healPoiPhotos({ poiId: id, deadUrls: [parsed.data.url] })
  return NextResponse.json({ data: { acted: true, removed: result.removed, status: result.status } })
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/contract/poi-photos.report-dead-photo.api.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage**

```bash
git add "src/app/api/pois/[id]/report-dead-photo/route.ts" tests/contract/poi-photos.report-dead-photo.api.test.ts
```

---

## Task 7: Cron endpoint — `POST /api/internal/check-photo-liveness`

**Files:**
- Create: `src/app/api/internal/check-photo-liveness/route.ts`
- Test: `tests/contract/poi-photos.check-liveness-cron.api.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/contract/poi-photos.check-liveness-cron.api.test.ts
import { NextRequest } from 'next/server'

const mockBatch = jest.fn()
jest.mock('@/features/poi-photos/queries/check-photo-liveness-batch', () => ({
  checkPhotoLivenessBatch: (...a: unknown[]) => mockBatch(...a),
}))

import { POST } from '@/app/api/internal/check-photo-liveness/route'

const SECRET = 'test-internal-secret'
function req(auth?: string, body: unknown = {}): NextRequest {
  return new NextRequest('http://localhost/api/internal/check-photo-liveness', {
    method: 'POST',
    headers: { ...(auth ? { authorization: auth } : {}), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const realSecret = process.env.INTERNAL_API_SECRET
beforeEach(() => { jest.clearAllMocks(); process.env.INTERNAL_API_SECRET = SECRET })
afterAll(() => { if (realSecret === undefined) delete process.env.INTERNAL_API_SECRET; else process.env.INTERNAL_API_SECRET = realSecret })

it('returns 401 without a valid bearer and does not run the batch', async () => {
  const res = await POST(req())
  expect(res.status).toBe(401)
  expect(mockBatch).not.toHaveBeenCalled()
})

it('runs the batch with the requested limit when authorized', async () => {
  mockBatch.mockResolvedValue({ processed: 5, poisFlagged: 1, photosRemoved: 2 })
  const res = await POST(req(`Bearer ${SECRET}`, { limit: 5 }))
  expect(res.status).toBe(200)
  await expect(res.json()).resolves.toEqual({ data: { processed: 5, poisFlagged: 1, photosRemoved: 2 } })
  expect(mockBatch).toHaveBeenCalledWith(5)
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx jest tests/contract/poi-photos.check-liveness-cron.api.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement**

```typescript
// src/app/api/internal/check-photo-liveness/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkPhotoLivenessBatch } from '@/features/poi-photos/queries/check-photo-liveness-batch'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

const BodySchema = z.object({ limit: z.number().int().min(1).max(100).default(25) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown = {}
  try {
    body = await req.json()
  } catch {
    // Empty body is valid — limit defaults
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await checkPhotoLivenessBatch(parsed.data.limit)
  return NextResponse.json({ data: result })
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest tests/contract/poi-photos.check-liveness-cron.api.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage**

```bash
git add src/app/api/internal/check-photo-liveness/route.ts tests/contract/poi-photos.check-liveness-cron.api.test.ts
```

---

## Task 8: Client reactive wiring (`onError` → report + hide)

**Files:**
- Create: `src/features/poi-photos/lib/report-dead-photo.ts`
- Modify: `src/features/categories/components/PoiCard.tsx` (header foreground `<Image>`)
- Modify: `src/features/categories/components/PoiDetailBody.tsx` (hero `<Image>`)
- Test: `tests/integration/poi-photos.client-onerror.test.tsx`

> **Note:** PoiCard is actively edited by the user — touch ONLY the header `<Image>` + the gallery
> state, nothing else.

- [ ] **Step 1: Write the client helper**

```typescript
// src/features/poi-photos/lib/report-dead-photo.ts
'use client'

/** Signale une photo morte au serveur (fire-and-forget ; les erreurs sont ignorées). */
export function reportDeadPhoto(poiId: string, url: string): void {
  try {
    void fetch(`/api/pois/${poiId}/report-dead-photo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Write the failing integration test**

```tsx
// tests/integration/poi-photos.client-onerror.test.tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

jest.mock('@/shared/components/MarkdownText', () => ({ MarkdownText: () => <div /> }))

const poi: PoiCardType = {
  id: 'p1', name: 'Café Test', slug: 'cafe-test', address: '1 rue', subcategory_name: null,
  rating: null, rating_count: 0, is_open_now: null, distance_km: 1, photo_url: null,
  photos: ['https://x/dead.jpg'], phone: null, website: null, description: null,
  closes_at_label: null, next_open_label: null, latitude: 45, longitude: 6, trail_detail: null,
}

it('reports the photo and hides it when the header image fails to load', () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true })
  global.fetch = fetchMock as unknown as typeof fetch

  render(<PoiCard poi={poi} citySlug="annecy" categorySlug="cafes" />)
  const img = screen.getByRole('img', { name: 'Café Test' })
  fireEvent.error(img)

  expect(fetchMock).toHaveBeenCalledWith(
    '/api/pois/p1/report-dead-photo',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ url: 'https://x/dead.jpg' }) }),
  )
  expect(screen.queryByRole('img', { name: 'Café Test' })).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run test, verify it fails**

Run: `npx jest tests/integration/poi-photos.client-onerror.test.tsx`
Expected: FAIL — no `onError`, image still present after error.

- [ ] **Step 4: Wire PoiCard** — add dead-photo state + `onError` (header only)

In `PoiCard.tsx`, add the import near the other imports:

```tsx
import { reportDeadPhoto } from '@/features/poi-photos/lib/report-dead-photo'
```

Add state next to `photoIndex`:

```tsx
  const [deadPhotos, setDeadPhotos] = useState<Set<string>>(new Set())
```

Change `galleryPhotos` to drop dead ones:

```tsx
  const galleryPhotos = (poi.photos.length > 0 ? poi.photos : poi.photo_url ? [poi.photo_url] : [])
    .filter(url => !deadPhotos.has(url))
```

Add the handler near `showNextPhoto`:

```tsx
  function handlePhotoError() {
    if (!currentPhoto) return
    reportDeadPhoto(poi.id, currentPhoto)
    setDeadPhotos(prev => new Set(prev).add(currentPhoto))
    setPhotoIndex(0)
  }
```

Add `onError={handlePhotoError}` to the **foreground** `<Image>` (the `object-contain` one), not the backdrop.

- [ ] **Step 5: Run test, verify pass**

Run: `npx jest tests/integration/poi-photos.client-onerror.test.tsx`
Expected: PASS.

- [ ] **Step 6: Wire PoiDetailBody hero** (same pattern, single hero photo)

In `PoiDetailBody.tsx`, add:

```tsx
import { reportDeadPhoto } from '@/features/poi-photos/lib/report-dead-photo'
```

Add near the top of the component body:

```tsx
  const [heroFailed, setHeroFailed] = useState(false)
```

(Ensure `useState` is imported from `'react'`; add `'use client'` only if the file is already a client component — if it is a server component, instead pass the failure handling down or skip the detail-hero wiring and keep only PoiCard for MVP.)

Guard the hero render with `poi.photos[0] && !heroFailed` and add to the hero `<Image>`:

```tsx
            onError={() => { reportDeadPhoto(poi.id, poi.photos[0]); setHeroFailed(true) }}
```

> If `PoiDetailBody` is a server component (no `'use client'`), DO NOT convert it. Limit the reactive
> wiring to `PoiCard` for the MVP and note it; the cron still covers detail-page photos.

- [ ] **Step 7: Run the PoiCard suite to confirm no regression**

Run: `npx jest tests/integration/categories.AC-01-02.poi-card-renders.test.tsx tests/integration/poi-photos.client-onerror.test.tsx`
Expected: PASS (all).

- [ ] **Step 8: Stage**

```bash
git add src/features/poi-photos/lib/report-dead-photo.ts src/features/categories/components/PoiCard.tsx src/features/categories/components/PoiDetailBody.tsx tests/integration/poi-photos.client-onerror.test.tsx
```

---

## Task 9: Admin surface — `needs_refresh` flag in the POI list

**Files:**
- Modify: `src/features/admin-pois/queries/admin-pois.ts` (`adminPoiSelect` + list mapper)
- Modify: `src/features/admin-pois/types.ts` (`AdminPoiListItem`)
- Modify: `src/app/admin/pois/page.tsx` (badge)

- [ ] **Step 1: Add `photos_status` to the list select**

In `admin-pois.ts`, add to the `adminPoiSelect` object:

```typescript
  photos_status: true,
```

If `listAdminPois` maps rows into `AdminPoiListItem` explicitly, add `photos_status: row.photos_status` to that mapping; if it returns the selected rows directly, no mapper change is needed.

- [ ] **Step 2: Add the field to the type**

In `admin-pois/types.ts`, add to `AdminPoiListItem`:

```typescript
  photos_status: string
```

- [ ] **Step 3: Render the badge** in `src/app/admin/pois/page.tsx`

Where each POI row renders (near the name / status cells), add:

```tsx
{poi.photos_status === 'needs_refresh' && (
  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
    Photos à rafraîchir
  </span>
)}
```

- [ ] **Step 4: Verify tsc + the admin-pois contract test still passes**

Run: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"` → no output.
Run: `npx jest tests/contract/admin-pois.AC-01-04.api.test.ts` → PASS.

- [ ] **Step 5: Stage**

```bash
git add src/features/admin-pois/queries/admin-pois.ts src/features/admin-pois/types.ts src/app/admin/pois/page.tsx
```

---

## Task 10: Full verification

- [ ] **Step 1: tsc**

Run: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"`
Expected: no output.

- [ ] **Step 2: Full poi-photos + touched suites**

Run: `npx jest poi-photos tests/integration/categories.AC-01-02.poi-card-renders.test.tsx tests/contract/admin-pois`
Expected: all green.

- [ ] **Step 3: Smoke the cron endpoint locally** (dev server running)

Run: `curl -s -X POST -H "Authorization: Bearer $INTERNAL_API_SECRET" -H 'content-type: application/json' -d '{"limit":5}' http://localhost:3000/api/internal/check-photo-liveness`
Expected: `{"data":{"processed":..,"poisFlagged":..,"photosRemoved":..}}`.

- [ ] **Step 4: Hand the staged changes to the user to commit.**

---

## Self-review

- **Spec coverage:** schema flag+checked_at (T1) ✔; dead-link pure detection (T2) ✔; HEAD/GET liveness (T3) ✔; remove+flag+re-acquire heal (T4) ✔; cron batch (T5,T7) ✔; reactive endpoint with anti-abuse (T6) ✔; client onError+hide (T8) ✔; admin flag surface (T9) ✔; website-only re-acquire / needs_refresh on 0 photos (T4) ✔; out-of-scope (content-change, Google re-fetch) honored — not implemented ✔.
- **Placeholder scan:** all steps contain runnable code/commands; the only conditional is T8 Step 6 (PoiDetailBody server-vs-client) which gives an explicit fallback instruction.
- **Type consistency:** `healPoiPhotos({poiId, deadUrls}) → {removed, status}`, `checkPhotoUrl → 'alive'|'dead'`, `checkPhotoLivenessBatch(limit) → {processed, poisFlagged, photosRemoved}`, `belongsToPoi(photos, url)` — names match across tasks and tests.
- **Cron tuning** (batch size, "two consecutive failures before delete") intentionally left to ops; current design deletes on a single confirmed-dead check, which is safe because removal is reversible via re-acquisition and the cron re-checks remaining photos each sweep.
