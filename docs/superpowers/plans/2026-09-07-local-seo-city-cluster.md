# Local SEO City Cluster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish factual city landing pages for concierge and seminars in the two active service areas, plus inventory-gated vacation-rental pages for four approved destinations.

**Architecture:** A typed `local-seo` catalogue owns destination copy and publication flags. Three Server Component routes compose shared MyStay marketing components; lodging pages reuse published profile queries and cards. Metadata, structured data, hub links and sitemap eligibility are derived from the same catalogue and published inventory.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript strict, Tailwind CSS, Prisma, Jest, Testing Library.

---

## File map

- Create `src/features/local-seo/content/destinations.ts`: typed copy and publication state for four destinations.
- Create `src/features/local-seo/lib/paths.ts`: canonical local route builders.
- Create `src/features/local-seo/lib/metadata.ts`: unique metadata and robots builders.
- Create `src/features/local-seo/lib/structured-data.ts`: factual `Service` schemas.
- Create `src/features/local-seo/components/LocalServiceLanding.tsx`: shared mobile-first service page presentation.
- Create `src/features/local-seo/components/LocalDestinationLinks.tsx`: compact internal-link section for public hubs.
- Create `src/features/local-seo/components/LocalVacationRentalLanding.tsx`: destination lodging presentation and conditional Airbnb CTA.
- Create `src/app/(public)/conciergerie/[city-slug]/page.tsx`: published concierge route.
- Create `src/app/(public)/seminaires/[city-slug]/page.tsx`: published seminar route.
- Create `src/app/(public)/locations-vacances/[city-slug]/page.tsx`: inventory-gated rental route.
- Modify `src/features/lodging-showcase/queries/public-lodgings.ts`: expose validated booking fields and city update time for published cards/sitemap.
- Modify `src/app/(public)/logements/page.tsx`, `src/app/(public)/seminaires/page.tsx`, `src/app/(public)/confier-mon-logement/page.tsx`: add hub links.
- Modify `src/features/seo/queries/sitemap-data.ts`, `src/app/sitemap.ts`: add inventory-backed destination paths.
- Modify `docs/traceability-matrix.md`: map spec 046 to source and tests.

### Task 1: Typed destination contract, routes and metadata

**Files:**
- Create: `tests/unit/local-seo.AC-01-02-04.catalog-metadata.test.ts`
- Create: `src/features/local-seo/content/destinations.ts`
- Create: `src/features/local-seo/lib/paths.ts`
- Create: `src/features/local-seo/lib/metadata.ts`

- [ ] **Step 1: Write the failing catalogue and metadata test**

```ts
import {
  getLocalSeoDestination,
  listPublishedServiceDestinations,
} from '@/features/local-seo/content/destinations'
import { localSeoMetadata } from '@/features/local-seo/lib/metadata'

test('publishes services only in the two approved cities', () => {
  expect(listPublishedServiceDestinations('concierge').map(item => item.slug)).toEqual([
    'saint-gervais-les-bains',
    'saint-nicolas-de-veroce',
  ])
  expect(getLocalSeoDestination('megeve')?.services.concierge.published).toBe(false)
})

test('builds a city and intent specific canonical', () => {
  const city = getLocalSeoDestination('saint-gervais-les-bains')!
  const metadata = localSeoMetadata(city, 'concierge', true)
  expect(metadata.title).toContain('Conciergerie à Saint-Gervais-les-Bains')
  expect(metadata.alternates?.canonical).toBe('/conciergerie/saint-gervais-les-bains')
})
```

- [ ] **Step 2: Run the test and verify it fails because the module is absent**

Run: `npm test -- tests/unit/local-seo.AC-01-02-04.catalog-metadata.test.ts --runInBand`

Expected: FAIL resolving `@/features/local-seo/...`.

- [ ] **Step 3: Implement the minimal typed catalogue and helpers**

```ts
export type LocalSeoIntent = 'concierge' | 'seminar' | 'vacation-rental'
export type LocalSeoDestination = {
  slug: string
  name: string
  services: {
    concierge: LocalServiceContent & { published: boolean }
    seminar: LocalServiceContent & { published: boolean }
    vacationRental: VacationRentalContent
  }
}

export function getLocalSeoDestination(slug: string): LocalSeoDestination | null
export function listPublishedServiceDestinations(
  intent: 'concierge' | 'seminar',
): LocalSeoDestination[]
export function localSeoPath(intent: LocalSeoIntent, citySlug: string): string
export function localSeoMetadata(
  destination: LocalSeoDestination,
  intent: LocalSeoIntent,
  indexable: boolean,
): Metadata
```

The catalogue contains reviewed, non-identical copy for Saint-Gervais-les-Bains,
Saint-Nicolas-de-Véroce, Megève and Combloux. Only the first two set service
`published: true`.

- [ ] **Step 4: Run the test and verify green**

Run: `npm test -- tests/unit/local-seo.AC-01-02-04.catalog-metadata.test.ts --runInBand`

Expected: PASS.

### Task 2: Service schemas and service routes

**Files:**
- Create: `tests/unit/local-seo.AC-04-02.structured-data.test.ts`
- Create: `tests/integration/local-seo.AC-01-02.service-pages.test.tsx`
- Create: `src/features/local-seo/lib/structured-data.ts`
- Create: `src/features/local-seo/components/LocalServiceLanding.tsx`
- Create: `src/app/(public)/conciergerie/[city-slug]/page.tsx`
- Create: `src/app/(public)/seminaires/[city-slug]/page.tsx`

- [ ] **Step 1: Write failing tests for schemas, content and inactive routes**

```tsx
const notFoundMock = jest.fn(() => { throw new Error('NEXT_NOT_FOUND') })
jest.mock('next/navigation', () => ({ notFound: notFoundMock }))

test('renders a unique concierge page for Saint-Gervais', async () => {
  render(await ConciergePage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) }))
  expect(screen.getByRole('heading', { level: 1, name: 'Conciergerie à Saint-Gervais-les-Bains' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Confier mon logement' })).toHaveAttribute('href', '/confier-mon-logement')
})

test('rejects a planned service destination', async () => {
  await expect(ConciergePage({ params: Promise.resolve({ 'city-slug': 'megeve' }) })).rejects.toThrow('NEXT_NOT_FOUND')
})
```

The schema test asserts `@type: Service`, the stable Organization provider and
the visible city in `areaServed`.

- [ ] **Step 2: Run both tests and verify red**

Run: `npm test -- tests/unit/local-seo.AC-04-02.structured-data.test.ts tests/integration/local-seo.AC-01-02.service-pages.test.tsx --runInBand`

Expected: FAIL because pages and builders do not exist.

- [ ] **Step 3: Implement service schemas, presentation and pages**

```ts
export function localServiceSchema(input: {
  name: string
  description: string
  cityName: string
  path: string
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: `${siteBaseUrl()}${input.path}`,
    provider: { '@id': organizationId() },
    areaServed: { '@type': 'Place', name: input.cityName },
  }
}
```

Each route resolves the catalogue, rejects inactive service entries, emits
`JsonLd` with a breadcrumb and service schema, then renders
`LocalServiceLanding` inside `MarketingShell`.

- [ ] **Step 4: Run both tests and verify green**

Run: `npm test -- tests/unit/local-seo.AC-04-02.structured-data.test.ts tests/integration/local-seo.AC-01-02.service-pages.test.tsx --runInBand`

Expected: PASS.

### Task 3: Published lodging query and vacation-rental route

**Files:**
- Create: `tests/unit/local-seo.AC-03-01.published-lodgings.test.ts`
- Create: `tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx`
- Create: `src/features/local-seo/components/LocalVacationRentalLanding.tsx`
- Create: `src/app/(public)/locations-vacances/[city-slug]/page.tsx`
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`

- [ ] **Step 1: Write failing tests for published-only data, robots and Airbnb**

```ts
expect(prisma.lodgingPublicProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
  where: expect.objectContaining({
    publication_status: 'published',
    deleted_at: null,
    city: { slug: 'saint-gervais-les-bains', is_active: true, deleted_at: null },
    lodging: { is_active: true, deleted_at: null },
  }),
}))
```

The integration test mocks one Airbnb profile and verifies its MyStay detail link,
secure `Voir sur Airbnb` link and `index: true`. A second case returns no rows and
verifies the useful empty state and `noindex, follow` metadata.

- [ ] **Step 2: Run the tests and verify red**

Run: `npm test -- tests/unit/local-seo.AC-03-01.published-lodgings.test.ts tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx --runInBand`

Expected: FAIL because the route and fields are absent.

- [ ] **Step 3: Extend the existing query and implement the rental page**

Add `external_booking_url`, `external_booking_platform` and `updated_at` to the
marketing card selection and DTO. The route resolves a known destination, queries
only published inventory, uses `localSeoMetadata(destination, 'vacation-rental',
lodgings.length > 0)`, emits `lodgingItemListSchema` only when populated and renders
`LocalVacationRentalLanding`.

The component renders `MarketingPropertyCard` and:

```tsx
{lodging.external_booking_platform === 'airbnb' &&
 lodging.external_booking_url?.startsWith('https://') && (
  <ExternalBookingCta
    externalBookingUrl={lodging.external_booking_url}
    platform="airbnb"
    citySlug={lodging.city_slug}
    lodgingId={lodging.id}
    className={marketingDarkButtonClass}
  />
)}
```

- [ ] **Step 4: Run the tests and verify green**

Run: `npm test -- tests/unit/local-seo.AC-03-01.published-lodgings.test.ts tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx --runInBand`

Expected: PASS.

### Task 4: Internal links and inventory-gated sitemap

**Files:**
- Create: `tests/integration/local-seo.AC-04-04.hub-links.test.tsx`
- Create: `tests/unit/local-seo.AC-04-03.sitemap.test.ts`
- Create: `src/features/local-seo/components/LocalDestinationLinks.tsx`
- Modify: `src/app/(public)/logements/page.tsx`
- Modify: `src/app/(public)/seminaires/page.tsx`
- Modify: `src/app/(public)/confier-mon-logement/page.tsx`
- Modify: `src/features/seo/queries/sitemap-data.ts`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Write failing hub and sitemap tests**

The hub test asserts links to both active service cities and four prepared rental
destinations. The sitemap test supplies published lodging city slugs and asserts:

```ts
expect(paths).toContain('/conciergerie/saint-gervais-les-bains')
expect(paths).toContain('/seminaires/saint-nicolas-de-veroce')
expect(paths).toContain('/locations-vacances/saint-gervais-les-bains')
expect(paths).not.toContain('/conciergerie/megeve')
expect(paths).not.toContain('/locations-vacances/combloux')
```

- [ ] **Step 2: Run tests and verify red**

Run: `npm test -- tests/integration/local-seo.AC-04-04.hub-links.test.tsx tests/unit/local-seo.AC-04-03.sitemap.test.ts --runInBand`

Expected: FAIL because the links and sitemap paths are absent.

- [ ] **Step 3: Implement links and sitemap derivation**

`getSitemapData()` adds `city_slug` to each published lodging. `app/sitemap.ts`
deduplicates eligible lodging destination slugs, intersects them with the approved
catalogue and appends their paths. Active concierge and seminar paths come directly
from `listPublishedServiceDestinations`.

`LocalDestinationLinks` renders a compact MyStay card grid from explicit entries;
each hub supplies only the paths relevant to its intent.

- [ ] **Step 4: Run tests and verify green**

Run: `npm test -- tests/integration/local-seo.AC-04-04.hub-links.test.tsx tests/unit/local-seo.AC-04-03.sitemap.test.ts --runInBand`

Expected: PASS.

### Task 5: Traceability and final verification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add spec 046 traceability rows**

Map every AC group to the exact route, helper, component and test files created in
Tasks 1–4.

- [ ] **Step 2: Run targeted regression suites**

Run:

```bash
npm test -- \
  tests/unit/local-seo.AC-01-02-04.catalog-metadata.test.ts \
  tests/unit/local-seo.AC-04-02.structured-data.test.ts \
  tests/unit/local-seo.AC-03-01.published-lodgings.test.ts \
  tests/unit/local-seo.AC-04-03.sitemap.test.ts \
  tests/integration/local-seo.AC-01-02.service-pages.test.tsx \
  tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx \
  tests/integration/local-seo.AC-04-04.hub-links.test.tsx \
  tests/unit/seo.sitemap.test.ts \
  tests/unit/lodging-showcase.metadata.test.ts \
  --runInBand
```

Expected: all targeted suites PASS.

- [ ] **Step 3: Run static verification**

Run: `npx tsc --noEmit && npm run lint && npm run build`

Expected: all commands exit 0. If the environment blocks a production data fetch,
report that separately from type/lint/test results.

- [ ] **Step 4: Inspect the final diff and traceability**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only spec 046 implementation files are changed.
