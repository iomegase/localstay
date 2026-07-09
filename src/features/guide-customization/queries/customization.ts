import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import type { CategorySummary } from '@/features/city-guide/types'
import type { CategoryWithCount } from '@/features/categories/types'
import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import { validateGeocode } from '@/features/geocoding/services/geo-validator'
import {
  countWords,
  filterValidCategoryOrder,
  groupFeaturedPoisByCategory,
  normalizeOwnerNote,
  normalizePracticalBlocks,
  normalizeTrashBins,
  OWNER_NOTE_MAX_WORDS,
} from '../lib/validation'
import type {
  FeaturedPoiInput,
  FeaturedPoiResponse,
  GuideCustomizationErrorCode,
  LodgingCustomizationInput,
  LodgingCustomizationResponse,
  PracticalBlockResponse,
  PracticalInfoFields,
  TrashBin,
} from '../types'
import { GuideCustomizationError, PRACTICAL_INFO_KEYS } from '../types'

const EMPTY_PRACTICAL_INFO: PracticalInfoFields = {
  cover_photo_url: null,
  presentation_video_url: null,
  lodging_address: null,
  wifi_ssid: null,
  wifi_password: null,
  parking_info: null,
  parking_photo_url: null,
  parking_video_url: null,
  equipment_info: null,
  checkout_instructions: null,
  trash_info: null,
  trash_location: null,
  house_rules: null,
  emergency_contacts: null,
  useful_services: null,
}

function pickPracticalInfo(source: Partial<PracticalInfoFields> | null | undefined): PracticalInfoFields {
  if (!source) return { ...EMPTY_PRACTICAL_INFO }
  return PRACTICAL_INFO_KEYS.reduce<PracticalInfoFields>((acc, key) => {
    const value = source[key]
    if (typeof value !== 'string') {
      acc[key] = null
      return acc
    }
    const trimmed = value.trim()
    acc[key] = trimmed.length > 0 ? trimmed : null
    return acc
  }, { ...EMPTY_PRACTICAL_INFO })
}

type CustomizableLodging = {
  id: string
  owner_id: string
  city_id: string
  city: { latitude: number; longitude: number }
}

type StoredLodgingAddressCoordinates = {
  lodging_address: string | null
  lodging_latitude: number | null
  lodging_longitude: number | null
}

type LodgingAddressCoordinates = {
  lodging_latitude: number | null
  lodging_longitude: number | null
}

type PublicCustomization = {
  welcome_message: string | null
  category_order: string[]
  featured_pois: Array<{
    poi_id: string
    sort_order: number
    category_slug: string
  }>
}

function raise(code: GuideCustomizationErrorCode, message: string): never {
  throw new GuideCustomizationError(code, message)
}

async function resolveLodgingAddressCoordinates(
  address: string | null,
  existing: StoredLodgingAddressCoordinates | null,
  cityCenter: { latitude: number; longitude: number },
): Promise<LodgingAddressCoordinates> {
  if (!address) {
    return { lodging_latitude: null, lodging_longitude: null }
  }

  if (
    existing?.lodging_address === address &&
    typeof existing.lodging_latitude === 'number' &&
    typeof existing.lodging_longitude === 'number'
  ) {
    return {
      lodging_latitude: existing.lodging_latitude,
      lodging_longitude: existing.lodging_longitude,
    }
  }

  try {
    const result = await geocodeAddress(address, {
      latitude: cityCenter.latitude,
      longitude: cityCenter.longitude,
    })
    if (!result) {
      return { lodging_latitude: null, lodging_longitude: null }
    }

    const validation = validateGeocode(result, cityCenter)
    if (!validation.valid) {
      return { lodging_latitude: null, lodging_longitude: null }
    }

    return {
      lodging_latitude: result.latitude,
      lodging_longitude: result.longitude,
    }
  } catch {
    return { lodging_latitude: null, lodging_longitude: null }
  }
}

async function getOwnedLodgingOrThrow(ownerId: string, lodgingId: string): Promise<CustomizableLodging> {
  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null },
    select: {
      id: true,
      owner_id: true,
      city_id: true,
      city: { select: { latitude: true, longitude: true } },
    },
  })

  if (!lodging) raise('NOT_FOUND', 'Logement introuvable')
  if (lodging.owner_id !== ownerId) raise('FORBIDDEN', 'Ce logement appartient a un autre hebergeur')
  return lodging
}

function applyCategoryOrder<T extends { slug: string; sort_order: number }>(
  categories: T[],
  categoryOrder: string[],
): T[] {
  if (categoryOrder.length === 0) return categories

  const rank = new Map(categoryOrder.map((slug, index) => [slug, index]))
  return [...categories].sort((a, b) => {
    const rankA = rank.get(a.slug)
    const rankB = rank.get(b.slug)
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB
    if (rankA !== undefined) return -1
    if (rankB !== undefined) return 1
    return a.sort_order - b.sort_order
  })
}

type FeaturedPublicPoi = PublicCustomization['featured_pois'][number]

export function applyCustomizationToCategorySummaries(
  categories: CategorySummary[],
  categoryOrder: string[],
  _featuredPois?: FeaturedPublicPoi[],
): CategorySummary[] {
  return applyCategoryOrder(categories, categoryOrder)
}

export function applyCustomizationToCategories(
  categories: CategoryWithCount[],
  categoryOrder: string[],
  _featuredPois?: FeaturedPublicPoi[],
): CategoryWithCount[] {
  return applyCategoryOrder(categories, categoryOrder)
}

export async function getPublicCustomization(
  cityId: string,
  lodgingId?: string,
): Promise<PublicCustomization | null> {
  if (!lodgingId) return null

  const lodging = await prisma.lodging.findFirst({
    where: {
      id: lodgingId,
      city_id: cityId,
      deleted_at: null,
      is_active: true,
    },
    select: {
      id: true,
    },
  })

  if (!lodging) return null

  const [customization, featuredPois] = await Promise.all([
    prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodging.id, deleted_at: null },
      select: { welcome_message: true, category_order: true },
    }),
    prisma.lodgingFeaturedPoi.findMany({
      where: { lodging_id: lodging.id, deleted_at: null },
      select: {
        poi_id: true,
        sort_order: true,
        poi: { select: { category: { select: { slug: true } } } },
      },
    }),
  ])

  return {
    welcome_message: customization?.welcome_message ?? null,
    category_order: customization?.category_order ?? [],
    featured_pois: featuredPois.map(featuredPoi => ({
      poi_id: featuredPoi.poi_id,
      sort_order: featuredPoi.sort_order,
      category_slug: featuredPoi.poi.category.slug,
    })),
  }
}

export async function getLodgingCustomization(
  ownerId: string,
  lodgingId: string,
): Promise<LodgingCustomizationResponse> {
  await getOwnedLodgingOrThrow(ownerId, lodgingId)

  const customization = await prisma.lodgingCustomization.findFirst({
    where: { lodging_id: lodgingId, deleted_at: null },
    select: {
      welcome_message: true,
      category_order: true,
      cover_photo_url: true,
      presentation_video_url: true,
      lodging_address: true,
      wifi_ssid: true,
      wifi_password: true,
      parking_info: true,
      parking_photo_url: true,
      parking_video_url: true,
      equipment_info: true,
      checkout_instructions: true,
      trash_info: true,
      trash_location: true,
      trash_bins: true,
      house_rules: true,
      emergency_contacts: true,
      useful_services: true,
    },
  })

  const featuredPois = await prisma.lodgingFeaturedPoi.findMany({
    where: { lodging_id: lodgingId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: {
      poi_id: true,
      owner_note: true,
      sort_order: true,
      poi: { select: { category_id: true } },
    },
  })

  const practicalBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, video_url: true, sort_order: true },
  })

  return {
    lodging_id: lodgingId,
    welcome_message: customization?.welcome_message ?? null,
    category_order: customization?.category_order ?? [],
    featured_pois: featuredPois.map(featuredPoi => ({
      poi_id: featuredPoi.poi_id,
      category_id: featuredPoi.poi.category_id,
      owner_note: featuredPoi.owner_note,
      sort_order: featuredPoi.sort_order,
    })),
    ignored_category_slugs: [],
    practical_blocks: practicalBlocks,
    trash_bins: (customization?.trash_bins as unknown as TrashBin[] | null) ?? [],
    ...pickPracticalInfo(customization),
  }
}

export async function saveLodgingCustomization(
  ownerId: string,
  lodgingId: string,
  input: LodgingCustomizationInput,
): Promise<LodgingCustomizationResponse> {
  const lodging = await getOwnedLodgingOrThrow(ownerId, lodgingId)

  const [validCategories, existingCustomization] = await Promise.all([
    prisma.category.findMany({
      where: { deleted_at: null, is_active: true },
      orderBy: { sort_order: 'asc' },
      select: {
        slug: true,
        _count: {
          select: {
            pois: {
              where: {
                city_id: lodging.city_id,
                deleted_at: null,
                is_active: true,
              },
            },
          },
        },
      },
    }),
    prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodgingId, deleted_at: null },
      select: {
        lodging_address: true,
        lodging_latitude: true,
        lodging_longitude: true,
      },
    }),
  ])

  const validCategorySlugs = new Set(
    validCategories
      .filter(category => category._count.pois > 0)
      .map(category => category.slug),
  )
  const categoryOrderResult = filterValidCategoryOrder(input.category_order, validCategorySlugs)
  const featuredPois = await validateFeaturedPois(lodging, input.featured_pois)
  const practicalInfo = pickPracticalInfo(input)
  const lodgingAddressCoordinates = await resolveLodgingAddressCoordinates(
    practicalInfo.lodging_address,
    existingCustomization,
    lodging.city,
  )
  const practicalBlocks = normalizePracticalBlocks(input.practical_blocks)
  const trashBins = normalizeTrashBins(input.trash_bins)
  const trashBinsJson = trashBins as unknown as Prisma.InputJsonValue

  await prisma.$transaction(async tx => {
    await tx.lodgingCustomization.upsert({
      where: { lodging_id: lodgingId },
      update: {
        welcome_message: input.welcome_message ?? null,
        category_order: categoryOrderResult.category_order,
        deleted_at: null,
        trash_bins: trashBinsJson,
        ...practicalInfo,
        ...lodgingAddressCoordinates,
      },
      create: {
        lodging_id: lodgingId,
        welcome_message: input.welcome_message ?? null,
        category_order: categoryOrderResult.category_order,
        trash_bins: trashBinsJson,
        ...practicalInfo,
        ...lodgingAddressCoordinates,
      },
    })

    await tx.lodgingFeaturedPoi.updateMany({
      where: { lodging_id: lodgingId, deleted_at: null },
      data: { deleted_at: new Date() },
    })

    for (const featuredPoi of featuredPois) {
      await tx.lodgingFeaturedPoi.upsert({
        where: { lodging_id_poi_id: { lodging_id: lodgingId, poi_id: featuredPoi.poi_id } },
        update: {
          owner_note: featuredPoi.owner_note,
          sort_order: featuredPoi.sort_order,
          deleted_at: null,
        },
        create: {
          lodging_id: lodgingId,
          poi_id: featuredPoi.poi_id,
          owner_note: featuredPoi.owner_note,
          sort_order: featuredPoi.sort_order,
        },
      })
    }

    await tx.lodgingPracticalBlock.updateMany({
      where: { lodging_id: lodgingId, deleted_at: null },
      data: { deleted_at: new Date() },
    })

    for (const block of practicalBlocks) {
      await tx.lodgingPracticalBlock.create({
        data: {
          lodging_id: lodgingId,
          title: block.title,
          body: block.body,
          icon: block.icon,
          photo_url: block.photo_url,
          video_url: block.video_url,
          sort_order: block.sort_order,
        },
      })
    }
  })

  const savedBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, video_url: true, sort_order: true },
  })

  return {
    lodging_id: lodgingId,
    welcome_message: input.welcome_message ?? null,
    category_order: categoryOrderResult.category_order,
    featured_pois: featuredPois,
    ignored_category_slugs: categoryOrderResult.ignored_category_slugs,
    practical_blocks: savedBlocks,
    trash_bins: trashBins,
    ...practicalInfo,
  }
}

const FEATURED_POI_LIMIT_PER_OTHER_CITY = 5

export async function validateFeaturedPois(
  lodging: CustomizableLodging,
  featuredPois: FeaturedPoiInput[],
): Promise<FeaturedPoiResponse[]> {
  if (featuredPois.length === 0) return []

  const requestedByPoiId = new Map<string, FeaturedPoiInput>()
  for (const featuredPoi of featuredPois) {
    requestedByPoiId.set(featuredPoi.poi_id, featuredPoi)
  }

  const rows = await prisma.pointOfInterest.findMany({
    where: { id: { in: [...requestedByPoiId.keys()] } },
    select: {
      id: true,
      city_id: true,
      category_id: true,
      is_active: true,
      deleted_at: true,
    },
  })

  if (rows.length !== requestedByPoiId.size) {
    raise('INVALID_FEATURED_POI', 'Un POI selectionne est introuvable')
  }

  const validated = rows.map(row => {
    const requested = requestedByPoiId.get(row.id)
    if (!requested) raise('INVALID_FEATURED_POI', 'Un POI selectionne est invalide')
    if (row.deleted_at !== null || !row.is_active) {
      raise('INVALID_FEATURED_POI', 'Un POI selectionne est indisponible')
    }

    const ownerNote = normalizeOwnerNote(requested.owner_note)
    if (ownerNote !== null && countWords(ownerNote) > OWNER_NOTE_MAX_WORDS) {
      raise('INVALID_FEATURED_POI', 'Le commentaire Owner depasse 300 mots')
    }

    return {
      poi_id: row.id,
      category_id: row.category_id,
      owner_note: ownerNote,
      sort_order: requested.sort_order,
      city_id: row.city_id,
    }
  })

  // Bucket local → max 5 par catégorie (règle inchangée).
  const localForLimit = validated
    .filter(item => item.city_id === lodging.city_id)
    .map(({ city_id: _city_id, ...rest }) => rest)
  try {
    groupFeaturedPoisByCategory(localForLimit)
  } catch {
    raise('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI mis en avant par categorie')
  }

  // Bucket ailleurs → max 5 par ville (toutes catégories confondues).
  const otherCityCount = new Map<string, number>()
  for (const item of validated) {
    if (item.city_id === lodging.city_id) continue
    const next = (otherCityCount.get(item.city_id) ?? 0) + 1
    otherCityCount.set(item.city_id, next)
    if (next > FEATURED_POI_LIMIT_PER_OTHER_CITY) {
      raise('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI recommandes par ville')
    }
  }

  return validated
    .map(({ city_id: _city_id, ...rest }) => rest)
    .sort((a, b) => a.sort_order - b.sort_order)
}
