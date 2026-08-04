const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { updateMany: jest.fn(), createMany: jest.fn() },
  lodgingArrivalInstruction: { updateMany: jest.fn(), createMany: jest.fn() },
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
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

jest.mock('@/features/geocoding/services/mapbox-client', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'

describe('saveLodgingCustomization — arrival instructions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1',
      owner_id: 'owner-1',
      city_id: 'city-1',
      city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingArrivalInstruction.findMany).mockResolvedValue([
      { id: 'i1', text: 'Ouvrez le portail', video_url: null, photos: ['a.jpg'], sort_order: 0 },
    ] as never)
  })

  it('soft-deletes existing instructions then recreates one row per normalized instruction', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      arrival_instructions: [
        { text: '  Ouvrez le portail  ', video_url: null, photos: ['a.jpg', ''], sort_order: 5 },
        { text: '', video_url: null, photos: [], sort_order: 1 },
      ],
    })

    expect(tx.lodgingArrivalInstruction.updateMany).toHaveBeenCalledWith({
      where: { lodging_id: 'lodging-1', deleted_at: null },
      data: { deleted_at: expect.any(Date) },
    })
    expect(tx.lodgingArrivalInstruction.createMany).toHaveBeenCalledWith({
      data: [
        {
          lodging_id: 'lodging-1',
          text: 'Ouvrez le portail',
          video_url: null,
          photos: ['a.jpg'],
          sort_order: 0,
        },
      ],
    })
    expect(result.arrival_instructions).toEqual([
      { id: 'i1', text: 'Ouvrez le portail', video_url: null, photos: ['a.jpg'], sort_order: 0 },
    ])
  })
})
