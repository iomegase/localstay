# Admin Local Landing Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au Super-admin de créer, éditer, activer, archiver et supprimer logiquement les trois landings SEO d'une ville existante depuis `/admin/landing-pages`.

**Architecture:** Une `LocalLandingDestination` reliée à `City` porte le statut global, tandis que trois `LocalLandingPage` persistées portent les contenus par intention. Les routes publiques consomment un repository serveur unique qui applique la complétude, le statut de la destination et l'existence d'un logement public avant de rendre une page ou de l'ajouter au sitemap.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma/PostgreSQL, Zod, React 19, Shadcn/ui, Lucide React, Tailwind CSS, Jest, Testing Library, Playwright.

---

## File map

- `prisma/schema.prisma` — modèles persistés et relations City/avis.
- `prisma/migrations/<timestamp>_add_local_landing_management/migration.sql` — migration Prisma générée.
- `prisma/backfill-local-landing-destinations.ts` — import idempotent des quatre configurations TypeScript et rattachement des avis.
- `src/features/local-seo/types/landing-pages.ts` — DTO, intentions et formes de contenu.
- `src/features/local-seo/schemas/landing-pages.ts` — validation Zod des formulaires et règles de complétude.
- `src/features/local-seo/queries/landing-pages.ts` — lectures publiques/Admin et mutations transactionnelles.
- `src/features/local-seo/services/landing-publication.ts` — calcul pur des états publiables.
- `src/app/api/admin/landing-pages/**/route.ts` — contrats HTTP Admin.
- `src/features/local-seo/components/AdminLandingPages.tsx` — orchestration de l'écran existant.
- `src/features/local-seo/components/AdminLandingDestinationTable.tsx` — tableau/cartes responsive et actions.
- `src/features/local-seo/components/LandingPageEditor.tsx` — éditeur en trois accordéons.
- `src/app/(public)/{conciergerie,seminaires,locations-vacances}/[city-slug]/page.tsx` — lecture persistée et politique 404.
- `src/features/local-seo/{lib,components}/**` — adaptation des metadata, JSON-LD, sitemap et composants publics aux DTO persistés.
- `tests/{unit,contract,integration,e2e}/local-landing-management.*` — couverture de la spec 048.
- `docs/traceability-matrix.md` — traçabilité AC vers code et tests.

### Task 1: Define the typed content contract and completeness rules

**Files:**
- Create: `src/features/local-seo/types/landing-pages.ts`
- Create: `src/features/local-seo/schemas/landing-pages.ts`
- Create: `src/features/local-seo/services/landing-publication.ts`
- Test: `tests/unit/local-landing-management.validation.test.ts`
- Test: `tests/unit/local-landing-management.publication.test.ts`

- [ ] **Step 1: Write the failing validation tests**

```ts
import {
  LandingDestinationInputSchema,
  landingPageInputSchema,
} from '@/features/local-seo/schemas/landing-pages'

describe('local landing validation', () => {
  it('accepts a City id and rejects an empty id', () => {
    expect(LandingDestinationInputSchema.safeParse({ city_id: 'city-1' }).success).toBe(true)
    expect(LandingDestinationInputSchema.safeParse({ city_id: '' }).success).toBe(false)
  })

  it('reports missing required concierge fields', () => {
    const result = landingPageInputSchema.safeParse({ intent: 'CONCIERGE' })
    expect(result.success).toBe(false)
  })

  it('accepts typed repeatable blocks', () => {
    const result = landingPageInputSchema.safeParse({
      intent: 'SEMINAR',
      seo_title: 'Séminaire à Megève | MyStay',
      meta_description: 'Organisez un séminaire à Megève avec un accompagnement local MyStay.',
      eyebrow: 'Séminaires',
      h1: 'Séminaire à Megève',
      hero_title: 'Un séjour professionnel en montagne',
      hero_copy: 'Présentez votre projet et le rythme recherché pour votre équipe.',
      reassurance: null,
      section_title: 'Construire un séminaire à Megève',
      section_copy: 'MyStay étudie votre brief et coordonne les informations nécessaires au séjour.',
      process_title: 'Une organisation claire',
      local_title: 'Réunir votre équipe à Megève',
      local_copy: 'Le village et ses secteurs offrent des cadres différents selon les objectifs du séjour.',
      cta_label: 'Parler de mon séminaire',
      cta_href: 'mailto:contact@mystay.city',
      empty_copy: null,
      highlights: [{ title: 'Brief', copy: 'Un format défini à partir de vos besoins.' }],
      steps: [{ title: 'Échange', copy: 'Nous étudions le contexte et les dates.' }],
      faq: [{ question: 'Comment démarrer ?', answer: 'Transmettez votre brief à MyStay.' }],
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run the validation test and confirm the missing-module failure**

Run: `npm test -- tests/unit/local-landing-management.validation.test.ts --runInBand`

Expected: FAIL because `schemas/landing-pages` does not exist.

- [ ] **Step 3: Implement strict DTO and Zod schemas**

```ts
// src/features/local-seo/types/landing-pages.ts
export const LOCAL_LANDING_INTENTS = ['CONCIERGE', 'SEMINAR', 'VACATION_RENTAL'] as const
export type LocalLandingIntent = (typeof LOCAL_LANDING_INTENTS)[number]
export type LandingHighlight = { title: string; copy: string }
export type LandingStep = { title: string; copy: string }
export type LandingFaq = { question: string; answer: string }

export type LocalLandingPageInput = {
  intent: LocalLandingIntent
  seo_title: string
  meta_description: string
  eyebrow: string
  h1: string
  hero_title: string
  hero_copy: string
  reassurance: string | null
  section_title: string
  section_copy: string
  process_title: string | null
  local_title: string
  local_copy: string
  cta_label: string
  cta_href: string
  empty_copy: string | null
  highlights: LandingHighlight[]
  steps: LandingStep[]
  faq: LandingFaq[]
}
```

```ts
// src/features/local-seo/schemas/landing-pages.ts
import { z } from 'zod'
import { LOCAL_LANDING_INTENTS } from '../types/landing-pages'

const requiredText = z.string().trim().min(3).max(2000)
const itemSchema = z.object({ title: requiredText.max(160), copy: requiredText })
const faqSchema = z.object({ question: requiredText.max(240), answer: requiredText })

export const LandingDestinationInputSchema = z.object({ city_id: z.string().trim().min(1) })
export const LandingPublicationInputSchema = z.object({ is_active: z.boolean() })
export const LandingPageIdSchema = z.object({ id: z.string().uuid() })
export const landingPageInputSchema = z.object({
  intent: z.enum(LOCAL_LANDING_INTENTS),
  seo_title: requiredText.max(180),
  meta_description: requiredText.max(320),
  eyebrow: requiredText.max(100),
  h1: requiredText.max(180),
  hero_title: requiredText.max(240),
  hero_copy: requiredText,
  reassurance: z.string().trim().max(300).nullable(),
  section_title: requiredText.max(240),
  section_copy: requiredText,
  process_title: z.string().trim().min(3).max(240).nullable(),
  local_title: requiredText.max(240),
  local_copy: requiredText,
  cta_label: requiredText.max(120),
  cta_href: z.string().trim().min(1).max(500),
  empty_copy: z.string().trim().min(3).max(2000).nullable(),
  highlights: z.array(itemSchema).max(12),
  steps: z.array(itemSchema).max(12),
  faq: z.array(faqSchema).max(20),
}).superRefine((value, context) => {
  if (value.intent !== 'VACATION_RENTAL' && value.highlights.length === 0) {
    context.addIssue({ code: 'custom', path: ['highlights'], message: 'Ajoutez au moins un point fort.' })
  }
  if (value.intent !== 'VACATION_RENTAL' && value.steps.length === 0) {
    context.addIssue({ code: 'custom', path: ['steps'], message: 'Ajoutez au moins une étape.' })
  }
  if (value.intent === 'VACATION_RENTAL' && !value.empty_copy) {
    context.addIssue({ code: 'custom', path: ['empty_copy'], message: 'Le texte sans logement est requis.' })
  }
})
export const LandingPagesUpdateSchema = z.object({ pages: z.array(landingPageInputSchema).length(3) })
```

- [ ] **Step 4: Write and run publication-policy tests**

```ts
import { resolveLandingPublication } from '@/features/local-seo/services/landing-publication'

it('publishes services but not locations without a public lodging', () => {
  expect(resolveLandingPublication({ destinationActive: true, serviceContentComplete: true, vacationContentComplete: true, publicLodgingCount: 0 }))
    .toEqual({ concierge: true, seminar: true, vacationRental: false })
})

it('archives all three surfaces when the destination is off', () => {
  expect(resolveLandingPublication({ destinationActive: false, serviceContentComplete: true, vacationContentComplete: true, publicLodgingCount: 2 }))
    .toEqual({ concierge: false, seminar: false, vacationRental: false })
})
```

Run: `npm test -- tests/unit/local-landing-management.validation.test.ts tests/unit/local-landing-management.publication.test.ts --runInBand`

Expected: FAIL until the pure function is implemented, then PASS with:

```ts
export function resolveLandingPublication(input: {
  destinationActive: boolean
  serviceContentComplete: boolean
  vacationContentComplete: boolean
  publicLodgingCount: number
}) {
  const services = input.destinationActive && input.serviceContentComplete
  return {
    concierge: services,
    seminar: services,
    vacationRental: services && input.vacationContentComplete && input.publicLodgingCount > 0,
  }
}
```

- [ ] **Step 5: Commit the typed contract**

```bash
git add src/features/local-seo/types/landing-pages.ts src/features/local-seo/schemas/landing-pages.ts src/features/local-seo/services/landing-publication.ts tests/unit/local-landing-management.validation.test.ts tests/unit/local-landing-management.publication.test.ts
git commit -m "feat(seo): define local landing publication contract"
```

### Task 2: Add persistence and backfill the existing destinations

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<generated>_add_local_landing_management/migration.sql`
- Create: `prisma/backfill-local-landing-destinations.ts`
- Modify: `package.json`
- Test: `tests/integration/local-landing-management.backfill.test.ts`

- [ ] **Step 1: Write a failing schema/backfill integrity test**

```ts
import { LOCAL_LANDING_INTENTS } from '@/features/local-seo/types/landing-pages'

it('defines exactly three landing intentions', () => {
  expect(LOCAL_LANDING_INTENTS).toEqual(['CONCIERGE', 'SEMINAR', 'VACATION_RENTAL'])
})

it('keeps the backfill source on the four reviewed destinations', async () => {
  const { localSeoDestinations } = await import('@/features/local-seo/content/destinations')
  expect(localSeoDestinations.map(item => item.slug)).toEqual([
    'saint-gervais-les-bains',
    'saint-nicolas-de-veroce',
    'megeve',
    'combloux',
  ])
})
```

- [ ] **Step 2: Extend Prisma with the approved target models**

Add `LocalLandingIntent`, `LocalLandingDestination`, `LocalLandingPage`, the inverse City relation and `destination_id` on `LocalLandingReview` exactly as specified in spec 048. During the first migration, keep `LocalLandingReview.destination_id` nullable so existing production rows remain valid.

Run: `npx prisma format && npx prisma validate`

Expected: schema formatted and `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 3: Generate the structural migration**

Run: `npx prisma migrate dev --name add_local_landing_management --create-only`

Expected: one new migration containing the enum, two tables, foreign keys, unique constraints and nullable review relation generated by Prisma.

- [ ] **Step 4: Implement an idempotent TypeScript backfill**

The script must:

```ts
for (const source of localSeoDestinations) {
  const city = await prisma.city.findFirst({
    where: { slug: source.slug, deleted_at: null },
    select: { id: true },
  })
  if (!city) throw new Error(`Missing City for ${source.slug}`)

  const destination = await prisma.localLandingDestination.upsert({
    where: { city_id: city.id },
    update: {},
    create: {
      city_id: city.id,
      is_active: source.services.concierge.published && source.services.seminar.published,
    },
  })

  await upsertThreePagesFromReviewedContent(destination.id, source)
  await prisma.localLandingReview.updateMany({
    where: { destination_slug: source.slug, destination_id: null },
    data: { destination_id: destination.id },
  })
}
```

`upsertThreePagesFromReviewedContent` maps every current scalar, highlight, step,
FAQ and concierge-specific field to the normalized page fields. It never changes
a page that already has Admin-authored content.

- [ ] **Step 5: Add and exercise the backfill command**

```json
{
  "scripts": {
    "db:backfill:local-landings": "tsx prisma/backfill-local-landing-destinations.ts"
  }
}
```

Run against the configured development database:

```bash
npx prisma migrate dev
npm run db:backfill:local-landings
npm run db:backfill:local-landings
```

Expected: both executions succeed; four destinations exist, each has three pages, and review counts are unchanged.

- [ ] **Step 6: Make the review relation required after backfill validation**

Change `destination_id String?` to `destination_id String`, run
`npx prisma migrate dev --name require_local_landing_review_destination --create-only`,
inspect the generated migration, then run `npx prisma migrate dev`.

Expected: validation succeeds and no review has a null `destination_id`.

- [ ] **Step 7: Run the focused integration test and commit**

Run: `npm test -- tests/integration/local-landing-management.backfill.test.ts --runInBand`

Expected: PASS.

```bash
git add prisma/schema.prisma prisma/migrations prisma/backfill-local-landing-destinations.ts package.json tests/integration/local-landing-management.backfill.test.ts
git commit -m "feat(db): persist local landing destinations"
```

### Task 3: Implement the repository and transactional mutations

**Files:**
- Create: `src/features/local-seo/queries/landing-pages.ts`
- Modify: `src/features/local-seo/queries/landing-reviews.ts`
- Modify: `src/features/local-seo/types/landing-reviews.ts`
- Test: `tests/unit/local-landing-management.queries.test.ts`
- Test: `tests/integration/local-landing-management.mutations.test.ts`

- [ ] **Step 1: Write failing repository tests**

Cover these exact outcomes with a mocked Prisma client:

```ts
expect(await listAdminLandingDestinations()).toEqual(expect.arrayContaining([
  expect.objectContaining({
    city: expect.objectContaining({ slug: 'megeve' }),
    publication: expect.objectContaining({ concierge: false, seminar: false, vacationRental: false }),
  }),
]))
await expect(setLandingDestinationActive('destination-1', true))
  .rejects.toMatchObject({ code: 'INCOMPLETE_CONTENT', status: 400 })
```

Also assert that `deleteLandingDestination` calls destination, page and review
`updateMany` operations inside a single `$transaction`, while never calling a
City update or delete operation.

- [ ] **Step 2: Implement public and Admin read functions**

Expose these signatures:

```ts
export async function listAdminLandingDestinations(): Promise<AdminLandingDestinationDto[]>
export async function listEligibleLandingCities(): Promise<EligibleLandingCityDto[]>
export async function getPublishedLocalLanding(slug: string, intent: LocalLandingIntent): Promise<PublicLocalLandingDto | null>
export async function listPublishedLocalLandingPaths(publishedLodgingCitySlugs: string[]): Promise<string[]>
```

`getPublishedLocalLanding` filters `destination.deleted_at`, `page.deleted_at`,
City activity, global activity and content completeness. For
`VACATION_RENTAL`, it also requires a published lodging profile.

- [ ] **Step 3: Implement create, update, toggle and delete transactions**

Expose these signatures and error codes:

```ts
export async function createLandingDestination(cityId: string): Promise<AdminLandingDestinationDto>
export async function updateLandingDestinationPages(id: string, pages: LocalLandingPageInput[]): Promise<AdminLandingDestinationDto>
export async function setLandingDestinationActive(id: string, isActive: boolean): Promise<AdminLandingDestinationDto>
export async function deleteLandingDestination(id: string): Promise<{ id: string }>

export class LandingDestinationError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'DESTINATION_ALREADY_EXISTS' | 'INCOMPLETE_CONTENT',
    public readonly status: 400 | 404 | 409,
    public readonly details: Record<string, unknown> = {},
  ) { super(code) }
}
```

Creation must create or reinitialize exactly three page rows. Deletion uses one
interactive transaction and applies the same timestamp to the destination,
pages and reviews. Toggle OFF never changes `deleted_at`.

- [ ] **Step 4: Move review queries to the destination relation**

Replace writes based only on `destination_slug` with a lookup of the active
destination and persist `destination_id`. Public review reads require an active,
non-deleted destination. Keep `destination_slug` during the compatibility
release so current DTO and URLs remain stable.

- [ ] **Step 5: Run focused tests and commit**

Run:

```bash
npm test -- tests/unit/local-landing-management.queries.test.ts tests/integration/local-landing-management.mutations.test.ts tests/unit/local-landing-reviews.queries.test.ts --runInBand
```

Expected: PASS.

```bash
git add src/features/local-seo/queries/landing-pages.ts src/features/local-seo/queries/landing-reviews.ts src/features/local-seo/types/landing-reviews.ts tests/unit/local-landing-management.queries.test.ts tests/integration/local-landing-management.mutations.test.ts tests/unit/local-landing-reviews.queries.test.ts
git commit -m "feat(admin): add landing destination repository"
```

### Task 4: Expose the Admin API contracts

**Files:**
- Create: `src/app/api/admin/landing-pages/route.ts`
- Create: `src/app/api/admin/landing-pages/[id]/route.ts`
- Create: `src/app/api/admin/landing-pages/[id]/publication/route.ts`
- Test: `tests/contract/local-landing-management.admin-api.test.ts`

- [ ] **Step 1: Write failing contract tests for authentication and responses**

Test GET/POST/PATCH/DELETE and publication PATCH with the established module
mocking pattern from `tests/contract/local-landing-reviews.admin-api.test.ts`.
Assert these responses exactly:

```ts
expect(response.status).toBe(400)
expect(await response.json()).toEqual({
  error: {
    code: 'INCOMPLETE_CONTENT',
    message: 'Les contenus obligatoires doivent être complétés avant activation.',
    details: { CONCIERGE: ['h1'], SEMINAR: ['faq'] },
  },
})
```

Also assert 403 without an Admin session, 404 for an unknown UUID and 409 for a
City already configured.

- [ ] **Step 2: Implement the collection route**

```ts
export async function GET() {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const [destinations, eligibleCities] = await Promise.all([
    listAdminLandingDestinations(),
    listEligibleLandingCities(),
  ])
  return NextResponse.json({ destinations, eligible_cities: eligibleCities })
}
```

POST validates `LandingDestinationInputSchema`, delegates to the repository and
returns 201. Import `getSessionAdmin` from
`@/features/merchant/lib/session`, `apiError` from
`@/features/merchant/lib/responses` and `NextResponse` from `next/server`.

- [ ] **Step 3: Implement content, publication and deletion routes**

`PATCH /[id]` validates `LandingPagesUpdateSchema`, `DELETE /[id]` soft-deletes
the group, and `PATCH /[id]/publication` validates
`LandingPublicationInputSchema`. After success, call:

```ts
revalidatePath('/admin/landing-pages')
revalidatePath('/sitemap.xml')
revalidatePath(`/conciergerie/${citySlug}`)
revalidatePath(`/seminaires/${citySlug}`)
revalidatePath(`/locations-vacances/${citySlug}`)
revalidatePath('/confier-mon-logement')
revalidatePath('/seminaires')
revalidatePath('/logements')
```

- [ ] **Step 4: Run contract tests and commit**

Run: `npm test -- tests/contract/local-landing-management.admin-api.test.ts --runInBand`

Expected: PASS.

```bash
git add src/app/api/admin/landing-pages src/features/local-seo/schemas/landing-pages.ts tests/contract/local-landing-management.admin-api.test.ts
git commit -m "feat(api): manage local landing destinations"
```

### Task 5: Replace static public resolution with persisted landings

**Files:**
- Modify: `src/app/(public)/conciergerie/[city-slug]/page.tsx`
- Modify: `src/app/(public)/seminaires/[city-slug]/page.tsx`
- Modify: `src/app/(public)/locations-vacances/[city-slug]/page.tsx`
- Modify: `src/features/local-seo/components/LocalConciergeLanding.tsx`
- Modify: `src/features/local-seo/components/LocalServiceLanding.tsx`
- Modify: `src/features/local-seo/components/LocalVacationRentalLanding.tsx`
- Modify: `src/features/local-seo/lib/metadata.ts`
- Modify: `src/features/local-seo/lib/structured-data.ts`
- Test: `tests/integration/local-landing-management.public-routes.test.tsx`

- [ ] **Step 1: Write failing public-route tests**

Mock `getPublishedLocalLanding` and assert:

```ts
await expect(ConciergePage({ params: Promise.resolve({ 'city-slug': 'megeve' }) }))
  .resolves.toBeTruthy()
expect(notFound).not.toHaveBeenCalled()
```

Add cases asserting 404 for an archived destination and 404 for Locations when
`publicLodgingCount` is zero. Assert metadata uses persisted `seo_title`,
`meta_description` and canonical path.

- [ ] **Step 2: Load persisted DTOs in all three page modules**

Each page and `generateMetadata` calls:

```ts
const landing = await getPublishedLocalLanding(citySlug, 'CONCIERGE')
if (!landing) notFound()
```

Use `SEMINAR` and `VACATION_RENTAL` for the other routes. Make
`generateStaticParams` async and return the current published slugs, while
retaining dynamic params for cities activated after deployment.

- [ ] **Step 3: Adapt public components without changing their visual contract**

Replace `LocalSeoDestination` and `LocalConciergeLandingContent` props with the
persisted DTO. Render all visible city-specific headings, copy, highlights,
steps and FAQ from that DTO. Keep global MyStay boilerplate only where the same
text is intentionally shared across cities.

- [ ] **Step 4: Adapt metadata and JSON-LD helpers**

Metadata must return:

```ts
{
  title: landing.page.seo_title,
  description: landing.page.meta_description,
  alternates: { canonical: localSeoPath(intent, landing.city.slug) },
  robots: { index: true, follow: true },
}
```

JSON-LD must use only `h1`, `meta_description`, City name and visible paths from
the same persisted DTO.

- [ ] **Step 5: Run public tests and commit**

Run:

```bash
npm test -- tests/integration/local-landing-management.public-routes.test.tsx tests/integration/local-seo.AC-01-02.service-pages.test.tsx tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx --runInBand
```

Expected: PASS after adapting superseded expectations from spec 046 to spec 048.

```bash
git add 'src/app/(public)/conciergerie/[city-slug]/page.tsx' 'src/app/(public)/seminaires/[city-slug]/page.tsx' 'src/app/(public)/locations-vacances/[city-slug]/page.tsx' src/features/local-seo/components src/features/local-seo/lib/metadata.ts src/features/local-seo/lib/structured-data.ts tests/integration/local-landing-management.public-routes.test.tsx tests/integration/local-seo.AC-01-02.service-pages.test.tsx tests/integration/local-seo.AC-03-01-05.vacation-page.test.tsx
git commit -m "feat(seo): serve persisted local landings"
```

### Task 6: Make sitemap and hub links follow persisted publication

**Files:**
- Modify: `src/features/local-seo/lib/sitemap.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `src/features/local-seo/components/LocalDestinationLinks.tsx`
- Modify: public hub callers returned by `rg -l "LocalDestinationLinks|listPublishedServiceDestinations" src/app src/features`
- Test: `tests/unit/local-landing-management.sitemap.test.ts`
- Test: `tests/integration/local-landing-management.hub-links.test.tsx`

- [ ] **Step 1: Write failing sitemap and hub tests**

```ts
expect(await localSeoSitemapPaths(['saint-gervais-les-bains'])).toEqual([
  '/conciergerie/saint-gervais-les-bains',
  '/seminaires/saint-gervais-les-bains',
  '/locations-vacances/saint-gervais-les-bains',
])
```

Add an archived-city case returning no path and a destination without lodging
returning only Conciergerie and Séminaires. Hub tests assert the same visibility.

- [ ] **Step 2: Make sitemap generation asynchronous**

```ts
export async function localSeoSitemapPaths(publishedLodgingCitySlugs: string[]) {
  return listPublishedLocalLandingPaths(publishedLodgingCitySlugs)
}
```

In `src/app/sitemap.ts`, await the paths before calling `buildSitemapEntries`.

- [ ] **Step 3: Feed hub components with published destinations from the server**

Replace constant-based list generation with `listPublishedLocalLandingSummaries`
and pass plain serializable arrays to components. Ensure deleted or archived
destinations never render links.

- [ ] **Step 4: Run focused tests and commit**

Run:

```bash
npm test -- tests/unit/local-landing-management.sitemap.test.ts tests/integration/local-landing-management.hub-links.test.tsx tests/unit/local-seo.AC-04-03.sitemap.test.ts tests/integration/local-seo.AC-04-04.hub-links.test.tsx --runInBand
```

Expected: PASS.

```bash
git add src/features/local-seo/lib/sitemap.ts src/app/sitemap.ts src/features/local-seo/components/LocalDestinationLinks.tsx src/app src/features/local-seo tests/unit/local-landing-management.sitemap.test.ts tests/integration/local-landing-management.hub-links.test.tsx tests/unit/local-seo.AC-04-03.sitemap.test.ts tests/integration/local-seo.AC-04-04.hub-links.test.tsx
git commit -m "feat(seo): publish dynamic local landing paths"
```

### Task 7: Build the responsive Admin table and accordion editor

**Files:**
- Create with Shadcn CLI: `src/shared/components/ui/accordion.tsx`
- Create with Shadcn CLI: `src/shared/components/ui/switch.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/admin/landing-pages/page.tsx`
- Modify: `src/features/local-seo/components/AdminLandingPages.tsx`
- Create: `src/features/local-seo/components/AdminLandingDestinationTable.tsx`
- Create: `src/features/local-seo/components/LandingPageEditor.tsx`
- Test: `tests/integration/local-landing-management.admin-page.test.tsx`
- Test: `tests/e2e/local-landing-management.admin-flow.test.ts`

- [ ] **Step 1: Write failing component tests**

Render one active destination and assert accessible controls:

```ts
expect(screen.getByRole('switch', { name: /archiver megève/i })).toBeChecked()
expect(screen.getByRole('button', { name: /modifier megève/i })).toBeVisible()
expect(screen.getByRole('button', { name: /supprimer les landings de megève/i })).toBeVisible()
expect(screen.getByText('Aucun logement associé')).toBeVisible()
```

Click Modifier and assert the three accordion buttons. Attempt activation with an
empty H1 and assert the server-provided missing-field message remains visible.

- [ ] **Step 2: Add the approved Shadcn primitives**

Run:

```bash
npx shadcn@latest add accordion switch
```

Expected: accessible Accordion and Switch primitives are created under
`src/shared/components/ui/` and their Radix dependencies are recorded in the
package files.

- [ ] **Step 3: Load the new Admin DTO in the Server Component**

```tsx
const [destinations, eligibleCities] = await Promise.all([
  listAdminLandingDestinations(),
  listEligibleLandingCities(),
])
return <AdminLandingPages initialDestinations={destinations} eligibleCities={eligibleCities} />
```

- [ ] **Step 4: Implement the responsive destination table**

Use semantic `<table>` markup from `md` upward and stacked cards below `md`.
Each row exposes one Shadcn `Switch`, a `Pencil` button and a `Trash2` button.
Disable all three controls while their mutation is pending. On API failure,
restore the previous switch value and render `error.message` plus missing fields.

- [ ] **Step 5: Implement the inline three-accordion editor**

Use Shadcn `Accordion` and controlled form state keyed by intention. Each
accordion renders common scalar fields plus repeatable highlight/step/FAQ rows.
Submit all three page payloads to `PATCH /api/admin/landing-pages/{id}` and call
`router.refresh()` only after a 200 response.

- [ ] **Step 6: Implement Add city and group deletion flows**

`Ajouter une ville` opens a Shadcn Select limited to `eligibleCities`, then POSTs
`{ city_id }`. The corbeille calls DELETE, removes the row after success and does
not mutate City state. Keep the existing review editor under the selected city
and hide it when that destination is deleted.

- [ ] **Step 7: Run integration and E2E tests**

Run:

```bash
npm test -- tests/integration/local-landing-management.admin-page.test.tsx tests/integration/local-landing-reviews.admin-page.test.tsx --runInBand
npx playwright test tests/e2e/local-landing-management.admin-flow.test.ts --project=chromium
```

Expected: both commands PASS at mobile and desktop widths with no horizontal overflow.

- [ ] **Step 8: Commit the Admin UI**

```bash
git add package.json package-lock.json src/shared/components/ui/accordion.tsx src/shared/components/ui/switch.tsx src/app/admin/landing-pages/page.tsx src/features/local-seo/components/AdminLandingPages.tsx src/features/local-seo/components/AdminLandingDestinationTable.tsx src/features/local-seo/components/LandingPageEditor.tsx tests/integration/local-landing-management.admin-page.test.tsx tests/integration/local-landing-reviews.admin-page.test.tsx tests/e2e/local-landing-management.admin-flow.test.ts
git commit -m "feat(admin): edit and publish city landings"
```

### Task 8: Remove runtime dependence on static content and close traceability

**Files:**
- Modify or remove after `rg` verification: `src/features/local-seo/content/destinations.ts`
- Modify or remove after `rg` verification: `src/features/local-seo/content/concierge-landings.ts`
- Modify: tests importing the static catalogue under `tests/unit/local-seo.*` and `tests/integration/local-seo.*`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Prove no public/Admin runtime imports the static catalogue**

Run:

```bash
rg -n "content/destinations|content/concierge-landings|localSeoDestinations" src
```

Expected: only the one-time backfill script may import the reviewed constants.
Move the frozen migration source beside the backfill script if necessary, then
remove runtime exports that could become a second source of truth.

- [ ] **Step 2: Update superseded tests to use persisted DTO fixtures**

Keep the behavioural assertions from specs 046 and 047, but build fixtures with
`LocalLandingDestination` and `LocalLandingPage` shapes. Do not retain tests that
assert Megève or Combloux must always return 404; instead assert their configured
status controls the response.

- [ ] **Step 3: Update the traceability matrix**

Add one row per AC group with concrete files, for example:

```md
| 048-admin-local-landing-management | Admin landing management | US-04 | AC-04-01–AC-04-05 | `src/features/local-seo/queries/landing-pages.ts`, `src/features/local-seo/services/landing-publication.ts` | `tests/unit/local-landing-management.publication.test.ts`, `tests/integration/local-landing-management.public-routes.test.tsx` | Implemented |
```

- [ ] **Step 4: Run complete verification**

Run:

```bash
npx prisma validate
npx prisma generate
npm test -- --runInBand
npm run lint
npm run build
```

Expected: Prisma validation succeeds, all Jest suites pass, ESLint exits 0 and
Next.js production build completes.

- [ ] **Step 5: Verify the critical browser flow locally**

Run the production server and verify:

```bash
npm run start -- --port 3001
```

Check `/admin/landing-pages`, activate a complete destination, confirm its
Conciergerie and Séminaires routes return 200, confirm Locations returns 404
without a public lodging, then archive the destination and confirm all three
routes return 404.

- [ ] **Step 6: Commit traceability and cleanup**

```bash
git add src/features/local-seo tests docs/traceability-matrix.md
git commit -m "test(seo): verify dynamic local landing management"
```
