import { prisma } from '@/shared/lib/prisma'
import { selectPrimaryPoiPhoto } from '@/features/categories/lib/photo-url'

type PublicLodgingCardApi = {
  id: string
  slug: string
  city_slug: string
  title: string
  cover_photo_url: string | null
  short_description: string
  property_type: string
  max_guests: number
  bedroom_count: number | null
  public_area_label: string | null
  amenities: string[]
  href: string
}

export type PublicLodgingDetailQueryResult = PublicLodgingCardApi & {
  city_name: string
  city_region: string | null
  description: string
  photos: Array<{
    id: string
    url: string
    alt: string
    room_type: string | null
    sort_order: number
    is_cover: boolean
  }>
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  external_booking_url: string | null
  external_booking_platform: string | null
  public_contact_enabled: boolean
  owner_recommendations: Array<{
    id: string
    name: string
    slug: string
    category_slug: string
    photo_url: string | null
  }>
}

export type PublicLodgingListResult = {
  items: PublicLodgingCardApi[]
  meta: { page: number; limit: number; total: number; total_pages: number }
}

type PublicLodgingFilters = {
  guests?: number
  amenities?: string[]
  page: number
  limit: number
}

const listPhotoArgs = {
  where: { deleted_at: null },
  orderBy: [{ is_cover: 'desc' as const }, { sort_order: 'asc' as const }, { created_at: 'asc' as const }],
  take: 1,
  select: { url: true },
}

const detailPhotoArgs = {
  where: { deleted_at: null },
  orderBy: [{ is_cover: 'desc' as const }, { sort_order: 'asc' as const }, { created_at: 'asc' as const }],
  select: {
    id: true,
    url: true,
    alt: true,
    room_type: true,
    sort_order: true,
    is_cover: true,
  },
}

const amenityArgs = {
  where: { deleted_at: null },
  orderBy: [{ sort_order: 'asc' as const }, { created_at: 'asc' as const }],
  select: { code: true, label: true },
}

async function getActiveCityBySlug(citySlug: string) {
  return prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, slug: true, name: true, region: true },
  })
}

function buildPublishedWhere(cityId: string, citySlug: string, filters?: { guests?: number; amenities?: string[] }) {
  const amenities = filters?.amenities?.filter(code => code.trim().length > 0) ?? []

  return {
    city_id: cityId,
    publication_status: 'published' as const,
    deleted_at: null,
    city: { slug: citySlug, is_active: true, deleted_at: null },
    lodging: { is_active: true, deleted_at: null },
    ...(filters?.guests ? { max_guests: { gte: filters.guests } } : {}),
    ...(amenities.length > 0
      ? {
          AND: amenities.map(code => ({
            amenities: {
              some: {
                code,
                deleted_at: null,
              },
            },
          })),
        }
      : {}),
  }
}

function toCardApi(row: {
  id: string
  slug: string
  title: string
  short_description: string
  property_type: string
  max_guests: number
  bedroom_count: number | null
  public_area_label: string | null
  photos: Array<{ url: string }>
  amenities: Array<{ label: string }>
  city: { slug: string }
}): PublicLodgingCardApi {
  return {
    id: row.id,
    slug: row.slug,
    city_slug: row.city.slug,
    title: row.title,
    cover_photo_url: row.photos[0]?.url ?? null,
    short_description: row.short_description,
    property_type: row.property_type,
    max_guests: row.max_guests,
    bedroom_count: row.bedroom_count,
    public_area_label: row.public_area_label,
    amenities: row.amenities.map(amenity => amenity.label),
    href: `/guide/${row.city.slug}/logements/${row.slug}`,
  }
}

export async function listPublishedLodgingsForCity(
  citySlug: string,
  filters: PublicLodgingFilters,
): Promise<PublicLodgingListResult | null> {
  const city = await getActiveCityBySlug(citySlug)
  if (!city) return null

  const where = buildPublishedWhere(city.id, citySlug, filters)
  const skip = (filters.page - 1) * filters.limit

  const [rows, total] = await Promise.all([
    prisma.lodgingPublicProfile.findMany({
      where,
      orderBy: [{ is_featured: 'desc' }, { published_at: 'desc' }, { created_at: 'desc' }],
      skip,
      take: filters.limit,
      select: {
        id: true,
        slug: true,
        title: true,
        short_description: true,
        property_type: true,
        max_guests: true,
        bedroom_count: true,
        public_area_label: true,
        city: { select: { slug: true } },
        photos: listPhotoArgs,
        amenities: amenityArgs,
      },
    }),
    prisma.lodgingPublicProfile.count({ where }),
  ])

  return {
    items: rows.map(toCardApi),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: total === 0 ? 0 : Math.ceil(total / filters.limit),
    },
  }
}

export async function getPublishedLodgingDetail(
  citySlug: string,
  lodgingSlug: string,
): Promise<PublicLodgingDetailQueryResult | null> {
  const city = await getActiveCityBySlug(citySlug)
  if (!city) return null

  const where = buildPublishedWhere(city.id, citySlug)
  const row = await prisma.lodgingPublicProfile.findFirst({
    where: {
      ...where,
      slug: lodgingSlug,
    },
    select: {
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
      external_booking_url: true,
      external_booking_platform: true,
      public_contact_enabled: true,
      city: { select: { slug: true, name: true, region: true } },
      photos: detailPhotoArgs,
      amenities: amenityArgs,
      lodging: {
        select: {
          featured_pois: {
            where: {
              deleted_at: null,
              poi: {
                deleted_at: null,
                is_active: true,
                geocode_status: { not: 'rejected' },
              },
            },
            orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
            select: {
              poi: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  photos: true,
                  category: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!row) return null

  const card = toCardApi(row)
  return {
    ...card,
    city_name: row.city.name,
    city_region: row.city.region,
    description: row.description,
    photos: row.photos,
    bathroom_count: row.bathroom_count,
    bed_count: row.bed_count,
    surface_m2: row.surface_m2,
    external_booking_url: row.external_booking_url,
    external_booking_platform: row.external_booking_platform,
    public_contact_enabled: row.public_contact_enabled,
    owner_recommendations: row.lodging.featured_pois.map(featuredPoi => ({
      id: featuredPoi.poi.id,
      name: featuredPoi.poi.name,
      slug: featuredPoi.poi.slug,
      category_slug: featuredPoi.poi.category.slug,
      photo_url: selectPrimaryPoiPhoto(featuredPoi.poi.photos),
    })),
  }
}
