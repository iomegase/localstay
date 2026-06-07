const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
  },
}))

const mockFetch = jest.fn()
jest.mock('@/features/poi-acquisition/services/official-website-photos', () => ({
  fetchOfficialWebsitePhotoEnrichmentDetailed: (...a: unknown[]) => mockFetch(...a),
  mergeOfficialWebsitePhotos: (existing: string[], extra: string[]) =>
    Array.from(new Set([...existing, ...extra])),
}))

import { healPoiPhotos } from '@/features/poi-photos/services/heal-poi-photos'

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({ id: 'p1' })
})

it('removes the dead url, keeps remaining photos, and stays ok (>=1 photo)', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['alive.jpg', 'dead.jpg'], website: null })
  mockFetch.mockResolvedValue({ status: 'no_website' })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result).toEqual({ removed: 1, status: 'ok' })
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'p1' },
      data: expect.objectContaining({ photos: ['alive.jpg'], photos_status: 'ok' }),
    }),
  )
})

it('flags needs_refresh when the POI is left with zero photos and re-acquire finds none', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['dead.jpg'], website: 'https://x' })
  mockFetch.mockResolvedValue({ status: 'no_photos_extracted', canonicalUrl: 'https://x' })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result).toEqual({ removed: 1, status: 'needs_refresh' })
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ photos: [], photos_status: 'needs_refresh' }),
    }),
  )
})

it('re-acquires website photos and recovers to ok', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['dead.jpg'], website: 'https://x' })
  mockFetch.mockResolvedValue({ status: 'ok', enrichment: { photos: ['fresh.jpg'], canonical_url: 'https://x' } })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['dead.jpg'] })

  expect(result.status).toBe('ok')
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ photos: ['fresh.jpg'], photos_status: 'ok' }),
    }),
  )
})

it('no-ops when the POI is missing', async () => {
  mockFindUnique.mockResolvedValue(null)
  const result = await healPoiPhotos({ poiId: 'missing', deadUrls: ['x'] })
  expect(result).toEqual({ removed: 0, status: 'ok' })
  expect(mockUpdate).not.toHaveBeenCalled()
})
