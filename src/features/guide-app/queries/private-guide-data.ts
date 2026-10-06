import { getPoiPhotoMirrorMap, resolvePoiPhotoList, type PoiPhotoMirrorMap } from '@/features/poi-photos/queries/photo-mirror-map'
import type { Prisma } from '@prisma/client'
import { computeIsOpenNow } from '@/features/categories/lib/is-open-now'
import { getCategoryColor } from '@/features/categories/lib/category-style'
import { activeFallbackImageUrl } from '@/features/categories/lib/poi-fallback-image'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import {
  FIXED_DEPARTURE_INSTRUCTIONS,
  FIXED_HOUSE_RULES,
} from '@/features/guide-app/lib/fixed-lodging-content'
import type {
  GuidePoi,
  GuideTrailSummary,
  GuideUsefulNumber,
  PrivateGuideData,
} from '@/features/guide-app/types'
import { isValidTrailGeometry } from '@/features/trail-navigation/lib/geo'
import { isTrashBinType } from '@/features/guide-customization/lib/trash-bins'
import { parseArrivalFacts, parseArrivalSubsteps } from '@/features/guide-app/lib/arrival-steps'
import { isFacilibusCity } from '@/features/transport/facilibus'
import { prisma } from '@/shared/lib/prisma'
import type { PoiHours } from '@/features/categories/types'
import { after } from 'next/server'
import type { GuideLocale } from '@/features/guide-i18n/lib/locale'
import { applyEnglishTranslations, prismaTranslationStore, type LocalizableField } from '@/features/content-translation/queries/store'
import { translateSources } from '@/features/content-translation/services/translate-sources'
import { deeplConfigFromEnv } from '@/shared/lib/deepl'

export async function getPrivateGuideData(
  lodgingId: string,
  /** Spec 061 A1 : en anglais, contenus remplacés par leur traduction à jour. */
  locale: GuideLocale = 'fr',
): Promise<PrivateGuideData | null> {
  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: {
      id: true,
      name: true,
      city: {
        select: {
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          transport_cards: {
            where: { deleted_at: null },
            orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
            select: { id: true, title: true, tag: true, body: true, details: true, image_url: true, external_url: true, cta_label: true, poi_id: true, service_key: true, is_free: true },
          },
        },
      },
      customization: {
        select: {
          id: true,
          welcome_message: true,
          cover_photo_url: true,
          lodging_address: true,
          lodging_latitude: true,
          lodging_longitude: true,
          wifi_ssid: true,
          wifi_password: true,
          emergency_contacts: true,
          useful_services: true,
          trash_bins: true,
          trash_location: true,
          presentation_video_url: true,
          key_box_code: true,
        },
      },
      public_profile: {
        select: { max_guests: true, bedroom_count: true, surface_m2: true, deleted_at: true },
      },
      practical_blocks: {
        where: { deleted_at: null },
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          title: true,
          body: true,
          icon: true,
          photo_url: true,
          video_url: true,
        },
      },
      arrival_instructions: {
        where: { deleted_at: null },
        orderBy: { sort_order: 'asc' },
        select: {
          id: true,
          title: true,
          text: true,
          video_url: true,
          photos: true,
          kind: true,
          tip: true,
          substeps: true,
          facts: true,
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
      id: true,
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
          // Spec 070 : image de remplacement attribuée.
          fallback_image: { select: { url: true, deleted_at: true } },
          city: { select: { slug: true } },
          category: { select: { id: true, slug: true, name: true, icon: true } },
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

  const mirrorMap = await getPoiPhotoMirrorMap()
  const featuredIds = new Set(featuredRows.map(row => row.poi.id))
  const linkedPoiIds = [...new Set((lodging.city.transport_cards ?? []).flatMap(card => card.poi_id ? [card.poi_id] : []))]
    .filter(id => !featuredIds.has(id))
  const linkedPoiRows = linkedPoiIds.length > 0
    ? await prisma.pointOfInterest.findMany({
        where: { id: { in: linkedPoiIds }, city: { slug: lodging.city.slug }, is_active: true, deleted_at: null, discovery_status: 'PUBLISHED' },
        select: {
          id: true, name: true, slug: true, description: true, address: true,
          latitude: true, longitude: true, phone: true, website: true,
          rating: true, rating_count: true, is_open_now: true, hours: true, photos: true,
          fallback_image: { select: { url: true, deleted_at: true } },
          city: { select: { slug: true } },
          category: { select: { id: true, slug: true, name: true, icon: true } },
          trail_detail: {
            where: { deleted_at: null, is_active: true },
            select: {
              difficulty: true, distance_km: true, elevation_gain_m: true,
              estimated_duration_min: true, start_label: true, start_latitude: true,
              start_longitude: true, geometry_geojson: true, data_quality_status: true,
              kids_friendly: true,
            },
          },
        },
      })
    : []

  const customization = lodging.customization
  const profile = lodging.public_profile?.deleted_at ? null : lodging.public_profile
  const coverImage = customization?.cover_photo_url?.trim()

  const data: PrivateGuideData = {
    lodging: {
      id: lodging.id,
      name: lodging.name,
      city: lodging.city.name,
      tagline:
        customization?.welcome_message?.trim() ||
        `Bienvenue à ${lodging.city.name}`,
      coverImage: coverImage || '/marketing/hero-chalet-v2.png',
      gallery: coverImage ? [coverImage] : [],
      latitude: customization?.lodging_latitude ?? lodging.city.latitude,
      longitude: customization?.lodging_longitude ?? lodging.city.longitude,
      addressLabel: customization?.lodging_address ?? lodging.city.name,
      checkIn: '16:00',
      checkOut: '10:00',
      wifiName: customization?.wifi_ssid ?? '',
      wifiPassword: customization?.wifi_password ?? '',
      presentationVideoUrl:
        customization?.presentation_video_url?.trim() || undefined,
      arrivalInstructions: lodging.arrival_instructions.map(instruction => ({
        title: instruction.title,
        text: instruction.text,
        videoUrl: instruction.video_url,
        photos: instruction.photos,
        kind: instruction.kind,
        tip: instruction.tip?.trim() || null,
        substeps: parseArrivalSubsteps(instruction.substeps),
        facts: parseArrivalFacts(instruction.facts),
      })),
      departureInstructions: [...FIXED_DEPARTURE_INSTRUCTIONS],
      houseRules: [...FIXED_HOUSE_RULES],
      practicalCards: lodging.practical_blocks.map(block => ({
        id: block.id,
        title: block.title,
        description: block.body ?? '',
        icon: block.icon,
        photoUrl: block.photo_url ?? undefined,
        videoUrl: block.video_url ?? undefined,
      })),
      usefulNumbers: mapUsefulNumbers(customization?.useful_services),
      trashBins: (
        (customization?.trash_bins as unknown as { type: string }[] | null) ?? []
      ).filter(bin => isTrashBinType(bin.type)),
      trashLocation: customization?.trash_location?.trim() || null,
      keyBoxCode: customization?.key_box_code?.trim() || null,
      stats: {
        guests: profile?.max_guests ?? null,
        bedrooms: profile?.bedroom_count ?? null,
        surfaceM2: profile?.surface_m2 ?? null,
      },
      locationPrecise:
        customization?.lodging_latitude != null && customization?.lodging_longitude != null,
      facilibus: isFacilibusCity(lodging.city.slug),
      transportCards: (lodging.city.transport_cards ?? []).map(card => ({
        ...card,
        poi_id: card.poi_id && (featuredIds.has(card.poi_id) || linkedPoiRows.some(poi => poi.id === card.poi_id))
          ? card.poi_id : null,
      })),
    },
    pois: featuredRows.map(row => mapPrivateGuidePoi(row, mirrorMap)),
    transportPois: linkedPoiRows.map(poi => mapPrivateGuidePoi({ poi, owner_note: null }, mirrorMap)),
  }

  if (locale === 'en') {
    await localizeToEnglish(data, {
      customizationId: customization?.id ?? null,
      welcomeMessage: customization?.welcome_message?.trim() || null,
      arrivalIds: lodging.arrival_instructions.map(instruction => instruction.id),
      featuredRows,
      linkedPoiRows,
    })
  }
  return data
}

/**
 * Spec 061 A1 : remplace les contenus du guide par leur traduction anglaise à
 * jour (AC-02-02) et lance, après la réponse, la traduction des autres (AC-02-01).
 */
async function localizeToEnglish(
  data: PrivateGuideData,
  refs: {
    customizationId: string | null
    welcomeMessage: string | null
    arrivalIds: string[]
    featuredRows: Array<{ id: string; owner_note: string | null; poi: { id: string; category: { id: string } } }>
    linkedPoiRows: Array<{ id: string; category: { id: string } }>
  },
) {
  const fields: LocalizableField[] = []
  const field = (entityType: string, entityId: string | null | undefined, name: string, text: string | null | undefined, apply: (value: string) => void) => {
    if (entityId && text?.trim()) fields.push({ entityType, entityId, field: name, text, apply })
  }
  const { lodging } = data

  if (refs.welcomeMessage) field('LodgingCustomization', refs.customizationId, 'welcome_message', refs.welcomeMessage, value => { lodging.tagline = value })
  field('LodgingCustomization', refs.customizationId, 'trash_location', lodging.trashLocation, value => { lodging.trashLocation = value })
  lodging.arrivalInstructions.forEach((step, index) => {
    const id = refs.arrivalIds[index]
    field('LodgingArrivalInstruction', id, 'title', step.title, value => { step.title = value })
    field('LodgingArrivalInstruction', id, 'text', step.text, value => { step.text = value })
    field('LodgingArrivalInstruction', id, 'tip', step.tip, value => { step.tip = value })
    // Spec 061 A2 : sous-étapes et repères (JSON), un champ par texte.
    step.substeps.forEach((substep, position) => {
      field('LodgingArrivalInstruction', id, `substeps.${position}.title`, substep.title, value => { substep.title = value })
      field('LodgingArrivalInstruction', id, `substeps.${position}.detail`, substep.detail, value => { substep.detail = value })
    })
    step.facts.forEach((fact, position) => {
      field('LodgingArrivalInstruction', id, `facts.${position}.label`, fact.label, value => { fact.label = value })
      field('LodgingArrivalInstruction', id, `facts.${position}.value`, fact.value, value => { fact.value = value })
    })
  })
  lodging.practicalCards.forEach(card => {
    field('LodgingPracticalBlock', card.id, 'title', card.title, value => { card.title = value })
    field('LodgingPracticalBlock', card.id, 'body', card.description, value => { card.description = value })
  })
  lodging.transportCards.forEach(card => {
    field('CityTransportCard', card.id, 'title', card.title, value => { card.title = value })
    field('CityTransportCard', card.id, 'body', card.body, value => { card.body = value })
    field('CityTransportCard', card.id, 'cta_label', card.cta_label, value => { card.cta_label = value })
  })
  const poiRefs = [
    ...data.pois.map((poi, index) => ({ poi, featured: refs.featuredRows[index] as (typeof refs.featuredRows)[number] | undefined, categoryId: refs.featuredRows[index]?.poi.category.id })),
    ...(data.transportPois ?? []).map((poi, index) => ({ poi, featured: undefined, categoryId: refs.linkedPoiRows[index]?.category.id })),
  ]
  for (const { poi, featured, categoryId } of poiRefs) {
    if (featured?.owner_note?.trim()) field('LodgingFeaturedPoi', featured.id, 'owner_note', featured.owner_note, value => { poi.ownerNote = value })
    field('PointOfInterest', poi.id, 'description', poi.description !== poi.name ? poi.description : null, value => {
      poi.description = value
      poi.shortDescription = shortDescription(value, poi.name)
    })
    field('Category', categoryId, 'name', poi.category.name, value => { poi.category = { ...poi.category, name: value } })
  }

  const missing = await applyEnglishTranslations(fields)
  if (missing.length === 0) return
  try {
    after(() => translateSources(missing, { config: deeplConfigFromEnv(), store: prismaTranslationStore, limit: 100 }))
  } catch {
    // Hors requête (tests, scripts) : la tâche planifiée s'en chargera.
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
    fallback_image: { url: string; deleted_at: Date | null } | null
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

function mapPrivateGuidePoi(row: PrivateGuidePoiRow, mirrorMap: PoiPhotoMirrorMap): GuidePoi {
  const { poi } = row
  const hours = isPoiHours(poi.hours) ? poi.hours : undefined
  const photo = getGuidePoiHeroImage({
    categorySlug: poi.category.slug,
    photos: poi.photos,
    fallbackImageUrl: activeFallbackImageUrl(poi.fallback_image),
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
    // Spec 063 : choix de la photo sur les URL d'origine, puis copies MyStay.
    photos: resolvePoiPhotoList([photo, ...poi.photos.filter(candidate => candidate !== photo)], mirrorMap),
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
