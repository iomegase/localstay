import { saveOwnerPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'
import type { LodgingPublicProfileInput } from '@/features/lodging-showcase/schemas'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingPublicProfile: { upsert: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
    lodgingAmenity: { deleteMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    lodgingFaqItem: { deleteMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    lodgingPhoto: { updateMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'

type TestDatabase = {
  lodging: {
    findFirst: jest.MockedFunction<() => Promise<unknown>>
  }
  lodgingPublicProfile: {
    upsert: jest.MockedFunction<() => Promise<{ id: string }>>
    findUnique: jest.MockedFunction<() => Promise<unknown>>
    findFirst: jest.MockedFunction<() => Promise<unknown>>
  }
  lodgingAmenity: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingFaqItem: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingPhoto: {
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
}

const db = prisma as unknown as TestDatabase

const baseInput: LodgingPublicProfileInput = {
  title: 'Chalet test alpin',
  short_description: 'x'.repeat(50),
  description: 'y'.repeat(100),
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 80,
  public_area_label: 'Zone',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: null,
  external_booking_platform: null,
  seo_title: null,
  seo_description: null,
  source_description_text: null,
  public_contact_enabled: true,
  amenities: [{ code: 'wifi', label: 'Wifi', sort_order: 0, availability: 'included' }],
  photos: [],
  faq: [],
}

describe('saveOwnerPublicProfile — child collection replacement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.lodging.findFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Chalet',
      city_id: 'city-1',
      city: { id: 'city-1', name: 'Chamonix', slug: 'chamonix' },
    })
    db.lodgingPublicProfile.upsert.mockResolvedValue({ id: 'profile-1' })
    db.lodgingPublicProfile.findFirst.mockResolvedValue(null)
    db.lodgingAmenity.deleteMany.mockResolvedValue({ count: 1 })
    db.lodgingAmenity.createMany.mockResolvedValue({ count: 1 })
    db.lodgingFaqItem.deleteMany.mockResolvedValue({ count: 0 })
    db.lodgingFaqItem.createMany.mockResolvedValue({ count: 0 })
    db.lodgingPhoto.updateMany.mockResolvedValue({ count: 0 })
    db.lodgingPublicProfile.findUnique.mockResolvedValue(null)
  })

  it('hard-deletes existing amenities before recreating (avoids @@unique(profile_id,code) P2002 on re-save)', async () => {
    await saveOwnerPublicProfile('owner-1', 'lodging-1', baseInput)

    expect(db.lodgingAmenity.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'profile-1' } })
    // The old soft-delete approach (updateMany set deleted_at) caused the collision.
    expect(db.lodgingAmenity.updateMany).not.toHaveBeenCalled()
    expect(db.lodgingAmenity.createMany).toHaveBeenCalled()
  })

  it('hard-deletes existing FAQ items before recreating', async () => {
    await saveOwnerPublicProfile('owner-1', 'lodging-1', baseInput)

    expect(db.lodgingFaqItem.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'profile-1' } })
    expect(db.lodgingFaqItem.updateMany).not.toHaveBeenCalled()
  })
})
