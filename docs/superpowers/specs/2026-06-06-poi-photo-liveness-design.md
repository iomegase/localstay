# POI Photo Liveness — Detect & heal dead photo URLs

**Status:** Design (approved fork-by-fork in brainstorming, pending written-spec review)
**Date:** 2026-06-06

## Goal

POI photos are stored as **raw external URLs** scraped from official websites and Google Places.
When a webmaster deletes / renames / moves an image, our stored URL rots → broken image in the
guide. We want to **detect dead photo URLs**, **remove** them, **flag the POI for admin review**,
and **best-effort auto re-acquire** replacement photos.

## Decisions (locked during brainstorming)

| # | Question | Decision |
|---|----------|----------|
| 1 | Outcome on detection | **(b) flag POI for admin review + (c) auto re-acquire** |
| 2 | Detection trigger | **(c) hybrid** — reactive (client `onError`) **and** proactive (internal cron) |
| 3 | Detection scope | **(a) dead-link only** — non-2xx status **or** non-`image/*` content-type. No content-change/fingerprint detection. |
| 4 | Re-acquisition strategy | **(a) website-only best-effort** — reuse `refresh-official-photos`; if not recovered, POI stays flagged for manual review. No Google Places re-fetch (avoid quota/cost). |

## Current state (verified)

- `PointOfInterest.photos String[]` (schema line 100) — flat URL array, **no per-photo source tracking**.
- Photos come from **two sources**: Google Places (primary) and official-website scraping
  (`src/features/poi-acquisition/services/official-website-photos.ts`).
- `mergeOfficialWebsitePhotos(existing, official)` = `dedupe([...existing, ...official]).slice(0, MAX)`
  → **merges, never removes**. So re-acquisition alone won't drop a dead URL; we must remove it explicitly.
- Re-acquisition endpoint exists: `POST /api/admin/pois/[id]/refresh-official-photos` (website only).
- Internal cron pattern exists & is Bearer-secured: `/api/internal/*`
  (`geocode-pois`, `cleanup-stale-candidates`, `refine-trail-geometry`, `check-subscriptions`…).
- Display: `next/image` `unoptimized` (arbitrary domains), blur-backdrop + `object-contain` foreground
  in `PoiCard` header; hero in `PoiDetailBody`.

**Consequence of (a) + no source tracking:** a dead **Google Places** photo is *removed* but cannot be
*auto-replaced* (website scrape won't recover it). The POI is then flagged `needs_refresh` for manual
review. This is accepted for the MVP.

## Architecture

Small, isolated units. Pure logic is separated from I/O so it is unit-testable without network/DB.

### 1. Schema (`PointOfInterest`)
- `photos_status String @default("ok")` — `ok | needs_refresh` (admin flag).
- `photos_checked_at DateTime?` — last liveness sweep (drives cron ordering).
- Index: `@@index([photos_status, photos_checked_at])` for cron batch selection.
- Migration applied surgically (`ADD COLUMN IF NOT EXISTS`) given the known shadow-DB / pgbouncer
  constraints in this repo.

### 2. Pure core (`src/features/poi-photos/lib/`)
- `isDeadPhotoResponse({ status, contentType }): boolean`
  → dead if `status < 200 || status >= 300` **or** `!contentType?.startsWith('image/')`.
- `removeDeadPhotos(photos: string[], deadUrls: string[]): string[]`
  → returns a new array without the dead URLs (set-based, order-preserving).
- `belongsToPoi(photos: string[], url: string): boolean` — anti-abuse guard for the reactive endpoint.

### 3. Liveness fetcher (thin I/O wrapper, `src/features/poi-photos/services/`)
- `checkPhotoUrl(url): Promise<'alive' | 'dead'>`
  → `HEAD` (fallback `GET` if HEAD unsupported), realistic `User-Agent`, short timeout (~5s),
  classify via `isDeadPhotoResponse`. Network error / timeout → `dead`.

### 4. Reactive path (client)
- `PoiCard` / `PoiDetailBody` foreground `<Image onError>` → `POST /api/pois/[id]/report-dead-photo { url }`.
- Endpoint: load POI; `belongsToPoi` guard; `removeDeadPhotos`; set `photos_status='needs_refresh'`;
  fire-and-forget re-acquisition (website-only). Idempotent (removing an already-removed URL is a no-op).
- Visual fallback: when the foreground image errors, the card/hero shows the existing gradient
  placeholder (the blur backdrop shares the same `src`, so it also fails → must fall back too).

### 5. Proactive path (cron)
- `POST /api/internal/check-photo-liveness` (Bearer secret, like siblings).
- Select a batch of active POIs ordered by `photos_checked_at ASC NULLS FIRST`, `limit N`.
- For each: `checkPhotoUrl` every photo; `removeDeadPhotos`; if any removed → `needs_refresh` +
  trigger re-acquisition; always set `photos_checked_at = now()`.
- Scheduled via the repo's existing cron mechanism.

### 6. Re-acquisition (shared helper)
- After removing dead URLs, call the website-only re-acquire (reuse `refresh-official-photos` logic).
- Clear-flag rule: if after re-acquire the POI has **≥1 photo**, set `photos_status='ok'`; otherwise
  keep `needs_refresh` for manual admin review.

### 7. Admin surface (b)
- `/admin/pois`: a **"Photos à rafraîchir"** filter + row badge for `photos_status='needs_refresh'`,
  alongside the existing refresh button.

## Data flow

```
dead image (browser onError)  ─┐
                               ├─► remove URL ─► flag needs_refresh ─► website re-acquire ─► ≥1 photo? ok : stay flagged
cron sweep (HEAD non-2xx)     ─┘                                                              │
                                                                                  admin sees flag + refresh button
```

## Error handling / edge cases
- **False positives** (anti-hotlink / 403 / UA blocking on *our* request): the reactive path is the
  ground-truth signal (a real browser failed to render). The cron uses a realistic UA + treats only
  clear non-2xx / non-image as dead; ambiguous network errors are retried next sweep (not hard-deleted
  on first failure — see "Open for implementation").
- **Abuse** on the public reactive endpoint: only URLs already present in that POI's `photos` are acted
  on; unknown URLs are ignored. No new data is created.
- **Idempotency**: removal + flag are idempotent; concurrent reports converge.
- **All photos dead**: POI ends with empty `photos`; UI shows gradient; flagged for manual review.

## Out of scope (YAGNI / deferred)
- Content-change detection (ETag / hash) — decision #3 = dead-link only.
- Google Places re-fetch on dead photo — decision #4 = website-only.
- Re-hosting photos on Supabase (would eliminate link-rot at the source) — separate, larger initiative.

## Testing strategy (TDD)
- **Pure** (`isDeadPhotoResponse`, `removeDeadPhotos`, `belongsToPoi`): exhaustive unit tests
  (200+image→alive; 404/500→dead; 200+text/html→dead; 403→dead; removal set logic; ownership guard).
- **Contracts**: `report-dead-photo` (removes + flags + ignores foreign URL), `check-photo-liveness`
  (batch removal + `photos_checked_at` update + Bearer auth).
- **Client**: `<Image onError>` posts the failed URL; gradient fallback renders.

## Open for implementation (not blocking the spec)
- Cron batch size `N` and schedule cadence.
- Whether the cron requires *two* consecutive failed sweeps before deleting a URL (reduce transient
  false positives) — recommended but tunable.
- Exact clear-flag threshold (≥1 photo vs a minimum count).
