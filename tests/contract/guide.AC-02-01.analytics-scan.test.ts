jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    analytics: { create: jest.fn() },
    lodging: { findFirst: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { recordQrScanIfPresent } from '../../src/features/analytics/lib/record-qr-scan'

const mockPrismaCreate = prisma.analytics.create as jest.Mock
const mockPrismaFindFirst = prisma.lodging.findFirst as jest.Mock

const LODGING = { id: 'lodging-1', city_id: 'city-1', deleted_at: null }

describe('recordQrScanIfPresent — AC-02-01', () => {
  beforeEach(() => jest.clearAllMocks())

  it('inserts qr_scan Analytics event when lodgingId is valid', async () => {
    mockPrismaFindFirst.mockResolvedValue(LODGING)
    await recordQrScanIfPresent('lodging-1')
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lodging_id: 'lodging-1',
          city_id: 'city-1',
          event_type: 'qr_scan',
        }),
      }),
    )
  })

  it('does nothing when lodgingId is null', async () => {
    await recordQrScanIfPresent(null)
    expect(mockPrismaCreate).not.toHaveBeenCalled()
  })

  it('does nothing when lodging not found in DB', async () => {
    mockPrismaFindFirst.mockResolvedValue(null)
    await recordQrScanIfPresent('unknown-id')
    expect(mockPrismaCreate).not.toHaveBeenCalled()
  })
})
