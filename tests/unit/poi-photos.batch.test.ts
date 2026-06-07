const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
  },
}))

const mockCheck = jest.fn()
jest.mock('@/features/poi-photos/services/check-photo-url', () => ({
  checkPhotoUrl: (...a: unknown[]) => mockCheck(...a),
}))

const mockHeal = jest.fn()
jest.mock('@/features/poi-photos/services/heal-poi-photos', () => ({
  healPoiPhotos: (...a: unknown[]) => mockHeal(...a),
}))

import { checkPhotoLivenessBatch } from '@/features/poi-photos/queries/check-photo-liveness-batch'

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({ id: 'p' })
})

it('only stamps photos_checked_at for a POI with all-alive photos (no heal)', async () => {
  mockFindMany.mockResolvedValue([{ id: 'p1', photos: ['a.jpg', 'b.jpg'] }])
  mockCheck.mockResolvedValue('alive')

  const result = await checkPhotoLivenessBatch(10)

  expect(mockHeal).not.toHaveBeenCalled()
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'p1' },
      data: expect.objectContaining({ photos_checked_at: expect.any(Date) }),
    }),
  )
  expect(result).toEqual({ processed: 1, poisFlagged: 0, photosRemoved: 0 })
})

it('heals a POI with a dead photo and counts a flagged POI', async () => {
  mockFindMany.mockResolvedValue([{ id: 'p1', photos: ['a.jpg', 'dead.jpg'] }])
  mockCheck.mockImplementation((url: string) => Promise.resolve(url === 'dead.jpg' ? 'dead' : 'alive'))
  mockHeal.mockResolvedValue({ removed: 1, status: 'needs_refresh' })

  const result = await checkPhotoLivenessBatch(10)

  expect(mockHeal).toHaveBeenCalledWith({ poiId: 'p1', deadUrls: ['dead.jpg'] })
  expect(result).toEqual({ processed: 1, poisFlagged: 1, photosRemoved: 1 })
})
