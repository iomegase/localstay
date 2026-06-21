# Design — Admin Analytics Intraday Extension

Date: 2026-06-21
Owner: Product Owner
Status: validated in conversation, pending written review
Scope: extend approved spec `030-admin-analytics-dashboard` before implementation

## Purpose

Add an intraday analytics layer to the existing admin analytics cockpit without breaking the original separation of concerns:

- `GA4 aujourd'hui` for same-day engagement totals
- `Live Vercel` for recent traffic
- `GSC` kept as delayed SEO acquisition data

This design exists to remove the current ambiguity where the admin page is technically connected to analytics sources but cannot surface the metrics the Product Owner expects after same-day public traffic tests.

## Why This Change Is Needed

The approved dashboard already distinguishes:

- consolidated daily snapshots
- a separate `live` block
- delayed SEO data

However, the current behavior still leaves an important gap:

- GA4 snapshots stop at `yesterday`
- GSC is intentionally delayed
- the Vercel `live` block is not yet backed by a real server-side fetch path

As a result, a same-day navigation test on `mystay.city` can legitimately produce no visible metric in `/admin/analytics`, which is confusing for product validation.

## Approved Product Decisions

Validated in conversation:

- do not merge GA4 intraday metrics into the existing Vercel `live` block
- keep `GSC` as delayed SEO reporting
- add a dedicated `GA4 aujourd'hui` block
- keep the existing `live` block reserved for Vercel recent traffic
- do not persist intraday GA4 metrics in Prisma for V1

## Constraints

- The existing approved spec `030-admin-analytics-dashboard` remains the source of truth and must be amended before implementation.
- The main dashboard overview must continue reading internal snapshots for consolidated KPIs.
- The `live` block must remain visually and semantically separate from historical reporting.
- No unsupported scraping of Vercel dashboard HTML is allowed.
- No undocumented private Vercel API is allowed.
- No analytics credential is exposed to the browser.

## Approaches Considered

### 1. Merge GA4 intraday into the existing `live` block

Why rejected:

- `GA4` and `Vercel` are not equivalent sources
- `GA4` depends on user consent while `Vercel` does not
- the numbers would diverge by design and become hard to interpret
- this would weaken the contract of the existing `live` block

### 2. Add a separate `GA4 aujourd'hui` block and keep `live` as Vercel-only

Why selected:

- preserves source clarity
- matches the Product Owner decision
- respects the existing dashboard separation
- allows same-day admin feedback without contaminating historical KPIs

### 3. Persist intraday reads into new database tables

Why rejected for V1:

- more schema and cron complexity
- weak business value for the immediate need
- unnecessary duplication of short-lived data

## Recommended Architecture

### Reporting Layers

#### Layer 1: historical consolidated reporting

Unchanged:

- `overview`, `pages`, `queries`, `cities`, `performance`
- backed by internal daily snapshots
- `GA4` and `GSC` imported by sync jobs

#### Layer 2: intraday direct-read reporting

New:

- a dedicated `GA4 aujourd'hui` block read directly from the GA4 Data API
- no persistence in Prisma for V1
- rendered as an isolated admin block with its own degraded states

#### Layer 3: recent traffic live reporting

Clarified:

- the existing `live` block remains Vercel-only
- it must use a real supported server-side retrieval path if one is available to this project/account
- if such a supported path is not available in the current environment, the block remains degraded without breaking the page

## Data Source Strategy

### GA4 today

Source:

- Google Analytics Data API `properties.runReport`

Why this path:

- it supports `dateRanges`
- it is better suited to same-day total values than the realtime endpoint
- it gives a stable shape for `sessions`, `users`, `page_views`, and optionally `engagement_rate`

Selected scope for V1:

- `sessions`
- `users`
- `page_views`
- `engagement_rate`

Important note:

- this block is intraday direct-read, not a daily snapshot replacement
- slight source lag is acceptable

### Vercel live

Source:

- Vercel-supported live traffic retrieval path only

Selected rule:

- use an official or project-supported server-side path available to the current project/account
- do not scrape the Vercel dashboard
- do not call undocumented private platform endpoints

Fallback:

- if the environment cannot provide a supported read path, return `no_data` or `not_configured` exactly as already allowed by spec `030`

### GSC delayed

Unchanged:

- Search Console remains delayed SEO reporting
- it does not participate in intraday product validation

## API Contract Delta

### Keep unchanged

- `GET /api/admin/analytics/overview`
- `GET /api/admin/analytics/live`

### Add

- `GET /api/admin/analytics/ga4-today`

Response shape:

- `status`
- `window_label`
- `sessions`
- `users`
- `page_views`
- `engagement_rate`

Behavior:

- `connected` when the direct read succeeds
- `not_configured` when GA4 direct-read credentials are missing
- `failed` when the source call errors and no fallback is available
- `no_data` when the source is reachable but returns no usable row

## UI Design

### Source ordering

The source status cards stay unchanged. They describe source configuration and sync status, not intraday block visibility.

### New block placement

Insert the new `GA4 aujourd'hui` block between:

- consolidated KPI rows
- existing `Live` Vercel block

This keeps the page readable:

1. historical consolidated KPIs
2. same-day GA4 snapshot-like intraday totals
3. Vercel recent traffic live block
4. analysis tables

### Labeling

Recommended labels:

- `GA4 aujourd'hui`
- `Live Vercel`

The wording must make the freshness difference obvious.

## Error Handling

### GA4 today

- Missing env or unsupported credentials: `not_configured`
- Upstream Google error: `failed`
- Valid call with no row: `no_data`

### Vercel live

- Missing project/account retrieval path: `not_configured`
- Supported path unavailable at runtime: `failed`
- Valid call with no live metrics: `no_data`

Neither degraded state may break the rest of `/admin/analytics`.

## Testing Strategy

### Unit

- `GA4 today` service normalizes a same-day API response
- `GA4 today` block maps no-row and error states correctly
- `live` Vercel block preserves graceful degradation rules

### Contract

- `GET /api/admin/analytics/ga4-today` validates admin access and returns the documented shape
- `GET /api/admin/analytics/live` keeps its Vercel-only contract

### Integration

- admin page renders the new `GA4 aujourd'hui` block
- degraded intraday blocks do not hide consolidated KPIs

## Risks

- GA4 same-day data may lag slightly
- Vercel may not expose a supported server-side read path on this project/account
- source discrepancies between `GA4 aujourd'hui` and `Live Vercel` are expected and must remain explicit in the UI

## Non-Goals

- no unified intraday total mixing GA4 and Vercel
- no new Prisma model for intraday reporting
- no GSC intraday mode
- no dashboard HTML scraping
- no undocumented Vercel private API usage

## Implementation Recommendation

Implement in this order:

1. amend spec `030-admin-analytics-dashboard`
2. add `GA4 today` API/service/query/UI block
3. refactor `live` into an explicit Vercel-only fetcher boundary
4. implement Vercel supported-path fetch if a compliant retrieval path is available
5. otherwise keep the spec-compliant degraded fallback for `live`
