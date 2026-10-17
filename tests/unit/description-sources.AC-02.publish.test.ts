import { Prisma } from '@prisma/client'
const mockCandidateFindFirst = jest.fn()
const mockPoiCreate = jest.fn()
const mockCandidateUpdate = jest.fn()
const mockAuditCreate = jest.fn()

const tx = {
  pointOfInterest: { findFirst: jest.fn(async () => null), create: (...a: unknown[]) => mockPoiCreate(...a) },
  poiAcquisitionCandidate: { update: (...a: unknown[]) => mockCandidateUpdate(...a) },
  poiAcquisitionAuditLog: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    poiAcquisitionCandidate: { findFirst: (...a: unknown[]) => mockCandidateFindFirst(...a) },
    $transaction: async (fn: (client: typeof tx) => unknown) => fn(tx),
  },
}))
jest.mock('@/features/poi-acquisition/services/official-website-photos', () => ({
  fetchOfficialWebsitePhotoEnrichment: jest.fn(async () => null),
  mergeOfficialWebsitePhotos: jest.fn(() => []),
}))

// Spec 101 : aucune recherche Wikimedia Commons réelle.
const mockFindCommonsPhotos = jest.fn(async (): Promise<unknown[]> => [])
jest.mock('@/features/poi-photos/services/wikimedia-commons', () => ({
  findCommonsPhotos: (...a: unknown[]) => mockFindCommonsPhotos(...(a as [])),
}))

import { publishCandidate } from '@/features/poi-acquisition/queries/review'

const candidate = (sources: unknown) => ({
  id: 'cand-1', run_id: 'run-1', name: 'Cani Smile', address: '75 allée chant oiseaux, 74190 Passy',
  description: 'Éducation canine. Séances à Passy.', description_sources: sources,
  phone: null, website: 'https://cani-smile.fr/', google_place_id: 'gp-1', google_review_payload: null,
  latitude: 45.91, longitude: 6.72, geocode_status: 'success', geocode_provider: 'mapbox',
  duplicate_poi_ids: [], review_status: 'needs_review', category_id: 'cat-1', subcategory_id: null, subcategory: null,
  run: { city_id: 'city-1', city: { name: 'Passy', is_active: true, deleted_at: null }, category: { is_active: true, deleted_at: null } },
})

describe('spec 094 AC-02 — publication d’un candidat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiCreate.mockResolvedValue({ id: 'poi-1' })
    mockCandidateUpdate.mockResolvedValue({ id: 'cand-1', review_status: 'published' })
  })

  it('les sources de la description sont copiées sur le POI', async () => {
    const sources = [{ url: 'https://cani-smile.fr/', title: 'cani-smile.fr' }]
    mockCandidateFindFirst.mockResolvedValue(candidate(sources))
    await publishCandidate('cand-1', 'admin-1', { confirm_duplicate: false })
    expect(mockPoiCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description_sources: sources }) }))
  })

  it('sans source : colonne vide', async () => {
    mockCandidateFindFirst.mockResolvedValue(candidate(null))
    await publishCandidate('cand-1', 'admin-1', { confirm_duplicate: false })
    expect(mockPoiCreate.mock.calls[0][0].data.description_sources).toBe(Prisma.JsonNull)
  })

  it('spec 101 AC-02-01 / AC-02-04 : sans photo du site officiel → photos Commons et leurs crédits', async () => {
    const commons = [{ photo_url: 'https://upload.wikimedia.org/a.jpg', author: 'Rémih', license: 'CC BY-SA 4.0', license_url: null, source_url: 'https://commons.wikimedia.org/wiki/File:A.jpg' }]
    mockFindCommonsPhotos.mockResolvedValueOnce(commons)
    mockCandidateFindFirst.mockResolvedValue(candidate(null))
    await publishCandidate('cand-1', 'admin-1', { confirm_duplicate: false })

    expect(mockFindCommonsPhotos).toHaveBeenCalledWith({ name: 'Cani Smile', latitude: 45.91, longitude: 6.72, city: 'Passy' })
    expect(mockPoiCreate.mock.calls[0][0].data).toMatchObject({ photos: ['https://upload.wikimedia.org/a.jpg'], photo_credits: commons })
  })

  it('spec 101 BR-02 : avec des photos du site officiel, Commons n’est pas consulté', async () => {
    const photos = jest.requireMock('@/features/poi-acquisition/services/official-website-photos') as { mergeOfficialWebsitePhotos: jest.Mock }
    photos.mergeOfficialWebsitePhotos.mockReturnValueOnce(['https://cani-smile.fr/photo.jpg'])
    mockCandidateFindFirst.mockResolvedValue(candidate(null))
    await publishCandidate('cand-1', 'admin-1', { confirm_duplicate: false })

    expect(mockFindCommonsPhotos).not.toHaveBeenCalled()
    expect(mockPoiCreate.mock.calls[0][0].data).toMatchObject({ photos: ['https://cani-smile.fr/photo.jpg'], photo_credits: Prisma.JsonNull })
  })
})
