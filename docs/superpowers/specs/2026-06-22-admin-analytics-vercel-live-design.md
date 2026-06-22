# Design — Admin Analytics Vercel Live Pipeline

Date: 2026-06-22
Owner: Product Owner
Status: validated in conversation, pending written review
Scope: extend approved spec `030-admin-analytics-dashboard` before implementation

## Purpose

Complete the missing Vercel live analytics chain inside StayLocal so that `mystay.city` can surface recent traffic in `/admin/analytics` without scraping the Vercel dashboard or relying on undocumented private APIs.

This design keeps the already-approved separation:

- historical reporting from internal daily snapshots
- same-day GA4 direct-read in `GA4 aujourd'hui`
- recent Vercel traffic in a dedicated `live` block

## Why This Change Is Needed

The current admin analytics implementation can render a Vercel live block only if a supported server-side source already exists behind `VERCEL_ANALYTICS_LIVE_ENDPOINT`.

That adapter is intentionally generic, but the project still lacks:

- a supported ingestion path for Vercel Web Analytics events
- a recent-event storage model inside StayLocal
- a first-party aggregation endpoint at `https://mystay.city/api/internal/analytics/vercel-live`

Without those three pieces, the dashboard remains structurally correct but operationally incomplete.

## Approved Product Decision

Validated in conversation:

- implement the full live pipeline in the StayLocal repo
- use a supported Vercel source path
- keep the domain target as `mystay.city`

## Constraints

- The source of truth for this feature remains approved spec `030-admin-analytics-dashboard`.
- No scraping of Vercel dashboard HTML.
- No undocumented Vercel private API.
- No exposure of live analytics credentials to the browser.
- Historical admin KPI snapshots remain unchanged.
- The live storage must not overload the existing append-only business `Analytics` table.

## Approaches Considered

### 1. External proxy only

Point `VERCEL_ANALYTICS_LIVE_ENDPOINT` to a third-party service outside the repo.

Why rejected:

- hides critical logic outside StayLocal
- harder to audit and test
- couples admin analytics to an opaque external dependency

### 2. Full first-party pipeline inside StayLocal

Receive supported Vercel analytics events via Drains, store recent raw events locally, aggregate them through an internal endpoint, and let the admin dashboard read that endpoint.

Why selected:

- fully owned by StayLocal
- consistent with the existing internal analytics architecture
- testable end-to-end
- no unsupported Vercel access pattern

## Recommended Architecture

### Layer 1: Vercel-supported event delivery

Source:

- Vercel Web Analytics Drains

Expected payload family:

- `vercel.analytics.v2`
- event types such as `pageview` and optional custom events

Delivery target:

- `POST https://mystay.city/api/internal/analytics/vercel-drain?token=<VERCEL_ANALYTICS_DRAIN_SECRET>`

Reason for query-param secret:

- the drain destination URL is configurable
- this avoids relying on undocumented custom-header behavior for Drains
- the route remains server-to-server and outside the browser

### Layer 2: Recent raw storage

Add a dedicated append-only model:

- `AnalyticsVercelLiveEvent`

This model stores only recent raw analytics material needed for live aggregation. It is explicitly separate from:

- the business `Analytics` table
- the daily admin snapshot tables

Core fields:

- dedupe key for idempotent ingestion
- source event metadata
- occurred timestamp
- session/device identifiers when present
- page path
- referrer when present
- optional raw JSON for audit/debug

### Layer 3: First-party live aggregation

Add a server route:

- `GET /api/internal/analytics/vercel-live`

Security:

- `Authorization: Bearer ${VERCEL_ANALYTICS_LIVE_TOKEN}`

Behavior:

- reads only recent `AnalyticsVercelLiveEvent` rows
- default aggregation window: last 30 minutes
- returns:
  - `window_label`
  - `visitors`
  - `page_views`
  - `top_pages`
  - `top_referrers`

### Layer 4: Existing admin consumption

Unchanged:

- the admin dashboard still calls the existing live adapter
- `VERCEL_ANALYTICS_LIVE_ENDPOINT` points to `https://mystay.city/api/internal/analytics/vercel-live`

This preserves the current separation between:

- admin UI
- live provider contract
- ingestion/storage internals

## Data Model Strategy

### New model

`AnalyticsVercelLiveEvent`

Purpose:

- store recent Vercel analytics events for live admin aggregation

Important rules:

- append-only writes
- no mutation of event meaning after ingestion
- soft delete for retention cleanup
- dedupe on a deterministic key computed from the delivered event payload

### Retention

Keep only a short rolling window in active storage.

Recommended V1 rule:

- soft-delete rows older than 7 days

This is long enough for debugging and replay checks, while keeping the table bounded.

## API Contract Delta

### Add ingestion route

- `POST /api/internal/analytics/vercel-drain`

Responsibilities:

- validate secret token
- validate payload shape
- persist normalized recent rows idempotently
- return a structured success/error response

### Add internal live route

- `GET /api/internal/analytics/vercel-live`

Responsibilities:

- validate bearer token
- aggregate last 30 minutes of recent rows
- return the existing admin live block shape

## Error Handling

### Drain ingestion

- invalid or missing secret: reject
- malformed payload: reject with validation error
- duplicate event: accept idempotently without creating a second row

### Live aggregation

- missing bearer token: reject
- no recent rows: return connected block shape with zero/empty metrics or a `no_data` block depending on contract choice
- storage/query issue: return structured error to the caller route

## Testing Strategy

### Unit

- normalize a valid Vercel drain event
- dedupe key generation is stable
- live aggregation computes visitors/page views/top pages/top referrers correctly

### Contract

- drain route rejects invalid secret
- drain route accepts valid payload
- live route rejects invalid bearer token
- live route returns the documented live shape

### Integration

- dashboard live block renders recent Vercel values when recent rows exist
- dashboard remains stable when no live rows exist

## Risks

- referrer richness depends on the fields actually present in the supported Vercel drain payload
- drains are eventually delivered, not guaranteed to be millisecond realtime
- if Drains are not configured in Vercel, the block remains degraded by design

## Non-Goals

- no replacement of daily snapshot syncs
- no monetization KPIs
- no browser-side exposure of ingestion/live secrets
- no merge between GA4 intraday and Vercel live
