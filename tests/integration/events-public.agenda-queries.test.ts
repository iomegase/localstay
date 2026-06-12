jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    event: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getCityAgenda, getEventBySlug, cityHasUpcomingEvents, cityHasUpcomingEventsBySlug } from '@/features/events-public/queries/agenda'

const CITY = { id: 'city-1', insee_code: '74056', name: 'Chamonix-Mont-Blanc' }

function dbEvent(over: Record<string, unknown> = {}) {
  return {
    id: 'e1', slug: 'concert-abc', title: 'Concert',
    description: 'desc', event_types: ['cultural'],
    start_date: new Date('2026-07-01'), end_date: new Date('2026-07-01'),
    venue_name: 'Salle', address: '1 rue', commune_name: 'Chamonix-Mont-Blanc',
    images: ['https://img/a.jpg'], website: 'https://x', phone: null, email: null, price_info: null,
    ...over,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(CITY)
  ;(prisma.event.findMany as jest.Mock).mockResolvedValue([dbEvent()])
  ;(prisma.event.findFirst as jest.Mock).mockResolvedValue(dbEvent())
  ;(prisma.event.count as jest.Mock).mockResolvedValue(3)
})

describe('getCityAgenda', () => {
  it('renvoie null si la ville est introuvable', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getCityAgenda('inconnue')).toBeNull()
  })

  it('filtre par ville (city_id OU insee), à venir et actif, trié par date', async () => {
    await getCityAgenda('chamonix-mont-blanc')
    const args = (prisma.event.findMany as jest.Mock).mock.calls[0][0]
    expect(args.where.OR).toEqual([{ city_id: 'city-1' }, { commune_insee: '74056' }])
    expect(args.where.is_active).toBe(true)
    expect(args.where.deleted_at).toBeNull()
    expect(args.where.end_date.gte).toBeInstanceOf(Date)
    expect(args.orderBy).toEqual({ start_date: 'asc' })
  })

  it('mappe les événements vers AgendaListItem avec dateLabel et imageUrl', async () => {
    const res = await getCityAgenda('chamonix-mont-blanc')
    expect(res!.items[0]).toMatchObject({
      id: 'e1', slug: 'concert-abc', title: 'Concert',
      types: ['cultural'], venueName: 'Salle', imageUrl: 'https://img/a.jpg',
    })
    expect(typeof res!.items[0].dateLabel).toBe('string')
  })

  it('expose les facettes de type et applique le filtre type', async () => {
    ;(prisma.event.findMany as jest.Mock).mockResolvedValue([
      dbEvent({ id: 'a', event_types: ['cultural'] }),
      dbEvent({ id: 'b', event_types: ['sport'] }),
    ])
    const res = await getCityAgenda('chamonix-mont-blanc', { type: 'sport' })
    expect(res!.facets.map((f) => f.type).sort()).toEqual(['cultural', 'sport'])
    expect(res!.items.every((i) => i.types.includes('sport'))).toBe(true)
    expect(res!.items).toHaveLength(1)
  })
})

describe('getEventBySlug', () => {
  it('renvoie null si la ville est introuvable', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getEventBySlug('x', 'y')).toBeNull()
  })
  it('renvoie null si aucun événement ne correspond', async () => {
    ;(prisma.event.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await getEventBySlug('chamonix-mont-blanc', 'inconnu')).toBeNull()
  })
  it('mappe vers AgendaEventDetail', async () => {
    const res = await getEventBySlug('chamonix-mont-blanc', 'concert-abc')
    expect(res).toMatchObject({ id: 'e1', slug: 'concert-abc', title: 'Concert', website: 'https://x' })
    const args = (prisma.event.findFirst as jest.Mock).mock.calls[0][0]
    expect(args.where.slug).toBe('concert-abc')
    expect(args.where.OR).toEqual([{ city_id: 'city-1' }, { commune_insee: '74056' }])
  })
})

describe('cityHasUpcomingEvents', () => {
  it('vrai quand le compteur est > 0', async () => {
    expect(await cityHasUpcomingEvents('city-1', '74056')).toBe(true)
  })
  it('faux quand le compteur est 0', async () => {
    ;(prisma.event.count as jest.Mock).mockResolvedValue(0)
    expect(await cityHasUpcomingEvents('city-1', '74056')).toBe(false)
  })
})

describe('cityHasUpcomingEventsBySlug', () => {
  it('résout la ville par slug puis compte (scope city_id OU insee)', async () => {
    expect(await cityHasUpcomingEventsBySlug('chamonix-mont-blanc')).toBe(true)
    const args = (prisma.event.count as jest.Mock).mock.calls[0][0]
    expect(args.where.OR).toEqual([{ city_id: 'city-1' }, { commune_insee: '74056' }])
  })
  it('faux si la ville est introuvable (aucun count lancé)', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    expect(await cityHasUpcomingEventsBySlug('inconnue')).toBe(false)
    expect(prisma.event.count as jest.Mock).not.toHaveBeenCalled()
  })
})
