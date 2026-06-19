# Design — Admin Analytics SEO/GEO Dashboard

Date: 2026-06-19
Owner: Product Owner
Status: validated in conversation, pending written review
Scope: preparation design only, no production code

## Purpose

Define a V1 admin cockpit that centralizes the metrics needed to test and improve SEO and GEO for StayLocal, while preserving the current spec-driven workflow of the repository.

This design does not authorize code under `src/`. It prepares the future approved feature spec(s) required before implementation.

## Project Constraints

- `src/` code remains blocked until a feature spec in `specs/features/` is approved.
- The existing approved spec `016-dashboard-superadmin` remains the source of truth for `/admin` in MVP 2.
- The new analytics cockpit must therefore be additive and must not silently alter the contract of `/api/admin/overview`.
- GA4 client tracking requires explicit user consent before any third-party client-side measurement starts.

## Product Outcome

The admin team wants one place to monitor:

- SEO acquisition
- GEO/visibility signals
- on-site engagement
- business-oriented micro-conversions
- future monetization readiness

The site is still free today. Payment and subscriptions will arrive later, so the V1 cockpit must already capture the signals that matter before Stripe monetization exists.

## Approved Decisions

The following decisions were validated during the conversation:

- Sources: `Vercel Analytics` + `Vercel Speed Insights` + `GA4` + `Google Search Console`
- Scope: both `SEO acquisition` and `engagement/conversion`
- Dashboard level: `executive + analysis tables + city-level views`
- Freshness model: `daily consolidated snapshot + separate Vercel live block`
- Consent model: `GA4 only after explicit consent`
- Conversion strategy: aggregate all currently available actionable signals and prepare the future blocking points for monetization tracking

## Goals

- Give admins one reliable cockpit for SEO/GEO decision-making
- Separate stable historical reporting from recent live traffic
- Segment performance by `City` when a public URL maps deterministically to a city slug
- Expose source health and sync freshness inside admin
- Reuse existing public pages and existing business events where possible
- Prepare the future addition of subscription-related conversion tracking without redesigning the whole stack

## Non-Goals for V1

- No billing, revenue, Stripe Checkout, Customer Portal, or subscription KPIs
- No direct use of external dashboards embedded in the app
- No replacement of the current `Analytics` business-event table
- No real-time unified cross-source analytics
- No probabilistic city attribution

## Approaches Considered

### 1. Live-only external reads

Read external sources directly from admin pages on every request.

Why rejected:

- external latency and quota risk
- mixed freshness across sources
- hard to test reliably
- weak support for city-level normalized reporting

### 2. Daily consolidated snapshots + separate live block

Import source data into internal normalized snapshot tables, then expose a dedicated admin analytics page that reads only internal reporting data, plus one isolated recent-traffic block from Vercel.

Why selected:

- stable and comparable reporting
- fast admin pages
- clean separation between historical reporting and recent traffic
- compatible with spec-driven additive implementation

### 3. External dashboard links or embeds

Send admins to GA4/GSC/Vercel or embed them indirectly.

Why rejected:

- poor product integration
- hard to secure and test
- weak fit with current admin architecture

## Recommended Architecture

### Reporting Layers

#### Layer 1: External collection

- Google Search Console for acquisition metrics:
  - impressions
  - clicks
  - CTR
  - average position
  - queries
  - landing pages
- GA4 for on-site engagement and conversion metrics:
  - sessions
  - users
  - engagement rate
  - page views
  - event-based conversions
- Vercel Analytics for recent traffic and web usage dimensions
- Vercel Speed Insights for Core Web Vitals and performance quality

Important note:

- GA4 and GSC have explicit API-based reporting paths.
- Vercel Analytics and Speed Insights are valid product sources, but the future implementation spec must still choose the supported retrieval path available to this project and account.

#### Layer 2: Internal normalized reporting

Internal database tables store normalized daily snapshots and sync status.

Admin pages read:

- consolidated internal snapshots for the main dashboard
- an isolated recent Vercel feed for the live block

Admin pages do not call GA4 or GSC directly during normal page rendering.

## Page Strategy

The current `/admin` page remains governed by approved spec `016-dashboard-superadmin`.

The analytics cockpit is introduced as a dedicated additive page:

- `/admin/analytics`

The current `/api/admin/overview` contract stays unchanged.

The navigation receives one new additive link:

- `Analytics SEO/GEO`

## Data Model Design

### Principle

Do not overload the current `Analytics` model used for internal business events such as `qr_scan`, `poi_click`, `phone_click`, `directions_click`, and similar domain events.

SEO/GEO reporting data is external, aggregated, source-specific, and delayed. It needs its own normalized reporting models.

### Proposed Internal Models

#### `AnalyticsSourceSync`

Purpose:

- track each sync run by source
- expose configuration and freshness status in admin

Suggested fields:

- `id`
- `created_at`
- `updated_at`
- `source` = `ga4 | gsc | vercel_analytics | vercel_speed_insights`
- `status` = `success | partial | failed | not_configured`
- `period_start`
- `period_end`
- `started_at`
- `finished_at`
- `last_success_at`
- `error_code`
- `error_message`
- `details_json`

#### `AnalyticsDailySnapshot`

Purpose:

- store global daily KPI values for consolidated reporting

Suggested fields:

- `id`
- `snapshot_date`
- `sessions`
- `users`
- `page_views`
- `engagement_rate`
- `seo_impressions`
- `seo_clicks`
- `seo_ctr`
- `seo_avg_position`
- `contact_leads`
- `owner_email_clicks`
- `mystay_email_clicks`
- `lodging_contact_clicks`
- `external_booking_clicks`
- `qr_scans`

#### `AnalyticsPageDailySnapshot`

Purpose:

- daily metrics per canonical public page

Suggested fields:

- `id`
- `snapshot_date`
- `page_path`
- `page_type`
- `city_id` nullable
- `sessions`
- `users`
- `page_views`
- `engagement_rate`
- `seo_impressions`
- `seo_clicks`
- `seo_ctr`
- `seo_avg_position`
- `contact_leads`
- `external_booking_clicks`
- `qr_scans`

#### `AnalyticsQueryDailySnapshot`

Purpose:

- daily Search Console metrics by search query

Suggested fields:

- `id`
- `snapshot_date`
- `query`
- `page_path` nullable
- `city_id` nullable
- `clicks`
- `impressions`
- `ctr`
- `avg_position`

#### `AnalyticsCityDailySnapshot`

Purpose:

- normalized daily reporting by StayLocal city

Suggested fields:

- `id`
- `snapshot_date`
- `city_id`
- `sessions`
- `users`
- `page_views`
- `seo_impressions`
- `seo_clicks`
- `seo_ctr`
- `seo_avg_position`
- `contact_leads`
- `external_booking_clicks`
- `qr_scans`

#### `AnalyticsPerfDailySnapshot`

Purpose:

- daily performance rollups used by admin

Suggested fields:

- `id`
- `snapshot_date`
- `page_path` nullable
- `city_id` nullable
- `core_web_vitals_pass_rate`
- `lcp`
- `inp`
- `cls`

### Optional Configuration Model

#### `AnalyticsSourceConfig`

Purpose:

- track source readiness and identifiers inside the product without storing raw secrets in source control

Suggested fields:

- `id`
- `source`
- `property_id` nullable
- `site_identifier` nullable
- `is_enabled`
- `created_at`
- `updated_at`

Secrets themselves remain in environment variables or provider configuration.

## URL to City Mapping

### Deterministic Mapping Only

City segmentation exists only when the public URL can be mapped deterministically to a `City.slug`.

Accepted patterns for V1:

- `/guide/[city-slug]`
- `/guide/[city-slug]/contact`
- `/guide/[city-slug]/logements/[lodging-slug]`
- future public routes only if their spec defines a stable city-first path contract

### Mapping Rules

- match by exact path pattern, never by fuzzy text
- resolve city through `city.slug`
- if no deterministic mapping exists, keep the metric global with `city_id = null`

## Event Strategy for V1

### Existing Signals to Reuse

- `qr_scan` from the current internal analytics flow
- public contact form submissions via `ContactMessage`
- external booking CTA clicks already identified on lodging public pages
- existing public `mailto:` entry points

### New GA4 Client Events to Define

- `contact_form_submit`
- `owner_email_click`
- `mystay_email_click`
- `lodging_contact_click`
- `lodging_external_booking_click`

### Future-Ready Events

Not required in V1, but the design must leave room for:

- `owner_signup_interest`
- `concierge_signup_interest`
- `subscription_cta_click`
- future Stripe-related conversion milestones

## Consent Strategy

### Rule

No GA4 client-side measurement before explicit opt-in.

### Behavior

- public pages show a consent banner
- consent states are `unset`, `accepted`, `refused`
- GA4 script loading is conditional on `accepted`
- client events are dropped or not emitted before opt-in

### Scope Clarification

- GA4 is consent-gated because it is client-side third-party tracking
- GSC data is provider-side reporting, not browser tracking
- Vercel Analytics and Speed Insights are source inputs for reporting, but this design does not redefine their provider-level legal mode; the future implementation spec must document how they are configured in production

## Synchronization Strategy

### Main Daily Consolidation

Run a daily import job that:

- pulls Search Console acquisition data
- pulls GA4 engagement and conversion data
- pulls Vercel reporting data needed for consolidation through the supported project access path
- pulls Speed Insights performance aggregates through the supported project access path
- normalizes all data into the reporting tables
- stores source sync status in `AnalyticsSourceSync`

If a direct supported retrieval path is unavailable for some Vercel metrics, the future implementation spec may define a first-party internal mirror for the specific metrics required by the cockpit, rather than blocking the whole feature.

### Live Block

Expose a separate recent-traffic block based on Vercel only.

Characteristics:

- recent period such as last `60 minutes` or `24 hours`
- visually separated from daily consolidated reporting
- never merged into historical KPI totals

## Admin API Design

All routes are additive, admin-protected, Zod-validated, and return the standard project error format.

### Existing Route Kept Intact

- `/api/admin/overview`

### New Routes

- `/api/admin/analytics/overview`
  - consolidated KPI summary
- `/api/admin/analytics/live`
  - recent Vercel traffic block
- `/api/admin/analytics/pages`
  - page-level analysis with filters
- `/api/admin/analytics/queries`
  - Search Console query analysis
- `/api/admin/analytics/cities`
  - city-level reporting
- `/api/admin/analytics/performance`
  - performance reporting
- `/api/admin/analytics/sources`
  - source status and sync health

### Filter Strategy

Expected filters across routes:

- `date_from`
- `date_to`
- `city_id` nullable
- `source` where relevant
- `device` where relevant
- `limit`
- `cursor` or `page`

## Admin UI Design

### Route

- `/admin/analytics`

### Sections

#### 1. Source Status Bar

Shows for each source:

- connected / missing / failed / stale
- last successful sync
- sync error if any

#### 2. Acquisition KPI Row

- SEO impressions
- SEO clicks
- SEO CTR
- average position
- active landing pages

#### 3. Engagement and Conversion KPI Row

- sessions
- users
- page views
- engagement rate
- contact leads
- lodging contact clicks
- external booking clicks
- qr scans

#### 4. Live Block

- recent visitors
- recent top pages
- recent top referrers

#### 5. Top Pages Table

Columns:

- page path
- page type
- city if linked
- sessions
- SEO clicks
- conversions

#### 6. Top Queries Table

Columns:

- query
- clicks
- impressions
- CTR
- average position
- city if linked

#### 7. City Performance Table

Columns:

- city
- sessions
- SEO clicks
- conversions
- top page summary

#### 8. Performance Block

- Core Web Vitals pass rate
- worst pages to inspect
- pages improving or degrading

## Error Handling and Fallback Rules

### Source Not Configured

- show `not configured`
- keep the page usable
- no fake zeroes that hide missing setup

### Source Failure

- retain the latest valid snapshot
- show the source as `failed` or `stale`
- expose the last error message in source status

### Partial Data Availability

- show the freshest valid data per reporting block
- label blocks with `last updated at`
- avoid blending delayed and recent numbers into one misleading KPI

### Empty Data

- distinguish `no data yet` from `source unavailable`

## Testing Strategy

The future feature spec must define acceptance criteria that map to:

- unit tests for URL-to-city mapping and reporting transforms
- contract tests for `/api/admin/analytics/*`
- integration tests for `/admin/analytics` rendering and empty/error states
- integration or contract tests for consent-gated GA4 script behavior
- integration tests for source status and fallback display

## Implementation Blockers to Prepare

The implementation must explicitly prepare for these blockers:

### 1. Source Credentials and Identifiers

- GA4 property identifier
- Search Console site identifier
- Vercel reporting access strategy
- Speed Insights access strategy
- confirmation of which Vercel metrics can be read directly versus which ones require internal first-party mirroring

### 2. Consent Infrastructure

- banner component
- consent persistence
- conditional GA4 loader
- event dispatch guard

### 3. Background Sync

- scheduled jobs
- retry strategy
- source status persistence

### 4. Mapping Coverage

- documented list of city-mappable public routes
- safe fallback when a path cannot be linked to a city

### 5. Future Monetization

- keep the event model extensible for later Stripe and subscription conversions

## Recommended Next Spec Shape

This design is best translated into one new approved feature spec dedicated to the analytics cockpit, for example:

- `admin-analytics-seo-geo-dashboard`

That future spec should contain:

- metadata
- context
- glossary references
- user stories
- business rules
- data model
- API contract
- UI behaviour
- acceptance criteria
- out of scope
- open questions

The future spec should remain additive relative to:

- `016-dashboard-superadmin`
- `024-contact-messages`
- `028-lodging-showcase-seo`

## Recommendation Summary

Build a dedicated `/admin/analytics` cockpit backed by internal daily snapshots from `GA4`, `GSC`, `Vercel Analytics`, and `Vercel Speed Insights`, plus an isolated recent-traffic Vercel block.

Keep:

- `/admin` stable under spec `016`
- consent mandatory for GA4
- city reporting deterministic by URL pattern
- source health visible in admin

Do not:

- read external sources live on every admin page load
- overload the existing internal `Analytics` event table
- merge delayed and live metrics into one misleading summary
