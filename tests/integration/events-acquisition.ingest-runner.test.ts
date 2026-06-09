jest.mock('@/features/events-acquisition/lib/datatourisme-client', () => ({
  fetchFluxObjects: jest.fn(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findUnique: jest.fn(), findMany: jest.fn() },
    event: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { fetchFluxObjects } from '@/features/events-acquisition/lib/datatourisme-client'
import { runEventIngestion } from '@/features/events-acquisition/services/ingest-runner'

const FUTURE = '2999-01-01'
const PAST = '2000-01-01'

function obj(id: string, insee: string, name: string, end = FUTURE): Record<string, unknown> {
  return {
    'dc:identifier': id,
    '@type': ['schema:Event', 'CulturalEvent'],
    'rdfs:label': { '@language': 'fr', '@value': `Event ${id}` },
    takesPlaceAt: [{ startDate: '2026-07-01', endDate: end }],
    isLocatedAt: [{ 'schema:address': [{ hasAddressCity: { insee, 'rdfs:label': { '@language': 'fr', '@value': name } } }] }],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
  ;(prisma.event.findMany as jest.Mock).mockResolvedValue([])
  ;(prisma.city.findMany as jest.Mock).mockResolvedValue([])
  ;(prisma.city.findUnique as jest.Mock).mockResolvedValue(null)
  ;(prisma.event.upsert as jest.Mock).mockResolvedValue({})
})

describe('runEventIngestion', () => {
  it('exclut les événements déjà terminés', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74236', 'Saint-Gervais-les-Bains', FUTURE),
      obj('B', '74236', 'Saint-Gervais-les-Bains', PAST),
    ])
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([{ insee_code: '74236' }])
    const r = await runEventIngestion({ source: 'cron' })
    expect(r.fetched).toBe(1)
    expect(r.upserted).toBe(1)
  })

  it('cron: ne traite que les communes suivies (City.insee_code ∪ events existants)', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74236', 'Saint-Gervais-les-Bains'),
      obj('B', '74256', 'Sallanches'),
    ])
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([{ insee_code: '74236' }])
    const r = await runEventIngestion({ source: 'cron' })
    expect(r.matched).toBe(1)
    expect(r.skipped).toBe(1)
    expect(prisma.event.upsert).toHaveBeenCalledTimes(1)
  })

  it('admin: filtre par commune et lie city_id quand la City existe', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([
      obj('A', '74056', 'Chamonix-Mont-Blanc'),
      obj('B', '74236', 'Saint-Gervais-les-Bains'),
    ])
    ;(prisma.city.findUnique as jest.Mock).mockResolvedValue({ id: 'city-cha' })
    const r = await runEventIngestion({ communeFilter: 'chamonix', source: 'admin' })
    expect(r.matched).toBe(1)
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBe('city-cha')
    expect(call.where).toEqual({ source_source_id: { source: 'datatourisme', source_id: 'A' } })
  })

  it("city_id null si aucune City ne correspond à l'INSEE", async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([obj('B', '74256', 'Sallanches')])
    ;(prisma.city.findUnique as jest.Mock).mockResolvedValue(null)
    await runEventIngestion({ communeFilter: '74256', source: 'admin' })
    const call = (prisma.event.upsert as jest.Mock).mock.calls[0][0]
    expect(call.create.city_id).toBeNull()
    expect(call.create.commune_insee).toBe('74256')
  })

  it('supprime les événements périmés', async () => {
    ;(fetchFluxObjects as jest.Mock).mockResolvedValue([])
    ;(prisma.event.deleteMany as jest.Mock).mockResolvedValue({ count: 4 })
    const r = await runEventIngestion({ source: 'cron' })
    expect(prisma.event.deleteMany).toHaveBeenCalled()
    expect(r.deleted).toBe(4)
  })
})
