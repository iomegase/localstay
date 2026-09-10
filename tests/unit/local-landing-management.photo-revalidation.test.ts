import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  createAdminLodgingPhoto,
  createLodgingPhoto,
  deleteAdminLodgingPhoto,
  deleteOwnerLodgingPhoto,
  setAdminCoverPhoto,
  setOwnerCoverPhoto,
} from '@/features/lodging-showcase/queries/owner-public-profile'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingPublicProfile: { upsert: jest.fn(), findUnique: jest.fn() },
    lodgingPhoto: {
      count: jest.fn(), create: jest.fn(), updateMany: jest.fn(),
      findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const lodging = {
  id: 'lodging-1', name: 'Chalet', city_id: 'city-megeve',
  city: { id: 'city-megeve', name: 'Megève', slug: 'megeve' },
}
const profile = {
  id: 'profile-1', lodging_id: 'lodging-1', city_id: 'city-chamonix',
  slug: 'chalet-public', publication_status: 'published',
  photos: [], amenities: [], faq_items: [], city: { slug: 'chamonix' },
}

describe('048 public lodging photo revalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue(lodging as never)
    jest.mocked(prisma.lodgingPublicProfile.upsert).mockResolvedValue(profile as never)
    jest.mocked(prisma.lodgingPublicProfile.findUnique).mockResolvedValue(profile as never)
    jest.mocked(prisma.lodgingPhoto.count).mockResolvedValue(0)
    jest.mocked(prisma.lodgingPhoto.create).mockResolvedValue({
      id: 'photo-1', url: '/photo.jpg', alt: 'Le chalet', room_type: null,
      room_label: null, sort_order: 0, is_cover: true,
    } as never)
    jest.mocked(prisma.lodgingPhoto.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(prisma.lodgingPhoto.findMany).mockResolvedValue([])
    jest.mocked(prisma.lodgingPhoto.findFirst).mockResolvedValue({ id: 'photo-1' } as never)
    jest.mocked(prisma.$transaction).mockResolvedValue([] as never)
  })

  function expectPublicPhotoPaths() {
    expect(revalidatePath).toHaveBeenCalledWith('/logements/chalet-public', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/locations-vacances/chamonix', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/locations-vacances/megeve', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  }

  it('invalidates exact lodging and both City surfaces after creating a photo', async () => {
    await createLodgingPhoto('owner-1', 'lodging-1', {
      url: '/photo.jpg', alt: 'Le chalet', room_type: null, room_label: null,
    })
    expectPublicPhotoPaths()
  })

  it('uses the same invalidation boundary when an admin creates a photo', async () => {
    await createAdminLodgingPhoto('lodging-1', {
      url: '/photo.jpg', alt: 'Le chalet', room_type: null, room_label: null,
    })
    expectPublicPhotoPaths()
  })

  it('invalidates exact lodging and both City surfaces after deleting a photo', async () => {
    await expect(deleteOwnerLodgingPhoto('owner-1', 'lodging-1', 'photo-1')).resolves.toBe(true)
    expectPublicPhotoPaths()
  })

  it('uses the same invalidation boundary when an admin deletes a photo', async () => {
    await expect(deleteAdminLodgingPhoto('lodging-1', 'photo-1')).resolves.toBe(true)
    expectPublicPhotoPaths()
  })

  it('invalidates exact lodging and both City surfaces after setting the cover', async () => {
    await expect(setOwnerCoverPhoto('owner-1', 'lodging-1', 'photo-1')).resolves.toBe(true)
    expectPublicPhotoPaths()
  })

  it('uses the same invalidation boundary when an admin sets the cover', async () => {
    await expect(setAdminCoverPhoto('lodging-1', 'photo-1')).resolves.toBe(true)
    expectPublicPhotoPaths()
  })

  it('does not invalidate when a photo mutation fails', async () => {
    jest.mocked(prisma.lodgingPhoto.create).mockRejectedValue(new Error('write failed'))
    await expect(createLodgingPhoto('owner-1', 'lodging-1', {
      url: '/photo.jpg', alt: 'Le chalet', room_type: null, room_label: null,
    })).rejects.toThrow('write failed')
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('does not invalidate when no photo is deleted', async () => {
    jest.mocked(prisma.lodgingPhoto.updateMany).mockResolvedValue({ count: 0 })
    await expect(deleteOwnerLodgingPhoto('owner-1', 'lodging-1', 'missing')).resolves.toBe(false)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('does not invalidate when the cover transaction fails', async () => {
    jest.mocked(prisma.$transaction).mockRejectedValue(new Error('write failed'))
    await expect(setAdminCoverPhoto('lodging-1', 'photo-1')).rejects.toThrow('write failed')
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
