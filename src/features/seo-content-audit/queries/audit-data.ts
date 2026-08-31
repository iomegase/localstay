import type { Prisma } from '@prisma/client'
import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'
import { getDiscoveryPoiVisibility } from '@/features/public-discovery/lib/visibility'
import { prisma } from '@/shared/lib/prisma'

const publicPoiAuditSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  updated_at: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  website: true,
  photos: true,
  discovery_status: true,
  discovery_published_at: true,
  is_active: true,
  deleted_at: true,
  geocode_status: true,
  subcategory_id: true,
  city: {
    select: {
      name: true,
      slug: true,
      latitude: true,
      longitude: true,
      is_active: true,
      deleted_at: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      is_active: true,
      deleted_at: true,
    },
  },
  subcategory: {
    select: {
      category_id: true,
      is_active: true,
      deleted_at: true,
    },
  },
  acquisition_candidates_published: {
    where: { deleted_at: null },
    orderBy: [{ updated_at: 'desc' }, { id: 'asc' }],
    select: {
      source: true,
      description: true,
      website: true,
      run: { select: { source: true } },
    },
  },
} satisfies Prisma.PointOfInterestSelect

type PublicPoiAuditDatabaseRow = Prisma.PointOfInterestGetPayload<{
  select: typeof publicPoiAuditSelect
}>

export type PublicPoiAuditProvenance = {
  source: string
  candidateDescriptionPresent: boolean
  website: string | null
  runSource: string
}

export type PublicPoiAuditRow = {
  id: string
  name: string
  description: string | null
  publicUrl: string
  cityName: string
  categoryName: string
  updatedAt: string
  provenance: PublicPoiAuditProvenance[]
}

const publicLodgingAuditSelect = {
  id: true,
  slug: true,
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
  updated_at: true,
  city: { select: { name: true, region: true } },
  photos: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
    select: {
      url: true,
      alt: true,
      is_cover: true,
      room_type: true,
    },
  },
  amenities: {
    where: { deleted_at: null },
    orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
    select: { code: true, label: true, availability: true },
  },
} satisfies Prisma.LodgingPublicProfileSelect

type PublicLodgingAuditDatabaseRow = Prisma.LodgingPublicProfileGetPayload<{
  select: typeof publicLodgingAuditSelect
}>

export type PublicLodgingAuditRow = {
  id: string
  slug: string
  publicUrl: string
  title: string
  shortDescription: string
  description: string
  propertyType: string
  maxGuests: number
  bedroomCount: number | null
  bathroomCount: number | null
  bedCount: number | null
  surfaceM2: number | null
  publicAreaLabel: string | null
  preciseLocationPublic: boolean
  publicLatitude: number | null
  publicLongitude: number | null
  cityName: string
  cityRegion: string | null
  photos: Array<{
    url: string
    alt: string
    is_cover: boolean
    room_type: string | null
  }>
  amenities: Array<{
    code: string
    label: string
    availability: 'included' | 'on_request'
  }>
  updatedAt: string
}

export async function getPublicPoiAuditRows(): Promise<PublicPoiAuditRow[]> {
  const rows: PublicPoiAuditDatabaseRow[] = await prisma.pointOfInterest.findMany({
    where: {
      discovery_status: 'PUBLISHED',
      discovery_published_at: { not: null },
      is_active: true,
      deleted_at: null,
      geocode_status: 'success',
      city: { is_active: true, deleted_at: null },
      category: { is_active: true, deleted_at: null },
      OR: [
        { subcategory_id: null },
        { subcategory: { is: { is_active: true, deleted_at: null } } },
      ],
    },
    select: publicPoiAuditSelect,
  })

  return rows
    .filter((row) => getDiscoveryPoiVisibility(row) !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      publicUrl: `/decouvrir/${row.city.slug}/${row.category.slug}/${row.slug}`,
      cityName: row.city.name,
      categoryName: row.category.name,
      updatedAt: row.updated_at.toISOString(),
      provenance: row.acquisition_candidates_published.map((candidate) => ({
        source: candidate.source,
        candidateDescriptionPresent: Boolean(candidate.description?.trim()),
        website: candidate.website,
        runSource: candidate.run.source,
      })),
    }))
    .sort((left, right) => left.publicUrl.localeCompare(right.publicUrl, 'fr'))
}

export async function getPublicLodgingAuditRows(): Promise<PublicLodgingAuditRow[]> {
  const rows: PublicLodgingAuditDatabaseRow[] = await prisma.lodgingPublicProfile.findMany({
    where: {
      publication_status: 'published',
      deleted_at: null,
      city: { is_active: true, deleted_at: null },
      lodging: { is_active: true, deleted_at: null },
    },
    select: publicLodgingAuditSelect,
  })

  return rows
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      publicUrl: publicLodgingPath(row.slug),
      title: row.title,
      shortDescription: row.short_description,
      description: row.description,
      propertyType: row.property_type,
      maxGuests: row.max_guests,
      bedroomCount: row.bedroom_count,
      bathroomCount: row.bathroom_count,
      bedCount: row.bed_count,
      surfaceM2: row.surface_m2,
      publicAreaLabel: row.public_area_label,
      preciseLocationPublic: row.precise_location_public,
      publicLatitude: row.public_latitude,
      publicLongitude: row.public_longitude,
      cityName: row.city.name,
      cityRegion: row.city.region,
      photos: row.photos,
      amenities: row.amenities,
      updatedAt: row.updated_at.toISOString(),
    }))
    .sort((left, right) => left.publicUrl.localeCompare(right.publicUrl, 'fr'))
}
