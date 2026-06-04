import { prisma } from '@/shared/lib/prisma'
import type { CategorySummary } from '@/features/city-guide/types'
import type { CategoryWithCount } from '@/features/categories/types'
import {
  filterValidCategoryOrder,
  groupFeaturedPoisByCategory,
  isPoiWithinGuideScope,
} from '../lib/validation'
import type {
  FeaturedPoiInput,
  FeaturedPoiResponse,
  GuideCustomizationErrorCode,
  LodgingCustomizationInput,
  LodgingCustomizationResponse,
  PracticalInfoFields,
} from '../types'
import { GuideCustomizationError, PRACTICAL_INFO_KEYS } from '../types'

const EMPTY_PRACTICAL_INFO: PracticalInfoFields = {
  cover_photo_url: null,
  lodging_address: null,
  wifi_ssid: null,
  wifi_password: null,
  parking_info: null,
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
    acc[key] = typeof value === 'string' && value.trim().length > 0 ? value : null
    return acc
  }, { ...EMPTY_PRACTICAL_INFO })
}

type CustomizableLodging = {
  id: string
  owner_id: string
  city_id: string
  city: { latitude: number; longitude: number }
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

function applyExclusiveCategorySelection<T extends { slug: string; poi_count: number }>(
  categories: T[],
  featuredPois?: FeaturedPublicPoi[],
): T[] {
  if (!featuredPois || featuredPois.length === 0) return categories

  const featuredCountByCategorySlug = new Map<string, number>()
  for (const featuredPoi of featuredPois) {
    featuredCountByCategorySlug.set(
      featuredPoi.category_slug,
      (featuredCountByCategorySlug.get(featuredPoi.category_slug) ?? 0) + 1,
    )
  }

  return categories
    .filter(category => featuredCountByCategorySlug.has(category.slug))
    .map(category => ({
      ...category,
      poi_count: featuredCountByCategorySlug.get(category.slug) ?? category.poi_count,
    }))
}

export function applyCustomizationToCategorySummaries(
  categories: CategorySummary[],
  categoryOrder: string[],
  featuredPois?: FeaturedPublicPoi[],
): CategorySummary[] {
  return applyCategoryOrder(
    applyExclusiveCategorySelection(categories, featuredPois),
    categoryOrder,
  )
}

export function applyCustomizationToCategories(
  categories: CategoryWithCount[],
  categoryOrder: string[],
  featuredPois?: FeaturedPublicPoi[],
): CategoryWithCount[] {
  return applyCategoryOrder(
    applyExclusiveCategorySelection(categories, featuredPois),
    categoryOrder,
  )
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
      lodging_address: true,
      wifi_ssid: true,
      wifi_password: true,
      parking_info: true,
      equipment_info: true,
      checkout_instructions: true,
      trash_info: true,
      trash_location: true,
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
      sort_order: true,
      poi: { select: { category_id: true } },
    },
  })

  return {
    lodging_id: lodgingId,
    welcome_message: customization?.welcome_message ?? null,
    category_order: customization?.category_order ?? [],
    featured_pois: featuredPois.map(featuredPoi => ({
      poi_id: featuredPoi.poi_id,
      category_id: featuredPoi.poi.category_id,
      sort_order: featuredPoi.sort_order,
    })),
    ignored_category_slugs: [],
    ...pickPracticalInfo(customization),
  }
}

export async function saveLodgingCustomization(
  ownerId: string,
  lodgingId: string,
  input: LodgingCustomizationInput,
): Promise<LodgingCustomizationResponse> {
  const lodging = await getOwnedLodgingOrThrow(ownerId, lodgingId)

  const validCategories = await prisma.category.findMany({
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
  })

  const validCategorySlugs = new Set(
    validCategories
      .filter(category => category._count.pois > 0)
      .map(category => category.slug),
  )
  const categoryOrderResult = filterValidCategoryOrder(input.category_order, validCategorySlugs)
  const featuredPois = await validateFeaturedPois(lodging, input.featured_pois)
  const practicalInfo = pickPracticalInfo(input)

  await prisma.$transaction(async tx => {
    await tx.lodgingCustomization.upsert({
      where: { lodging_id: lodgingId },
      update: {
        welcome_message: input.welcome_message ?? null,
        category_order: categoryOrderResult.category_order,
        deleted_at: null,
        ...practicalInfo,
      },
      create: {
        lodging_id: lodgingId,
        welcome_message: input.welcome_message ?? null,
        category_order: categoryOrderResult.category_order,
        ...practicalInfo,
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
          sort_order: featuredPoi.sort_order,
          deleted_at: null,
        },
        create: {
          lodging_id: lodgingId,
          poi_id: featuredPoi.poi_id,
          sort_order: featuredPoi.sort_order,
        },
      })
    }
  })

  return {
    lodging_id: lodgingId,
    welcome_message: input.welcome_message ?? null,
    category_order: categoryOrderResult.category_order,
    featured_pois: featuredPois,
    ignored_category_slugs: categoryOrderResult.ignored_category_slugs,
    ...practicalInfo,
  }
}

async function validateFeaturedPois(
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
      latitude: true,
      longitude: true,
      is_active: true,
      deleted_at: true,
      geocode_status: true,
    },
  })

  if (rows.length !== requestedByPoiId.size) {
    raise('INVALID_FEATURED_POI', 'Un POI selectionne est introuvable')
  }

  const validated = rows.map(row => {
    const requested = requestedByPoiId.get(row.id)
    if (!requested) raise('INVALID_FEATURED_POI', 'Un POI selectionne est invalide')

    const distanceKm = haversineKm(
      lodging.city.latitude,
      lodging.city.longitude,
      row.latitude,
      row.longitude,
    )

    const withinScope = isPoiWithinGuideScope({
      city_id: row.city_id,
      lodging_city_id: lodging.city_id,
      is_active: row.is_active,
      deleted_at: row.deleted_at,
      geocode_status: row.geocode_status,
      distance_km: distanceKm,
    })

    if (!withinScope) {
      raise('INVALID_FEATURED_POI', 'Un POI selectionne est hors perimetre du guide')
    }

    return {
      poi_id: row.id,
      category_id: row.category_id,
      sort_order: requested.sort_order,
    }
  })

  try {
    groupFeaturedPoisByCategory(validated)
  } catch {
    raise('FEATURED_POI_LIMIT_EXCEEDED', 'Maximum 5 POI mis en avant par categorie')
  }

  return validated.sort((a, b) => a.sort_order - b.sort_order)
}
