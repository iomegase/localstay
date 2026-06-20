# Lodging detail page redesign — design spec

**Date:** 2026-06-20
**Author:** brainstorming session (devillers + Claude)
**Status:** Approved — pending spec review
**Route affected:** `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`

## Goal

Redesign the public lodging detail page ("logement slug") to match the mobile
luxury mockup from the My Stay App Figma Make file
(`ESOLXXMX4KxnAVagcskkAB`, node `0-9`), while keeping the MyStay brand identity.

The mockup is a single-column mobile experience: full-bleed swipe gallery,
italic excerpt, "À propos", an equipment/services grid split into
*compris dans le séjour* and *disponible sur demande*, an "L'espace de vie"
room grid, a localisation map, a FAQ accordion, and a promo/booking CTA.

## Decisions (from brainstorming)

| Question | Decision |
| --- | --- |
| Form factor | **Mobile-first, match mockup closely** |
| Palette | **Keep MyStay brand** (navy `#003A5D`, gold/beige accent) — mockup terracotta `#c98a6f` → MyStay gold; mockup dark `#1a1a2e` → navy `#003A5D` |
| Data-gap sections (FAQ, services split, map) | **Build them all**, render each conditionally when data exists |
| Scope | **Phase 1 (frontend) + Phase 2 (backend) — both in this work** |
| Interactivity | **Client islands OK** — interactive swipe gallery + interactive mapbox |

## Context that shapes the design

- The `(public)` layout (`src/app/(public)/layout.tsx`) is **already a 430px
  mobile frame** with a sticky glassmorphism header and a floating
  `PublicBottomNav`. The mockup's bottom tab bar already exists — **do not add
  one**. This is a content rebuild inside the existing frame.
- `mapbox-gl` is already a dependency; interactive maps already exist in
  `src/features/trail-navigation/components/TrailPreviewMap.tsx` and
  `TrailNavigationMap.tsx` — reuse that pattern/token setup.
- Location fields (`precise_location_public`, `public_latitude`,
  `public_longitude`, `public_area_label`) **already exist** on
  `LodgingPublicProfile`, are in `LodgingPublicProfileInputSchema`, and are
  already saved by the admin write path. The map therefore needs **no schema or
  admin change** — only surfacing in the public query + rendering.
- Photos already carry a `room_type` enum
  (`bedroom | bathroom | common_area | exterior | kitchen | other`) — the
  "L'espace de vie" room grid groups existing photos; **no schema change**.
- Amenities today are a flat list (`code`, `label`, `sort_order`) edited as a
  comma-separated textarea in `LodgingShowcaseForm`. The compris/sur-demande
  split is the only amenity change that needs a new field.
- There is **no FAQ data** anywhere today — FAQ needs a new model end-to-end.

## Architecture

Keep `page.tsx` as a **server component** (data fetch, JSON-LD, metadata).
Break the mockup into focused section components under
`src/features/lodging-showcase/components/`, consistent with the existing
pattern (`LodgingGallery`, `LodgingFacts`, `AmenitiesGrid`,
`OwnerRecommendationsBlock`).

Two new **client** islands (`'use client'`): the swipe gallery and the map.
Everything else stays server-rendered for SEO and to keep JS minimal.

### Section order (top → bottom)

1. **Hero swipe gallery** — `LodgingHeroGallery` *(client, new)*. Full-bleed
   ~320px scroll-snap carousel; dark gradient overlay; per-slide `room_type`
   label; "1 / N" counter; dot indicators. Replaces the static grid
   `LodgingGallery` on this page. Falls back to a single image / placeholder
   when there are 0–1 photos.
2. **Title block** *(server, inline or small component)* — property-type badge
   (beige `#e8decb` / brown `#8b6f4e`), `title`, location row
   (`public_area_label` + MapPin in navy).
3. **Excerpt** — `LodgingExcerpt` *(server, new)*: `short_description` as an
   italic quote with a left gold/navy border.
4. **À propos** — gold uppercase eyebrow + `description` (preserve line breaks).
5. **Facts row** — reuse `LodgingFacts`, restyled to navy/gold tokens.
6. **Équipements & Services** — `LodgingAmenitiesGrid` *(server, new or
   evolved `AmenitiesGrid`)*: icon grid of amenities with
   `availability = included`, subtitled "compris dans le séjour".
7. **Services sur demande** — same component, amenities with
   `availability = on_request`, subtitled "disponible sur demande".
   **Renders only if any on-request amenity exists.**
8. **L'espace de vie** — `LodgingRoomsGrid` *(server, new)*: 2-col image cards
   grouped by `photos.room_type` (label per room type). **Renders only if
   room-typed photos exist.**
9. **Localisation** — `LodgingLocationMap` *(client, new)*: interactive mapbox
   map with a pin + address bar + "Itinéraire →" link (Google/Apple maps deep
   link from coords). **Renders only when `precise_location_public` is true and
   both public coords are present.**
10. **Autour du logement** — restyled `OwnerRecommendationsBlock`.
11. **FAQ** — `LodgingFaq` *(client, new)*: accordion of question/answer items.
    **Renders only if FAQ items exist.**
12. **CTA** — `LodgingBookingCta` *(server, new)*: navy gradient promo card that
    wraps the existing contact link + `ExternalBookingCta`.

## Data flow / query changes

`getPublishedLodgingDetail` (`src/features/lodging-showcase/queries/public-lodgings.ts`)
and its result type `PublicLodgingDetailQueryResult` gain:

- `precise_location_public: boolean`, `public_latitude: number | null`,
  `public_longitude: number | null` (already on the model — add to `select` +
  return shape). Remove the hardcoded `preciseLocationPublic: false` in
  `page.tsx` and use the real value for the schema input + map gate.
- `amenities` items gain `availability: 'included' | 'on_request'`
  (default `included`).
- `faq: Array<{ id: string; question: string; answer: string }>` ordered by
  `sort_order`.

## Phase 2 — backend changes

### Amenity availability

- Prisma: add `availability LodgingAmenityAvailability @default(included)` to
  `LodgingAmenity`; new enum `enum LodgingAmenityAvailability { included on_request }`.
- `LodgingAmenityItemSchema`: add
  `availability: z.enum(['included','on_request']).default('included')`.
- Write path (`owner-public-profile.ts` `createMany`): persist `availability`.
- Admin form (`LodgingShowcaseForm.tsx`): a second textarea
  "Services sur demande" → amenities tagged `on_request`; existing textarea →
  `included`. Round-trip both on load.
- Migration: `add_lodging_amenity_availability`.

### FAQ

- Prisma: new model `LodgingFaqItem` (`id`, timestamps, `deleted_at`,
  `profile_id` → `LodgingPublicProfile`, `question String`, `answer String`,
  `sort_order Int @default(0)`), with `@@index([profile_id, deleted_at])`.
  Add `faq_items LodgingFaqItem[]` to `LodgingPublicProfile`.
- New zod `LodgingFaqItemSchema` (`question` trimmed 5–200, `answer` trimmed
  10–2000, `sort_order`); add `faq: z.array(...).max(20)` to
  `LodgingPublicProfileInputSchema`.
- Write path: soft-delete + `createMany`, mirroring the amenity pattern.
- Owner read query (`owner-public-profile.ts`): select faq items.
- Admin form: repeatable Q/A rows (add/remove/reorder).
- Migration: `add_lodging_faq_items`.

**Migration note:** per project memory, the direct DB URL (port 5432) is
unreachable from the sandbox. `prisma generate` works offline, but the live DDL
(`prisma migrate deploy`) must be applied by the user against prod/staging.

## Styling system

- Reuse existing tokens (`text-gold`, `text-charcoal`, navy `#003A5D`,
  beige `#e8decb`, brown `#8b6f4e`) — no terracotta.
- Match mockup rhythm: `mx-4` section gutters, uppercase tracked-wide eyebrows,
  rounded-2xl cards with soft shadows, gradient overlays on imagery.
- Respect the layout's `immersive-*` classes where relevant (already handled by
  the layout; page content does not need to manage header/nav visibility).

## Error handling & edge cases

- 0 photos → gallery placeholder; 1 photo → no dots/counter.
- Missing optional fields (counts, surface, area label) already filtered by
  `LodgingFacts`; keep that behaviour.
- Map gated on `precise_location_public && lat != null && lng != null`.
- On-request amenities, room grid, FAQ each gate on non-empty data.
- Mapbox token must be the public token already used by trail-navigation; the
  map is a client component so it must not break SSR (render container, init in
  effect), matching the existing trail map components.

## Testing

- **Unit:** room-grouping helper (photos → room-type buckets, ordering),
  amenity partitioning (included vs on_request), conditional-render gates.
- **Schema:** zod round-trip for new `availability` + `faq` fields.
- **Write path:** amenity availability + faq persistence (mirror existing
  amenity/photo write tests if present).
- **Integration/e2e:** existing lodging detail tests stay green; add coverage
  that map/faq/on-request sections appear only with data. Verify the page
  remains a server component (JSON-LD still emitted).
- Run the full suite; note that ~10 suites are pre-existing drift (per memory)
  and are not introduced by this work.

## Out of scope

- No changes to the bottom nav / header (provided by layout).
- No new map provider; reuse mapbox.
- No redesign of the lodging **list** page or admin tables beyond the FAQ +
  availability form additions.
- No reviews/ratings system (mockup's "4.9 Rating" is decorative; not in data).

## Rollout

1. Phase 2 backend: Prisma models/enum + migrations + schemas + write path +
   admin form (FAQ, availability). `prisma generate`; user applies DDL.
2. Query: surface location + availability + faq in `getPublishedLodgingDetail`.
3. Phase 1 frontend: build section components; rebuild `page.tsx`.
4. Tests; verification; commit.
