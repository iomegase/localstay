import { prisma } from '@/shared/lib/prisma'
import type { CityTransportCardsInput } from '../schemas'
import { isFacilibusCity } from '../facilibus'

export type CityTransportCardRow = {
  id: string
  title: string
  tag: string | null
  body: string
  details: string | null
  image_url: string | null
  external_url: string | null
  cta_label: string | null
  poi_id: string | null
  service_key: string | null
  is_free: boolean
  sort_order: number
}

const CARD_SELECT = { id: true, title: true, tag: true, body: true, details: true, image_url: true, external_url: true, cta_label: true, poi_id: true, service_key: true, is_free: true, sort_order: true } as const

export class CityTransportCardsError extends Error {
  constructor(public code: 'CITY_NOT_FOUND' | 'INVALID_CARD_ID' | 'INVALID_POI_ID' | 'INVALID_SERVICE_KEY', public status: number, message: string) {
    super(message)
  }
}

async function cityIdOrThrow(slug: string): Promise<string> {
  const city = await prisma.city.findFirst({ where: { slug, deleted_at: null }, select: { id: true } })
  if (!city) throw new CityTransportCardsError('CITY_NOT_FOUND', 404, 'Ville introuvable.')
  return city.id
}

export async function listCityTransportCards(cityId: string): Promise<CityTransportCardRow[]> {
  return prisma.cityTransportCard.findMany({
    where: { city_id: cityId, deleted_at: null },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    select: CARD_SELECT,
  })
}

export async function getCityTransportCards(slug: string): Promise<CityTransportCardRow[]> {
  return listCityTransportCards(await cityIdOrThrow(slug))
}

export async function getCityTransportPoiOptions(slug: string): Promise<{ id: string; name: string }[]> {
  const cityId = await cityIdOrThrow(slug)
  return prisma.pointOfInterest.findMany({
    where: { city_id: cityId, deleted_at: null, is_active: true, discovery_status: 'PUBLISHED' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })
}

/** Remplace la liste ordonnée (mise à jour, création, soft delete — spec 055 BR-06). */
export async function saveCityTransportCards(
  slug: string,
  input: CityTransportCardsInput,
): Promise<CityTransportCardRow[]> {
  const cityId = await cityIdOrThrow(slug)

  const shuttleCards = input.cards.filter(card => card.service_key === 'facilibus')
  if (shuttleCards.length > 1 || (shuttleCards.length > 0 && !isFacilibusCity(slug))) {
    throw new CityTransportCardsError('INVALID_SERVICE_KEY', 400, 'Une seule carte Facilibus est autorisée dans une ville desservie.')
  }

  const poiIds = [...new Set(input.cards.flatMap(card => card.poi_id ? [card.poi_id] : []))]
  if (poiIds.length > 0) {
    const count = await prisma.pointOfInterest.count({
      where: { id: { in: poiIds }, city_id: cityId, deleted_at: null, is_active: true, discovery_status: 'PUBLISHED' },
    })
    if (count !== poiIds.length) throw new CityTransportCardsError('INVALID_POI_ID', 400, 'Point d’intérêt introuvable dans cette ville.')
  }

  await prisma.$transaction(async tx => {
    const existing = await tx.cityTransportCard.findMany({
      where: { city_id: cityId, deleted_at: null },
      select: { id: true },
    })
    const existingIds = new Set(existing.map(card => card.id))
    const keptIds = input.cards.flatMap(card => (card.id ? [card.id] : []))
    if (keptIds.some(id => !existingIds.has(id))) {
      throw new CityTransportCardsError('INVALID_CARD_ID', 400, 'Carte inconnue pour cette ville.')
    }

    for (const [index, card] of input.cards.entries()) {
      const data = {
        title: card.title, tag: card.tag ?? null, body: card.body,
        details: card.details || null, image_url: card.image_url || null,
        external_url: card.external_url || null, cta_label: card.cta_label || null,
        poi_id: card.poi_id || null, service_key: card.service_key || null,
        is_free: card.is_free ?? (card.service_key === 'facilibus'), sort_order: index,
      }
      if (card.id) await tx.cityTransportCard.update({ where: { id: card.id }, data })
      else await tx.cityTransportCard.create({ data: { city_id: cityId, ...data } })
    }

    const removed = [...existingIds].filter(id => !keptIds.includes(id))
    if (removed.length > 0) {
      await tx.cityTransportCard.updateMany({
        where: { city_id: cityId, deleted_at: null, id: { in: removed } },
        data: { deleted_at: new Date() },
      })
    }
  })

  return listCityTransportCards(cityId)
}
