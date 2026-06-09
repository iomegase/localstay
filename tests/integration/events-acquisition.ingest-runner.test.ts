jest.mock('@/features/events-acquisition/lib/datatourisme-client', () => ({
  fetchEventsNear: jest.fn(),
}))
jest.mock('@/features/events-acquisition/lib/commune-geo', () => ({
  resolveCommune: jest.fn(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findMany: jest.fn() },
    event: { upsert: jest.fn(), deleteMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { fetchEventsNear } from '@/features/events-acquisition/lib/datatourisme-client'
import { resolveCommune } from '@/features/events-acquisition/lib/commune-geo'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

const FUTURE = '2999-01-01'
const PAST = '2000-01-01'

function ev(uuid: string, insee: string, name: string, end = FUTURE): Record<string, unknown> {
  return {
    uuid,
    label: { '@fr': `Event ${uuid}` },
    type: ['EntertainmentAndEvent', 'CulturalEvent'],
    takesPlaceAt: [{ startDate: '2026-07-01', endDate: end }],
    isLocatedAt: [{ geo: { latitude: 45, longitude: 6 }, address: [{ hasAddressCity: { insee, label: { '@fr': name } } }] }],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
  ;(prisma.event.upsert as jest.Mock).mockResolvedValue({})
  // default: no city targets, no INSEE match
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([])
  ;(resolveCommune as jest.Mock).mockResolvedValue(null)
  ;(fetchEventsNear as jest.Mock).mockResolvedValue([])
})

describe('runEventIngestion (API REST v1)', () => {
  it('admin: résout la commune, interroge geo_distance avec le rayon, upsert + lie city_id', async () => {
    ;(resolveCommune as jest.Mock).mockResolvedValue({ insee: '74056', name: 'Chamonix', latitude: 45.92, longitude: 6.86 })
    ;(fetchEventsNear as jest.Mock).mockResolvedValue([
      ev('A', '74056', 'Chamonix-Mont-Blanc'),
      ev('B', '74056', 'Chamonix-Mont-Blanc', PAST),
    ])
    ;(prisma.city.findMany as jest.Mock).mockImplementation((args: { where?: { insee_code?: { in?: string[] } } }) =>
      args?.where?.insee_code?.in ? Promise.resolve([{ id: 'city-cha', insee_code: '74056' }]) : Promise.resolve([]),
    )

    const r = await runEventIngestion({ communeFilter: 'chamonix', radiusKm: 15, source: 'admin' })

    expect(resolveCommune).toHaveBeenCalledWith('chamonix')
    expect(fetchEventsNear).toHaveBeenCalledWith(expect.objectContaining({ latitude: 45.92, longitude: 6.86, radiusKm: 15 }))
    expect(r.fetched).toBe(2)
    expect(r.matched).toBe(1) // B exclu (terminé)
    expect(r.upserted).toBe(1)
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBe('city-cha')
    expect(call.where).toEqual({ source_source_id: { source: 'datatourisme', source_id: 'A' } })
  })

  it('admin: commune introuvable → aucun appel API, résumé vide', async () => {
    ;(resolveCommune as jest.Mock).mockResolvedValue(null)
    const r = await runEventIngestion({ communeFilter: 'zzz', source: 'admin' })
    expect(fetchEventsNear).not.toHaveBeenCalled()
    expect(r.fetched).toBe(0)
    expect(r.upserted).toBe(0)
  })

  it('cron: interroge chaque ville suivie et déduplique par identifiant', async () => {
    ;(prisma.city.findMany as jest.Mock).mockImplementation((args: { where?: { insee_code?: { in?: string[] } } }) =>
      args?.where?.insee_code?.in
        ? Promise.resolve([])
        : Promise.resolve([
            { latitude: 45.9, longitude: 6.8 },
            { latitude: 45.8, longitude: 6.7 },
          ]),
    )
    ;(fetchEventsNear as jest.Mock)
      .mockResolvedValueOnce([ev('A', '74056', 'Chamonix')])
      .mockResolvedValueOnce([ev('A', '74056', 'Chamonix'), ev('C', '74236', 'Saint-Gervais')])

    const r = await runEventIngestion({ source: 'cron' })

    expect(fetchEventsNear).toHaveBeenCalledTimes(2)
    expect(r.fetched).toBe(3) // brut
    expect(r.matched).toBe(2) // A dédupliqué + C
    expect(r.upserted).toBe(2)
  })

  it('utilise le rayon par défaut (10 km) si non fourni', async () => {
    ;(resolveCommune as jest.Mock).mockResolvedValue({ insee: '74056', name: 'C', latitude: 1, longitude: 2 })
    await runEventIngestion({ communeFilter: 'c', source: 'admin' })
    expect(fetchEventsNear).toHaveBeenCalledWith(expect.objectContaining({ radiusKm: 10 }))
  })

  it('city_id null si aucune City ne correspond à l’INSEE', async () => {
    ;(resolveCommune as jest.Mock).mockResolvedValue({ insee: '74999', name: 'X', latitude: 1, longitude: 2 })
    ;(fetchEventsNear as jest.Mock).mockResolvedValue([ev('Z', '74999', 'Village')])
    const r = await runEventIngestion({ communeFilter: '74999', source: 'admin' })
    expect(r.upserted).toBe(1)
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBeNull()
    expect(call.create.commune_insee).toBe('74999')
  })

  it('supprime les événements périmés', async () => {
    ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 4 })
    const r = await runEventIngestion({ source: 'cron' })
    expect(prisma.event.deleteMany).toHaveBeenCalled()
    expect(r.deleted).toBe(4)
  })
})
