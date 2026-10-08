const mockCreateMany = jest.fn()
const tx = {
  equipmentTemplate: { findMany: jest.fn() },
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

describe('spec 096 US-03 — contrôle serveur des équipements', () => {
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

  const save = (practical_blocks: Parameters<typeof saveLodgingCustomization>[2]['practical_blocks']) =>
    saveLodgingCustomization('owner-1', 'lodging-1', { category_order: [], featured_pois: [], practical_blocks })

  it('AC-03-01 : un nouvel équipement prend l’icône de la bibliothèque, sans photo ni vidéo de l’Owner', async () => {
    tx.equipmentTemplate.findMany.mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', icon: 'utensils' }])
    await save([{
      id: 'tmp-1', equipment_template_id: '11111111-1111-4111-8111-111111111111', title: 'Machine Nespresso', body: 'Capsules',
      icon: 'star', photo_url: 'https://evil/photo.jpg', video_url: 'https://youtu.be/abc12345678', sort_order: 0,
    }])
    expect(tx.equipmentTemplate.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['11111111-1111-4111-8111-111111111111'] }, status: 'approved', deleted_at: null },
      select: { id: true, icon: true },
    })
    expect(tx.lodgingPracticalBlock.create).toHaveBeenCalledWith({
      data: {
        lodging_id: 'lodging-1', title: 'Machine Nespresso', body: 'Capsules', sort_order: 0,
        equipment_template_id: '11111111-1111-4111-8111-111111111111', icon: 'utensils', photo_url: null, video_url: null,
      },
    })
  })

  it('AC-03-01 : 400 EQUIPMENT_NOT_AVAILABLE sans équipement de bibliothèque, ou s’il n’est pas validé', async () => {
    tx.equipmentTemplate.findMany.mockResolvedValue([])
    await expect(save([{ title: 'Barbecue', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0 }]))
      .rejects.toMatchObject({ code: 'EQUIPMENT_NOT_AVAILABLE' })
    await expect(save([{ equipment_template_id: '22222222-2222-4222-8222-222222222222', title: 'Spa', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0 }]))
      .rejects.toBeInstanceOf(GuideCustomizationError)
    expect(tx.lodgingPracticalBlock.create).not.toHaveBeenCalled()
  })

  it('AC-03-02 / AC-03-03 : un équipement existant ne change que de nom, texte et ordre ; rien n’alimente la bibliothèque', async () => {
    tx.lodgingPracticalBlock.findMany.mockResolvedValue([{ id: 'b1' }])
    await save([{
      id: 'b1', equipment_template_id: '33333333-3333-4333-8333-333333333333', title: 'TV', body: 'Netflix',
      icon: 'star', photo_url: 'https://evil/photo.jpg', video_url: null, sort_order: 0,
    }])
    expect(tx.lodgingPracticalBlock.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { title: 'TV', body: 'Netflix', sort_order: 0 } })
    expect(mockCreateMany).not.toHaveBeenCalled()
  })
})
