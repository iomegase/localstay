import { prisma } from '@/shared/lib/prisma'
import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { detectExternalListingSource } from '../lib/source-url'
import { evaluateProfileCompleteness } from '../lib/completeness'
import { lodgingProfileSlug } from '../lib/slug'
import type {
  LodgingPhotoRoomType,
  OwnerLodgingPublicProfileDto,
  OwnerLodgingShowcasePageData,
} from '../types'
import type {
  LodgingPublicProfileInput,
  SourceUrlInput,
} from '../schemas'

const EMPTY_DRAFT_VALUES = {
  title: '-',
  short_description: '-',
  description: '-',
  property_type: '',
  max_guests: 1,
} as const

const ownerProfileSelect: Prisma.LodgingPublicProfileSelect = {
  id: true,
  lodging_id: true,
  city_id: true,
  slug: true,
  publication_status: true,
  title: true,
  short_description: true,
  description: true,
  property_type: true,
  max_guests: true,
  bedroom_count: true,
  bathroom_count: true,
  bed_count: true,
  surface_m2: true,
  public_area_label: true,
  precise_location_public: true,
  public_latitude: true,
  public_longitude: true,
  external_booking_url: true,
  external_booking_platform: true,
  public_contact_enabled: true,
  source_listing_url: true,
  source_listing_platform: true,
  source_listing_identifier: true,
  source_metadata_status: true,
  source_description_text: true,
  content_rights_confirmed_at: true,
  content_rights_confirmed_by_user_id: true,
  content_rights_statement_version: true,
  rewrite_status: true,
  rewrite_suggestion: true,
  rewrite_generated_at: true,
  rewrite_provider: true,
  seo_title: true,
  seo_description: true,
  photos: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      id: true,
      url: true,
      alt: true,
      room_type: true,
      room_label: true,
      sort_order: true,
      is_cover: true,
    },
  },
  amenities: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      id: true,
      code: true,
      label: true,
      sort_order: true,
      availability: true,
    },
  },
  faq_items: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
    select: { id: true, question: true, answer: true, sort_order: true },
  },
}

type OwnerProfileQueryRow = {
  id: string
  lodging_id: string
  city_id: string
  slug: string
  publication_status: OwnerLodgingPublicProfileDto['publication_status']
  title: string
  short_description: string
  description: string
  property_type: string
  max_guests: number
  bedroom_count: number | null
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  public_area_label: string | null
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  external_booking_url: string | null
  external_booking_platform: OwnerLodgingPublicProfileDto['external_booking_platform']
  public_contact_enabled: boolean
  source_listing_url: string | null
  source_listing_platform: OwnerLodgingPublicProfileDto['source_listing_platform']
  source_listing_identifier: string | null
  source_metadata_status: OwnerLodgingPublicProfileDto['source_metadata_status']
  source_description_text: string | null
  content_rights_confirmed_at: Date | null
  content_rights_confirmed_by_user_id: string | null
  content_rights_statement_version: string | null
  rewrite_status: OwnerLodgingPublicProfileDto['rewrite_status']
  rewrite_suggestion: string | null
  rewrite_generated_at: Date | null
  rewrite_provider: string | null
  seo_title: string | null
  seo_description: string | null
  photos: Array<{
    id: string
    url: string
    alt: string
    room_type: string | null
    room_label: string | null
    sort_order: number
    is_cover: boolean
  }>
  amenities: Array<{
    id: string
    code: string
    label: string
    sort_order: number
    availability: OwnerLodgingPublicProfileDto['amenities'][number]['availability']
  }>
  faq_items: Array<{
    id: string
    question: string
    answer: string
    sort_order: number
  }>
}

function toIsoString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null
}

function formatOwnerProfile(
  row: OwnerProfileQueryRow,
): OwnerLodgingPublicProfileDto {
  return {
    id: row.id,
    lodging_id: row.lodging_id,
    city_id: row.city_id,
    slug: row.slug,
    publication_status: row.publication_status,
    title: row.title,
    short_description: row.short_description,
    description: row.description,
    property_type: row.property_type,
    max_guests: row.max_guests,
    bedroom_count: row.bedroom_count,
    bathroom_count: row.bathroom_count,
    bed_count: row.bed_count,
    surface_m2: row.surface_m2,
    public_area_label: row.public_area_label,
    precise_location_public: row.precise_location_public,
    public_latitude: row.public_latitude,
    public_longitude: row.public_longitude,
    external_booking_url: row.external_booking_url,
    external_booking_platform: row.external_booking_platform,
    public_contact_enabled: row.public_contact_enabled,
    source_listing_url: row.source_listing_url,
    source_listing_platform: row.source_listing_platform,
    source_listing_identifier: row.source_listing_identifier,
    source_metadata_status: row.source_metadata_status,
    source_description_text: row.source_description_text,
    content_rights_confirmed_at: toIsoString(row.content_rights_confirmed_at),
    content_rights_confirmed_by_user_id: row.content_rights_confirmed_by_user_id,
    content_rights_statement_version: row.content_rights_statement_version,
    rewrite_status: row.rewrite_status,
    rewrite_suggestion: row.rewrite_suggestion,
    rewrite_generated_at: toIsoString(row.rewrite_generated_at),
    rewrite_provider: row.rewrite_provider,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    photos: row.photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      room_type: photo.room_type as LodgingPhotoRoomType | null,
      room_label: photo.room_label,
      sort_order: photo.sort_order,
      is_cover: photo.is_cover,
    })),
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
  }
}

function emptyOwnerProfile(lodgingId: string, cityId: string): OwnerLodgingPublicProfileDto {
  return {
    id: null,
    lodging_id: lodgingId,
    city_id: cityId,
    slug: null,
    publication_status: 'draft',
    title: '',
    short_description: '',
    description: '',
    property_type: '',
    max_guests: 1,
    bedroom_count: null,
    bathroom_count: null,
    bed_count: null,
    surface_m2: null,
    public_area_label: null,
    precise_location_public: false,
    public_latitude: null,
    public_longitude: null,
    external_booking_url: null,
    external_booking_platform: null,
    public_contact_enabled: true,
    source_listing_url: null,
    source_listing_platform: null,
    source_listing_identifier: null,
    source_metadata_status: 'not_checked',
    source_description_text: null,
    content_rights_confirmed_at: null,
    content_rights_confirmed_by_user_id: null,
    content_rights_statement_version: null,
    rewrite_status: 'not_requested',
    rewrite_suggestion: null,
    rewrite_generated_at: null,
    rewrite_provider: null,
    seo_title: null,
    seo_description: null,
    photos: [],
    amenities: [],
    faq: [],
  }
}

function inferExternalBookingPlatform(
  value: string | null | undefined,
): 'airbnb' | 'booking' | 'other_verified' | null {
  if (!value) return null

  const hostname = new URL(value).hostname.replace(/^www\./, '').toLowerCase()
  if (hostname.endsWith('airbnb.fr') || hostname.endsWith('airbnb.com')) return 'airbnb'
  if (hostname.endsWith('booking.com')) return 'booking'
  return 'other_verified'
}

export async function getOwnedLodgingForShowcase(ownerId: string, lodgingId: string) {
  return prisma.lodging.findFirst({
    where: {
      id: lodgingId,
      owner_id: ownerId,
      deleted_at: null,
      is_active: true,
      city: {
        deleted_at: null,
        is_active: true,
      },
    },
    select: {
      id: true,
      name: true,
      city_id: true,
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

type ShowcaseLodging = {
  id: string
  name: string
  city_id: string
  city: { id: string; name: string; slug: string }
}

async function ensureProfileRecordForLodging(lodging: ShowcaseLodging) {
  const profile = await prisma.lodgingPublicProfile.upsert({
    where: { lodging_id: lodging.id },
    create: {
      lodging_id: lodging.id,
      city_id: lodging.city_id,
      slug: lodgingProfileSlug(`lodging-${lodging.id}`),
      publication_status: 'draft',
      public_contact_enabled: true,
      ...EMPTY_DRAFT_VALUES,
    },
    update: {
      city_id: lodging.city_id,
    },
    select: ownerProfileSelect,
  })

  return { lodging, profile: formatOwnerProfile(profile) }
}

async function ensureOwnerProfileRecord(ownerId: string, lodgingId: string) {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null

  return ensureProfileRecordForLodging(lodging)
}

export async function getOwnerPublicProfile(
  ownerId: string,
  lodgingId: string,
): Promise<OwnerLodgingPublicProfileDto | null> {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null

  const profile = await prisma.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodgingId },
    select: ownerProfileSelect,
  })

  return profile ? formatOwnerProfile(profile) : emptyOwnerProfile(lodgingId, lodging.city_id)
}

export async function getOwnedLodgingShowcasePageData(
  ownerId: string,
  lodgingId: string,
): Promise<OwnerLodgingShowcasePageData | null> {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null

  const profile = await getOwnerPublicProfile(ownerId, lodgingId)
  if (!profile) return null

  return {
    lodging: {
      id: lodging.id,
      name: lodging.name,
      city: lodging.city,
    },
    profile,
  }
}

async function writePublicProfileForLodging(
  lodging: { id: string; city_id: string },
  input: LodgingPublicProfileInput,
  options: { resetToDraft: boolean },
): Promise<OwnerLodgingPublicProfileDto | null> {
  const slug = lodgingProfileSlug(input.title)
  const externalBookingPlatform = inferExternalBookingPlatform(input.external_booking_url ?? null)

  const profile = await prisma.lodgingPublicProfile.upsert({
    where: { lodging_id: lodging.id },
    create: {
      lodging_id: lodging.id,
      city_id: lodging.city_id,
      slug,
      publication_status: 'draft',
      title: input.title,
      short_description: input.short_description,
      description: input.description,
      property_type: input.property_type,
      max_guests: input.max_guests,
      bedroom_count: input.bedroom_count ?? null,
      bathroom_count: input.bathroom_count ?? null,
      bed_count: input.bed_count ?? null,
      surface_m2: input.surface_m2 ?? null,
      public_area_label: input.public_area_label ?? null,
      precise_location_public: input.precise_location_public ?? false,
      public_latitude: input.public_latitude ?? null,
      public_longitude: input.public_longitude ?? null,
      external_booking_url: input.external_booking_url ?? null,
      external_booking_platform: externalBookingPlatform,
      public_contact_enabled: input.public_contact_enabled,
      source_description_text: input.source_description_text ?? null,
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
    },
    update: {
      city_id: lodging.city_id,
      slug,
      ...(options.resetToDraft ? { publication_status: 'draft' as const } : {}),
      title: input.title,
      short_description: input.short_description,
      description: input.description,
      property_type: input.property_type,
      max_guests: input.max_guests,
      bedroom_count: input.bedroom_count ?? null,
      bathroom_count: input.bathroom_count ?? null,
      bed_count: input.bed_count ?? null,
      surface_m2: input.surface_m2 ?? null,
      public_area_label: input.public_area_label ?? null,
      precise_location_public: input.precise_location_public ?? false,
      public_latitude: input.public_latitude ?? null,
      public_longitude: input.public_longitude ?? null,
      external_booking_url: input.external_booking_url ?? null,
      external_booking_platform: externalBookingPlatform,
      public_contact_enabled: input.public_contact_enabled,
      source_description_text: input.source_description_text ?? null,
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
    },
    select: { id: true },
  })

  // Amenities are a fully-replaced child collection. Hard-delete (not soft-delete)
  // so re-saving the same codes can't collide with leftover rows on the
  // @@unique([profile_id, code]) index (which ignores deleted_at) → would 500.
  await prisma.lodgingAmenity.deleteMany({
    where: { profile_id: profile.id },
  })

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

  // FAQ items are also fully replaced on each save → hard-delete then recreate.
  await prisma.lodgingFaqItem.deleteMany({
    where: { profile_id: profile.id },
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

  for (const photo of input.photos) {
    if (!photo.id) continue

    await prisma.lodgingPhoto.updateMany({
      where: { id: photo.id, profile_id: profile.id, deleted_at: null },
      data: {
        alt: photo.alt,
        room_type: photo.room_type ?? null,
        room_label: photo.room_label ?? null,
        sort_order: photo.sort_order,
        is_cover: photo.is_cover,
      },
    })
  }

  const fresh = await prisma.lodgingPublicProfile.findUnique({
    where: { id: profile.id },
    select: ownerProfileSelect,
  })

  return fresh ? formatOwnerProfile(fresh) : null
}

export async function saveOwnerPublicProfile(
  ownerId: string,
  lodgingId: string,
  input: LodgingPublicProfileInput,
): Promise<OwnerLodgingPublicProfileDto | null> {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null

  return writePublicProfileForLodging(lodging, input, { resetToDraft: true })
}

export async function submitOwnerPublicProfile(ownerId: string, lodgingId: string) {
  const owned = await ensureOwnerProfileRecord(ownerId, lodgingId)
  if (!owned) {
    return { ok: false as const, code: 'LODGING_NOT_FOUND', status: 404, missingFields: [] }
  }

  const completeness = evaluateProfileCompleteness({
    title: owned.profile.title,
    short_description: owned.profile.short_description,
    description: owned.profile.description,
    property_type: owned.profile.property_type,
    max_guests: owned.profile.max_guests,
    photos: owned.profile.photos,
    amenities: owned.profile.amenities.map(amenity => ({
      code: amenity.code,
      label: amenity.label,
    })),
    content_rights_confirmed_at: owned.profile.content_rights_confirmed_at
      ? new Date(owned.profile.content_rights_confirmed_at)
      : null,
  })

  if (!completeness.canSubmitForReview) {
    return {
      ok: false as const,
      code: 'PROFILE_INCOMPLETE',
      status: 400,
      missingFields: completeness.missingFields,
      warnings: completeness.warnings,
    }
  }

  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: owned.profile.id ?? '' },
    data: {
      publication_status: 'review',
      submitted_for_review_at: new Date(),
    },
    select: {
      id: true,
      publication_status: true,
    },
  })

  return { ok: true as const, profile: updated }
}

export async function saveSourceListingUrl(
  ownerId: string,
  lodgingId: string,
  input: SourceUrlInput,
) {
  const owned = await ensureOwnerProfileRecord(ownerId, lodgingId)
  if (!owned) return null

  const detected = detectExternalListingSource(input.source_listing_url)

  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: owned.profile.id ?? '' },
    data: {
      source_listing_url: input.source_listing_url,
      source_listing_platform: detected.platform,
      source_listing_identifier: detected.identifier,
      source_metadata_status: detected.metadataStatus,
      publication_status: 'draft',
    },
    select: {
      source_listing_url: true,
      source_listing_platform: true,
      source_listing_identifier: true,
      source_metadata_status: true,
    },
  })

  return updated
}

export async function confirmContentRights(
  ownerId: string,
  lodgingId: string,
  statementVersion: string,
) {
  const owned = await ensureOwnerProfileRecord(ownerId, lodgingId)
  if (!owned) return null

  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: owned.profile.id ?? '' },
    data: {
      content_rights_confirmed_at: new Date(),
      content_rights_confirmed_by_user_id: ownerId,
      content_rights_statement_version: statementVersion,
      publication_status: 'draft',
    },
    select: {
      content_rights_confirmed_at: true,
    },
  })

  return {
    content_rights_confirmed_at: updated.content_rights_confirmed_at
      ? updated.content_rights_confirmed_at.toISOString()
      : null,
  }
}

async function createPhotoForLodging(
  lodging: ShowcaseLodging,
  input: {
    url: string
    alt: string
    room_type: LodgingPhotoRoomType | null
    room_label: string | null
  },
) {
  const owned = await ensureProfileRecordForLodging(lodging)

  const existingCount = await prisma.lodgingPhoto.count({
    where: {
      profile_id: owned.profile.id ?? '',
      deleted_at: null,
    },
  })

  const photo = await prisma.lodgingPhoto.create({
    data: {
      profile_id: owned.profile.id ?? '',
      url: input.url,
      alt: input.alt,
      room_type: input.room_type,
      room_label: input.room_label,
      sort_order: existingCount,
      is_cover: existingCount === 0,
    },
    select: {
      id: true,
      url: true,
      alt: true,
      room_type: true,
      room_label: true,
      sort_order: true,
      is_cover: true,
    },
  })

  return {
    ...photo,
    room_type: photo.room_type as LodgingPhotoRoomType | null,
  }
}

export async function createLodgingPhoto(
  ownerId: string,
  lodgingId: string,
  input: {
    url: string
    alt: string
    room_type: LodgingPhotoRoomType | null
    room_label: string | null
  },
) {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return null

  return createPhotoForLodging(lodging, input)
}

export async function getOwnerRewriteContext(ownerId: string, lodgingId: string) {
  const owned = await ensureOwnerProfileRecord(ownerId, lodgingId)
  if (!owned) return null

  return {
    cityName: owned.lodging.city.name,
    maxGuests: owned.profile.max_guests,
    amenities: owned.profile.amenities.map(amenity => amenity.label),
  }
}

export async function saveGeneratedRewrite(
  ownerId: string,
  lodgingId: string,
  input: {
    sourceDescriptionText: string
    rewriteSuggestion: {
      short_description: string
      description: string
      seo_title: string
      seo_description: string
    }
  },
) {
  const owned = await ensureOwnerProfileRecord(ownerId, lodgingId)
  if (!owned) return null

  const rewriteSuggestion = JSON.stringify(input.rewriteSuggestion)
  const rewriteSourceTextHash = createHash('sha256')
    .update(input.sourceDescriptionText.trim().replace(/\s+/g, ' '))
    .digest('hex')

  const updated = await prisma.lodgingPublicProfile.update({
    where: { id: owned.profile.id ?? '' },
    data: {
      publication_status: 'draft',
      source_description_text: input.sourceDescriptionText,
      rewrite_status: 'generated',
      rewrite_suggestion: rewriteSuggestion,
      rewrite_generated_at: new Date(),
      rewrite_provider: 'gemini',
      rewrite_source_text_hash: rewriteSourceTextHash,
    },
    select: {
      rewrite_status: true,
      rewrite_suggestion: true,
    },
  })

  return updated
}

export async function getLodgingForAdminShowcase(lodgingId: string) {
  return prisma.lodging.findFirst({
    where: {
      id: lodgingId,
      deleted_at: null,
      is_active: true,
      city: {
        deleted_at: null,
        is_active: true,
      },
    },
    select: {
      id: true,
      name: true,
      city_id: true,
      city: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function getAdminPublicProfile(
  lodgingId: string,
): Promise<OwnerLodgingPublicProfileDto | null> {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return null

  const profile = await prisma.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodgingId },
    select: ownerProfileSelect,
  })

  return profile ? formatOwnerProfile(profile) : emptyOwnerProfile(lodgingId, lodging.city_id)
}

export async function getAdminLodgingShowcasePageData(
  lodgingId: string,
): Promise<OwnerLodgingShowcasePageData | null> {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return null

  const profile = await getAdminPublicProfile(lodgingId)
  if (!profile) return null

  return {
    lodging: {
      id: lodging.id,
      name: lodging.name,
      city: lodging.city,
    },
    profile,
  }
}

export async function saveAdminPublicProfile(
  lodgingId: string,
  input: LodgingPublicProfileInput,
): Promise<OwnerLodgingPublicProfileDto | null> {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return null

  return writePublicProfileForLodging(lodging, input, { resetToDraft: false })
}

export async function createAdminLodgingPhoto(
  lodgingId: string,
  input: {
    url: string
    alt: string
    room_type: LodgingPhotoRoomType | null
    room_label: string | null
  },
) {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return null

  return createPhotoForLodging(lodging, input)
}

async function deletePhotoForLodging(lodging: { id: string }, photoId: string): Promise<boolean> {
  const deleted = await prisma.lodgingPhoto.updateMany({
    where: { id: photoId, deleted_at: null, profile: { lodging_id: lodging.id } },
    data: { deleted_at: new Date() },
  })
  if (deleted.count === 0) return false

  const profile = await prisma.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodging.id },
    select: { id: true },
  })
  if (profile) {
    const remaining = await prisma.lodgingPhoto.findMany({
      where: { profile_id: profile.id, deleted_at: null },
      orderBy: [{ is_cover: 'desc' }, { sort_order: 'asc' }, { created_at: 'asc' }],
      select: { id: true, is_cover: true },
    })
    if (remaining.length > 0 && !remaining.some(photo => photo.is_cover)) {
      await prisma.lodgingPhoto.update({ where: { id: remaining[0].id }, data: { is_cover: true } })
    }
  }
  return true
}

async function setCoverPhotoForLodging(lodging: { id: string }, photoId: string): Promise<boolean> {
  const profile = await prisma.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodging.id },
    select: { id: true },
  })
  if (!profile) return false

  const target = await prisma.lodgingPhoto.findFirst({
    where: { id: photoId, deleted_at: null, profile_id: profile.id },
    select: { id: true },
  })
  if (!target) return false

  await prisma.$transaction([
    prisma.lodgingPhoto.updateMany({ where: { profile_id: profile.id, deleted_at: null }, data: { is_cover: false } }),
    prisma.lodgingPhoto.update({ where: { id: photoId }, data: { is_cover: true } }),
  ])
  return true
}

export async function deleteOwnerLodgingPhoto(ownerId: string, lodgingId: string, photoId: string): Promise<boolean> {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return false
  return deletePhotoForLodging(lodging, photoId)
}

export async function setOwnerCoverPhoto(ownerId: string, lodgingId: string, photoId: string): Promise<boolean> {
  const lodging = await getOwnedLodgingForShowcase(ownerId, lodgingId)
  if (!lodging) return false
  return setCoverPhotoForLodging(lodging, photoId)
}

export async function deleteAdminLodgingPhoto(lodgingId: string, photoId: string): Promise<boolean> {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return false
  return deletePhotoForLodging(lodging, photoId)
}

export async function setAdminCoverPhoto(lodgingId: string, photoId: string): Promise<boolean> {
  const lodging = await getLodgingForAdminShowcase(lodgingId)
  if (!lodging) return false
  return setCoverPhotoForLodging(lodging, photoId)
}
