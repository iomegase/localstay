# Per-room photo categories (Chambre 1…N / Salle de bain 1…M)

**Date:** 2026-06-21
**Status:** Approved — implementing
**Branch:** `feature/per-room-photo-labels` (off `main`, which now includes the admin lodging editor)

## Goal

In the lodging showcase form (used by both owner dashboard and admin editor), when the
owner indicates multiple bedrooms/bathrooms, expose per-unit photo categories so each
room can be illustrated by a specific photo, and show those specific names publicly.

## Decisions (from brainstorming)

- **Scope:** both bedrooms AND bathrooms.
- **Public label:** show the specific name ("Chambre 2"), falling back to the generic
  label when no number was assigned.
- **Storage:** new nullable `room_label String?` on `LodgingPhoto`. `room_type` stays the
  coarse enum bucket; `room_label` carries the specific name.

## Numbering rule

Driven by the form's live count fields:
- Bedrooms: `N = bedroom_count`
- Bathrooms: `M = Math.ceil(bathroom_count)` (so `1.5` → 2 slots)
- Numbered options appear **only when count ≥ 2**; otherwise a single generic option
  ("Chambre" / "Salle de bain"). Kitchen / Pièce de vie / Extérieur / Autre unchanged.

## Data model

`LodgingPhoto` gains `room_label String?` (nullable). Generic categories → `room_label = null`;
a numbered pick → `room_type = 'bedroom'|'bathroom'` + `room_label = 'Chambre 2'`.
Migration `add_lodging_photo_room_label`. (Applied by maintainer; `prisma generate` offline.)

## Form (`LodgingShowcaseForm`)

- New pure helper `buildPhotoCategoryOptions(bedroomCount, bathroomCount)` →
  `Array<{ value: string; label: string; roomType: string; roomLabel: string | null }>`.
  - value encodes `roomType` or `roomType::roomLabel`.
  - bedrooms ≥ 2 → one option per "Chambre i"; bedrooms ≤ 1 → single "Chambre".
  - bathrooms: `M = Math.ceil(bathroomCount ?? 0)`; `M ≥ 2` → "Salle de bain i"; else single.
  - always include: Pièce de vie (common_area), Cuisine, Extérieur, Autre.
- The photo `<select>` is built from that helper using the live `bedroom_count` /
  `bathroom_count` form values.
- On upload, parse the selected value into `room_type` + `room_label`, send both in the
  FormData. Photo list shows `room_label ?? generic(room_type)`.
- The photos array sent on save round-trips `room_label`.

## Backend wiring

- `LodgingPhotoItemSchema`: add `room_label: z.string().trim().max(40).nullish()`.
- Photo upload routes (owner `…/public-profile/photos` AND admin
  `/api/admin/lodgings/[id]/public-profile/photos`): read `room_label` from FormData
  (optional, trimmed, ≤40), pass to the create function.
- `owner-public-profile.ts`:
  - `ownerProfileSelect.photos` + `OwnerProfileQueryRow.photos` + `formatOwnerProfile` →
    include `room_label`.
  - `createPhotoForLodging` (and the `createLodgingPhoto` / `createAdminLodgingPhoto`
    wrappers) accept + persist `room_label`.
  - `writePublicProfileForLodging` photo update loop sets `room_label`.
- `types.ts` `OwnerLodgingPublicProfileDto.photos[]`: add `room_label: string | null`.
- `public-lodgings.ts`: detail `detailPhotoArgs.select` + `PublicLodgingDetailQueryResult.photos[]`
  include `room_label`. (List query unaffected.)

## Public display

- `lib/detail-view.ts`: `Photo` type gains `room_label`; `selectRoomPhotos` label becomes
  `photo.room_label ?? ROOM_TYPE_LABELS[photo.room_type]` (still filtered to known
  room_type ≠ 'other').
- `LodgingHeroGallery`: per-slide label = `photo.room_label ?? ROOM_TYPE_LABELS[room_type]`;
  `Photo` type gains `room_label`.
- `LodgingRoomsGrid`: `Photo` type gains `room_label` (forwarded to `selectRoomPhotos`).
- `page.tsx` already passes `detail.photos`; no change beyond types flowing through.

## Testing

- Unit: `buildPhotoCategoryOptions` (counts → options: ≥2 numbered, ≤1 generic, ceil for
  bathrooms, always-on generic categories).
- Unit: `selectRoomPhotos` returns `room_label` when present, generic fallback otherwise.
- Unit: `LodgingPhotoItemSchema` accepts/normalizes `room_label`.
- Existing lodging suites stay green.

## Out of scope

- No change to amenities/FAQ/services. No reordering of photos. No per-room grouping in
  the rooms grid beyond labelling (each photo card keeps its own label).
