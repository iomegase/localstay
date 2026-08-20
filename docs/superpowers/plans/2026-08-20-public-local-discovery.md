# Public Local Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer les trois routes publiques `/decouvrir`, leur sélection éditoriale administrable, la migration SEO des anciennes routes `/guide` et une séparation stricte avec `/sejour` conformément à la spec 041.

**Architecture:** Ajouter un statut Prisma `PoiDiscoveryStatus` sur `PointOfInterest`, centraliser l'éligibilité et les mutations dans le bounded context `public-discovery`, puis exposer des queries serveur qui ne retournent que les POI publiés et complets. Les pages `/decouvrir` utilisent le `MarketingShell`; les routes `/guide` restent l'entrée QR et la surface privée, mais redirigent les visiteurs anonymes vers une URL publique uniquement lorsqu'un équivalent publié existe.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript strict, Prisma/PostgreSQL, Zod, Tailwind CSS, Shadcn/ui, Jest, Testing Library, Playwright.

---

## File map

### New files

- `prisma/migrations/20260820150000_add_poi_discovery_publication/migration.sql` — enum, colonnes et index SQL.
- `src/features/public-discovery/types.ts` — DTO publics et contrat d'éligibilité.
- `src/features/public-discovery/lib/eligibility.ts` — règle pure BR-04.
- `src/features/public-discovery/queries/public-discovery.ts` — lectures City, Category et POI publiés.
- `src/features/public-discovery/queries/admin-publication.ts` — mutation transactionnelle du statut et audit.
- `src/features/public-discovery/components/DiscoveryPoiCard.tsx` — card publique partagée.
- `src/features/public-discovery/components/DiscoveryCityView.tsx` — vue éditoriale City.
- `src/features/public-discovery/components/DiscoveryCategoryView.tsx` — vue éditoriale Category.
- `src/features/public-discovery/components/DiscoveryPoiView.tsx` — fiche POI marketing.
- `src/features/admin-pois/components/AdminPoiDiscoveryCard.tsx` — checklist et contrôle de publication.
- `src/app/api/admin/pois/[id]/discovery-publication/route.ts` — endpoint Admin Zod.
- `src/app/(public)/decouvrir/[city-slug]/page.tsx` — page City publique.
- `src/app/(public)/decouvrir/[city-slug]/[category-slug]/page.tsx` — page Category publique.
- `src/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page.tsx` — fiche POI publique.
- Tests `public-discovery.*` répartis dans `tests/unit`, `tests/contract`, `tests/integration` et `tests/e2e`.

### Modified files

- `prisma/schema.prisma` — statut, date de publication et index.
- `src/features/admin-pois/types.ts` — filtre, statut, éligibilité et URL publique.
- `src/features/admin-pois/lib/admin-poi-rules.ts` — filtre Zod et retrait automatique.
- `src/features/admin-pois/queries/admin-pois.ts` — sélection des champs, filtre et garde-fou transactionnel.
- `src/app/admin/pois/page.tsx` — filtre et badge Découvrir.
- `src/app/admin/pois/[id]/page.tsx` — card de publication.
- `src/features/seo/lib/metadata.ts` — metadata `/decouvrir`.
- `src/features/seo/lib/structured-data.ts` — ItemList public et chemins `/decouvrir`.
- `src/features/seo/queries/sitemap-data.ts` — POI `PUBLISHED` uniquement.
- `src/features/seo/lib/sitemap.ts` — URL `/decouvrir`, déduplication City/Category.
- `src/app/sitemap.ts` — conserver la suppression de `'/'` déjà effectuée par le Product Owner.
- Les trois pages historiques sous `src/app/(public)/guide/[city-slug]/...` — redirection anonyme conditionnelle et comportement privé inchangé.
- `docs/traceability-matrix.md` — lignes spec 041.

---

### Task 1: Add the publication model and eligibility rule

**Files:**
- Create: `tests/unit/public-discovery.BR-04.eligibility.test.ts`
- Create: `src/features/public-discovery/types.ts`
- Create: `src/features/public-discovery/lib/eligibility.ts`
- Modify: `prisma/schema.prisma:90-150`
- Create: `prisma/migrations/20260820150000_add_poi_discovery_publication/migration.sql`

- [ ] **Step 1: Write the failing eligibility tests**

```ts
import { getPoiDiscoveryEligibility } from '@/features/public-discovery/lib/eligibility'

const completePoi = {
  is_active: true,
  deleted_at: null,
  description: 'Une adresse locale vérifiée et décrite par MyStay.',
  address: '100 rue du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  latitude: 45.89,
  longitude: 6.71,
  geocode_status: 'success',
  phone: '+33450000000',
  website: null,
  photos: ['https://example.com/poi.jpg'],
  city: { is_active: true, deleted_at: null },
  category: { is_active: true, deleted_at: null },
  subcategory: null,
}

describe('041 POI discovery eligibility', () => {
  it('accepts a strictly complete POI', () => {
    expect(getPoiDiscoveryEligibility(completePoi)).toEqual({ eligible: true, missing: [] })
  })

  it.each([
    ['description', { description: ' ' }],
    ['photo', { photos: [] }],
    ['geocode', { geocode_status: 'pending' }],
    ['contact', { phone: null, website: null }],
  ])('rejects a POI missing %s', (_label, patch) => {
    const result = getPoiDiscoveryEligibility({ ...completePoi, ...patch })
    expect(result.eligible).toBe(false)
    expect(result.missing).not.toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run the unit test and verify the expected failure**

Run: `npm test -- --runInBand tests/unit/public-discovery.BR-04.eligibility.test.ts`

Expected: FAIL because `@/features/public-discovery/lib/eligibility` does not exist.

- [ ] **Step 3: Define the strict typed eligibility contract**

```ts
// src/features/public-discovery/types.ts
export type PoiDiscoveryStatus = 'DRAFT' | 'PUBLISHED'

export type PoiDiscoveryEligibility = {
  eligible: boolean
  missing: Array<
    | 'active'
    | 'city'
    | 'category'
    | 'subcategory'
    | 'description'
    | 'photo'
    | 'address'
    | 'geocode'
    | 'contact'
  >
}
```

```ts
// src/features/public-discovery/lib/eligibility.ts
import { isUsableAdminPhotoUrl } from '@/features/admin-pois/lib/admin-poi-rules'
import type { PoiDiscoveryEligibility } from '../types'

type EligibilityInput = {
  is_active: boolean
  deleted_at: Date | null
  description: string | null
  address: string
  latitude: number
  longitude: number
  geocode_status: string
  phone: string | null
  website: string | null
  photos: string[]
  city: { is_active: boolean; deleted_at: Date | null }
  category: { is_active: boolean; deleted_at: Date | null }
  subcategory: { is_active: boolean; deleted_at: Date | null } | null
}

export function getPoiDiscoveryEligibility(input: EligibilityInput): PoiDiscoveryEligibility {
  const missing: PoiDiscoveryEligibility['missing'] = []
  if (!input.is_active || input.deleted_at) missing.push('active')
  if (!input.city.is_active || input.city.deleted_at) missing.push('city')
  if (!input.category.is_active || input.category.deleted_at) missing.push('category')
  if (input.subcategory && (!input.subcategory.is_active || input.subcategory.deleted_at)) missing.push('subcategory')
  if (!input.description?.trim()) missing.push('description')
  if (!input.photos.some(isUsableAdminPhotoUrl)) missing.push('photo')
  if (!input.address.trim()) missing.push('address')
  if (input.geocode_status !== 'success' || !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) missing.push('geocode')
  if (!input.phone?.trim() && !isHttpUrl(input.website)) missing.push('contact')
  return { eligible: missing.length === 0, missing }
}

function isHttpUrl(value: string | null): boolean {
  if (!value) return false
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Add Prisma enum, fields and indexes**

```prisma
enum PoiDiscoveryStatus {
  DRAFT
  PUBLISHED
}

model PointOfInterest {
  // existing fields
  discovery_status       PoiDiscoveryStatus @default(DRAFT)
  discovery_published_at DateTime?

  @@index([discovery_status, deleted_at, is_active, updated_at])
  @@index([city_id, category_id, discovery_status, deleted_at, is_active])
}
```

```sql
CREATE TYPE "PoiDiscoveryStatus" AS ENUM ('DRAFT', 'PUBLISHED');

ALTER TABLE "PointOfInterest"
ADD COLUMN "discovery_status" "PoiDiscoveryStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "discovery_published_at" TIMESTAMP(3);

CREATE INDEX "PointOfInterest_discovery_status_deleted_at_is_active_updated_at_idx"
ON "PointOfInterest"("discovery_status", "deleted_at", "is_active", "updated_at");

CREATE INDEX "PointOfInterest_city_id_category_id_discovery_status_deleted_at_is_active_idx"
ON "PointOfInterest"("city_id", "category_id", "discovery_status", "deleted_at", "is_active");
```

- [ ] **Step 5: Generate Prisma Client and run validation/tests**

Run: `npx prisma validate`

Expected: `The schema at prisma/schema.prisma is valid`.

Run: `npx prisma generate`

Expected: Prisma Client generated successfully.

Run: `npm test -- --runInBand tests/unit/public-discovery.BR-04.eligibility.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the model and pure rule**

```bash
git add prisma/schema.prisma prisma/migrations/20260820150000_add_poi_discovery_publication/migration.sql src/features/public-discovery/types.ts src/features/public-discovery/lib/eligibility.ts tests/unit/public-discovery.BR-04.eligibility.test.ts
git commit -m "feat(discovery): add POI publication eligibility"
```

---

### Task 2: Add the transactional Admin publication API

**Files:**
- Create: `tests/contract/public-discovery.AC-04.publication-api.test.ts`
- Create: `tests/integration/public-discovery.AC-04.publication-query.test.ts`
- Create: `src/features/public-discovery/queries/admin-publication.ts`
- Create: `src/app/api/admin/pois/[id]/discovery-publication/route.ts`
- Modify: `src/features/admin-pois/types.ts`
- Modify: `src/features/admin-pois/lib/admin-poi-rules.ts`
- Modify: `src/features/admin-pois/queries/admin-pois.ts`

- [ ] **Step 1: Write failing API tests for publish, reject and unpublish**

```ts
const mockUpdatePublication = jest.fn()
jest.mock('@/features/public-discovery/queries/admin-publication', () => ({
  updatePoiDiscoveryPublication: (...args: unknown[]) => mockUpdatePublication(...args),
}))

it('publishes an eligible POI for an Admin', async () => {
  mockUpdatePublication.mockResolvedValue({
    id: poiId,
    discovery_status: 'PUBLISHED',
    discovery_published_at: '2026-08-20T15:00:00.000Z',
    public_url: '/decouvrir/saint-gervais-les-bains/diner/le-serac',
    eligibility: { eligible: true, missing: [] },
  })
  const response = await PATCH(request({ status: 'PUBLISHED' }), params)
  expect(response.status).toBe(200)
  expect(mockUpdatePublication).toHaveBeenCalledWith(poiId, 'PUBLISHED', 'admin-1')
})

it('rejects unknown fields with 400', async () => {
  const response = await PATCH(request({ status: 'PUBLISHED', force: true }), params)
  expect(response.status).toBe(400)
})
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `npm test -- --runInBand tests/contract/public-discovery.AC-04.publication-api.test.ts`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Add strict Zod validation and the Admin route**

```ts
const DiscoveryPublicationSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED']),
}).strict()

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getSessionAdmin()
  if (session.error || !session.user) return session.error
  const { id } = await context.params
  const parsed = DiscoveryPublicationSchema.safeParse(await request.json())
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Payload invalide', 400, parsed.error.flatten())
  try {
    const data = await updatePoiDiscoveryPublication(id, parsed.data.status, session.user.id)
    revalidatePath('/sitemap.xml')
    return NextResponse.json({ data })
  } catch (error) {
    return mapPoiAcquisitionError(error)
  }
}
```

- [ ] **Step 4: Implement the transaction and audit**

`updatePoiDiscoveryPublication` must load the POI with City, Category and
SubCategory, call `getPoiDiscoveryEligibility`, reject incomplete publication
with `PoiAcquisitionError('DISCOVERY_PUBLICATION_INCOMPLETE', 409, { missing })`,
then update `discovery_status` and `discovery_published_at` in the same Prisma
transaction that creates the audit log. Use actions
`poi_discovery_published`, `poi_discovery_unpublished` and
`poi_discovery_auto_unpublished`.

```ts
const nextPublishedAt = status === 'PUBLISHED' ? new Date() : null
await tx.pointOfInterest.update({
  where: { id },
  data: { discovery_status: status, discovery_published_at: nextPublishedAt },
})
await tx.poiAcquisitionAuditLog.create({
  data: {
    admin_id: adminId,
    action: status === 'PUBLISHED' ? 'poi_discovery_published' : 'poi_discovery_unpublished',
    target_type: 'poi',
    target_id: id,
    before: { discovery_status: poi.discovery_status },
    after: { discovery_status: status },
  },
})
```

- [ ] **Step 5: Extend Admin filters and enforce automatic unpublication**

Add `discovery_status` to `AdminPoiListQuerySchema`, `AdminPoiListFilters`, list
selection and DTOs. In `updateAdminPoi`, `disableAdminPoi`, `deleteAdminPoi` and
`restoreAdminPoi`, evaluate the post-mutation state inside the transaction. If
BR-04 becomes false, set `DRAFT`, clear the date and append the automatic audit.

- [ ] **Step 6: Run focused Admin tests**

Run: `npm test -- --runInBand tests/unit/admin-pois.AC-01-04.status-filters.test.ts tests/contract/admin-pois.AC-01-04.api.test.ts tests/contract/public-discovery.AC-04.publication-api.test.ts tests/integration/public-discovery.AC-04.publication-query.test.ts`

Expected: all suites PASS.

- [ ] **Step 7: Commit the Admin backend**

```bash
git add src/features/public-discovery/queries/admin-publication.ts src/app/api/admin/pois/[id]/discovery-publication/route.ts src/features/admin-pois/types.ts src/features/admin-pois/lib/admin-poi-rules.ts src/features/admin-pois/queries/admin-pois.ts tests/unit/admin-pois.AC-01-04.status-filters.test.ts tests/contract/admin-pois.AC-01-04.api.test.ts tests/contract/public-discovery.AC-04.publication-api.test.ts tests/integration/public-discovery.AC-04.publication-query.test.ts
git commit -m "feat(discovery): add Admin publication workflow"
```

---

### Task 3: Add the Admin publication controls

**Files:**
- Create: `tests/integration/public-discovery.AC-04.admin-ui.test.tsx`
- Create: `src/features/admin-pois/components/AdminPoiDiscoveryCard.tsx`
- Modify: `src/app/admin/pois/[id]/page.tsx`
- Modify: `src/app/admin/pois/page.tsx`

- [ ] **Step 1: Write failing UI tests**

Test that the detail page displays all checklist labels, the current status,
publication date, public URL and the correct action. Test that the list page
renders the `discovery_status` select and a `Publié`/`Brouillon` badge.

```tsx
expect(screen.getByRole('heading', { name: 'Découverte publique' })).toBeInTheDocument()
expect(screen.getByText('Description')).toBeInTheDocument()
expect(screen.getByText('Photo exploitable')).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Publier dans Découvrir' })).toBeEnabled()
expect(screen.getByLabelText('Découverte')).toBeInTheDocument()
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-04.admin-ui.test.tsx`

Expected: FAIL because the card/filter do not exist.

- [ ] **Step 3: Implement the focused client card**

`AdminPoiDiscoveryCard` receives only serializable props:

```ts
type Props = {
  poiId: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  publicUrl: string | null
  eligibility: PoiDiscoveryEligibility
}
```

The component shows the nine BR-04 checks, sends a strict PATCH to
`/api/admin/pois/${poiId}/discovery-publication`, requires `confirm()` before
publish/unpublish, displays the API error message and calls `router.refresh()`
only after success.

- [ ] **Step 4: Wire the detail and list pages**

Render the card beside `AdminPoiEditForm`. Add a GET filter named
`discovery_status` to the list form and render the status badge in each row.
Keep the existing City requirement, paging query parameters and Shadcn visual
grammar.

- [ ] **Step 5: Run Admin UI regressions**

Run: `npm test -- --runInBand tests/integration/admin-pois.AC-01-05.pages.test.tsx tests/integration/public-discovery.AC-04.admin-ui.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the Admin UI**

```bash
git add src/features/admin-pois/components/AdminPoiDiscoveryCard.tsx src/app/admin/pois/[id]/page.tsx src/app/admin/pois/page.tsx tests/integration/admin-pois.AC-01-05.pages.test.tsx tests/integration/public-discovery.AC-04.admin-ui.test.tsx
git commit -m "feat(discovery): add publication controls to Admin POIs"
```

---

### Task 4: Build public discovery queries without private data

**Files:**
- Create: `tests/integration/public-discovery.AC-01-03.public-queries.test.ts`
- Create: `tests/unit/public-discovery.AC-02-03.zones.test.ts`
- Modify: `src/features/public-discovery/types.ts`
- Create: `src/features/public-discovery/queries/public-discovery.ts`

- [ ] **Step 1: Write failing query tests**

Mock Prisma and assert that every query includes `discovery_status: 'PUBLISHED'`,
`is_active: true`, `deleted_at: null`, `geocode_status: 'success'` and active
City/Category/SubCategory relations. Assert the returned DTO contains no
`lodging_id`, Owner note or private recommendation field.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-01-03.public-queries.test.ts tests/unit/public-discovery.AC-02-03.zones.test.ts`

Expected: FAIL because the query module does not exist.

- [ ] **Step 3: Define minimal public DTOs**

Define `DiscoveryCity`, `DiscoveryCategory`, `DiscoveryPoiCard` and
`DiscoveryPoiDetail`. Include only visible facts: slugs, names, description,
address, coordinates, contact, rating, hours, usable photos, taxonomies and
computed `distance_km`/zone.

- [ ] **Step 4: Implement three cached server queries**

```ts
export const getDiscoveryCity = cache(async (citySlug: string): Promise<DiscoveryCity | null> => {})
export const getDiscoveryCategory = cache(async (citySlug: string, categorySlug: string): Promise<DiscoveryCategory | null> => {})
export const getDiscoveryPoi = cache(async (citySlug: string, categorySlug: string, poiSlug: string): Promise<DiscoveryPoiDetail | null> => {})
```

Return `null` for every invalid/non-published route. Reuse the existing
Haversine/zone helper rather than creating a second distance formula. Sort
categories by `sort_order`, POI by zone, distance and name.

- [ ] **Step 5: Run focused query tests**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-01-03.public-queries.test.ts tests/unit/public-discovery.AC-02-03.zones.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the public read model**

```bash
git add src/features/public-discovery/types.ts src/features/public-discovery/queries/public-discovery.ts tests/integration/public-discovery.AC-01-03.public-queries.test.ts tests/unit/public-discovery.AC-02-03.zones.test.ts
git commit -m "feat(discovery): add public POI read model"
```

---

### Task 5: Add `/decouvrir` metadata and structured data

**Files:**
- Create: `tests/unit/public-discovery.AC-01-05.metadata.test.ts`
- Create: `tests/unit/public-discovery.AC-03-04.structured-data.test.ts`
- Modify: `src/features/seo/lib/metadata.ts`
- Modify: `src/features/seo/lib/structured-data.ts`

- [ ] **Step 1: Write failing SEO tests**

Assert exact canonical paths and self URLs:

```ts
expect(discoveryCityMetadata(city).alternates?.canonical)
  .toBe('/decouvrir/saint-gervais-les-bains')
expect(discoveryCategoryMetadata(category).openGraph?.url)
  .toBe('/decouvrir/saint-gervais-les-bains/diner')
expect(discoveryPoiMetadata(poi).twitter?.card).toBe('summary_large_image')
```

Assert the ItemList contains only visible `/decouvrir` URLs and POI JSON-LD
uses the `/decouvrir` path provided by the caller.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/unit/public-discovery.AC-01-05.metadata.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts`

Expected: FAIL because discovery helpers do not exist.

- [ ] **Step 3: Add dedicated metadata builders**

Add `discoveryCityMetadata`, `discoveryCategoryMetadata` and
`discoveryPoiMetadata`; do not repurpose the historical `/guide` builders.
Titles must be:

- `Découvrir {ville} — Sélection locale MyStay`;
- `{catégorie} à {ville} — Adresses MyStay`;
- `{POI} à {ville} — MyStay`.

All functions must set description, canonical, Open Graph URL/content and
Twitter content from the same path and visible facts.

- [ ] **Step 4: Add the discovery ItemList helper**

```ts
export function discoveryItemListSchema(input: {
  name: string
  items: Array<{ name: string; path: string }>
}): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type': 'ItemList',
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${siteBaseUrl()}${item.path}`,
    })),
  }
}
```

- [ ] **Step 5: Run all SEO units**

Run: `npm test -- --runInBand tests/unit/seo.metadata.test.ts tests/unit/seo.structured-data.test.ts tests/unit/public-discovery.AC-01-05.metadata.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit SEO helpers**

```bash
git add src/features/seo/lib/metadata.ts src/features/seo/lib/structured-data.ts tests/unit/public-discovery.AC-01-05.metadata.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts
git commit -m "feat(discovery): add metadata and structured data"
```

---

### Task 6: Build the three MyStay public pages

**Files:**
- Create: `tests/integration/public-discovery.AC-01-03.pages.test.tsx`
- Create: `tests/e2e/public-discovery.AC-01-04.responsive.test.ts`
- Create: `src/features/public-discovery/components/DiscoveryPoiCard.tsx`
- Create: `src/features/public-discovery/components/DiscoveryCityView.tsx`
- Create: `src/features/public-discovery/components/DiscoveryCategoryView.tsx`
- Create: `src/features/public-discovery/components/DiscoveryPoiView.tsx`
- Create: `src/app/(public)/decouvrir/[city-slug]/page.tsx`
- Create: `src/app/(public)/decouvrir/[city-slug]/[category-slug]/page.tsx`
- Create: `src/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page.tsx`

- [ ] **Step 1: Write failing page integration tests**

Mock `public-discovery` queries and verify each page:

- calls `notFound()` for `null`;
- renders exactly one descriptive H1;
- uses `MarketingShell`;
- emits breadcrumb plus ItemList/POI JSON-LD;
- links only to `/decouvrir` for local discovery;
- does not render `ownerRecommendationNote`, `lodging_id`, bottom navigation or
  guest-specific wording.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-01-03.pages.test.tsx`

Expected: FAIL because the routes/components do not exist.

- [ ] **Step 3: Implement the shared public card**

Per BR-26 and the resolved spec 022 compatibility decision, use a native
responsive `<img>` for arbitrary eligible remote `http(s)` URLs (not
`next/image`, no proxy, no re-hosting and no host allowlist). Reserve a 4:3
ratio with intrinsic dimensions, lazy-load cards, apply a restrictive referrer
policy, meaningful alt text and reduced-motion handling. Keep the category
eyebrow, address, optional rating/distance and full-card `Link` to the
canonical discovery path.

- [ ] **Step 4: Implement City and Category views**

Both views compose `MarketingShell`, `MarketingEyebrow`,
`marketingContainerClass` and the shared card. The City view includes category
cards and the owner-lead CTA. The Category view renders primary and nearby
sections independently and omits nearby when empty.

- [ ] **Step 5: Implement the POI marketing view**

Render the rounded hero with the same BR-26 native-image exception (intrinsic
dimensions, eager/high-priority loading, restrictive referrer policy), breadcrumb, H1, category, description, address,
optional hours/rating and conditional `tel:`, official site and Google Maps
links. Reuse the existing Static Map component when its prop contract accepts
the public DTO; otherwise create a focused wrapper without loading interactive
Mapbox. End with the `/confier-mon-logement` CTA.

- [ ] **Step 6: Implement page modules and `generateMetadata`**

Each Server Component loads exactly one public query, calls `notFound()` on
`null`, and passes the same DTO to its metadata/JSON-LD and visible view. Do not
read `cookies()` or `headers()` in the new route modules.

- [ ] **Step 7: Run integration and responsive tests**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-01-03.pages.test.tsx`

Expected: PASS.

Run: `npx playwright test tests/e2e/public-discovery.AC-01-04.responsive.test.ts`

Expected: routes render at 375, 768 and 1440 px with no horizontal overflow.

- [ ] **Step 8: Commit the public pages**

```bash
git add src/features/public-discovery/components src/app/(public)/decouvrir tests/integration/public-discovery.AC-01-03.pages.test.tsx tests/e2e/public-discovery.AC-01-04.responsive.test.ts
git commit -m "feat(discovery): add public City Category and POI pages"
```

---

### Task 7: Migrate anonymous `/guide` traffic while preserving QR/private flows

**Files:**
- Create: `tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx`
- Modify: `tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts`
- Modify: `tests/unit/proxy.guest-confinement.test.ts`
- Modify: `src/app/(public)/guide/[city-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx`
- Modify: `src/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page.tsx`

- [ ] **Step 1: Write failing redirect/security tests**

Cover these branches:

1. anonymous + published City/Category/POI → `permanentRedirect('/decouvrir/...')`;
2. anonymous + no public equivalent → `notFound()`;
3. valid QR query → proxy still redirects to `/sejour?lodging=...` and sets cookie;
4. valid stay cookie + POI → existing private detail and Owner note remain;
5. lodging routes remain unaffected.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts`

Expected: anonymous routes still render historical public content, so new redirect assertions FAIL.

- [ ] **Step 3: Add route-level anonymous migration guards**

For City and Category pages, resolve the active lodging context first. When it
is absent, call the matching discovery query; use `permanentRedirect()` if it
exists and `notFound()` otherwise. For POI detail, preserve the existing
private query/note branch only when a valid lodging context exists; otherwise
resolve the public POI and redirect or 404 before loading contextual data.

- [ ] **Step 4: Verify QR priority and reserved routes**

Do not move the QR branch below anonymous marketing checks in `proxy.ts`. Do
not redirect `/guide/{city}/logements/*`, agenda or trail start routes as part
of this task.

- [ ] **Step 5: Run migration regressions**

Run: `npm test -- --runInBand tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts tests/integration/private-guide-favorites.AC-01-01-05.page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit route migration**

```bash
git add src/app/(public)/guide tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx tests/unit/public-marketing.AC-02-01.qr-redirect.test.ts tests/unit/proxy.guest-confinement.test.ts
git commit -m "feat(discovery): migrate anonymous guide URLs"
```

---

### Task 8: Publish only discovery URLs in the sitemap

**Files:**
- Modify: `tests/unit/seo.sitemap.test.ts`
- Create: `tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts`
- Modify: `src/features/seo/queries/sitemap-data.ts`
- Modify: `src/features/seo/lib/sitemap.ts`
- Preserve: `src/app/sitemap.ts`

- [ ] **Step 1: Change sitemap tests first**

Expect City, Category and POI URLs under `/decouvrir`; explicitly assert the
equivalent `/guide` URLs are absent. Assert City/Category are deduplicated and
that homepage occurs once.

```ts
expect(urls).toContain(`${base}/decouvrir/saint-gervais-les-bains`)
expect(urls).toContain(`${base}/decouvrir/saint-gervais-les-bains/diner/le-serac`)
expect(urls).not.toContain(`${base}/guide/saint-gervais-les-bains/diner/le-serac`)
expect(urls.filter(url => url === `${base}/`)).toHaveLength(1)
```

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- --runInBand tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts`

Expected: FAIL because the builder still creates `/guide` URLs and the query
does not filter `PUBLISHED`.

- [ ] **Step 3: Filter sitemap data at the database boundary**

`pointOfInterest.findMany` must apply the complete public predicate including
`discovery_status: 'PUBLISHED'`. Derive distinct City entries from those POI so
an active City without a published POI never enters the sitemap. Keep published
lodgings and blog articles unchanged.

- [ ] **Step 4: Build discovery paths and retain lodging paths**

Change only generic City/Category/POI paths to `/decouvrir`. Keep
`/guide/{city}/logements` and its published details per spec 031. Preserve the
Product Owner's existing removal of `'/'` from `staticPaths`; homepage remains
the single explicit entry created by `buildSitemapEntries`.

- [ ] **Step 5: Run sitemap suites**

Run: `npm test -- --runInBand tests/unit/seo.sitemap.test.ts tests/unit/blog.AC-06-05.sitemap.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit sitemap migration without overwriting user work**

```bash
git add src/features/seo/queries/sitemap-data.ts src/features/seo/lib/sitemap.ts src/app/sitemap.ts tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts
git commit -m "feat(discovery): publish canonical discovery sitemap URLs"
```

---

### Task 9: Full verification and traceability

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add one traceability row per acceptance criterion group**

Map AC-01 through AC-05 to the exact source and test files created above. Mark
only verified criteria `✅ done`; every row must name its concrete source and
test paths.

- [ ] **Step 2: Validate Prisma and TypeScript build**

Run: `npx prisma validate`

Expected: valid schema.

Run: `npx prisma generate`

Expected: generated client.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 and all three `/decouvrir` route patterns listed.

- [ ] **Step 3: Run all affected Jest suites**

Run: `npm test -- --runInBand tests/unit/public-discovery.BR-04.eligibility.test.ts tests/contract/public-discovery.AC-04.publication-api.test.ts tests/integration/public-discovery.AC-04.publication-query.test.ts tests/integration/public-discovery.AC-04.admin-ui.test.tsx tests/integration/public-discovery.AC-01-03.public-queries.test.ts tests/unit/public-discovery.AC-02-03.zones.test.ts tests/unit/public-discovery.AC-01-05.metadata.test.ts tests/unit/public-discovery.AC-03-04.structured-data.test.ts tests/integration/public-discovery.AC-01-03.pages.test.tsx tests/integration/public-discovery.AC-05.legacy-redirects.test.tsx tests/contract/public-discovery.AC-05-06.sitemap-data.test.ts tests/unit/seo.sitemap.test.ts tests/unit/seo.metadata.test.ts tests/unit/seo.structured-data.test.ts tests/contract/admin-pois.AC-01-04.api.test.ts tests/integration/admin-pois.AC-01-05.pages.test.tsx tests/unit/proxy.guest-confinement.test.ts`

Expected: all suites PASS.

- [ ] **Step 4: Run browser verification against a local production build**

Start: `npm run start -- --port 3001`

Verify with Playwright:

- City, Category and POI public pages return 200 for a seeded `PUBLISHED` POI;
- anonymous historical URLs return 308 to matching `/decouvrir` URLs;
- unpublished URLs return 404;
- QR URL still reaches `/sejour` and sets `lodging_id`;
- widths 375, 768 and 1440 have no horizontal overflow;
- page source contains one H1, self-canonical and matching JSON-LD.

- [ ] **Step 5: Inspect the final diff for scope and secrets**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only intended spec 041 implementation and traceability files; no
`.env`, credentials, generated temporary files or unrelated user changes.

- [ ] **Step 6: Commit traceability and final verification state**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace public discovery implementation"
```

---

## Self-review result

- Spec coverage:
  - Task 4 + Task 6 cover `AC-01-01`, `AC-01-02`, `AC-01-03`, `AC-01-04`,
    `AC-01-05`, `AC-02-01`, `AC-02-02`, `AC-02-03`, `AC-02-04`, `AC-02-05`,
    `AC-03-01`, `AC-03-02`, `AC-03-03`, `AC-03-04` et `AC-03-05`.
  - Task 1 + Task 2 + Task 3 cover `AC-04-01`, `AC-04-02`, `AC-04-03`,
    `AC-04-04`, `AC-04-05` et `AC-04-06`.
  - Task 7 + Task 8 cover `AC-05-01`, `AC-05-02`, `AC-05-03`, `AC-05-04`,
    `AC-05-05` et `AC-05-06`.
  - BR-01 through BR-25, Admin control, migration SEO, sitemap, responsive
    design, structured data and private-data isolation each map to at least one
    task and one named test.
- Type consistency: `DRAFT | PUBLISHED`, `discovery_status`,
  `discovery_published_at` and `PoiDiscoveryEligibility` use the same names in
  schema, API, Admin UI, queries and tests.
- Scope: no `/decouvrir` root, no lodging URL migration, no agenda refactor and
  no new editorial CMS fields are included.
- Existing user work: `src/app/sitemap.ts` already removes `'/'` from
  `staticPaths`; implementation must preserve that change and must not revert
  unrelated working-tree edits.
