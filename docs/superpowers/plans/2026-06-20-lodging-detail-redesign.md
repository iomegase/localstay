# Lodging Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public lodging detail page (`/guide/[city-slug]/logements/[lodging-slug]`) as a mobile-first luxury layout matching the My Stay Figma mockup, in MyStay brand colours, with new FAQ + amenity-availability backend support and an interactive map.

**Architecture:** `page.tsx` stays a server component (data, JSON-LD, metadata). Mockup sections become focused components under `src/features/lodging-showcase/components/`. Two client islands: swipe gallery and interactive mapbox map. Backend gains an amenity `availability` enum/field and a `LodgingFaqItem` model, threaded through zod schemas, the owner write path, the admin form, and the public detail query.

**Tech Stack:** Next.js (App Router, RSC), Prisma 5, Zod, Tailwind, mapbox-gl, Jest + Testing Library, lucide-react.

**Reference spec:** `docs/superpowers/specs/2026-06-20-lodging-detail-redesign-design.md`

---

## File Structure

**Backend / data (Phase 2):**
- `prisma/schema.prisma` — modify: add `LodgingAmenityAvailability` enum, `availability` field on `LodgingAmenity`, new `LodgingFaqItem` model, `faq_items` relation on `LodgingPublicProfile`.
- `src/features/lodging-showcase/schemas.ts` — modify: amenity `availability`, new `LodgingFaqItemSchema`, `faq` on `LodgingPublicProfileInputSchema`.
- `src/features/lodging-showcase/types.ts` — modify: DTO types for availability + faq.
- `src/features/lodging-showcase/queries/owner-public-profile.ts` — modify: persist availability + faq; select faq + availability on read.
- `src/features/lodging-showcase/queries/public-lodgings.ts` — modify: surface location, amenity availability, faq in `getPublishedLodgingDetail` + result type.
- `src/features/lodging-showcase/components/LodgingShowcaseForm.tsx` — modify: "Services sur demande" textarea + FAQ repeatable rows.

**Frontend (Phase 1):**
- `src/features/lodging-showcase/lib/detail-view.ts` — create: pure helpers (`selectRoomPhotos`, `partitionAmenities`, `mapsDirectionUrl`, `ROOM_TYPE_LABELS`).
- `src/features/lodging-showcase/components/LodgingHeroGallery.tsx` — create (client): swipe carousel.
- `src/features/lodging-showcase/components/LodgingExcerpt.tsx` — create (server): italic quote.
- `src/features/lodging-showcase/components/LodgingAmenitiesGrid.tsx` — create (server): icon grid w/ subtitle, used for both included + on-request.
- `src/features/lodging-showcase/components/LodgingRoomsGrid.tsx` — create (server): "L'espace de vie".
- `src/features/lodging-showcase/components/LodgingLocationMap.tsx` — create (client): mapbox map.
- `src/features/lodging-showcase/components/LodgingFaq.tsx` — create (client): accordion.
- `src/features/lodging-showcase/components/LodgingBookingCta.tsx` — create (server): navy gradient CTA card.
- `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx` — modify: rebuild section composition.

**Tests:**
- `tests/unit/lodging-showcase/detail-view.test.ts`
- `tests/unit/lodging-showcase/schemas-faq-availability.test.ts`
- `tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx`
- `tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx`
- `tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx`
- `tests/unit/lodging-showcase/LodgingFaq.test.tsx`
- `tests/unit/lodging-showcase/LodgingLocationMap.test.tsx`

**Conventions:**
- Test command: `npm test -- <path>` (Jest, config `jest.config.ts`).
- Component tests render in jsdom — start the file with the docblock `/** @jest-environment jsdom */`.
- Type check: `npx tsc --noEmit`.
- Prisma client regenerate: `npm run db:generate`.
- **Migrations:** create the migration SQL but DO NOT attempt `prisma migrate deploy` (the direct DB URL on port 5432 is unreachable from this environment). Generate the client offline and flag the migration for the user to apply.

---

## Phase 2 — Backend

### Task 1: Prisma schema — amenity availability + FAQ model

**Files:**
- Modify: `prisma/schema.prisma` (`LodgingAmenity` ~line 933, `LodgingPublicProfile` ~line 849)
- Create: `prisma/migrations/<timestamp>_add_lodging_faq_and_amenity_availability/migration.sql`

- [ ] **Step 1: Add the enum near the other lodging enums**

Add this enum to `prisma/schema.prisma` (place it just above `model LodgingAmenity`):

```prisma
enum LodgingAmenityAvailability {
  included
  on_request
}
```

- [ ] **Step 2: Add `availability` to `LodgingAmenity`**

In `model LodgingAmenity`, add the field after `sort_order`:

```prisma
  availability LodgingAmenityAvailability @default(included)
```

- [ ] **Step 3: Add the `LodgingFaqItem` model and relation**

Add the relation field inside `model LodgingPublicProfile` (next to `photos`/`amenities`):

```prisma
  faq_items LodgingFaqItem[]
```

Add the new model after `model LodgingAmenity`:

```prisma
model LodgingFaqItem {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  profile_id String
  profile    LodgingPublicProfile @relation(fields: [profile_id], references: [id])

  question   String
  answer     String
  sort_order Int @default(0)

  @@index([profile_id, deleted_at])
}
```

- [ ] **Step 4: Regenerate the Prisma client (offline)**

Run: `npm run db:generate`
Expected: "Generated Prisma Client" with no error (no DB connection required for generate).

- [ ] **Step 5: Create the migration SQL by hand**

Create `prisma/migrations/20260620120000_add_lodging_faq_and_amenity_availability/migration.sql`:

```sql
-- CreateEnum
CREATE TYPE "LodgingAmenityAvailability" AS ENUM ('included', 'on_request');

-- AlterTable
ALTER TABLE "LodgingAmenity" ADD COLUMN "availability" "LodgingAmenityAvailability" NOT NULL DEFAULT 'included';

-- CreateTable
CREATE TABLE "LodgingFaqItem" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "profile_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LodgingFaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LodgingFaqItem_profile_id_deleted_at_idx" ON "LodgingFaqItem"("profile_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "LodgingFaqItem" ADD CONSTRAINT "LodgingFaqItem_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "LodgingPublicProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(lodging): add FAQ model and amenity availability to schema"
```

> **User action (out-of-band):** apply the migration to staging/prod with `prisma migrate deploy` from an environment that can reach the DB.

---

### Task 2: Zod schemas — availability + FAQ

**Files:**
- Modify: `src/features/lodging-showcase/schemas.ts:34-86`
- Test: `tests/unit/lodging-showcase/schemas-faq-availability.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/schemas-faq-availability.test.ts`:

```ts
import {
  LodgingAmenityItemSchema,
  LodgingFaqItemSchema,
  LodgingPublicProfileInputSchema,
} from '@/features/lodging-showcase/schemas'

describe('amenity availability', () => {
  it('defaults availability to included', () => {
    const parsed = LodgingAmenityItemSchema.parse({ code: 'wifi', label: 'Wifi' })
    expect(parsed.availability).toBe('included')
  })

  it('accepts on_request', () => {
    const parsed = LodgingAmenityItemSchema.parse({ code: 'chef', label: 'Chef', availability: 'on_request' })
    expect(parsed.availability).toBe('on_request')
  })

  it('rejects unknown availability', () => {
    expect(() => LodgingAmenityItemSchema.parse({ code: 'x', label: 'X', availability: 'maybe' })).toThrow()
  })
})

describe('faq schema', () => {
  it('parses a valid faq item', () => {
    const parsed = LodgingFaqItemSchema.parse({ question: 'Heure arrivée ?', answer: 'À partir de 15h.' })
    expect(parsed.sort_order).toBe(0)
  })

  it('rejects too-short answers', () => {
    expect(() => LodgingFaqItemSchema.parse({ question: 'Quoi ?', answer: 'non' })).toThrow()
  })

  it('accepts faq array on profile input (empty allowed)', () => {
    const base = {
      title: 'Chalet Remy alpin',
      short_description: 'Un chalet chaleureux au cœur des montagnes pour vos vacances en famille.',
      description: 'x'.repeat(120),
      property_type: 'Chalet',
      max_guests: 6,
      public_contact_enabled: true,
      amenities: [],
      photos: [],
      faq: [],
    }
    expect(() => LodgingPublicProfileInputSchema.parse(base)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/schemas-faq-availability.test.ts`
Expected: FAIL — `availability` undefined / `LodgingFaqItemSchema` not exported.

- [ ] **Step 3: Implement the schema changes**

In `src/features/lodging-showcase/schemas.ts`, add an availability enum constant near line 11:

```ts
export const LodgingAmenityAvailabilitySchema = z.enum(['included', 'on_request'])
```

Add `availability` to `LodgingAmenityItemSchema` (after `sort_order`):

```ts
  availability: LodgingAmenityAvailabilitySchema.default('included'),
```

Add the FAQ item schema after `LodgingAmenityItemSchema`:

```ts
export const LodgingFaqItemSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(10).max(2000),
  sort_order: z.number().int().min(0).default(0),
})
```

Add `faq` to `LodgingPublicProfileInputSchema` (after `photos`):

```ts
  faq: z.array(LodgingFaqItemSchema).max(20).default([]),
```

Add inferred types near the other exports (~line 105):

```ts
export type LodgingAmenityAvailability = z.infer<typeof LodgingAmenityAvailabilitySchema>
export type LodgingFaqItemInput = z.infer<typeof LodgingFaqItemSchema>
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/schemas-faq-availability.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/schemas.ts tests/unit/lodging-showcase/schemas-faq-availability.test.ts
git commit -m "feat(lodging): zod schemas for amenity availability and FAQ"
```

---

### Task 3: Owner write path — persist availability + FAQ

**Files:**
- Modify: `src/features/lodging-showcase/queries/owner-public-profile.ts` (amenity `createMany` ~line 406; read select ~line 73; mapper ~line 188)

- [ ] **Step 1: Persist `availability` in the amenity createMany**

In the `prisma.lodgingAmenity.createMany` call, add `availability` to each row:

```ts
  if (input.amenities.length > 0) {
    await prisma.lodgingAmenity.createMany({
      data: input.amenities.map((amenity, index) => ({
        profile_id: profile.id,
        code: amenity.code,
        label: amenity.label,
        sort_order: amenity.sort_order ?? index,
        availability: amenity.availability ?? 'included',
      })),
    })
  }
```

- [ ] **Step 2: Soft-delete + recreate FAQ items**

Immediately after the amenity create block, add the FAQ write (mirrors the amenity pattern):

```ts
  await prisma.lodgingFaqItem.updateMany({
    where: { profile_id: profile.id, deleted_at: null },
    data: { deleted_at: new Date() },
  })

  if (input.faq.length > 0) {
    await prisma.lodgingFaqItem.createMany({
      data: input.faq.map((item, index) => ({
        profile_id: profile.id,
        question: item.question,
        answer: item.answer,
        sort_order: item.sort_order ?? index,
      })),
    })
  }
```

- [ ] **Step 3: Select availability + faq on the owner read**

In the owner profile read `select` (the `amenities` select near line 73), add `availability: true`. Add a `faq_items` select alongside `amenities`:

```ts
  faq_items: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
    select: { id: true, question: true, answer: true, sort_order: true },
  },
```

- [ ] **Step 4: Map availability + faq into the DTO**

In the owner DTO mapper (~line 188), extend the amenity map and add faq:

```ts
    amenities: row.amenities.map(amenity => ({
      id: amenity.id,
      code: amenity.code,
      label: amenity.label,
      sort_order: amenity.sort_order,
      availability: amenity.availability,
    })),
    faq: row.faq_items.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      sort_order: item.sort_order,
    })),
```

In the empty/default profile branch (~line 234) add `faq: []` next to `amenities: []`.

- [ ] **Step 5: Update DTO types**

In `src/features/lodging-showcase/types.ts`, find `OwnerLodgingPublicProfileDto`. Add `availability: 'included' | 'on_request'` to the amenity item type, and add a `faq` array:

```ts
  faq: Array<{ id: string; question: string; answer: string; sort_order: number }>
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `lodging-showcase`.

- [ ] **Step 7: Run the lodging test suite**

Run: `npm test -- tests/unit/lodging-showcase tests/integration`
Expected: existing lodging tests still pass (or pre-existing drift only, unchanged by this task).

- [ ] **Step 8: Commit**

```bash
git add src/features/lodging-showcase/queries/owner-public-profile.ts src/features/lodging-showcase/types.ts
git commit -m "feat(lodging): persist amenity availability and FAQ in owner write path"
```

---

### Task 4: Admin form — on-request services + FAQ rows

**Files:**
- Modify: `src/features/lodging-showcase/components/LodgingShowcaseForm.tsx` (amenity state ~line 64; payload build ~line 214-251; amenities field ~line 508)

- [ ] **Step 1: Add state for on-request amenities + FAQ**

Near the existing `amenitiesText` state (~line 64), add:

```tsx
  const [onRequestText, setOnRequestText] = useState(
    props.initialProfile.amenities
      .filter(a => a.availability === 'on_request')
      .map(a => a.label)
      .join(', '),
  )
  const [faqRows, setFaqRows] = useState<Array<{ question: string; answer: string }>>(
    props.initialProfile.faq.map(f => ({ question: f.question, answer: f.answer })),
  )
```

Change the existing `amenitiesText` initializer to only include included amenities:

```tsx
  const [amenitiesText, setAmenitiesText] = useState(
    props.initialProfile.amenities
      .filter(a => a.availability !== 'on_request')
      .map(amenity => amenity.label)
      .join(', '),
  )
```

- [ ] **Step 2: Build the combined amenities + faq payload**

Where the payload `amenities` array is built (~line 214), produce tagged amenities and a faq array:

```tsx
    const includedAmenities = amenitiesText
      .split(',')
      .map(label => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        code: amenityCode(label) || `amenity-${index + 1}`,
        label,
        sort_order: index,
        availability: 'included' as const,
      }))

    const onRequestAmenities = onRequestText
      .split(',')
      .map(label => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        code: amenityCode(label) || `service-${index + 1}`,
        label,
        sort_order: includedAmenities.length + index,
        availability: 'on_request' as const,
      }))

    const amenities = [...includedAmenities, ...onRequestAmenities]

    const faq = faqRows
      .map((row, index) => ({ question: row.question.trim(), answer: row.answer.trim(), sort_order: index }))
      .filter(row => row.question.length > 0 && row.answer.length > 0)
```

Add `faq` to the object sent to the save call (next to `amenities`).

- [ ] **Step 3: Render the on-request textarea**

After the existing amenities textarea block (~line 512), add:

```tsx
              <div className="space-y-2">
                <Label htmlFor="on-request-text">Services sur demande</Label>
                <textarea
                  id="on-request-text"
                  value={onRequestText}
                  onChange={event => setOnRequestText(event.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  placeholder="Chef privé, Transfert aéroport, Massage…"
                />
                <p className="text-xs text-gray-500">Séparez par des virgules. Affichés dans « disponible sur demande ».</p>
              </div>
```

- [ ] **Step 4: Render the FAQ editor**

Add an FAQ section after the on-request block:

```tsx
              <div className="space-y-3">
                <Label>FAQ</Label>
                {faqRows.map((row, index) => (
                  <div key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
                    <input
                      value={row.question}
                      onChange={event =>
                        setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, question: event.target.value } : r)))
                      }
                      className="w-full rounded-md border border-gray-300 p-2 text-sm"
                      placeholder="Question"
                    />
                    <textarea
                      value={row.answer}
                      onChange={event =>
                        setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, answer: event.target.value } : r)))
                      }
                      rows={2}
                      className="w-full rounded-md border border-gray-300 p-2 text-sm"
                      placeholder="Réponse"
                    />
                    <button
                      type="button"
                      onClick={() => setFaqRows(rows => rows.filter((_, i) => i !== index))}
                      className="text-xs text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqRows(rows => [...rows, { question: '', answer: '' }])}
                  className="text-sm font-medium text-[#003A5D]"
                >
                  + Ajouter une question
                </button>
              </div>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `props.initialProfile.faq` errors, confirm Task 3 Step 5 added the type.)

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingShowcaseForm.tsx
git commit -m "feat(lodging): admin form for on-request services and FAQ"
```

---

### Task 5: Public detail query — surface location, availability, FAQ

**Files:**
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts` (result type ~line 23; `amenityArgs` ~line 79; detail select ~line 200; return ~line 252)

- [ ] **Step 1: Extend `amenityArgs` to select availability**

Change `amenityArgs.select` to include availability:

```ts
  select: { code: true, label: true, availability: true },
```

- [ ] **Step 2: Extend the detail result type**

In `PublicLodgingDetailQueryResult` (~line 23), add:

```ts
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  amenities_included: string[]
  amenities_on_request: string[]
  faq: Array<{ id: string; question: string; answer: string }>
```

- [ ] **Step 3: Select the new fields in `getPublishedLodgingDetail`**

In the detail `select` (~line 200), add after `public_area_label`:

```ts
      precise_location_public: true,
      public_latitude: true,
      public_longitude: true,
```

Add a `faq_items` select alongside `photos`/`amenities`:

```ts
      faq_items: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
        select: { id: true, question: true, answer: true },
      },
```

- [ ] **Step 4: Map the new fields into the return object**

In the returned object (~line 252), add:

```ts
    precise_location_public: row.precise_location_public,
    public_latitude: row.public_latitude,
    public_longitude: row.public_longitude,
    amenities_included: row.amenities.filter(a => a.availability !== 'on_request').map(a => a.label),
    amenities_on_request: row.amenities.filter(a => a.availability === 'on_request').map(a => a.label),
    faq: row.faq_items.map(item => ({ id: item.id, question: item.question, answer: item.answer })),
```

> Note: `toCardApi` keeps building `amenities: string[]` (all labels) — leave it for the JSON-LD schema input and the list page. `amenityArgs` is shared with the list query; adding `availability` to its select is harmless there.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`page.tsx` may now error because it doesn't use the new fields yet — that's fine; it's fixed in Task 14.)

- [ ] **Step 6: Commit**

```bash
git add src/features/lodging-showcase/queries/public-lodgings.ts
git commit -m "feat(lodging): surface location, amenity availability and FAQ in public detail query"
```

---

## Phase 1 — Frontend

### Task 6: Pure view helpers (TDD)

**Files:**
- Create: `src/features/lodging-showcase/lib/detail-view.ts`
- Test: `tests/unit/lodging-showcase/detail-view.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/detail-view.test.ts`:

```ts
import { selectRoomPhotos, partitionAmenities, mapsDirectionUrl, ROOM_TYPE_LABELS } from '@/features/lodging-showcase/lib/detail-view'

describe('selectRoomPhotos', () => {
  const photos = [
    { id: '1', url: 'a', alt: 'A', room_type: 'bedroom', sort_order: 0, is_cover: true },
    { id: '2', url: 'b', alt: 'B', room_type: null, sort_order: 1, is_cover: false },
    { id: '3', url: 'c', alt: 'C', room_type: 'kitchen', sort_order: 2, is_cover: false },
  ]

  it('keeps only photos with a known room type and labels them', () => {
    const result = selectRoomPhotos(photos)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ url: 'a', label: 'Chambre' })
    expect(result[1]).toMatchObject({ url: 'c', label: 'Cuisine' })
  })

  it('ignores the "other" room type', () => {
    expect(selectRoomPhotos([{ id: '4', url: 'd', alt: 'D', room_type: 'other', sort_order: 0, is_cover: false }])).toHaveLength(0)
  })
})

describe('partitionAmenities', () => {
  it('returns included and on-request as given', () => {
    const result = partitionAmenities(['Wifi', 'Parking'], ['Chef'])
    expect(result.included).toEqual(['Wifi', 'Parking'])
    expect(result.onRequest).toEqual(['Chef'])
  })
})

describe('mapsDirectionUrl', () => {
  it('builds a google maps directions url', () => {
    expect(mapsDirectionUrl(45.9, 6.86)).toBe('https://www.google.com/maps/dir/?api=1&destination=45.9,6.86')
  })
})

describe('ROOM_TYPE_LABELS', () => {
  it('maps every enum value', () => {
    expect(Object.keys(ROOM_TYPE_LABELS)).toEqual(
      expect.arrayContaining(['bedroom', 'bathroom', 'common_area', 'exterior', 'kitchen', 'other']),
    )
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/detail-view.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

Create `src/features/lodging-showcase/lib/detail-view.ts`:

```ts
type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  sort_order: number
  is_cover: boolean
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  bedroom: 'Chambre',
  bathroom: 'Salle de bain',
  common_area: 'Pièce de vie',
  exterior: 'Extérieur',
  kitchen: 'Cuisine',
  other: 'Autre',
}

export function selectRoomPhotos(photos: Photo[]): Array<{ id: string; url: string; alt: string; label: string }> {
  return photos
    .filter(photo => photo.room_type != null && photo.room_type !== 'other' && ROOM_TYPE_LABELS[photo.room_type] != null)
    .map(photo => ({ id: photo.id, url: photo.url, alt: photo.alt, label: ROOM_TYPE_LABELS[photo.room_type as string] }))
}

export function partitionAmenities(included: string[], onRequest: string[]): { included: string[]; onRequest: string[] } {
  return { included, onRequest }
}

export function mapsDirectionUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/detail-view.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/lib/detail-view.ts tests/unit/lodging-showcase/detail-view.test.ts
git commit -m "feat(lodging): detail-view helpers for rooms, amenities, directions"
```

---

### Task 7: LodgingHeroGallery (client swipe carousel)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingHeroGallery.tsx`
- Test: `tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingHeroGallery } from '@/features/lodging-showcase/components/LodgingHeroGallery'

const photos = [
  { id: '1', url: 'a.jpg', alt: 'Chambre', room_type: 'bedroom', sort_order: 0, is_cover: true },
  { id: '2', url: 'b.jpg', alt: 'Cuisine', room_type: 'kitchen', sort_order: 1, is_cover: false },
]

describe('LodgingHeroGallery', () => {
  it('renders one image per photo with alt text', () => {
    render(<LodgingHeroGallery title="Chalet Remy" photos={photos} />)
    expect(screen.getByAltText('Chambre')).toBeInTheDocument()
    expect(screen.getByAltText('Cuisine')).toBeInTheDocument()
  })

  it('shows a slide counter', () => {
    render(<LodgingHeroGallery title="Chalet Remy" photos={photos} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('renders a placeholder when there are no photos', () => {
    const { container } = render(<LodgingHeroGallery title="Chalet Remy" photos={[]} />)
    expect(container.querySelector('[data-testid="gallery-placeholder"]')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/features/lodging-showcase/components/LodgingHeroGallery.tsx`:

```tsx
'use client'

import { useRef, useState } from 'react'
import { ROOM_TYPE_LABELS } from '../lib/detail-view'

type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  sort_order: number
  is_cover: boolean
}

export function LodgingHeroGallery({ title, photos }: { title: string; photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return <div data-testid="gallery-placeholder" className="h-[320px] w-full bg-gray-100" aria-hidden="true" />
  }

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section aria-label={`Photos de ${title}`} className="relative h-[320px] overflow-hidden">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map(photo => (
          <div key={photo.id} className="relative h-full w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {photo.room_type && ROOM_TYPE_LABELS[photo.room_type] && (
              <div className="absolute bottom-12 left-0 right-0 px-5">
                <p className="text-[11px] uppercase tracking-widest text-white/70">{ROOM_TYPE_LABELS[photo.room_type]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: active === i ? 20 : 6, background: active === i ? '#fff' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </div>
      )}

      <span className="absolute right-4 top-4 rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] text-white backdrop-blur-sm">
        {active + 1} / {photos.length}
      </span>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx`
Expected: PASS. (jsdom does not implement `scrollTo`/scroll metrics, but the component only calls them inside handlers not triggered by these tests.)

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingHeroGallery.tsx tests/unit/lodging-showcase/LodgingHeroGallery.test.tsx
git commit -m "feat(lodging): swipe hero gallery client component"
```

---

### Task 8: LodgingExcerpt (server)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingExcerpt.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/lodging-showcase/components/LodgingExcerpt.tsx`:

```tsx
export function LodgingExcerpt({ text }: { text: string }) {
  if (!text.trim()) return null
  return (
    <div className="mx-4 mt-5 border-l-2 border-gold pl-4">
      <p className="text-[13px] font-light italic leading-relaxed text-gray-600">{text}</p>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If `border-gold` is not a Tailwind token, replace with `border-[#8b6f4e]`. Confirm by checking `tailwind.config` for `gold`.)

- [ ] **Step 3: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingExcerpt.tsx
git commit -m "feat(lodging): excerpt quote component"
```

---

### Task 9: LodgingAmenitiesGrid (server, included + on-request)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingAmenitiesGrid.tsx`
- Test: `tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingAmenitiesGrid } from '@/features/lodging-showcase/components/LodgingAmenitiesGrid'

describe('LodgingAmenitiesGrid', () => {
  it('renders a heading, subtitle and each label', () => {
    render(<LodgingAmenitiesGrid title="Équipements" subtitle="compris dans le séjour" items={['Wifi', 'Parking']} />)
    expect(screen.getByText('Équipements')).toBeInTheDocument()
    expect(screen.getByText('compris dans le séjour')).toBeInTheDocument()
    expect(screen.getByText('Wifi')).toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
  })

  it('renders nothing when there are no items', () => {
    const { container } = render(<LodgingAmenitiesGrid title="Services" subtitle="sur demande" items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/features/lodging-showcase/components/LodgingAmenitiesGrid.tsx`:

```tsx
import { Check } from 'lucide-react'

export function LodgingAmenitiesGrid({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section className="mx-4 mt-6">
      <p className="mb-1 text-[14px] font-bold uppercase tracking-wider text-charcoal">{title}</p>
      <p className="mb-4 text-[9px] font-light uppercase tracking-widest text-gray-500">{subtitle}</p>
      <ul className="grid grid-cols-4 gap-3">
        {items.map(label => (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-gold">
              <Check className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[10px] text-gray-600">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingAmenitiesGrid.tsx tests/unit/lodging-showcase/LodgingAmenitiesGrid.test.tsx
git commit -m "feat(lodging): amenities/services icon grid component"
```

---

### Task 10: LodgingRoomsGrid (server)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingRoomsGrid.tsx`
- Test: `tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'

const photos = [
  { id: '1', url: 'a.jpg', alt: 'Chambre', room_type: 'bedroom', sort_order: 0, is_cover: true },
  { id: '2', url: 'b.jpg', alt: 'No type', room_type: null, sort_order: 1, is_cover: false },
]

describe('LodgingRoomsGrid', () => {
  it('renders room-typed photos with their label', () => {
    render(<LodgingRoomsGrid photos={photos} />)
    expect(screen.getByAltText('Chambre')).toBeInTheDocument()
    expect(screen.getByText('Chambre')).toBeInTheDocument()
  })

  it('renders nothing when no photo has a room type', () => {
    const { container } = render(<LodgingRoomsGrid photos={[photos[1]]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/features/lodging-showcase/components/LodgingRoomsGrid.tsx`:

```tsx
import { selectRoomPhotos } from '../lib/detail-view'

type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  sort_order: number
  is_cover: boolean
}

export function LodgingRoomsGrid({ photos }: { photos: Photo[] }) {
  const rooms = selectRoomPhotos(photos)
  if (rooms.length === 0) return null

  return (
    <section className="mt-6">
      <p className="mx-4 mb-4 text-[14px] font-bold uppercase tracking-wider text-charcoal">L&apos;espace de vie</p>
      <div className="mx-4 grid grid-cols-2 gap-3">
        {rooms.map(room => (
          <div key={room.id} className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={room.url} alt={room.alt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[12px] font-semibold text-white drop-shadow">{room.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingRoomsGrid.tsx tests/unit/lodging-showcase/LodgingRoomsGrid.test.tsx
git commit -m "feat(lodging): L'espace de vie rooms grid component"
```

---

### Task 11: LodgingLocationMap (client mapbox)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingLocationMap.tsx`
- Test: `tests/unit/lodging-showcase/LodgingLocationMap.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/LodgingLocationMap.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    accessToken: '',
    Map: class {
      on() {}
      remove() {}
      addControl() {}
    },
    Marker: class {
      setLngLat() { return this }
      addTo() { return this }
    },
    NavigationControl: class {},
  },
}))

import { LodgingLocationMap } from '@/features/lodging-showcase/components/LodgingLocationMap'

describe('LodgingLocationMap', () => {
  it('renders the address and a directions link', () => {
    render(<LodgingLocationMap latitude={45.9} longitude={6.86} areaLabel="St Gervais" />)
    expect(screen.getByText('St Gervais')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /itinéraire/i })
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=45.9,6.86')
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/LodgingLocationMap.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/features/lodging-showcase/components/LodgingLocationMap.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapsDirectionUrl } from '../lib/detail-view'

export function LodgingLocationMap({
  latitude,
  longitude,
  areaLabel,
}: {
  latitude: number
  longitude: number
  areaLabel: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [longitude, latitude],
      zoom: 13,
      attributionControl: true,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    new mapboxgl.Marker({ color: '#003A5D' }).setLngLat([longitude, latitude]).addTo(map)

    return () => map.remove()
  }, [latitude, longitude])

  return (
    <section className="mx-4 mt-6">
      <p className="mb-4 text-[14px] font-bold uppercase tracking-wider text-charcoal">Localisation</p>
      <div className="relative h-[200px] w-full overflow-hidden rounded-2xl shadow-sm">
        <div ref={containerRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] flex items-center justify-between bg-white/85 px-3 py-2 backdrop-blur-sm">
          <span className="text-[10px] font-light uppercase tracking-widest text-gray-700">{areaLabel ?? ''}</span>
          <a
            href={mapsDirectionUrl(latitude, longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto text-[10px] font-semibold text-gold"
          >
            Itinéraire →
          </a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/LodgingLocationMap.test.tsx`
Expected: PASS. (mapbox-gl is mocked; the CSS import is handled by next/jest.)

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingLocationMap.tsx tests/unit/lodging-showcase/LodgingLocationMap.test.tsx
git commit -m "feat(lodging): interactive location map client component"
```

---

### Task 12: LodgingFaq (client accordion)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingFaq.tsx`
- Test: `tests/unit/lodging-showcase/LodgingFaq.test.tsx`

> Uses `@radix-ui/react-accordion` if already in deps; otherwise use the native `<details>` element shown below (no new dependency). This plan uses `<details>` to avoid adding a dependency.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lodging-showcase/LodgingFaq.test.tsx`:

```tsx
/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'

const items = [
  { id: '1', question: 'Heure arrivée ?', answer: 'À partir de 15h.' },
  { id: '2', question: 'Parking ?', answer: 'Oui, gratuit.' },
]

describe('LodgingFaq', () => {
  it('renders each question and answer', () => {
    render(<LodgingFaq items={items} />)
    expect(screen.getByText('Heure arrivée ?')).toBeInTheDocument()
    expect(screen.getByText('Oui, gratuit.')).toBeInTheDocument()
  })

  it('renders nothing with no items', () => {
    const { container } = render(<LodgingFaq items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run it to confirm failure**

Run: `npm test -- tests/unit/lodging-showcase/LodgingFaq.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/features/lodging-showcase/components/LodgingFaq.tsx`:

```tsx
'use client'

import { ChevronDown } from 'lucide-react'

export function LodgingFaq({ items }: { items: Array<{ id: string; question: string; answer: string }> }) {
  if (items.length === 0) return null

  return (
    <section className="mx-4 mt-6">
      <p className="mb-1 text-[14px] font-bold uppercase tracking-wider text-charcoal">FAQ</p>
      <p className="mb-4 text-[9px] font-light uppercase tracking-widest text-gray-500">Questions fréquentes</p>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <details key={item.id} className="group overflow-hidden rounded-xl bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-semibold text-charcoal">{item.question}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="px-4 pb-4 text-[12px] font-light leading-relaxed text-gray-600">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run the test to confirm pass**

Run: `npm test -- tests/unit/lodging-showcase/LodgingFaq.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingFaq.tsx tests/unit/lodging-showcase/LodgingFaq.test.tsx
git commit -m "feat(lodging): FAQ accordion component"
```

---

### Task 13: LodgingBookingCta (server)

**Files:**
- Create: `src/features/lodging-showcase/components/LodgingBookingCta.tsx`

- [ ] **Step 1: Implement the component**

Create `src/features/lodging-showcase/components/LodgingBookingCta.tsx`. It wraps the existing contact link + `ExternalBookingCta` in a navy gradient promo card.

> **Airbnb listing CTA:** `ExternalBookingCta` already renders the link to the external listing using `external_booking_url`, and labels it **"Reserver sur Airbnb"** when `platform === 'airbnb'` (and "Reserver sur Booking" / "Ouvrir la reservation" for other platforms). Passing `externalBookingPlatform` through (done below) is what surfaces the Airbnb listing link as the primary gold CTA button — no extra component needed.

```tsx
import Link from 'next/link'
import { ExternalBookingCta } from './ExternalBookingCta'
import { contextualContactPath } from '@/features/city-guide/lib/public-paths'

export function LodgingBookingCta({
  citySlug,
  lodgingId,
  publicContactEnabled,
  externalBookingUrl,
  externalBookingPlatform,
}: {
  citySlug: string
  lodgingId: string
  publicContactEnabled: boolean
  externalBookingUrl: string | null
  externalBookingPlatform: string | null
}) {
  return (
    <section className="mx-4 mt-6">
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-6"
        style={{ background: 'linear-gradient(135deg, #003A5D 0%, #002a43 100%)' }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold opacity-10" />
        <p className="mb-1 text-[18px] font-light leading-snug text-white">Réserver ou contacter</p>
        <p className="mb-4 text-[11px] font-light leading-relaxed text-white/70">
          Vérifiez les disponibilités ou posez vos questions directement depuis la fiche.
        </p>
        <div className="flex flex-col gap-2">
          {publicContactEnabled && (
            <Link
              href={`${contextualContactPath(citySlug)}?lodging=${lodgingId}`}
              data-analytics-event="lodging_contact_click"
              data-analytics-city-slug={citySlug}
              data-analytics-lodging-id={lodgingId}
              className="w-full rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              Contacter
            </Link>
          )}
          <ExternalBookingCta
            externalBookingUrl={externalBookingUrl}
            platform={externalBookingPlatform}
            citySlug={citySlug}
            lodgingId={lodgingId}
            className="w-full justify-center rounded-xl bg-gold px-7 py-3 text-center text-[14px] font-semibold text-white shadow-md transition-all hover:opacity-90"
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirm `ExternalBookingCta` prop names by reading `ExternalBookingCta.tsx`; they match the current `page.tsx` usage: `externalBookingUrl`, `platform`, `citySlug`, `lodgingId`, `className`. If `platform` expects a union type, cast `externalBookingPlatform as never`-free by passing it through as-is, matching today's call site.)

- [ ] **Step 3: Commit**

```bash
git add src/features/lodging-showcase/components/LodgingBookingCta.tsx
git commit -m "feat(lodging): navy gradient booking CTA card"
```

---

### Task 14: Rebuild page.tsx composition

**Files:**
- Modify: `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`

- [ ] **Step 1: Replace the render body**

Keep the imports for metadata/structured-data/query/JsonLd. Replace the component imports and the returned JSX. New imports:

```tsx
import { LodgingHeroGallery } from '@/features/lodging-showcase/components/LodgingHeroGallery'
import { LodgingExcerpt } from '@/features/lodging-showcase/components/LodgingExcerpt'
import { LodgingFacts } from '@/features/lodging-showcase/components/LodgingFacts'
import { LodgingAmenitiesGrid } from '@/features/lodging-showcase/components/LodgingAmenitiesGrid'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'
import { LodgingLocationMap } from '@/features/lodging-showcase/components/LodgingLocationMap'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'
import { LodgingBookingCta } from '@/features/lodging-showcase/components/LodgingBookingCta'
import { OwnerRecommendationsBlock } from '@/features/lodging-showcase/components/OwnerRecommendationsBlock'
import { ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
```

Wire the real location values into `lodgingSchemaInput`:

```tsx
    preciseLocationPublic: detail.precise_location_public,
    publicLatitude: detail.public_latitude,
    publicLongitude: detail.public_longitude,
```

Replace the returned JSX after `<JsonLd .../>` with:

```tsx
      <div className="font-sans">
        <LodgingHeroGallery title={detail.title} photos={detail.photos} />

        <div className="mx-4 mt-4">
          <Link
            href={`/guide/${citySlug}/logements`}
            className="group inline-flex items-center text-[13px] font-medium text-gray-500 transition-colors hover:text-charcoal"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2} />
            Retour
          </Link>
          <span className="mt-3 inline-block rounded-md bg-[#e8decb] px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#8b6f4e]">
            {detail.property_type}
          </span>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-charcoal">{detail.title}</h1>
          {detail.public_area_label && (
            <div className="mt-2 flex items-center text-[13px] font-medium text-gray-500">
              <MapPin className="mr-1.5 h-4 w-4 text-[#003A5D]" strokeWidth={2.5} />
              {detail.public_area_label}
            </div>
          )}
        </div>

        <LodgingExcerpt text={detail.short_description} />

        <section className="mx-4 mt-6">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-gold">À propos</p>
          <p className="whitespace-pre-line text-[12px] font-light leading-[1.8] text-gray-600">{detail.description}</p>
        </section>

        <div className="mx-4 mt-6">
          <LodgingFacts
            maxGuests={detail.max_guests}
            bedroomCount={detail.bedroom_count}
            bathroomCount={detail.bathroom_count}
            bedCount={detail.bed_count}
            surfaceM2={detail.surface_m2}
          />
        </div>

        <LodgingAmenitiesGrid title="Équipements & Services" subtitle="compris dans le séjour" items={detail.amenities_included} />
        <LodgingAmenitiesGrid title="Services" subtitle="disponible sur demande" items={detail.amenities_on_request} />

        <LodgingRoomsGrid photos={detail.photos} />

        {detail.precise_location_public && detail.public_latitude != null && detail.public_longitude != null && (
          <LodgingLocationMap
            latitude={detail.public_latitude}
            longitude={detail.public_longitude}
            areaLabel={detail.public_area_label}
          />
        )}

        <div className="mx-4 mt-6">
          <OwnerRecommendationsBlock citySlug={citySlug} items={detail.owner_recommendations} />
        </div>

        <LodgingFaq items={detail.faq} />

        <LodgingBookingCta
          citySlug={citySlug}
          lodgingId={detail.id}
          publicContactEnabled={detail.public_contact_enabled}
          externalBookingUrl={detail.external_booking_url}
          externalBookingPlatform={detail.external_booking_platform}
        />
      </div>
```

Remove the now-unused imports (`LodgingGallery`, `AmenitiesGrid`, `ExternalBookingCta`, `Compass`, `CalendarDays`, `contextualContactPath`) from `page.tsx`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Lint the route**

Run: `npm run lint`
Expected: no new errors (img elements already use the eslint-disable pattern from the source components).

- [ ] **Step 4: Run the full unit + integration suite**

Run: `npm test`
Expected: new tests pass; pre-existing drift suites (per project memory, ~10 unrelated red suites) unchanged.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx"
git commit -m "feat(lodging): rebuild detail page with mobile-first sections"
```

---

### Task 15: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Build to confirm RSC/client boundaries compile**

Run: `npm run build`
Expected: build succeeds; `LodgingHeroGallery`, `LodgingLocationMap`, `LodgingFaq` compile as client components; the route stays server-rendered.

- [ ] **Step 2: Run the app and inspect a published lodging**

Use the project `run` skill (or `npm run dev`) and open `/guide/<city>/logements/<slug>` for a published profile. Confirm: swipe gallery, excerpt, about, facts, amenities/services grids, rooms grid (if room-typed photos), map (only if `precise_location_public` + coords), owner recos, FAQ (only if FAQ data), CTA. Confirm the layout's existing header + bottom nav still render.

- [ ] **Step 3: Confirm graceful degradation**

Open a profile with no FAQ, no on-request services, no public coords, no room-typed photos — confirm those sections are absent and the page reads cleanly.

---

## Self-Review

**Spec coverage:**
- Mobile-first layout in existing 430px frame → Tasks 7-14 (no nav added). ✓
- MyStay palette (navy/gold/beige, no terracotta) → component styles + page. ✓
- Hero swipe gallery → Task 7. ✓
- Title/excerpt/about → Task 8 + Task 14. ✓
- Facts → reused in Task 14. ✓
- Équipements compris + services sur demande split → Tasks 1-5 (backend) + Task 9 + Task 14. ✓
- L'espace de vie rooms grid → Task 10. ✓
- Localisation map (conditional, no schema change) → Task 5 (query) + Task 11 + Task 14 gate. ✓
- Autour du logement (owner recos) → reused in Task 14. ✓
- FAQ (full backend + conditional render) → Tasks 1-5 + Task 12 + Task 14. ✓
- Booking/contact CTA → Task 13. ✓
- Conditional rendering for data-gap sections → gates in Tasks 9, 10, 11, 12 + Task 14. ✓
- Migration note (user applies DDL) → Task 1. ✓
- Tests (helpers, schema, components) → Tasks 2, 6, 7, 9, 10, 11, 12. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. Two conditional verifications (Task 8 `border-gold` fallback, Task 13 `ExternalBookingCta` prop confirmation) reference real files to check, not placeholders.

**Type consistency:** `availability: 'included' | 'on_request'` consistent across schema (Task 2), write path (Task 3), types (Task 3), query (Task 5). `faq: Array<{ id; question; answer }>` consistent in query (Task 5) and `LodgingFaq` (Task 12). `selectRoomPhotos` signature defined in Task 6 and consumed in Tasks 7/10. `amenities_included` / `amenities_on_request` defined in Task 5, consumed in Task 14.

**Out-of-scope confirmed:** no FAQPage JSON-LD (future), no list-page/admin-table redesign beyond form fields, no reviews system.
