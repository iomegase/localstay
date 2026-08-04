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
import { GuideCustomizationError } from '@/features/guide-customization/types'

describe('saveLodgingCustomization — practical blocks', () => {
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
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      {
        id: 'poi-1',
        city_id: 'city-1',
        category_id: 'cat-1',
        latitude: 45,
        longitude: 6,
        is_active: true,
        deleted_at: null,
        geocode_status: 'success',
      },
    ] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ] as never)
    jest.mocked(prisma.lodgingArrivalInstruction.findMany).mockResolvedValue([] as never)
  })

  it('soft-deletes existing blocks then recreates one row per normalized block', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      practical_blocks: [
        { title: '  La plage  ', body: 'À 5 min', icon: 'star', photo_url: '', sort_order: 7 },
        { title: 'Local à skis', body: null, icon: 'info', photo_url: 'https://cdn.test/ski.jpg', sort_order: 8 },
        { title: '', body: 'orphan', icon: 'info', photo_url: null, sort_order: 2 },
      ],
    })

    expect(tx.lodgingPracticalBlock.updateMany).toHaveBeenCalledWith({
      where: { lodging_id: 'lodging-1', deleted_at: null },
      data: { deleted_at: expect.any(Date) },
    })
    expect(tx.lodgingPracticalBlock.createMany).toHaveBeenCalledTimes(1)
    expect(tx.lodgingPracticalBlock.createMany).toHaveBeenCalledWith({
      data: [
        {
          lodging_id: 'lodging-1',
          title: 'La plage',
          body: 'À 5 min',
          icon: 'star',
          photo_url: null,
          video_url: null,
          sort_order: 0,
        },
        {
          lodging_id: 'lodging-1',
          title: 'Local à skis',
          body: null,
          icon: 'info',
          photo_url: 'https://cdn.test/ski.jpg',
          video_url: null,
          sort_order: 1,
        },
      ],
    })
    expect(result.practical_blocks).toEqual([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ])
  })

  it('uses a longer transaction timeout for customization saves with many owner recommendations', async () => {
    await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      practical_blocks: [],
    })

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { timeout: 20000 })
  })

  it('normalizes and persists an owner note for a selected POI', async () => {
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: '  Notre terrasse préférée.  ',
        sort_order: 0,
      }],
    })

    expect(tx.lodgingFeaturedPoi.upsert).toHaveBeenCalledWith({
      where: { lodging_id_poi_id: { lodging_id: 'lodging-1', poi_id: 'poi-1' } },
      update: {
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
        deleted_at: null,
      },
      create: {
        lodging_id: 'lodging-1',
        poi_id: 'poi-1',
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
      },
    })
    expect(result.featured_pois).toEqual([{
      poi_id: 'poi-1',
      category_id: 'cat-1',
      owner_note: 'Notre terrasse préférée.',
      sort_order: 0,
    }])
  })

  it('AC-04-03: geocodes the lodging address via Mapbox and stores coordinates on customization', async () => {
    mockGeocodeAddress.mockResolvedValue({
      latitude: 45.001,
      longitude: 6.002,
      relevance: 0.98,
      place_name: '22 Rue de la Comtesse, 74170 Saint-Gervais-les-Bains',
    })

    await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      lodging_address: ' 22 Rue de la Comtesse ',
    })

    expect(mockGeocodeAddress).toHaveBeenCalledWith('22 Rue de la Comtesse', {
      latitude: 45,
      longitude: 6,
    })
    expect(tx.lodgingCustomization.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        lodging_address: '22 Rue de la Comtesse',
        lodging_latitude: 45.001,
        lodging_longitude: 6.002,
      }),
      create: expect.objectContaining({
        lodging_address: '22 Rue de la Comtesse',
        lodging_latitude: 45.001,
        lodging_longitude: 6.002,
      }),
    }))
  })

  it('rejects an owner note over 300 words before starting the transaction', async () => {
    const save = saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: Array.from({ length: 301 }, () => 'mot').join(' '),
        sort_order: 0,
      }],
    })

    await expect(save).rejects.toEqual(
      expect.objectContaining<Partial<GuideCustomizationError>>({
        code: 'INVALID_FEATURED_POI',
      }),
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
