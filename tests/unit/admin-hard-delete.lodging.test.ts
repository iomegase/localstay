const del = () => ({ deleteMany: jest.fn().mockResolvedValue({ count: 0 }) })

const tx = {
  lodgingPublicProfile: {
    findUnique: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  lodgingPhoto: del(),
  lodgingAmenity: del(),
  lodgingFaqItem: del(),
  qrCode: del(),
  analytics: del(),
  analyticsInteractionEvent: del(),
  lodgingCustomization: del(),
  lodgingFeaturedPoi: del(),
  lodgingPracticalBlock: del(),
  lodgingArrivalInstruction: del(),
  contactMessage: del(),
  lodging: { delete: jest.fn().mockResolvedValue({ id: 'lodg-1' }) },
}

import { hardDeleteLodging } from '@/features/admin/lib/hard-delete'

describe('hardDeleteLodging', () => {
  beforeEach(() => jest.clearAllMocks())

  it('purges public-profile children then the profile when a profile exists', async () => {
    tx.lodgingPublicProfile.findUnique.mockResolvedValue({ id: 'prof-1' })

    await hardDeleteLodging(tx as never, 'lodg-1')

    expect(tx.lodgingPhoto.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingAmenity.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingFaqItem.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingPublicProfile.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
  })

  it('skips profile children when there is no public profile, and deletes the lodging last', async () => {
    tx.lodgingPublicProfile.findUnique.mockResolvedValue(null)

    await hardDeleteLodging(tx as never, 'lodg-1')

    expect(tx.lodgingPhoto.deleteMany).not.toHaveBeenCalled()
    expect(tx.qrCode.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
    expect(tx.contactMessage.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
    expect(tx.lodging.delete).toHaveBeenCalledWith({ where: { id: 'lodg-1' } })
  })
})
