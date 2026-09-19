# Five-city Local Landing Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate complete, unpublished Conciergerie, Séminaires, and Locations de vacances drafts for five existing cities.

**Architecture:** Reuse `buildLocalLandingBackfill()` as the reviewed source for the four historical destinations, append a fully typed Les Contamines-Montjoie payload, validate all pages with `landingPageInputSchema`, then upsert the five destination groups inside one Prisma transaction. A pre-write JSON snapshot makes the content update recoverable, and post-write checks prove that all destinations remain unpublished.

**Tech Stack:** TypeScript, Prisma, PostgreSQL/Supabase, Zod, Next.js local SEO domain types.

---

### Task 1: Build and validate the fifteen-page payload

**Files:**
- Create temporarily: `/private/tmp/install-five-city-landing-drafts.ts`
- Read: `prisma/backfill-local-landing-destinations.ts`
- Read: `src/features/local-seo/schemas/landing-pages.ts`

- [x] **Step 1: Import the four reviewed destinations**

Use `buildLocalLandingBackfill()` and select exactly these slugs:

```ts
const requestedSlugs = [
  'saint-gervais-les-bains',
  'saint-nicolas-de-veroce',
  'megeve',
  'combloux',
  'les-contamines-montjoie',
] as const

const reviewed = buildLocalLandingBackfill().map(destination => ({
  ...destination,
  is_active: false,
}))
```

- [x] **Step 2: Append the Les Contamines-Montjoie content**

Create exactly three `LocalLandingPageInput` records. Conciergerie covers traveller coordination, arrival information, cleaning and linen coordination, property follow-up, and the MyStay guide. Séminaires describes a brief-led search for accommodation, meeting rooms, meals, transfers, and local activities, without guaranteeing availability. Locations de vacances describes only runtime-published inventory and includes an honest empty state.

Use the official spelling `Les Contamines-Montjoie` in editorial content. Local references are limited to the Val Montjoie setting, the village's multiple hamlets, and the existence of spaces suitable for meetings and nature/cultural activities; do not copy source wording or include prices/capacities.

- [x] **Step 3: Validate before connecting to the database**

```ts
if (payload.length !== 5) throw new Error('Expected five destinations')
for (const destination of payload) {
  if (destination.pages.length !== 3) throw new Error(`Expected three pages: ${destination.slug}`)
  destination.pages.forEach(page => landingPageInputSchema.parse(page))
}
```

Expected: five destinations, fifteen schema-valid pages, no placeholders.

### Task 2: Snapshot and install the drafts atomically

**Files:**
- Create: `/private/tmp/staylocal-five-city-landing-backup.json`
- Execute temporarily: `/private/tmp/install-five-city-landing-drafts.ts`

- [x] **Step 1: Resolve the target cities and current landing records**

Query active, non-deleted cities by the five requested slugs. Abort unless all five resolve exactly once.

- [x] **Step 2: Save the current target records**

Serialize the five cities' current destination/page state to `/private/tmp/staylocal-five-city-landing-backup.json`. Do not include credentials or unrelated records.

- [x] **Step 3: Execute one transaction**

For each target city, upsert `LocalLandingDestination` with `is_active: false` and `deleted_at: null`. Upsert one `LocalLandingPage` per intent using the validated payload, restoring only those page rows with `deleted_at: null`. Do not mutate reviews, Cities, Lodgings, POIs, Blog Articles, or guides.

- [x] **Step 4: Print a bounded mutation report**

Expected report:

```json
{
  "destinations": 5,
  "pages": 15,
  "activeDestinations": 0
}
```

### Task 3: Verify content and publication isolation

**Files:**
- Read: `src/features/local-seo/queries/landing-pages.ts`
- Read: `src/features/local-seo/services/landing-publication.ts`

- [x] **Step 1: Read the persisted content back**

Assert that the five slugs have non-deleted destinations, all destinations are inactive, and every destination has exactly `CONCIERGE`, `SEMINAR`, and `VACATION_RENTAL`.

- [x] **Step 2: Revalidate persisted payloads**

Project each database row to `LocalLandingPageInput` and parse it with `landingPageInputSchema`. Expected: fifteen successful parses.

- [x] **Step 3: Verify public isolation**

Call `listPublishedLocalLandingPaths()` and assert that none of the following appear:

```text
/conciergerie/<target-slug>
/seminaires/<target-slug>
/locations-vacances/<target-slug>
```

- [x] **Step 4: Report the backup location and result**

State that all fifteen pages are complete drafts, all five destination sliders remain off, and the pre-write snapshot is available at `/private/tmp/staylocal-five-city-landing-backup.json` for recovery during this machine session.
