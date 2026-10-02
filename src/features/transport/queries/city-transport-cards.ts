import { prisma } from '@/shared/lib/prisma'
import type { CityTransportCardsInput } from '../schemas'

export type CityTransportCardRow = {
  id: string
  title: string
  tag: string | null
  body: string
  sort_order: number
}

const CARD_SELECT = { id: true, title: true, tag: true, body: true, sort_order: true } as const

export class CityTransportCardsError extends Error {
  constructor(public code: 'CITY_NOT_FOUND' | 'INVALID_CARD_ID', public status: number, message: string) {
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

/** Remplace la liste ordonnée (mise à jour, création, soft delete — spec 055 BR-06). */
export async function saveCityTransportCards(
  slug: string,
  input: CityTransportCardsInput,
): Promise<CityTransportCardRow[]> {
  const cityId = await cityIdOrThrow(slug)

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
      const data = { title: card.title, tag: card.tag ?? null, body: card.body, sort_order: index }
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
