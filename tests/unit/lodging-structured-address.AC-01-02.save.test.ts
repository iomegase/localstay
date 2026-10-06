const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  lodgingArrivalInstruction: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
}

const mockGeocode = jest.fn()
jest.mock('@/features/geocoding/services/mapbox-client', () => ({ geocodeAddress: (...args: unknown[]) => mockGeocode(...args) }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    lodgingArrivalInstruction: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getLodgingCustomization, saveLodgingCustomization } from '@/features/guide-customization/queries/customization'

// Spec 080 — recomposition et reprise de l'adresse.
describe('080 — adresse structurée (requêtes)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.89, longitude: 6.71 },
    } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingFeaturedPoi.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingArrivalInstruction.findMany).mockResolvedValue([] as never)
    tx.lodgingPracticalBlock.findMany.mockResolvedValue([])
    tx.lodgingArrivalInstruction.findMany.mockResolvedValue([])
    mockGeocode.mockResolvedValue(null)
  })

  it('AC-01-02 : les parties sont enregistrées et l’adresse complète recomposée', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [], featured_pois: [],
      lodging_address: 'ancienne valeur ignorée',
      address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains',
    })

    const create = jest.mocked(tx.lodgingCustomization.upsert).mock.calls[0][0].create
    expect(create).toMatchObject({
      lodging_address: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains',
      address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains',
    })
    expect(result.lodging_address).toBe('12 rue des Alpages, 74170 Saint-Gervais-les-Bains')
  })

  it('AC-01-03 : une ancienne adresse libre est découpée à la lecture', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      category_order: [], lodging_address: '5 chemin du Bettex, 74170 Saint-Gervais-les-Bains',
      address_number: null, address_street: null, address_postal_code: null, address_city: null,
    } as never)

    const result = await getLodgingCustomization('owner-1', 'lodging-1')

    expect(result).toMatchObject({
      address_number: '5', address_street: 'chemin du Bettex', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains',
    })
  })
})
