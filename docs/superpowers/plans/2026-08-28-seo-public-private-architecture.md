# SEO Public / Private Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/decouvrir` and `/logements/{slug}` the only canonical public content namespaces while keeping every private stay surface non-indexable and preserving printed QR journeys.

**Architecture:** Centralize URL construction, private robots metadata, and `/guide` route classification in pure helpers. Migrate public lodging profiles to globally unique stable slugs only after a read-only collision gate, move the existing lodging detail UI to its short route, and keep `/guide` as a tested 308/private-compatibility layer. Keep database-aware eligibility decisions in Server Components, not in the proxy.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma/PostgreSQL, Jest/Testing Library, Playwright, Tailwind CSS, Schema.org JSON-LD.

---

## Preconditions and guardrails

- Approved source spec: `specs/features/042-seo-public-private-architecture/spec.md`.
- Required context: `specs/glossary.md`, `docs/DAT/architecture.md`, relevant ADRs, and `docs/superpowers/specs/2026-08-28-seo-public-private-architecture-design.md`.
- Do not modify POI or lodging editorial data in this plan.
- Do not remove `/guide` routes needed by an active stay.
- The lodging-slug collision audit is a hard gate. If any collision is found, stop before changing the Prisma uniqueness constraint and use the repository's `BUSINESS DECISION REQUIRED` process.
- Do not add `/sejour`, `/guide`, or historical private routes to `robots.txt` disallow rules: crawlers must be able to read `noindex`.

## Task 1: Centralize canonical public lodging paths

**Files:**

- Create: `src/features/lodging-showcase/lib/public-paths.ts`
- Create: `tests/unit/seo-public-private.AC-02-05.public-lodging-paths.test.ts`
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`
- Modify: `tests/unit/public-marketing.AC-03-01.global-lodgings.test.ts`
- Modify: `tests/integration/public-marketing.AC-01-01.home.test.tsx`

- [ ] **Step 1: Write the failing canonical-path test**

```ts
import {
  publicLodgingPath,
  publicLodgingsPath,
} from '@/features/lodging-showcase/lib/public-paths'

describe('042 AC-02-05 public lodging paths', () => {
  it('uses the global short route without a City segment', () => {
    expect(publicLodgingsPath()).toBe('/logements')
    expect(publicLodgingPath('chalet-hygge')).toBe('/logements/chalet-hygge')
  })
})
```

- [ ] **Step 2: Run it and confirm the missing-module failure**

```bash
npm test -- --runInBand tests/unit/seo-public-private.AC-02-05.public-lodging-paths.test.ts
```

Expected: FAIL because `public-paths.ts` does not exist.

- [ ] **Step 3: Implement the only public lodging URL builder**

```ts
export function publicLodgingsPath(): '/logements' {
  return '/logements'
}

export function publicLodgingPath(slug: string): string {
  return `${publicLodgingsPath()}/${encodeURIComponent(slug)}`
}
```

- [ ] **Step 4: Use `publicLodgingPath(profile.slug)` in `toCardApi` and update fixtures**

Keep `city_slug` in existing DTOs for compatibility, but never use it to construct a public lodging URL.

- [ ] **Step 5: Run the focused tests**

```bash
npm test -- --runInBand \
  tests/unit/seo-public-private.AC-02-05.public-lodging-paths.test.ts \
  tests/unit/public-marketing.AC-03-01.global-lodgings.test.ts \
  tests/integration/public-marketing.AC-01-01.home.test.tsx
```

Expected: PASS, with every card `href` under `/logements/{slug}`.

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/lib/public-paths.ts src/features/lodging-showcase/queries/public-lodgings.ts tests/unit/seo-public-private.AC-02-05.public-lodging-paths.test.ts tests/unit/public-marketing.AC-03-01.global-lodgings.test.ts tests/integration/public-marketing.AC-01-01.home.test.tsx
git commit -m "refactor(seo): centralize public lodging paths"
```

## Task 2: Add the read-only global slug collision gate

**Files:**

- Modify: `src/features/lodging-showcase/lib/slug.ts`
- Create: `scripts/audit-lodging-slugs.ts`
- Modify: `package.json`
- Create: `tests/unit/seo-public-private.BR-12.lodging-slug-audit.test.ts`

- [ ] **Step 1: Write failing collision-grouping tests**

```ts
expect(findLodgingSlugCollisions([
  { id: 'profile-a', slug: 'chalet-hygge', citySlug: 'annecy' },
  { id: 'profile-b', slug: 'chalet-hygge', citySlug: 'chamonix' },
  { id: 'profile-c', slug: 'studio-centre', citySlug: 'annecy' },
])).toEqual([{
  slug: 'chalet-hygge',
  profiles: [
    { id: 'profile-a', slug: 'chalet-hygge', citySlug: 'annecy' },
    { id: 'profile-b', slug: 'chalet-hygge', citySlug: 'chamonix' },
  ],
}])
```

Also assert that soft-deleted rows are included, because a public URL must never be reassigned.

- [ ] **Step 2: Confirm the helper is absent**

```bash
npm test -- --runInBand tests/unit/seo-public-private.BR-12.lodging-slug-audit.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement a pure, sorted audit helper**

```ts
export type AuditedLodgingSlug = {
  id: string
  slug: string
  citySlug: string
}

export type LodgingSlugCollision = {
  slug: string
  profiles: AuditedLodgingSlug[]
}
```

Return only duplicate groups, sorted by slug and profile ID. Do not mutate input.

- [ ] **Step 4: Add the read-only Prisma script and package command**

The script uses only `findMany`, includes soft-deleted profiles, prints the audited/collision counts, sets `process.exitCode = 1` on collision, and disconnects Prisma in `finally`. It must not call `update`, `upsert`, `delete`, raw SQL, or migrations.

```json
"audit:lodging-slugs": "tsx scripts/audit-lodging-slugs.ts"
```

- [ ] **Step 5: Verify compilation and execute the gate**

```bash
npm test -- --runInBand tests/unit/seo-public-private.BR-12.lodging-slug-audit.test.ts
npx tsc --noEmit
npm run audit:lodging-slugs
```

Expected success:

```text
Audited lodging public profile slugs: [runtime integer]
Global slug collisions: 0
```

If the collision count is greater than zero, run `afplay /System/Library/Sounds/Glass.aiff`, stop before Task 3, and request a Product Owner decision for each duplicate. Never rename an existing published slug automatically.

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/lib/slug.ts scripts/audit-lodging-slugs.ts package.json tests/unit/seo-public-private.BR-12.lodging-slug-audit.test.ts
git commit -m "test(seo): gate global lodging slug migration"
```

## Task 3: Enforce global uniqueness and stable published slugs

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260828120000_global_lodging_profile_slug/migration.sql`
- Modify: `src/features/lodging-showcase/lib/slug.ts`
- Modify: `src/features/lodging-showcase/queries/owner-public-profile.ts`
- Create: `tests/unit/seo-public-private.BR-11-13.global-lodging-slug.test.ts`
- Modify: `tests/unit/lodging-showcase.save-amenities.test.ts`

- [ ] **Step 1: Write failing allocation/stability tests**

Cover:

- new draft and free base → `chalet-hygge`;
- base conflict → `chalet-hygge-annecy`;
- second conflict → `chalet-hygge-annecy-2`;
- already-published profile keeps its slug after a title change;
- a soft-deleted row blocks reuse.

```ts
expect(lodgingSlugCandidates('Chalet Hygge', 'Annecy')).toEqual([
  'chalet-hygge',
  'chalet-hygge-annecy',
])
```

- [ ] **Step 2: Run the tests and confirm failure**

```bash
npm test -- --runInBand \
  tests/unit/seo-public-private.BR-11-13.global-lodging-slug.test.ts \
  tests/unit/lodging-showcase.save-amenities.test.ts
```

- [ ] **Step 3: Implement allocation without changing a published slug**

In `writePublicProfileForLodging`:

1. Read the current profile by `lodging_id` before the upsert.
2. If status is `published`, reuse `current.slug`.
3. Otherwise test base and City-suffixed candidates against every profile, including soft-deleted rows, excluding only the same `lodging_id`.
4. Continue with `-${n}` from `2` until free.
5. Keep the database constraint as the race-condition guard.

Pass `lodging.city.slug` through a strict internal type; do not introduce `any`.

- [ ] **Step 4: Change Prisma and add the migration**

Replace `slug String` plus `@@unique([city_id, slug])` with:

```prisma
slug String @unique
```

Migration:

```sql
DROP INDEX IF EXISTS "LodgingPublicProfile_city_id_slug_key";
CREATE UNIQUE INDEX "LodgingPublicProfile_slug_key"
  ON "LodgingPublicProfile"("slug");
```

Do not use a partial index: soft-deleted rows remain unique.

- [ ] **Step 5: Validate and rerun tests**

```bash
npx prisma validate
npx prisma generate
npm test -- --runInBand \
  tests/unit/seo-public-private.BR-11-13.global-lodging-slug.test.ts \
  tests/unit/lodging-showcase.save-amenities.test.ts
```

Expected: Prisma valid and tests PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260828120000_global_lodging_profile_slug/migration.sql src/features/lodging-showcase/lib/slug.ts src/features/lodging-showcase/queries/owner-public-profile.ts tests/unit/seo-public-private.BR-11-13.global-lodging-slug.test.ts tests/unit/lodging-showcase.save-amenities.test.ts
git commit -m "feat(seo): enforce stable global lodging slugs"
```

## Task 4: Return a safe API conflict if the database wins a slug race

**Files:**

- Modify: `src/features/lodging-showcase/lib/slug.ts`
- Modify: `src/features/lodging-showcase/queries/owner-public-profile.ts`
- Modify: `src/app/api/dashboard/lodgings/[id]/public-profile/route.ts`
- Modify: `src/app/api/admin/lodgings/[id]/public-profile/route.ts`
- Modify: `tests/contract/lodging-showcase.owner-api.test.ts`
- Create: `tests/contract/seo-public-private.BR-13.admin-slug-conflict.test.ts`

- [ ] **Step 1: Add failing owner/admin 409 contract tests**

Both routes must return:

```json
{
  "error": {
    "code": "LODGING_SLUG_CONFLICT",
    "message": "Cette URL de logement est déjà utilisée",
    "details": {}
  }
}
```

No Prisma metadata, constraint name, SQL, or stack trace may appear.

- [ ] **Step 2: Run and confirm the unhandled-error failure**

```bash
npm test -- --runInBand tests/contract/lodging-showcase.owner-api.test.ts tests/contract/seo-public-private.BR-13.admin-slug-conflict.test.ts
```

- [ ] **Step 3: Add a typed domain error and translate it**

```ts
export class LodgingSlugConflictError extends Error {
  constructor() {
    super('LODGING_SLUG_CONFLICT')
    this.name = 'LodgingSlugConflictError'
  }
}
```

Translate Prisma `P2002` on `slug` to this error in the query layer. Catch only this class in each route, return `apiError(..., 409)`, and rethrow unrelated errors.

- [ ] **Step 4: Rerun and commit**

```bash
npm test -- --runInBand tests/contract/lodging-showcase.owner-api.test.ts tests/contract/seo-public-private.BR-13.admin-slug-conflict.test.ts
git add src/features/lodging-showcase/lib/slug.ts src/features/lodging-showcase/queries/owner-public-profile.ts src/app/api/dashboard/lodgings/'[id]'/public-profile/route.ts src/app/api/admin/lodgings/'[id]'/public-profile/route.ts tests/contract/lodging-showcase.owner-api.test.ts tests/contract/seo-public-private.BR-13.admin-slug-conflict.test.ts
git commit -m "fix(seo): expose safe lodging slug conflicts"
```

## Task 5: Move the public lodging detail to `/logements/{slug}`

**Files:**

- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`
- Create: `src/app/(public)/logements/[lodging-slug]/page.tsx` by moving the existing detail page
- Modify: `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/logements/page.tsx`
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
- Modify: `tests/unit/lodging-showcase.metadata.test.ts`

- [ ] **Step 1: Change integration tests before moving the page**

Assert that:

- the short page calls `getPublishedLodgingDetailBySlug('chalet-hygge')` and renders the existing `MarketingShell`;
- an unknown, unpublished, inactive, or deleted profile calls `notFound()`;
- missing metadata is `noindex`, `nofollow`, `noarchive`;
- the old detail permanently redirects only when City and published profile match;
- the old City list permanently redirects to `/logements`;
- an old detail without an eligible target returns 404.

- [ ] **Step 2: Run and confirm old-route failures**

```bash
npm test -- --runInBand tests/integration/lodging-showcase.public-pages.test.tsx tests/unit/lodging-showcase.metadata.test.ts
```

- [ ] **Step 3: Add the global-slug query while retaining a legacy wrapper**

```ts
export async function getPublishedLodgingDetailBySlug(lodgingSlug: string) {
  return getPublishedLodgingDetailWhere({ slug: lodgingSlug })
}

export async function getPublishedLodgingDetail(
  citySlug: string,
  lodgingSlug: string,
) {
  return getPublishedLodgingDetailWhere({
    slug: lodgingSlug,
    city: { slug: citySlug },
  })
}
```

Keep the current publication, active, City-active, and soft-delete filters in the shared implementation.

- [ ] **Step 4: Move and adapt the existing detail page**

```bash
mkdir -p 'src/app/(public)/logements/[lodging-slug]'
git mv 'src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx' 'src/app/(public)/logements/[lodging-slug]/page.tsx'
```

Then change params to `{ 'lodging-slug': string }`, call the global query, and use `publicLodgingPath(detail.slug)` for metadata canonical/OG, breadcrumb, and JSON-LD. Breadcrumbs become Home → `/logements` → detail. Keep the existing layout, photos, amenities, FAQ, CTA, and `MarketingShell` unchanged. Keep the private contact destination but mark that link `rel="nofollow"`.

- [ ] **Step 5: Recreate minimal legacy redirect pages**

```ts
import { notFound, permanentRedirect } from 'next/navigation'
import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'

export default async function LegacyLodgingDetailPage({ params }: {
  params: Promise<{ 'city-slug': string; 'lodging-slug': string }>
}) {
  const values = await params
  const detail = await getPublishedLodgingDetail(
    values['city-slug'],
    values['lodging-slug'],
  )
  if (!detail) notFound()
  permanentRedirect(publicLodgingPath(detail.slug))
}
```

The old City list needs no database query and calls `permanentRedirect('/logements')` once the proxy has established that this is not a QR/private branch.

- [ ] **Step 6: Rerun and commit**

```bash
npm test -- --runInBand tests/integration/lodging-showcase.public-pages.test.tsx tests/unit/lodging-showcase.metadata.test.ts
git add src/app/'(public)'/logements/'[lodging-slug]'/page.tsx src/app/'(public)'/guide/'[city-slug]'/logements/page.tsx src/app/'(public)'/guide/'[city-slug]'/logements/'[lodging-slug]'/page.tsx src/features/lodging-showcase/queries/public-lodgings.ts tests/integration/lodging-showcase.public-pages.test.tsx tests/unit/lodging-showcase.metadata.test.ts
git commit -m "feat(seo): publish lodging details on short routes"
```

## Task 6: Migrate active links, previews, revalidation, and analytics

**Files:**

- Modify: `src/features/city-guide/components/PublicMenu.tsx`
- Modify: `src/features/lodging-showcase/components/LodgingShowcaseForm.tsx`
- Modify: `src/features/lodging-showcase/lib/revalidation.ts`
- Modify: `src/features/admin-analytics/lib/city-path-mapping.ts`
- Modify: `tests/unit/public-menu.lodging-items.test.tsx`
- Modify: `tests/unit/admin-analytics.city-path-mapping.test.ts`
- Modify: `tests/contract/lodging-showcase.admin-api.test.ts`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`

- [ ] **Step 1: Change tests to the short paths**

```ts
expect(publicMenuLink).toHaveAttribute('href', '/logements')
expect(resolveAnalyticsCityContext('/logements/chalet-hygge')).toEqual({
  citySlug: null,
  pageType: 'lodging_detail',
})
```

Retain assertions for historical `/guide/{city}/logements*` analytics paths so old measurements stay classifiable.

- [ ] **Step 2: Confirm failures**

```bash
npm test -- --runInBand tests/unit/public-menu.lodging-items.test.tsx tests/unit/admin-analytics.city-path-mapping.test.ts tests/contract/lodging-showcase.admin-api.test.ts
```

- [ ] **Step 3: Update each active consumer**

- Public menu: `/logements`.
- Owner/admin preview: `/logements/{profile.slug}`.
- Revalidation: `/logements`, `/logements/[lodging-slug]`, `/sitemap.xml`.
- Analytics: new short-detail regex plus retained legacy regexes.
- Responsive E2E fixture: `/logements/le-chalet-hygge`.

- [ ] **Step 4: Prove no active old public link builder remains**

```bash
rg -n "href: '/guide/.*/logements|canonical.*guide/.*/logements|revalidatePath\('/guide/\[city-slug\]/logements" src
```

Expected: no card, canonical, preview, or revalidation construction. Legacy route files may still appear in broader searches.

- [ ] **Step 5: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/public-menu.lodging-items.test.tsx tests/unit/admin-analytics.city-path-mapping.test.ts tests/contract/lodging-showcase.admin-api.test.ts
git add src/features/city-guide/components/PublicMenu.tsx src/features/lodging-showcase/components/LodgingShowcaseForm.tsx src/features/lodging-showcase/lib/revalidation.ts src/features/admin-analytics/lib/city-path-mapping.ts tests/unit/public-menu.lodging-items.test.tsx tests/unit/admin-analytics.city-path-mapping.test.ts tests/contract/lodging-showcase.admin-api.test.ts tests/e2e/public-marketing.AC-01-03.responsive.test.ts
git commit -m "refactor(seo): migrate public lodging links"
```

## Task 7: Restrict the sitemap to canonical public URLs

**Files:**

- Modify: `src/features/seo/lib/sitemap.ts`
- Modify: `src/features/seo/queries/sitemap-data.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `tests/unit/seo.sitemap.test.ts`
- Modify: `tests/contract/public-discovery.AC-06.sitemap-route.test.ts`
- Modify: `tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts`

- [ ] **Step 1: Write failing exclusions and short-route expectations**

Require `/logements` and `/logements/chalet-hygge`, but reject every URL containing `/guide`, `/sejour`, `/acces-reserve`, `/contact`, `/le-logement`, `/nos-recommandations`, `/map`, `/mes-favoris`, `/services-prives`, `/api/`, or `?`. Reject UUID-shaped path segments too.

- [ ] **Step 2: Run and confirm failures**

```bash
npm test -- --runInBand tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-06.sitemap-route.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts
```

- [ ] **Step 3: Implement canonical-only generation**

- Remove `/contact` from `staticPaths`.
- Generate one `/logements/{slug}` entry per published, active, non-deleted profile.
- Remove City-level lodging list entries.
- Remove `city_slug` from the sitemap-only lodging DTO/query selection if unused.
- Keep eligible `/decouvrir/*`, published `/blog/*`, and indexable marketing routes unchanged.

- [ ] **Step 4: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-06.sitemap-route.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts
git add src/features/seo/lib/sitemap.ts src/features/seo/queries/sitemap-data.ts src/app/sitemap.ts tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-06.sitemap-route.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts
git commit -m "fix(seo): publish canonical-only sitemap URLs"
```

## Task 8: Apply one private robots policy everywhere

**Files:**

- Create: `src/features/seo/lib/private-metadata.ts`
- Create: `src/app/(public)/sejour/layout.tsx`
- Create: `src/app/(public)/guide/[city-slug]/layout.tsx`
- Modify: `src/app/acces-reserve/page.tsx`
- Modify: `src/app/(public)/le-logement/page.tsx`
- Modify: `src/app/(public)/nos-recommandations/page.tsx`
- Modify: `src/app/(public)/map/page.tsx`
- Modify: `src/app/(public)/mes-favoris/page.tsx`
- Modify: `src/app/(public)/services-prives/page.tsx`
- Modify: `src/app/(public)/contact/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/agenda/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/agenda/[event-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/start/page.tsx`
- Create: `tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts`
- Create: `tests/integration/seo-public-private.AC-01-02.legacy-private-metadata.test.tsx`
- Create: `tests/integration/seo-public-private.AC-01-03.access-gate-metadata.test.tsx`
- Modify: `tests/unit/seo.robots.test.ts`

- [ ] **Step 1: Write failing shared-policy tests**

Use one exact expected object:

```ts
const expectedRobots = {
  index: false,
  follow: false,
  noarchive: true,
}
```

Test the helper, `/sejour` layout, `/guide` layout, access gate, and every historical private page. Assert `robots.txt` does not disallow these paths.

- [ ] **Step 2: Confirm missing `noarchive` and divergence failures**

```bash
npm test -- --runInBand tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts tests/integration/seo-public-private.AC-01-02.legacy-private-metadata.test.tsx tests/integration/seo-public-private.AC-01-03.access-gate-metadata.test.tsx tests/unit/seo.robots.test.ts
```

- [ ] **Step 3: Implement the shared metadata factory and layouts**

```ts
import type { Metadata } from 'next'

export const PRIVATE_ROBOTS = {
  index: false,
  follow: false,
  noarchive: true,
} as const

export function privatePageMetadata(title: string): Metadata {
  return { title, robots: PRIVATE_ROBOTS }
}
```

Both layouts are Server Components that only return `{children}` and export metadata from this helper.

- [ ] **Step 4: Reuse it on every legacy route**

Remove private canonicals and divergent robot objects. Every `/guide` metadata generator (City, category, POI, agenda, event, trail start, and not-found branch) must return the shared private policy, because `/guide` is now only a redirect/compatibility namespace. The trail-start route must stop overriding `follow: true`. Public anonymous requests still redirect or 404 from their page logic; active stays inherit the same policy from the `/guide` layout.

- [ ] **Step 5: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts tests/integration/seo-public-private.AC-01-02.legacy-private-metadata.test.tsx tests/integration/seo-public-private.AC-01-03.access-gate-metadata.test.tsx tests/unit/seo.robots.test.ts
git add src/features/seo/lib/private-metadata.ts src/app/'(public)'/sejour/layout.tsx src/app/'(public)'/guide/'[city-slug]'/layout.tsx src/app/acces-reserve/page.tsx src/app/'(public)'/le-logement/page.tsx src/app/'(public)'/nos-recommandations/page.tsx src/app/'(public)'/map/page.tsx src/app/'(public)'/mes-favoris/page.tsx src/app/'(public)'/services-prives/page.tsx src/app/'(public)'/contact/page.tsx src/app/'(public)'/guide/'[city-slug]'/page.tsx src/app/'(public)'/guide/'[city-slug]'/'[category-slug]'/page.tsx src/app/'(public)'/guide/'[city-slug]'/'[category-slug]'/'[poi-slug]'/page.tsx src/app/'(public)'/guide/'[city-slug]'/agenda/page.tsx src/app/'(public)'/guide/'[city-slug]'/agenda/'[event-slug]'/page.tsx src/app/'(public)'/guide/'[city-slug]'/'[category-slug]'/'[poi-slug]'/start/page.tsx tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts tests/integration/seo-public-private.AC-01-02.legacy-private-metadata.test.tsx tests/integration/seo-public-private.AC-01-03.access-gate-metadata.test.tsx tests/unit/seo.robots.test.ts
git commit -m "fix(seo): noindex every private stay surface"
```

## Task 9: Make `/guide` route priorities explicit and preserve QR behavior

**Files:**

- Create: `src/features/seo/lib/route-policy.ts`
- Modify: `src/proxy.ts`
- Modify: `src/app/(public)/guide/[city-slug]/page.tsx`
- Create: `tests/unit/seo-public-private.BR-27.route-policy.test.ts`
- Modify: `tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`
- Modify: `tests/unit/proxy.guest-confinement.test.ts`
- Modify: `tests/unit/public-marketing.AC-01-02.access-policy.test.ts`
- Modify: `tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx`
- Create: `tests/e2e/seo-public-private.AC-02-04.routing.test.ts`

- [ ] **Step 1: Write failing pure route-policy tests**

Export and cover `isValidLodgingId`, `isGuidePath`, `isGuideCityLanding`, `isLegacyDiscoveryGuidePath`, `isPrivateGuideCompatibilityPath`, and `hasValidLodgingCookie`.

Cover this priority matrix:

| Input | Expected branch |
|---|---|
| `/guide/annecy?lodging=<uuid>` | QR → `/sejour?lodging=<uuid>` + cookie |
| `/guide/annecy/restaurants?lodging=<uuid>` | QR → `/sejour?lodging=<uuid>` + cookie |
| `/guide/annecy/logements/chalet?lodging=<uuid>` | QR → `/sejour?lodging=<uuid>` before lodging SEO redirect |
| `/guide/annecy/contact?lodging=<uuid>` without matching cookie | QR → `/sejour?lodging=<uuid>` + cookie |
| `/guide/annecy/contact?lodging=<uuid>` with the same active cookie | continue private compatibility, refresh cookie |
| `/guide/annecy/logements/chalet` without UUID | legacy redirect page |
| `/guide/annecy` without UUID/cookie | City eligibility page |
| invalid UUID | no cookie, normal access policy |

- [ ] **Step 2: Confirm failures**

```bash
npm test -- --runInBand tests/unit/seo-public-private.BR-27.route-policy.test.ts tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts tests/unit/public-marketing.AC-01-02.access-policy.test.ts
```

- [ ] **Step 3: Extract classification while preserving proxy order**

The order is: access-gate exclusions → valid UUID entry detection → matching-cookie private compatibility → fresh/mismatched QR redirect to `/sejour` → anonymous legacy public pass-through → private access-gate rewrite → authenticated areas. Old public lodging routes are not private compatibility routes after this migration, so their valid `lodging` query is handled before the 308 SEO page. Do not query Prisma in the proxy and do not propagate arbitrary query parameters to a public redirect.

- [ ] **Step 4: Implement historical City fallback in the page**

```ts
const city = await getDiscoveryCity(citySlug)
permanentRedirect(city ? `/decouvrir/${city.slug}` : '/decouvrir')
```

Category and POI routes still 404 when their precise eligible equivalent is absent.

- [ ] **Step 5: Add HTTP-level E2E assertions**

Using request context with `maxRedirects: 0`, assert old lodging detail/list and old POI return 308 to their canonical public paths, the new detail returns 200, private/access-gate HTML contains `noindex`, and a valid QR lands under `/sejour` rather than `/decouvrir`.

- [ ] **Step 6: Run and commit**

```bash
npm test -- --runInBand tests/unit/seo-public-private.BR-27.route-policy.test.ts tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts tests/unit/public-marketing.AC-01-02.access-policy.test.ts tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx
npx playwright test tests/e2e/seo-public-private.AC-02-04.routing.test.ts
git add src/features/seo/lib/route-policy.ts src/proxy.ts src/app/'(public)'/guide/'[city-slug]'/page.tsx tests/unit/seo-public-private.BR-27.route-policy.test.ts tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts tests/unit/public-marketing.AC-01-02.access-policy.test.ts tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx tests/e2e/seo-public-private.AC-02-04.routing.test.ts
git commit -m "refactor(seo): preserve qr priority over redirects"
```

## Task 10: Give the homepage its own concierge metadata

**Files:**

- Modify: `src/features/seo/lib/metadata.ts`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `tests/unit/seo-public-private.AC-05-01.home-metadata.test.ts`
- Create: `tests/integration/seo-public-private.AC-06-04.canonicals.test.tsx`
- Modify: `tests/unit/public-discovery.AC-01-05.metadata.test.ts`

- [ ] **Step 1: Write failing metadata tests**

```ts
expect(metadata.title).toBe('Conciergerie en Haute-Savoie | MyStay')
expect(metadata.alternates?.canonical).toBe('/')
expect(metadata.description).toMatch(/gestion de locations saisonnières/i)
expect(metadata.openGraph).toEqual(expect.objectContaining({ url: '/' }))
```

Also assert root metadata defines neither a canonical nor `openGraph.url`, representative public pages own their canonical, and `/decouvrir` metadata remains self-canonical without accepting any Lodging context.

- [ ] **Step 2: Confirm current failures**

```bash
npm test -- --runInBand tests/unit/seo-public-private.AC-05-01.home-metadata.test.ts tests/integration/seo-public-private.AC-06-04.canonicals.test.tsx tests/unit/public-discovery.AC-01-05.metadata.test.ts
```

- [ ] **Step 3: Implement `homeMetadata()`**

```ts
const title = 'Conciergerie en Haute-Savoie | MyStay'
const description = 'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.'
```

Return title, description, canonical `/`, and matching OpenGraph title/description/url/image. Export it from the homepage. Remove root-level `openGraph.url`; keep safe site-wide fallbacks only.

- [ ] **Step 4: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo-public-private.AC-05-01.home-metadata.test.ts tests/integration/seo-public-private.AC-06-04.canonicals.test.tsx tests/unit/public-discovery.AC-01-05.metadata.test.ts
git add src/features/seo/lib/metadata.ts src/app/'(public)'/page.tsx src/app/layout.tsx tests/unit/seo-public-private.AC-05-01.home-metadata.test.ts tests/integration/seo-public-private.AC-06-04.canonicals.test.tsx tests/unit/public-discovery.AC-01-05.metadata.test.ts
git commit -m "fix(seo): set concierge homepage metadata"
```

## Task 11: Build one verified Organization graph and deterministic POI types

**Files:**

- Modify: `src/features/seo/lib/site.ts`
- Modify: `src/features/seo/lib/structured-data.ts`
- Modify: `src/features/blog/lib/structured-data.ts`
- Modify: `tests/unit/seo.structured-data.test.ts`
- Modify: `tests/unit/lodging-showcase.structured-data.test.ts`
- Modify: `tests/unit/public-discovery.AC-03-04.structured-data.test.ts`
- Modify: `tests/unit/blog.AC-06-04.blogposting-jsonld.test.ts`
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
- Modify: `tests/integration/public-discovery.AC-01-03.pages.test.tsx`

- [ ] **Step 1: Write failing graph and type tests**

Assert:

- Organization `@id` is `https://www.mystay.city/#organization`;
- verified fields are name, URL, `/mystay-logo-approved/mystay-logo-approved.png`, concierge description, `bonjour@mystay.city`, and `Haute-Savoie, France`;
- `telephone` and `sameAs` are absent;
- Website publisher, lodging provider, and blog author/publisher reference the same `@id`;
- lodging URLs use `/logements/{slug}`;
- exact canonical slugs map restaurant → `Restaurant`, boulangerie → `Bakery`, bar → `BarOrPub`, hotel → `Hotel`, magasin → `Store`, spa → `DaySpa`, musee → `Museum`, and tourist activity → `TouristAttraction`;
- ambiguous/unknown taxonomy falls back to `LocalBusiness`.

- [ ] **Step 2: Confirm failures**

```bash
npm test -- --runInBand tests/unit/seo.structured-data.test.ts tests/unit/lodging-showcase.structured-data.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts tests/unit/blog.AC-06-04.blogposting-jsonld.test.ts
```

- [ ] **Step 3: Add verified site facts and a stable ID**

```ts
export function organizationId(): string {
  return `${siteBaseUrl()}/#organization`
}
```

Do not add generic Instagram/LinkedIn homepages as `sameAs`, and do not invent a phone number.

- [ ] **Step 4: Implement exact slug mapping**

Normalize and resolve subcategory first, then category. Use explicit slug sets only, never description text. A specific business type wins over a broad tourist category; all ambiguous values return `LocalBusiness`.

- [ ] **Step 5: Align graph references and visible page data**

Website uses `publisher: { '@id': organizationId() }`; lodging uses the short URL and `provider`; BlogPosting references the same Organization. Extend lodging and POI integration tests so every marked fact comes from structured data and is rendered visibly on the corresponding page.

- [ ] **Step 6: Rerun and commit**

```bash
npm test -- --runInBand tests/unit/seo.structured-data.test.ts tests/unit/lodging-showcase.structured-data.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts tests/unit/blog.AC-06-04.blogposting-jsonld.test.ts tests/integration/lodging-showcase.public-pages.test.tsx tests/integration/public-discovery.AC-01-03.pages.test.tsx
git add src/features/seo/lib/site.ts src/features/seo/lib/structured-data.ts src/features/blog/lib/structured-data.ts tests/unit/seo.structured-data.test.ts tests/unit/lodging-showcase.structured-data.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts tests/unit/blog.AC-06-04.blogposting-jsonld.test.ts tests/integration/lodging-showcase.public-pages.test.tsx tests/integration/public-discovery.AC-01-03.pages.test.tsx
git commit -m "feat(seo): align public structured data graph"
```

## Task 12: Restore pinch zoom and remove unused font cost

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `tests/unit/mobile-browser-immersive.test.ts`
- Modify: `tests/unit/story-script-font.test.ts`
- Create: `tests/e2e/seo-public-private.AC-07.map-zoom.test.ts`

- [ ] **Step 1: Write failing viewport/font assertions**

Assert:

- exported viewport has neither `maximumScale` nor `userScalable`;
- `Quicksand` and `Lobster` are absent from root imports, instances, and body classes;
- `Story_Script` and `Big_Shoulders_Inline` remain with `preload: false`;
- `Plus_Jakarta_Sans` and `Playfair_Display` remain loaded;
- removed Tailwind aliases have no source consumer.

- [ ] **Step 2: Confirm failures**

```bash
npm test -- --runInBand tests/unit/mobile-browser-immersive.test.ts tests/unit/story-script-font.test.ts
```

- [ ] **Step 3: Make the minimal layout/font change**

Remove `maximumScale: 1`, `userScalable: false`, Quicksand/Lobster imports, font variables, body classes, and Tailwind aliases. Add `preload: false` to the two occasional decorative families. Do not change active `font-sans`, `font-serif`, `font-hand`, or Big Shoulders consumer classes.

- [ ] **Step 4: Add a Mapbox smoke test**

Open an existing public discovery map, confirm its canvas and zoom controls, click zoom-in, and confirm it stays interactive. Assert the viewport meta contains neither `maximum-scale=1` nor `user-scalable=no`.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --runInBand tests/unit/mobile-browser-immersive.test.ts tests/unit/story-script-font.test.ts
npx playwright test tests/e2e/seo-public-private.AC-07.map-zoom.test.ts
npm run build
git add src/app/layout.tsx tailwind.config.ts tests/unit/mobile-browser-immersive.test.ts tests/unit/story-script-font.test.ts tests/e2e/seo-public-private.AC-07.map-zoom.test.ts
git commit -m "fix(a11y): restore zoom and trim font preloads"
```

## Task 13: Complete traceability and full regression verification

**Files:**

- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add traceability for every AC-01-01 through AC-07-04**

Each row names spec `042-seo-public-private-architecture`, the precise source files, exact test files, and status `Implemented`.

- [ ] **Step 2: Run the complete quality gate**

```bash
npm run lint
npm test -- --runInBand
npm run build
npx playwright test
```

Expected: all commands exit `0`.

- [ ] **Step 3: Run final security/content searches**

```bash
rg -n "maximumScale|userScalable" src/app/layout.tsx
rg -n "lodging=|token=" src/app/sitemap.ts src/features/seo
rg -n "telephone|sameAs" src/features/seo/lib/site.ts src/features/seo/lib/structured-data.ts
```

Expected: no blocked zoom, sitemap query/token construction, or unverified Organization fact. Separately inspect any remaining `/guide/.../logements` result and keep it only when it is compatibility code or a historical analytics fixture.

- [ ] **Step 4: Inspect final diff**

```bash
git diff --check
git status --short
```

Expected: `git diff --check` exits `0`; only intended spec-042 implementation/traceability changes remain.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(traceability): map seo public private architecture"
```

## Final coverage review

- US-01: Task 8 plus Task 9 access-gate regression.
- US-02: Tasks 1 and 3–7 plus Task 11.
- US-03: Task 9.
- US-04: Task 9 and existing spec-041 canonical helpers.
- US-05: Tasks 10–11.
- US-06: Tasks 7, 8, and 10.
- US-07: Task 12.
- Data model: Tasks 2–4, with the collision audit as a mandatory gate.
- Out of scope: no visual redesign, editorial rewrite, public `/contact`, deployment, or Search Console action.
