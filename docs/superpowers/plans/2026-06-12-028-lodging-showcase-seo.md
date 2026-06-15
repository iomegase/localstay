# 028 Lodging Showcase SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved public lodging showcase: SEO/GEO listing pages, premium lodging detail pages, Owner creation workflow, Admin moderation, external Airbnb/Booking link support, manual content import, and Gemini editorial rewrite drafts.

**Architecture:** Add a dedicated `lodging-showcase` bounded context instead of overloading `guide-customization`. The public surface reads only `published` profiles; Owner APIs write `draft`/`review`; Admin APIs publish/archive. Gemini is only an editorial rewrite provider for Owner-supplied text, per ADR-009, and never scrapes or invents facts.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Prisma/PostgreSQL, Zod, Shadcn/ui/Tailwind, Supabase auth/session helpers, existing image upload service, Gemini SDK, Jest/Testing Library/Playwright.

---

## Scope Check

Spec `028-lodging-showcase-seo` is broad but cohesive: every subsystem depends on the same `LodgingPublicProfile` lifecycle. Implement it in vertical slices with commits after each task. Do not implement native booking, iCal, price calendars, Airbnb API, Booking API, review imports, or automatic platform scraping.

## File Map

Create:
- `src/features/lodging-showcase/types.ts` — public/admin/owner DTOs and enums.
- `src/features/lodging-showcase/schemas.ts` — Zod validation for profile, source URL, rights, rewrite, filters.
- `src/features/lodging-showcase/lib/source-url.ts` — platform detection without network scraping.
- `src/features/lodging-showcase/lib/completeness.ts` — review/publication and JSON-LD eligibility checks.
- `src/features/lodging-showcase/lib/slug.ts` — city-scoped lodging profile slug helper.
- `src/features/lodging-showcase/lib/rewrite-prompt.ts` — Gemini prompt builder constrained by ADR-009.
- `src/features/lodging-showcase/services/gemini-rewrite.ts` — server-only Gemini rewrite adapter.
- `src/features/lodging-showcase/queries/public-lodgings.ts` — public list/detail/read queries.
- `src/features/lodging-showcase/queries/owner-public-profile.ts` — Owner write/read/review submission.
- `src/features/lodging-showcase/queries/admin-public-profiles.ts` — Admin moderation.
- `src/features/lodging-showcase/components/LodgingCard.tsx`
- `src/features/lodging-showcase/components/LodgingGallery.tsx`
- `src/features/lodging-showcase/components/LodgingFacts.tsx`
- `src/features/lodging-showcase/components/AmenitiesGrid.tsx`
- `src/features/lodging-showcase/components/ExternalBookingCta.tsx`
- `src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx`
- `src/features/lodging-showcase/components/LodgingCitySection.tsx`
- `src/features/lodging-showcase/components/LodgingShowcaseForm.tsx`
- `src/features/lodging-showcase/components/AdminLodgingProfilesTable.tsx`
- `src/app/(public)/guide/[city-slug]/logements/page.tsx`
- `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`
- `src/app/api/cities/[slug]/lodgings/route.ts`
- `src/app/api/cities/[slug]/lodgings/[lodgingSlug]/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/submit/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/source-url/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/rights-confirmation/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/rewrite/route.ts`
- `src/app/api/dashboard/lodgings/[id]/public-profile/photos/route.ts`
- `src/app/(dashboard)/dashboard/lodgings/[id]/showcase/page.tsx`
- `src/app/admin/lodgings/page.tsx`
- `src/app/api/admin/lodgings/public-profiles/route.ts`
- `src/app/api/admin/lodgings/public-profiles/[profileId]/publish/route.ts`
- `src/app/api/admin/lodgings/public-profiles/[profileId]/request-changes/route.ts`
- `src/app/api/admin/lodgings/public-profiles/[profileId]/archive/route.ts`
- `tests/unit/lodging-showcase.source-url.test.ts`
- `tests/unit/lodging-showcase.completeness.test.ts`
- `tests/unit/lodging-showcase.structured-data.test.ts`
- `tests/unit/lodging-showcase.metadata.test.ts`
- `tests/unit/lodging-showcase.rewrite-prompt.test.ts`
- `tests/contract/lodging-showcase.public-api.test.ts`
- `tests/contract/lodging-showcase.owner-api.test.ts`
- `tests/contract/lodging-showcase.admin-api.test.ts`
- `tests/integration/lodging-showcase.public-pages.test.tsx`
- `tests/integration/lodging-showcase.owner-page.test.tsx`
- `tests/integration/lodging-showcase.admin-page.test.tsx`

Modify:
- `prisma/schema.prisma` — add enums/models and relations.
- `src/features/seo/lib/structured-data.ts` — add lodging JSON-LD builders.
- `src/features/seo/lib/metadata.ts` — add lodging metadata helpers.
- `src/features/seo/lib/sitemap.ts` — include lodging list/detail URLs.
- `src/features/seo/queries/sitemap-data.ts` — fetch published lodging profiles.
- `src/app/sitemap.ts` — pass lodging sitemap data.
- `src/app/(public)/guide/[city-slug]/page.tsx` — render `LodgingCitySection`.
- `src/app/admin/layout.tsx` — add "Logements" nav item.
- `src/features/dashboard-owner/components/LodgingsTable.tsx` — add action link to `/dashboard/lodgings/[id]/showcase`.
- `docs/traceability-matrix.md` — add `028` rows after implementation.

## Global Implementation Contracts

Use these response and DTO shapes across all tasks so the public page, APIs and tests stay aligned.

```ts
export type PublicLodgingCardDto = {
  id: string
  slug: string
  title: string
  short_description: string
  property_type: string
  max_guests: number
  public_area_label: string | null
  cover_photo_url: string | null
  amenities: Array<{ code: string; label: string }>
  href: string
}

export type PublicLodgingDetailDto = PublicLodgingCardDto & {
  description: string
  bedroom_count: number | null
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  external_booking_url: string | null
  external_booking_platform: 'airbnb' | 'booking' | 'other_verified' | null
  public_contact_enabled: boolean
  photos: Array<{ id: string; url: string; alt: string; room_type: string | null; sort_order: number; is_cover: boolean }>
  owner_recommendations: Array<{ id: string; name: string; slug: string; category_slug: string; photo_url: string | null }>
}

export type ApiErrorBody = {
  error: { code: string; message: string; details: Record<string, unknown> }
}
```

For every route, use the same error envelope:

```ts
function apiError(code: string, message: string, status: number, details: Record<string, unknown> = {}) {
  return NextResponse.json({ error: { code, message, details } }, { status })
}
```

Status transitions are fixed:

```txt
Owner save: any incoming status -> draft
Owner submit: draft -> review only if evaluateProfileCompleteness(profile).canSubmitForReview
Admin publish: review -> published with published_at = now
Admin request changes: review/published -> draft with admin_review_note
Admin archive: review/published/draft -> archived
Public reads: published only
```

---

### Task 1: Prisma Model And Generated Types

**Files:**
- Modify: `prisma/schema.prisma`
- Test: Prisma validation/generation

- [ ] **Step 1: Update Prisma schema**

Add these enums near the other enum declarations and add relations to `City` and `Lodging`.

```prisma
enum LodgingPublicationStatus {
  draft
  review
  published
  archived
}

enum ExternalBookingPlatform {
  airbnb
  booking
  other_verified
}

enum LodgingSourceMetadataStatus {
  not_checked
  url_only
  unavailable
  blocked
}

enum LodgingRewriteStatus {
  not_requested
  requested
  generated
  accepted
  rejected
  failed
}
```

In `model City`, add:

```prisma
  lodging_public_profiles LodgingPublicProfile[]
```

In `model Lodging`, add:

```prisma
  public_profile LodgingPublicProfile?
```

Add below the existing lodging models:

```prisma
model LodgingPublicProfile {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  lodging_id  String  @unique
  lodging     Lodging @relation(fields: [lodging_id], references: [id])
  city_id     String
  city        City    @relation(fields: [city_id], references: [id])

  slug                    String
  publication_status      LodgingPublicationStatus @default(draft)
  is_featured             Boolean @default(false)
  published_at            DateTime?
  submitted_for_review_at DateTime?
  admin_review_note       String?

  title             String
  short_description String
  description       String
  property_type     String
  max_guests        Int
  bedroom_count     Int?
  bathroom_count    Float?
  bed_count         Int?
  surface_m2        Int?

  public_area_label       String?
  precise_location_public Boolean @default(false)
  public_latitude         Float?
  public_longitude        Float?

  external_booking_url      String?
  external_booking_platform ExternalBookingPlatform?
  public_contact_enabled    Boolean @default(true)

  source_listing_url        String?
  source_listing_platform   ExternalBookingPlatform?
  source_listing_identifier String?
  source_metadata_status    LodgingSourceMetadataStatus @default(not_checked)
  source_metadata_detected  Json?
  source_description_text   String?

  content_rights_confirmed_at         DateTime?
  content_rights_confirmed_by_user_id String?
  content_rights_statement_version    String?

  rewrite_status           LodgingRewriteStatus @default(not_requested)
  rewrite_source_text_hash String?
  rewrite_suggestion       String?
  rewrite_generated_at     DateTime?
  rewrite_provider         String?

  seo_title       String?
  seo_description String?

  photos    LodgingPhoto[]
  amenities LodgingAmenity[]

  @@unique([city_id, slug])
  @@index([publication_status, deleted_at])
  @@index([city_id, publication_status, deleted_at])
  @@index([published_at])
}

model LodgingPhoto {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  profile_id String
  profile    LodgingPublicProfile @relation(fields: [profile_id], references: [id])

  url        String
  alt        String
  room_type  String?
  sort_order Int @default(0)
  is_cover   Boolean @default(false)

  @@index([profile_id, deleted_at])
}

model LodgingAmenity {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  profile_id String
  profile    LodgingPublicProfile @relation(fields: [profile_id], references: [id])

  code       String
  label      String
  sort_order Int @default(0)

  @@unique([profile_id, code])
  @@index([profile_id, deleted_at])
}
```

- [ ] **Step 2: Validate Prisma schema**

Run:

```bash
npx prisma validate
```

Expected: schema validates successfully.

- [ ] **Step 3: Generate Prisma client**

Run:

```bash
npm run db:generate
```

Expected: Prisma client generation completes.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(028): add lodging public profile models"
```

---

### Task 2: Domain Validation And Source URL Rules

**Files:**
- Create: `src/features/lodging-showcase/types.ts`
- Create: `src/features/lodging-showcase/schemas.ts`
- Create: `src/features/lodging-showcase/lib/source-url.ts`
- Create: `src/features/lodging-showcase/lib/completeness.ts`
- Create: `src/features/lodging-showcase/lib/slug.ts`
- Test: `tests/unit/lodging-showcase.source-url.test.ts`
- Test: `tests/unit/lodging-showcase.completeness.test.ts`

- [ ] **Step 1: Write source URL tests**

```ts
import { detectExternalListingSource } from '../../src/features/lodging-showcase/lib/source-url'

describe('detectExternalListingSource', () => {
  it('detects Airbnb listing id without scraping', () => {
    expect(detectExternalListingSource('https://www.airbnb.fr/rooms/123456789')).toEqual({
      platform: 'airbnb',
      identifier: '123456789',
      metadataStatus: 'url_only',
    })
  })

  it('detects Booking as a verified external platform', () => {
    expect(detectExternalListingSource('https://www.booking.com/hotel/fr/chalet-demo.fr.html')).toEqual({
      platform: 'booking',
      identifier: null,
      metadataStatus: 'url_only',
    })
  })

  it('rejects non-https urls', () => {
    expect(() => detectExternalListingSource('http://www.airbnb.fr/rooms/123')).toThrow('EXTERNAL_URL_HTTPS_REQUIRED')
  })

  it('rejects unsupported domains', () => {
    expect(() => detectExternalListingSource('https://example.com/listing/1')).toThrow('EXTERNAL_PLATFORM_NOT_ALLOWED')
  })
})
```

- [ ] **Step 2: Write completeness tests**

```ts
import { evaluateProfileCompleteness, canEmitVacationRentalSchema } from '../../src/features/lodging-showcase/lib/completeness'

const baseProfile = {
  title: 'Chalet des Alpes',
  short_description: 'Un chalet lumineux proche du guide local MyStay.',
  description: 'Un logement confortable pour profiter de la destination avec des recommandations locales.',
  property_type: 'Chalet',
  max_guests: 4,
  photos: [{ url: 'https://img.test/cover.webp', alt: 'Salon du chalet', is_cover: true, room_type: 'common_area' }],
  amenities: [{ code: 'wifi', label: 'Wi-Fi' }, { code: 'kitchen', label: 'Cuisine' }, { code: 'parking', label: 'Parking' }],
  content_rights_confirmed_at: new Date('2026-06-12'),
}

describe('lodging profile completeness', () => {
  it('allows review when required fields are present', () => {
    expect(evaluateProfileCompleteness(baseProfile).canSubmitForReview).toBe(true)
  })

  it('requires rights confirmation for review', () => {
    expect(evaluateProfileCompleteness({ ...baseProfile, content_rights_confirmed_at: null }).missingFields).toContain('content_rights_confirmation')
  })

  it('requires eight room-classified photos and public coordinates for VacationRental JSON-LD', () => {
    expect(canEmitVacationRentalSchema({
      ...baseProfile,
      photos: [],
      precise_location_public: false,
      public_latitude: null,
      public_longitude: null,
    })).toBe(false)
  })
})
```

- [ ] **Step 3: Implement `types.ts`**

```ts
export type ExternalBookingPlatform = 'airbnb' | 'booking' | 'other_verified'
export type LodgingPublicationStatus = 'draft' | 'review' | 'published' | 'archived'
export type LodgingSourceMetadataStatus = 'not_checked' | 'url_only' | 'unavailable' | 'blocked'
export type LodgingRewriteStatus = 'not_requested' | 'requested' | 'generated' | 'accepted' | 'rejected' | 'failed'
export type LodgingPhotoRoomType = 'bedroom' | 'bathroom' | 'common_area' | 'exterior' | 'kitchen' | 'other'

export type ExternalListingDetection = {
  platform: ExternalBookingPlatform
  identifier: string | null
  metadataStatus: Exclude<LodgingSourceMetadataStatus, 'not_checked'>
}

export type CompletenessResult = {
  canSubmitForReview: boolean
  missingFields: string[]
  warnings: string[]
}

export type PublicLodgingCardDto = {
  id: string
  slug: string
  title: string
  short_description: string
  property_type: string
  max_guests: number
  public_area_label: string | null
  cover_photo_url: string | null
  amenities: Array<{ code: string; label: string }>
  href: string
}

export type PublicLodgingDetailDto = PublicLodgingCardDto & {
  description: string
  bedroom_count: number | null
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  external_booking_url: string | null
  external_booking_platform: ExternalBookingPlatform | null
  public_contact_enabled: boolean
  photos: Array<{ id: string; url: string; alt: string; room_type: string | null; sort_order: number; is_cover: boolean }>
  owner_recommendations: Array<{ id: string; name: string; slug: string; category_slug: string; photo_url: string | null }>
}
```

- [ ] **Step 4: Implement `source-url.ts`**

```ts
import type { ExternalListingDetection } from '../types'

function hostname(value: string): string {
  return new URL(value).hostname.replace(/^www\./, '').toLowerCase()
}

export function detectExternalListingSource(value: string): ExternalListingDetection {
  const url = new URL(value)
  if (url.protocol !== 'https:') throw new Error('EXTERNAL_URL_HTTPS_REQUIRED')

  const host = hostname(value)
  if (host.endsWith('airbnb.fr') || host.endsWith('airbnb.com')) {
    const roomMatch = url.pathname.match(/\/rooms\/(\d+)/)
    return { platform: 'airbnb', identifier: roomMatch?.[1] ?? null, metadataStatus: 'url_only' }
  }
  if (host.endsWith('booking.com')) {
    return { platform: 'booking', identifier: null, metadataStatus: 'url_only' }
  }
  throw new Error('EXTERNAL_PLATFORM_NOT_ALLOWED')
}
```

- [ ] **Step 5: Implement `completeness.ts`**

```ts
type ProfileLike = {
  title: string | null
  short_description: string | null
  description: string | null
  property_type: string | null
  max_guests: number | null
  photos: Array<{ url: string; alt: string; is_cover: boolean; room_type?: string | null }>
  amenities: Array<{ code: string; label: string }>
  content_rights_confirmed_at?: Date | null
  precise_location_public?: boolean | null
  public_latitude?: number | null
  public_longitude?: number | null
}

export function evaluateProfileCompleteness(profile: ProfileLike) {
  const missingFields: string[] = []
  if (!profile.title || profile.title.trim().length < 5) missingFields.push('title')
  if (!profile.short_description || profile.short_description.trim().length < 40) missingFields.push('short_description')
  if (!profile.description || profile.description.trim().length < 80) missingFields.push('description')
  if (!profile.property_type) missingFields.push('property_type')
  if (!profile.max_guests || profile.max_guests < 1) missingFields.push('max_guests')
  if (profile.photos.length < 1) missingFields.push('photos')
  if (!profile.photos.some(photo => photo.is_cover)) missingFields.push('cover_photo')
  if (profile.amenities.length < 3) missingFields.push('amenities')
  if (!profile.content_rights_confirmed_at) missingFields.push('content_rights_confirmation')

  const warnings: string[] = []
  if (profile.description && profile.description.length < 200) warnings.push('editorial_description_length')
  if (profile.photos.length < 5) warnings.push('seo_photo_count')
  if (profile.description && profile.description.length < 400) warnings.push('seo_description_length')

  return { canSubmitForReview: missingFields.length === 0, missingFields, warnings }
}

export function canEmitVacationRentalSchema(profile: ProfileLike): boolean {
  const roomTypes = new Set(profile.photos.map(photo => photo.room_type).filter(Boolean))
  return Boolean(
    profile.precise_location_public &&
      typeof profile.public_latitude === 'number' &&
      typeof profile.public_longitude === 'number' &&
      profile.photos.length >= 8 &&
      roomTypes.has('bedroom') &&
      roomTypes.has('bathroom') &&
      roomTypes.has('common_area'),
  )
}
```

- [ ] **Step 6: Implement `slug.ts`**

```ts
export function lodgingProfileSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'logement'
}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- tests/unit/lodging-showcase.source-url.test.ts tests/unit/lodging-showcase.completeness.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/lodging-showcase tests/unit/lodging-showcase.source-url.test.ts tests/unit/lodging-showcase.completeness.test.ts
git commit -m "feat(028): add lodging showcase domain rules"
```

---

### Task 3: Public Queries And API Contracts

**Files:**
- Create: `src/features/lodging-showcase/queries/public-lodgings.ts`
- Create: `src/app/api/cities/[slug]/lodgings/route.ts`
- Create: `src/app/api/cities/[slug]/lodgings/[lodgingSlug]/route.ts`
- Test: `tests/contract/lodging-showcase.public-api.test.ts`

- [ ] **Step 1: Write public API contract tests**

Mock `prisma.city.findFirst`, `prisma.lodgingPublicProfile.findMany`, `findFirst`, and `count`. Include tests:

```ts
it('AC-01-01: lists only published lodging profiles for a city', async () => {
  mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy', is_active: true, deleted_at: null })
  mockFindManyProfiles.mockResolvedValue([publishedProfile])
  mockCountProfiles.mockResolvedValue(1)
  const res = await GET(new NextRequest('http://localhost:3000/api/cities/annecy/lodgings'), { params: Promise.resolve({ slug: 'annecy' }) })
  expect(res.status).toBe(200)
  const json = await res.json()
  expect(json.items).toHaveLength(1)
  expect(mockFindManyProfiles).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ city_id: 'city-1', publication_status: 'published', deleted_at: null }),
  }))
})

it('AC-02-03: returns 404 for non-published detail', async () => {
  mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy' })
  mockFindFirstProfile.mockResolvedValue(null)
  const res = await DETAIL_GET(new NextRequest('http://localhost:3000/api/cities/annecy/lodgings/draft'), {
    params: Promise.resolve({ slug: 'annecy', lodgingSlug: 'draft' }),
  })
  expect(res.status).toBe(404)
})
```

- [ ] **Step 2: Implement public query functions**

Create functions:

```ts
export async function listPublishedLodgingsForCity(citySlug: string, filters: { guests?: number; amenities?: string[]; page: number; limit: number })
export async function getPublishedLodgingDetail(citySlug: string, lodgingSlug: string)
export async function listFeaturedLodgingsForCity(citySlug: string, limit = 3)
```

All queries must include:

```ts
where: {
  publication_status: 'published',
  deleted_at: null,
  city: { slug: citySlug, is_active: true, deleted_at: null },
  lodging: { is_active: true, deleted_at: null },
}
```

- [ ] **Step 3: Implement public API routes**

Use Zod query parsing:

```ts
const listQuerySchema = z.object({
  guests: z.coerce.number().int().min(1).max(30).optional(),
  amenities: z.string().optional().transform(value => value ? value.split(',').filter(Boolean) : []),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
})
```

Return standard errors:

```ts
return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Ville introuvable', details: {} } }, { status: 404 })
```

- [ ] **Step 4: Run contract tests**

```bash
npm test -- tests/contract/lodging-showcase.public-api.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/queries/public-lodgings.ts src/app/api/cities/[slug]/lodgings tests/contract/lodging-showcase.public-api.test.ts
git commit -m "feat(028): expose public lodging showcase api"
```

---

### Task 4: Public SEO Pages, Components, Metadata, JSON-LD

**Files:**
- Create public components listed in File Map.
- Create: `src/app/(public)/guide/[city-slug]/logements/page.tsx`
- Create: `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`
- Modify: `src/features/seo/lib/metadata.ts`
- Modify: `src/features/seo/lib/structured-data.ts`
- Modify: `src/app/(public)/guide/[city-slug]/page.tsx`
- Test: `tests/unit/lodging-showcase.metadata.test.ts`
- Test: `tests/unit/lodging-showcase.structured-data.test.ts`
- Test: `tests/integration/lodging-showcase.public-pages.test.tsx`

- [ ] **Step 1: Add metadata helpers**

Add to `metadata.ts`:

```ts
export function lodgingListMetadata(input: { cityName: string; citySlug: string }): Metadata {
  const title = `Logements à ${input.cityName} — MyStay`
  const description = truncate(`Découvrez les logements à ${input.cityName} avec photos, équipements, recommandations locales et lien de réservation.`)
  const path = `/guide/${input.citySlug}/logements`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path }),
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function lodgingDetailMetadata(input: { title: string; shortDescription: string; citySlug: string; lodgingSlug: string; coverPhoto: string | null }): Metadata {
  const title = `${input.title} — Logement MyStay`
  const description = truncate(input.shortDescription)
  const path = `/guide/${input.citySlug}/logements/${input.lodgingSlug}`
  const images = input.coverPhoto ? [input.coverPhoto] : undefined
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images, type: 'article' }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}
```

- [ ] **Step 2: Add structured data helpers**

Add this input type and helpers to `structured-data.ts`. Use `canEmitVacationRentalSchema` to gate the strict schema. Tests must assert no `VacationRental` is emitted without public coordinates and 8 classified photos.

```ts
import { canEmitVacationRentalSchema } from '@/features/lodging-showcase/lib/completeness'
import type { PublicLodgingCardDto } from '@/features/lodging-showcase/types'

export type LodgingSchemaInput = {
  id: string
  title: string
  shortDescription: string
  description: string
  cityName: string
  cityRegion: string | null
  citySlug: string
  slug: string
  propertyType: string
  maxGuests: number
  publicAreaLabel: string | null
  preciseLocationPublic: boolean
  publicLatitude: number | null
  publicLongitude: number | null
  photos: Array<{ url: string; alt: string; is_cover: boolean; room_type: string | null }>
  amenities: Array<{ code: string; label: string }>
}

export function lodgingPlaceSchema(input: LodgingSchemaInput): JsonLdObject {
  const path = `/guide/${input.citySlug}/logements/${input.slug}`
  return {
    '@context': SCHEMA,
    '@type': 'LodgingBusiness',
    '@id': `${siteBaseUrl()}${path}#lodging`,
    name: input.title,
    description: input.shortDescription,
    url: `${siteBaseUrl()}${path}`,
    image: input.photos.map(photo => photo.url),
    amenityFeature: input.amenities.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.label,
      value: true,
    })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.publicAreaLabel ?? input.cityName,
      ...(input.cityRegion ? { addressRegion: input.cityRegion } : {}),
      addressCountry: 'FR',
    },
    ...(input.preciseLocationPublic && input.publicLatitude != null && input.publicLongitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: input.publicLatitude, longitude: input.publicLongitude } }
      : {}),
  }
}

export function vacationRentalSchema(input: LodgingSchemaInput): JsonLdObject | null {
  const canEmit = canEmitVacationRentalSchema({
    title: input.title,
    short_description: input.shortDescription,
    description: input.description,
    property_type: input.propertyType,
    max_guests: input.maxGuests,
    photos: input.photos,
    amenities: input.amenities,
    precise_location_public: input.preciseLocationPublic,
    public_latitude: input.publicLatitude,
    public_longitude: input.publicLongitude,
  })
  if (!canEmit) return null
  return {
    ...lodgingPlaceSchema(input),
    '@type': 'VacationRental',
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: input.maxGuests,
      unitText: 'personnes',
    },
  }
}

export function lodgingItemListSchema(input: { cityName: string; citySlug: string; items: PublicLodgingCardDto[] }): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type': 'ItemList',
    name: `Logements à ${input.cityName}`,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteBaseUrl()}${item.href}`,
      name: item.title,
    })),
  }
}
```

- [ ] **Step 3: Create presentational components**

Keep components focused:
- `LodgingCard` renders one card and receives `{ href, title, coverPhotoUrl, propertyType, maxGuests, publicAreaLabel, amenities }`.
- `ExternalBookingCta` renders nothing if `externalBookingUrl` is null; otherwise renders an `<a target="_blank" rel="noopener noreferrer">`.
- `LodgingGallery` is a Client Component only if it needs carousel state.
- `OwnerRecommendationsBlock` reuses existing POI card styles or compact links and never creates POI data.

Use this minimum component contract:

```tsx
import Link from 'next/link'
import { Users } from 'lucide-react'

export function LodgingCard(props: PublicLodgingCardDto) {
  return (
    <article className="overflow-hidden rounded-lg border bg-white">
      <Link href={props.href} className="block">
        {props.cover_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.cover_photo_url} alt="" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] bg-slate-100" aria-hidden="true" />
        )}
        <div className="space-y-2 p-4">
          <p className="text-sm text-slate-600">{props.property_type}</p>
          <h2 className="text-lg font-semibold text-slate-950">{props.title}</h2>
          <p className="line-clamp-2 text-sm text-slate-700">{props.short_description}</p>
          <p className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="h-4 w-4" aria-hidden="true" />
            Jusqu'a {props.max_guests} voyageurs
          </p>
          {props.public_area_label && <p className="text-sm text-slate-600">{props.public_area_label}</p>}
        </div>
      </Link>
    </article>
  )
}

export function ExternalBookingCta(props: { externalBookingUrl: string | null; platform: string | null }) {
  if (!props.externalBookingUrl) return null
  const label = props.platform === 'airbnb' ? 'Reserver sur Airbnb' : 'Ouvrir la reservation'
  return (
    <a
      href={props.externalBookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-event="lodging_external_booking_click"
      className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
    >
      {label}
    </a>
  )
}

export function LodgingCitySection(props: { citySlug: string; cityName: string; lodgings: PublicLodgingCardDto[] }) {
  if (props.lodgings.length === 0) return null
  return (
    <section aria-labelledby="city-lodgings" className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="city-lodgings" className="text-2xl font-semibold text-slate-950">Sejourner a {props.cityName}</h2>
          <p className="mt-1 text-sm text-slate-700">Des logements relies au guide local MyStay.</p>
        </div>
        <Link href={`/guide/${props.citySlug}/logements`} className="text-sm font-medium text-slate-950 underline">
          Voir tous les logements
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {props.lodgings.map(lodging => <LodgingCard key={lodging.id} {...lodging} />)}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create list page**

`/guide/[city-slug]/logements/page.tsx` must:
- call `listPublishedLodgingsForCity`;
- return 404 for inactive/missing city;
- render editorial empty state with links to `/guide/[citySlug]`, category pages when available, and no fake listings;
- expose `lodgingListMetadata`.

- [ ] **Step 5: Create detail page**

`/guide/[city-slug]/logements/[lodging-slug]/page.tsx` must:
- call `getPublishedLodgingDetail`;
- return 404 if missing or non-published;
- render JSON-LD via `JsonLd`;
- render sticky mobile CTAs.

- [ ] **Step 6: Add city guide section**

In `src/app/(public)/guide/[city-slug]/page.tsx`, fetch `listFeaturedLodgingsForCity(slug, 3)` in the existing `Promise.all` and render:

```tsx
{featuredLodgings.length > 0 && (
  <LodgingCitySection citySlug={slug} cityName={city.name} lodgings={featuredLodgings} />
)}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- tests/unit/lodging-showcase.metadata.test.ts tests/unit/lodging-showcase.structured-data.test.ts tests/integration/lodging-showcase.public-pages.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/(public)/guide/[city-slug] src/features/lodging-showcase/components src/features/seo tests/unit/lodging-showcase.metadata.test.ts tests/unit/lodging-showcase.structured-data.test.ts tests/integration/lodging-showcase.public-pages.test.tsx
git commit -m "feat(028): add public lodging showcase pages"
```

---

### Task 5: Owner Public Profile Workflow

**Files:**
- Create owner query/API files listed in File Map.
- Create: `src/features/lodging-showcase/components/LodgingShowcaseForm.tsx`
- Create: `src/app/(dashboard)/dashboard/lodgings/[id]/showcase/page.tsx`
- Modify: `src/features/dashboard-owner/components/LodgingsTable.tsx`
- Test: `tests/contract/lodging-showcase.owner-api.test.ts`
- Test: `tests/integration/lodging-showcase.owner-page.test.tsx`

- [ ] **Step 1: Write owner API contract tests**

Create tests with these concrete cases:

```ts
it('AC-05-02: saves owner payload as draft even if a status is submitted', async () => {
  mockGetSessionOwner.mockResolvedValue({ owner: { id: 'owner-1' }, error: null })
  mockFindOwnedLodging.mockResolvedValue({ id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1', city: { slug: 'annecy' } })
  mockUpsertProfile.mockResolvedValue({ id: 'profile-1', publication_status: 'draft' })
  const res = await PUT(jsonRequest({ ...validOwnerPayload, publication_status: 'published' }), {
    params: Promise.resolve({ id: 'lodging-1' }),
  })
  expect(res.status).toBe(200)
  expect(mockUpsertProfile).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ publication_status: 'draft' }),
  }))
})

it('AC-05-06: detects Airbnb URL without fetching the platform', async () => {
  global.fetch = jest.fn()
  const res = await SOURCE_POST(jsonRequest({ source_listing_url: 'https://www.airbnb.fr/rooms/123456789' }), {
    params: Promise.resolve({ id: 'lodging-1' }),
  })
  expect(res.status).toBe(200)
  expect(global.fetch).not.toHaveBeenCalled()
  expect(await res.json()).toMatchObject({
    source_listing_platform: 'airbnb',
    source_listing_identifier: '123456789',
    source_metadata_status: 'url_only',
  })
})

it('AC-05-08: submit refuses a profile without rights confirmation', async () => {
  mockGetProfileForReview.mockResolvedValue({ ...completeProfile, content_rights_confirmed_at: null })
  const res = await SUBMIT_POST(new NextRequest('http://localhost'), { params: Promise.resolve({ id: 'lodging-1' }) })
  expect(res.status).toBe(400)
  expect(await res.json()).toMatchObject({
    error: { code: 'PROFILE_INCOMPLETE', details: { missingFields: expect.arrayContaining(['content_rights_confirmation']) } },
  })
})
```

Also cover non-owner 403/404, invalid MIME upload rejection, valid upload creation, and successful `draft -> review` transition.

- [ ] **Step 2: Implement owner query helpers**

Create `getOwnedLodgingForShowcase(ownerId, lodgingId)` with:

```ts
where: { id: lodgingId, owner_id: ownerId, deleted_at: null, is_active: true }
```

Create `saveOwnerPublicProfile`, `submitOwnerPublicProfile`, `saveSourceListingUrl`, `confirmContentRights`, and `createLodgingPhoto` with these invariants:

```ts
export async function saveOwnerPublicProfile(ownerId: string, lodgingId: string, input: OwnerLodgingPublicProfileInput) {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null
  const slug = lodgingProfileSlug(input.title)
  return prisma.lodgingPublicProfile.upsert({
    where: { lodging_id: lodgingId },
    create: {
      lodging_id: lodgingId,
      city_id: lodging.city_id,
      slug,
      publication_status: 'draft',
      ...input,
    },
    update: {
      ...input,
      slug,
      city_id: lodging.city_id,
      publication_status: 'draft',
    },
    include: ownerProfileInclude,
  })
}

export async function submitOwnerPublicProfile(ownerId: string, lodgingId: string) {
  const profile = await getOwnerProfileForReview(ownerId, lodgingId)
  if (!profile) return { ok: false as const, code: 'NOT_FOUND', status: 404, missingFields: [] }
  const completeness = evaluateProfileCompleteness(profile)
  if (!completeness.canSubmitForReview) {
    return { ok: false as const, code: 'PROFILE_INCOMPLETE', status: 400, missingFields: completeness.missingFields }
  }
  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: profile.id },
    data: { publication_status: 'review', submitted_for_review_at: new Date() },
  })
  return { ok: true as const, profile: updated }
}
```

- [ ] **Step 3: Implement owner routes**

All routes must use `getSessionOwner()` and standard errors. `PUT /public-profile` saves `publication_status: 'draft'` even if the payload contains a status.

```ts
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { owner, error } = await getSessionOwner()
  if (error) return error
  const { id } = await context.params
  const body = await req.json().catch(() => null)
  const parsed = OwnerPublicProfileInputSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Parametre manquant ou invalide', 400, parsed.error.flatten())
  const profile = await saveOwnerPublicProfile(owner.id, id, parsed.data)
  if (!profile) return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  return NextResponse.json(profile)
}
```

For `source-url`, call only `detectExternalListingSource(source_listing_url)`. Do not call `fetch`, `curl`, Playwright, Airbnb APIs, Booking APIs, or HTML parsers.

- [ ] **Step 4: Implement Owner page**

`/dashboard/lodgings/[id]/showcase/page.tsx` must:
- call `getPageOwner` or existing Owner page helper;
- load profile, city, and lodging;
- render `LodgingShowcaseForm`.

- [ ] **Step 5: Implement form**

The form sections must match spec:
- source URL;
- rights confirmation;
- content fields;
- facts;
- amenities;
- photos;
- external booking CTA;
- SEO preview;
- submit for review.

Never auto-download Airbnb images. The source URL UI text must state: `MyStay ne copie pas automatiquement les photos ou textes Airbnb. Importez uniquement des contenus dont vous possédez les droits.`

Use this top-level form shape:

```tsx
'use client'

export function LodgingShowcaseForm(props: { lodgingId: string; initialProfile: OwnerLodgingPublicProfile | null }) {
  return (
    <form className="space-y-8">
      <section aria-labelledby="source-url">
        <h2 id="source-url" className="text-lg font-semibold">Annonce externe</h2>
        <p className="text-sm text-slate-600">
          MyStay ne copie pas automatiquement les photos ou textes Airbnb. Importez uniquement des contenus dont vous possédez les droits.
        </p>
        {/* input source_listing_url + save button calling /source-url */}
      </section>
      <section aria-labelledby="rights-confirmation">
        <h2 id="rights-confirmation" className="text-lg font-semibold">Droits contenus</h2>
        {/* checkbox required before submit for review; POST /rights-confirmation */}
      </section>
      <section aria-labelledby="content-fields">
        <h2 id="content-fields" className="text-lg font-semibold">Presentation publique</h2>
        {/* title, short_description, description, facts, amenities, seo preview */}
      </section>
      <section aria-labelledby="photos">
        <h2 id="photos" className="text-lg font-semibold">Photos</h2>
        {/* upload from computer only; no third-party URL import */}
      </section>
      <section aria-labelledby="publication">
        <h2 id="publication" className="text-lg font-semibold">Publication</h2>
        {/* save draft and submit for review actions */}
      </section>
    </form>
  )
}
```

- [ ] **Step 6: Add dashboard table action**

In `LodgingsTable`, add a link action:

```tsx
router.push(`/dashboard/lodgings/${lodging.id}/showcase`)
```

- [ ] **Step 7: Run tests**

```bash
npm test -- tests/contract/lodging-showcase.owner-api.test.ts tests/integration/lodging-showcase.owner-page.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/dashboard/lodgings/[id]/public-profile src/app/(dashboard)/dashboard/lodgings/[id]/showcase src/features/lodging-showcase src/features/dashboard-owner/components/LodgingsTable.tsx tests/contract/lodging-showcase.owner-api.test.ts tests/integration/lodging-showcase.owner-page.test.tsx
git commit -m "feat(028): add owner lodging showcase workflow"
```

---

### Task 6: Gemini Editorial Rewrite For Lodging Drafts

**Files:**
- Create: `src/features/lodging-showcase/lib/rewrite-prompt.ts`
- Create: `src/features/lodging-showcase/services/gemini-rewrite.ts`
- Create: `src/app/api/dashboard/lodgings/[id]/public-profile/rewrite/route.ts`
- Test: `tests/unit/lodging-showcase.rewrite-prompt.test.ts`
- Extend: `tests/contract/lodging-showcase.owner-api.test.ts`

- [ ] **Step 1: Write prompt tests**

```ts
import { buildLodgingRewritePrompt } from '../../src/features/lodging-showcase/lib/rewrite-prompt'

it('forbids invention of facts and scraping', () => {
  const prompt = buildLodgingRewritePrompt({
    sourceText: 'Appartement lumineux avec balcon.',
    facts: { cityName: 'Annecy', maxGuests: 4, amenities: ['Wi-Fi', 'Parking'] },
  })
  expect(prompt).toContain('N invente aucun equipement')
  expect(prompt).toContain('N ajoute aucun prix')
  expect(prompt).toContain('Retourne uniquement du JSON')
})
```

- [ ] **Step 2: Implement prompt builder**

Return JSON-only instructions:

```ts
export function buildLodgingRewritePrompt(input: { sourceText: string; facts: { cityName: string; maxGuests: number; amenities: string[] } }): string {
  return [
    'Tu es un assistant editorial MyStay pour fiches logement.',
    'Reecris uniquement a partir du texte source et des faits fournis.',
    'N invente aucun equipement, prix, disponibilite, adresse, coordonnee, surface, chambre ou regle.',
    'N ajoute aucun prix ni donnee transactionnelle.',
    'Retourne uniquement du JSON avec: short_description, description, seo_title, seo_description.',
    `Ville: ${input.facts.cityName}`,
    `Capacite: ${input.facts.maxGuests}`,
    `Equipements fournis: ${input.facts.amenities.join(', ')}`,
    `Texte source Owner: ${input.sourceText}`,
  ].join('\n')
}
```

- [ ] **Step 3: Implement Gemini adapter**

Use `@google/generative-ai`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and a Zod schema:

```ts
const RewriteSchema = z.object({
  short_description: z.string().min(40).max(180),
  description: z.string().min(200).max(4000),
  seo_title: z.string().min(30).max(70),
  seo_description: z.string().min(80).max(180),
})
```

Strip markdown fences as in `gemini-fetch/services/gemini-client.ts`.

- [ ] **Step 4: Implement rewrite route**

The route:
- stores `source_description_text`;
- hashes normalized source text with Node `crypto.createHash('sha256')`;
- calls Gemini;
- saves `rewrite_status = generated`, `rewrite_provider = gemini`, `rewrite_generated_at`.

On missing API key or provider failure, return:

```json
{ "error": { "code": "GEMINI_REWRITE_UNAVAILABLE", "message": "Réécriture indisponible", "details": {} } }
```

with status `503`.

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/unit/lodging-showcase.rewrite-prompt.test.ts tests/contract/lodging-showcase.owner-api.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/lib/rewrite-prompt.ts src/features/lodging-showcase/services/gemini-rewrite.ts src/app/api/dashboard/lodgings/[id]/public-profile/rewrite/route.ts tests/unit/lodging-showcase.rewrite-prompt.test.ts tests/contract/lodging-showcase.owner-api.test.ts
git commit -m "feat(028): add Gemini lodging rewrite drafts"
```

---

### Task 7: Admin Moderation

**Files:**
- Create: `src/features/lodging-showcase/queries/admin-public-profiles.ts`
- Create: `src/features/lodging-showcase/components/AdminLodgingProfilesTable.tsx`
- Create: `src/app/admin/lodgings/page.tsx`
- Create admin API routes listed in File Map.
- Modify: `src/app/admin/layout.tsx`
- Test: `tests/contract/lodging-showcase.admin-api.test.ts`
- Test: `tests/integration/lodging-showcase.admin-page.test.tsx`

- [ ] **Step 1: Write admin API tests**

Create tests for the moderation state machine:

```ts
it('AC-06-02: admin publishes a profile in review', async () => {
  mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  mockUpdateProfile.mockResolvedValue({ id: 'profile-1', publication_status: 'published', published_at: new Date('2026-06-12') })
  const res = await PUBLISH_POST(new NextRequest('http://localhost'), { params: Promise.resolve({ profileId: 'profile-1' }) })
  expect(res.status).toBe(200)
  expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'profile-1' },
    data: expect.objectContaining({ publication_status: 'published', published_at: expect.any(Date) }),
  }))
})

it('AC-06-03: admin requests changes and removes indexability', async () => {
  const res = await REQUEST_CHANGES_POST(jsonRequest({ note: 'Ajouter des photos avec alt.' }), {
    params: Promise.resolve({ profileId: 'profile-1' }),
  })
  expect(res.status).toBe(200)
  expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ publication_status: 'draft', admin_review_note: 'Ajouter des photos avec alt.' }),
  }))
})

it('AC-06-04: archived profile is no longer returned publicly', async () => {
  await ARCHIVE_POST(new NextRequest('http://localhost'), { params: Promise.resolve({ profileId: 'profile-1' }) })
  expect(mockUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ publication_status: 'archived' }),
  }))
})
```

Also cover list filters by `publication_status`, `city_id`, `owner_id`, and non-admin access returning the existing admin helper behavior.

- [ ] **Step 2: Implement admin queries**

Use `getPageAdmin()` for pages and admin session helpers for routes. Query only `deleted_at: null` unless filtering archive status.

```ts
export async function listAdminLodgingProfiles(filters: { status?: LodgingPublicationStatus; cityId?: string; ownerId?: string }) {
  return prisma.lodgingPublicProfile.findMany({
    where: {
      deleted_at: null,
      ...(filters.status ? { publication_status: filters.status } : {}),
      ...(filters.cityId ? { city_id: filters.cityId } : {}),
      ...(filters.ownerId ? { lodging: { owner_id: filters.ownerId } } : {}),
    },
    include: {
      city: { select: { id: true, name: true, slug: true } },
      lodging: { select: { id: true, name: true, owner: { select: { id: true, email: true } } } },
      photos: { where: { deleted_at: null }, orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }] },
      amenities: { where: { deleted_at: null }, orderBy: { sort_order: 'asc' } },
    },
    orderBy: [{ publication_status: 'asc' }, { submitted_for_review_at: 'desc' }, { updated_at: 'desc' }],
  })
}

export async function publishLodgingProfile(profileId: string) {
  return prisma.lodgingPublicProfile.update({
    where: { id: profileId },
    data: { publication_status: 'published', published_at: new Date(), admin_review_note: null },
  })
}
```

- [ ] **Step 3: Implement admin page and table**

Add nav item in `src/app/admin/layout.tsx`:

```ts
{ href: '/admin/lodgings', label: 'Logements', icon: Home }
```

Use Lucide `Home` or `House`.

- [ ] **Step 4: Implement admin routes**

All mutations validate path UUID with Zod and return standard errors.

```ts
const ParamsSchema = z.object({ profileId: z.string().uuid() })

export async function POST(req: NextRequest, context: { params: Promise<{ profileId: string }> }) {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  void session.user
  const params = ParamsSchema.safeParse(await context.params)
  if (!params.success) return apiError('VALIDATION_ERROR', 'Parametre invalide', 400, params.error.flatten())
  const profile = await publishLodgingProfile(params.data.profileId)
  return NextResponse.json({ id: profile.id, publication_status: profile.publication_status, published_at: profile.published_at })
}
```

`request-changes` must parse `{ note: string().min(5).max(1000) }`. `archive` must set `publication_status = 'archived'` and never delete the record.

- [ ] **Step 5: Run tests**

```bash
npm test -- tests/contract/lodging-showcase.admin-api.test.ts tests/integration/lodging-showcase.admin-page.test.tsx --no-coverage
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/queries/admin-public-profiles.ts src/features/lodging-showcase/components/AdminLodgingProfilesTable.tsx src/app/admin/lodgings src/app/api/admin/lodgings src/app/admin/layout.tsx tests/contract/lodging-showcase.admin-api.test.ts tests/integration/lodging-showcase.admin-page.test.tsx
git commit -m "feat(028): add admin lodging moderation"
```

---

### Task 8: Sitemap, SEO Data, Traceability, Final Verification

**Files:**
- Modify: `src/features/seo/lib/sitemap.ts`
- Modify: `src/features/seo/queries/sitemap-data.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `docs/traceability-matrix.md`
- Test: `tests/unit/seo.sitemap.test.ts`

- [ ] **Step 1: Extend sitemap types**

In `sitemap.ts`, add:

```ts
export type SitemapLodging = {
  slug: string
  city_slug: string
  updated_at: Date
}
```

Extend `buildSitemapEntries` input with `lodgings: SitemapLodging[]`, add city lodging list URL once per city with published lodging, and add each detail URL:

```ts
entries.push({
  url: url(`/guide/${lodging.city_slug}/logements/${lodging.slug}`),
  lastModified: lodging.updated_at,
  changeFrequency: 'weekly',
  priority: 0.65,
})
```

- [ ] **Step 2: Extend sitemap data query**

Fetch only published, active, non-deleted profiles:

```ts
prisma.lodgingPublicProfile.findMany({
  where: {
    publication_status: 'published',
    deleted_at: null,
    city: { is_active: true, deleted_at: null },
    lodging: { is_active: true, deleted_at: null },
  },
  select: { slug: true, updated_at: true, city: { select: { slug: true } } },
})
```

- [ ] **Step 3: Update traceability matrix**

Add section `## 028 — Lodging Showcase SEO` with rows for every AC from spec 028. Use status `✅ done` only after source and tests exist. During implementation, use `🔵 in progress` for partially completed groups.

- [ ] **Step 4: Run focused tests**

```bash
npm test -- tests/unit/seo.sitemap.test.ts tests/unit/lodging-showcase.metadata.test.ts tests/unit/lodging-showcase.structured-data.test.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 5: Run Prisma validation**

```bash
npx prisma validate
```

Expected: schema validates.

- [ ] **Step 6: Run full unit/contract/integration suite**

```bash
npm test -- --no-coverage
```

Expected: PASS.

- [ ] **Step 7: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/features/seo src/app/sitemap.ts docs/traceability-matrix.md tests/unit/seo.sitemap.test.ts
git commit -m "feat(028): index lodging showcase pages"
```

---

## Implementation Notes

- Do not add booking, prices, availability, iCal, Airbnb API, Booking API, or calendar sync.
- Do not scrape Airbnb or Booking. Never fetch images from third-party listing URLs.
- Keep `LodgingCustomization` private-stay oriented. Public showcase belongs to `LodgingPublicProfile`.
- Use `deleted_at` and `publication_status = archived`; do not physically delete records.
- Use Server Components for public pages unless gallery/filter state requires a Client Component.
- Keep public JSON-LD aligned with visible page content only.
- If Gemini response includes facts not present in the source/facts, reject or leave as draft for Admin review.

## Self-Review Checklist

- Spec coverage: Tasks cover data model, public list/detail, city guide block, Owner workflow, source URL, rights confirmation, manual photos, Gemini rewrite, Admin moderation, SEO metadata, JSON-LD, sitemap and traceability.
- Placeholder scan: no task instructs the implementer to "fill in later"; each task has concrete files, snippets and commands.
- Type consistency: naming follows spec 028: `LodgingPublicProfile`, `LodgingPhoto`, `LodgingAmenity`, `ExternalBookingPlatform`, `LodgingPublicationStatus`, `LodgingRewriteStatus`.
