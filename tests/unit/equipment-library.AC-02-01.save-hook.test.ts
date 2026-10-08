const mockCreateMany = jest.fn()
const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  lodgingArrivalInstruction: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
}

const mockGeocodeAddress = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    lodgingArrivalInstruction: { findMany: jest.fn() },
    equipmentTemplate: { createMany: (...args: unknown[]) => mockCreateMany(...args) },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'

describe('spec 095 AC-02-01 — l’enregistrement du guide alimente la bibliothèque', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({ id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1', city: { latitude: 45, longitude: 6 } } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingArrivalInstruction.findMany).mockResolvedValue([] as never)
    tx.lodgingPracticalBlock.findMany.mockResolvedValue([])
    tx.lodgingArrivalInstruction.findMany.mockResolvedValue([])
  })

  const save = () => saveLodgingCustomization('owner-1', 'lodging-1', {
    category_order: [],
    featured_pois: [],
    practical_blocks: [
      { title: 'Machine à café', body: 'Nespresso', icon: 'info', photo_url: 'https://cdn.test/cafe.jpg', sort_order: 0 },
      { title: 'Tri des déchets', body: 'Local', icon: 'recycle', photo_url: null, sort_order: 1 },
    ],
  })

  it('les équipements enregistrés sont proposés « à valider » (sans photo, sans tri des déchets)', async () => {
    mockCreateMany.mockResolvedValue({ count: 1 })
    await save()
    expect(mockCreateMany).toHaveBeenCalledWith({
      data: [{ title: 'Machine à café', title_key: 'machine a cafe', icon: 'info', body: 'Nespresso', source_lodging_id: 'lodging-1' }],
      skipDuplicates: true,
    })
  })

  it('un échec de la bibliothèque ne bloque jamais l’enregistrement', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockCreateMany.mockRejectedValue(new Error('base indisponible'))
    await expect(save()).resolves.toMatchObject({ lodging_id: 'lodging-1' })
    expect(consoleError).toHaveBeenCalledWith('[equipment-library] capture failed', 'base indisponible')
    consoleError.mockRestore()
  })
})
