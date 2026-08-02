import type { Prisma } from '@prisma/client'
import { computeIsOpenNow } from '@/features/categories/lib/is-open-now'
import { getCategoryColor } from '@/features/categories/lib/category-style'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import type {
  GuidePoi,
  GuideTrailSummary,
  GuideUsefulNumber,
  PrivateGuideData,
} from '@/features/guide-app/types'
import { isValidTrailGeometry } from '@/features/trail-navigation/lib/geo'
import { prisma } from '@/shared/lib/prisma'
import type { PoiHours } from '@/features/categories/types'

export async function getPrivateGuideData(
  lodgingId: string,
): Promise<PrivateGuideData | null> {
  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: {
      id: true,
      name: true,
      city: { select: { name: true, latitude: true, longitude: true } },
      customization: {
        select: {
          welcome_message: true,
          cover_photo_url: true,
          lodging_address: true,
          lodging_latitude: true,
          lodging_longitude: true,
          wifi_ssid: true,
          wifi_password: true,
          equipment_info: true,
          checkout_instructions: true,
          house_rules: true,
          emergency_contacts: true,
          useful_services: true,
        },
      },
      practical_blocks: {
        where: { deleted_at: null },
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          title: true,
          body: true,
          icon: true,
          video_url: true,
        },
      },
    },
  })

  if (!lodging) return null

  const featuredRows = await prisma.lodgingFeaturedPoi.findMany({
    where: {
      lodging_id: lodgingId,
      deleted_at: null,
      poi: { is_active: true, deleted_at: null },
    },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      owner_note: true,
      poi: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          latitude: true,
          longitude: true,
          phone: true,
          website: true,
          rating: true,
          rating_count: true,
          is_open_now: true,
          hours: true,
          photos: true,
          city: { select: { slug: true } },
          category: { select: { slug: true, name: true, icon: true } },
          trail_detail: {
            where: { deleted_at: null, is_active: true },
            select: {
              difficulty: true,
              distance_km: true,
              elevation_gain_m: true,
              estimated_duration_min: true,
              start_label: true,
              start_latitude: true,
              start_longitude: true,
              geometry_geojson: true,
              data_quality_status: true,
              kids_friendly: true,
            },
          },
        },
      },
    },
  })

  const customization = lodging.customization
  const coverImage = customization?.cover_photo_url?.trim()

  return {
    lodging: {
      id: lodging.id,
      name: lodging.name,
      city: lodging.city.name,
      tagline:
        customization?.welcome_message?.trim() ||
        `Bienvenue à ${lodging.city.name}`,
      coverImage: coverImage || '/marketing/hero-chalet.png',
      gallery: coverImage ? [coverImage] : [],
      latitude: customization?.lodging_latitude ?? lodging.city.latitude,
      longitude: customization?.lodging_longitude ?? lodging.city.longitude,
      addressLabel: customization?.lodging_address ?? lodging.city.name,
      checkIn: '16:00',
      checkOut: '10:00',
      wifiName: customization?.wifi_ssid ?? '',
      wifiPassword: customization?.wifi_password ?? '',
      arrivalInstructions: [],
      departureInstructions: splitContent(
        customization?.checkout_instructions,
      ),
      equipment: splitContent(customization?.equipment_info),
      houseRules: splitContent(customization?.house_rules),
      practicalCards: lodging.practical_blocks.map(block => ({
        id: block.id,
        title: block.title,
        description: block.body ?? '',
        icon: block.icon,
        videoUrl: block.video_url ?? undefined,
      })),
      usefulNumbers: mapUsefulNumbers(customization?.emergency_contacts),
    },
    pois: featuredRows.map(row => mapPrivateGuidePoi(row)),
  }
}

type PrivateGuidePoiRow = {
  owner_note: string | null
  poi: {
    id: string
    name: string
    slug: string
    description: string | null
    address: string
    latitude: number
    longitude: number
    phone: string | null
    website: string | null
    rating: number | null
    rating_count: number
    is_open_now: boolean | null
    hours: Prisma.JsonValue | null
    photos: string[]
    city: { slug: string }
    category: { slug: string; name: string; icon: string }
    trail_detail: {
      difficulty: string
      distance_km: number | null
      elevation_gain_m: number | null
      estimated_duration_min: number | null
      start_label: string | null
      start_latitude: number
      start_longitude: number
      geometry_geojson: Prisma.JsonValue | null
      data_quality_status: string
      kids_friendly: boolean | null
    } | null
  }
}

function mapPrivateGuidePoi(row: PrivateGuidePoiRow): GuidePoi {
  const { poi } = row
  const hours = isPoiHours(poi.hours) ? poi.hours : undefined
  const photo = getGuidePoiHeroImage({
    categorySlug: poi.category.slug,
    photos: poi.photos,
  })

  return {
    id: poi.id,
    name: poi.name,
    slug: poi.slug,
    citySlug: poi.city.slug,
    category: {
      slug: poi.category.slug,
      name: poi.category.name,
      icon: poi.category.icon,
      color: getCategoryColor(poi.category.slug),
    },
    description: poi.description?.trim() || poi.name,
    shortDescription: shortDescription(poi.description, poi.name),
    photos: [photo, ...poi.photos.filter(candidate => candidate !== photo)],
    latitude: poi.latitude,
    longitude: poi.longitude,
    address: poi.address,
    recommended: true,
    familyFriendly: poi.trail_detail?.kids_friendly ?? undefined,
    isOpenNow: computeIsOpenNow(hours) ?? poi.is_open_now ?? undefined,
    website: poi.website ?? undefined,
    phone: poi.phone ?? undefined,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`,
    rating: poi.rating ?? undefined,
    reviewCount: poi.rating_count || undefined,
    hours,
    ownerNote: row.owner_note?.trim() || undefined,
    trail: mapTrail(poi.trail_detail),
  }
}

function mapTrail(
  trail: PrivateGuidePoiRow['poi']['trail_detail'],
): GuideTrailSummary | undefined {
  if (!trail) return undefined

  const geometry = trail.geometry_geojson
  const trackingEnabled =
    isValidTrailGeometry(geometry) &&
    ['complete', 'partial'].includes(trail.data_quality_status)

  return {
    difficulty: normalizeDifficulty(trail.difficulty),
    estimatedDurationMinutes: trail.estimated_duration_min,
    distanceKm: trail.distance_km,
    elevationGainM: trail.elevation_gain_m,
    startLabel: trail.start_label,
    trackingEnabled,
    geometry: isValidTrailGeometry(geometry) ? geometry : undefined,
    startLatitude: trail.start_latitude,
    startLongitude: trail.start_longitude,
    reliability:
      trail.data_quality_status === 'complete' ? 'reliable' : 'indicative',
  }
}

function normalizeDifficulty(value: string): GuideTrailSummary['difficulty'] {
  return ['easy', 'medium', 'hard', 'expert'].includes(value)
    ? (value as GuideTrailSummary['difficulty'])
    : 'unknown'
}

function splitContent(value: string | null | undefined): string[] {
  if (!value) return []

  return value
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
}

function mapUsefulNumbers(
  value: string | null | undefined,
): GuideUsefulNumber[] {
  return splitContent(value).map((line, index) => {
    const separator = line.indexOf(':')
    if (separator < 0) {
      return { label: `Contact ${index + 1}`, number: line }
    }

    return {
      label: line.slice(0, separator).trim() || `Contact ${index + 1}`,
      number: line.slice(separator + 1).trim(),
    }
  })
}

function shortDescription(description: string | null, fallback: string): string {
  const value = description?.trim() || fallback
  if (value.length <= 120) return value
  return `${value.slice(0, 117).trimEnd()}…`
}

function isPoiHours(value: Prisma.JsonValue | null): value is PoiHours {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}
