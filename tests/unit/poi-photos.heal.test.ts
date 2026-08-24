const mockFindUnique = jest.fn()
const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTransaction = jest.fn()
const mockRevalidate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
    },
    poiAcquisitionAuditLog: { create: (...a: unknown[]) => mockAuditCreate(...a) },
    $transaction: (callback: (tx: unknown) => unknown) => mockTransaction(callback),
  },
}))

jest.mock('@/features/public-discovery/lib/revalidation', () => ({
  safelyRevalidateDiscoveryPaths: (...args: unknown[]) => mockRevalidate(...args),
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
  mockFindFirst.mockResolvedValue(null)
  mockUpdate.mockResolvedValue({ id: 'p1' })
  mockTransaction.mockImplementation(async callback => callback({
    pointOfInterest: { findFirst: mockFindFirst, findUnique: mockFindUnique, update: mockUpdate },
    poiAcquisitionAuditLog: { create: mockAuditCreate },
  }))
})

const publishedPoi = {
  id: 'p1', slug: 'poi', description: 'Description', address: 'Adresse',
  latitude: 45.89, longitude: 6.71, phone: '+33450000000', website: null,
  photos: ['dead.jpg'], is_active: true, deleted_at: null, geocode_status: 'success',
  discovery_status: 'PUBLISHED',
  discovery_published_at: new Date('2026-08-20T15:00:00.000Z'),
  city: { id: 'city-1', slug: 'ville', is_active: true, deleted_at: null },
  category: { id: 'category-1', slug: 'categorie', is_active: true, deleted_at: null },
  subcategory: null,
}

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

it('atomically unpublishes with a SYSTEM audit after removing the last usable photo', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['https://example.com/dead.jpg'], website: null })
  mockFetch.mockResolvedValue({ status: 'no_website' })
  mockFindFirst
    .mockResolvedValueOnce({ ...publishedPoi, photos: ['https://example.com/dead.jpg'] })
    .mockResolvedValueOnce({ ...publishedPoi, photos: [] })
  mockUpdate
    .mockResolvedValueOnce({ id: 'p1' })
    .mockResolvedValueOnce({ discovery_status: 'DRAFT', discovery_published_at: null })

  await healPoiPhotos({ poiId: 'p1', deadUrls: ['https://example.com/dead.jpg'] })

  expect(mockTransaction).toHaveBeenCalledTimes(1)
  expect(mockAuditCreate).toHaveBeenCalledWith({
    data: expect.objectContaining({
      admin_id: null,
      actor_type: 'SYSTEM',
      action: 'poi_discovery_auto_unpublished',
      target_id: 'p1',
    }),
  })
  expect(mockRevalidate).toHaveBeenCalledWith([
    '/decouvrir/ville',
    '/decouvrir/ville/categorie',
    '/decouvrir/ville/categorie/poi',
  ])
})

it('keeps an eligible published POI and revalidates without a withdrawal audit', async () => {
  mockFindUnique.mockResolvedValue({
    photos: ['https://example.com/alive.jpg', 'https://example.com/dead.jpg'],
    website: null,
  })
  mockFetch.mockResolvedValue({ status: 'no_website' })
  mockFindFirst
    .mockResolvedValueOnce({
      ...publishedPoi,
      photos: ['https://example.com/alive.jpg', 'https://example.com/dead.jpg'],
    })
    .mockResolvedValueOnce({ ...publishedPoi, photos: ['https://example.com/alive.jpg'] })
  mockUpdate.mockResolvedValueOnce({ id: 'p1' })

  await healPoiPhotos({ poiId: 'p1', deadUrls: ['https://example.com/dead.jpg'] })

  expect(mockUpdate).toHaveBeenCalledTimes(1)
  expect(mockAuditCreate).not.toHaveBeenCalled()
  expect(mockRevalidate).toHaveBeenCalledTimes(1)
})

it('preserves a photo added concurrently while the remote liveness check was running', async () => {
  mockFindUnique
    .mockResolvedValueOnce({ photos: ['https://example.com/dead.jpg'], website: null })
    .mockResolvedValueOnce({
      photos: ['https://example.com/dead.jpg', 'https://example.com/concurrent.jpg'],
      website: null,
    })
  mockFetch.mockResolvedValue({ status: 'no_website' })
  mockFindFirst.mockResolvedValue(null)
  mockUpdate.mockResolvedValueOnce({ id: 'p1' })

  const result = await healPoiPhotos({ poiId: 'p1', deadUrls: ['https://example.com/dead.jpg'] })

  expect(result).toEqual({ removed: 1, status: 'ok' })
  expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ photos: ['https://example.com/concurrent.jpg'] }),
  }))
})
