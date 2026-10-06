const mockCandidateFindFirst = jest.fn()
const mockCandidateUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockMemoryFindFirst = jest.fn()
const mockMemoryCreate = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockSubcategoryFindFirst = jest.fn()
const mockGeocode = jest.fn()

const tx = {
  poiAcquisitionCandidate: { update: (...args: unknown[]) => mockCandidateUpdate(...args) },
  poiAcquisitionAuditLog: { create: (...args: unknown[]) => mockAuditCreate(...args) },
  poiAcquisitionMemory: {
    findFirst: (...args: unknown[]) => mockMemoryFindFirst(...args),
    create: (...args: unknown[]) => mockMemoryCreate(...args),
  },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    poiAcquisitionCandidate: { findFirst: (...args: unknown[]) => mockCandidateFindFirst(...args) },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    subCategory: { findFirst: (...args: unknown[]) => mockSubcategoryFindFirst(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}))
jest.mock('@/features/poi-acquisition/lib/geocode', () => ({
  geocodeForAcquisition: (...args: unknown[]) => mockGeocode(...args),
}))
jest.mock('@/features/poi-acquisition/services/official-website-photos', () => ({
  fetchOfficialWebsitePhotoEnrichment: jest.fn(),
}))

import { excludeCandidate, rejectCandidate, updateCandidate } from '@/features/poi-acquisition/queries/review'

// Spec 071 — rejeter (mémorisé), exclure, modifier.
const candidate = {
  id: 'cand-1', run_id: 'run-1', review_status: 'needs_review', published_poi_id: null, admin_note: null,
  google_place_id: 'gp-maison-alpes', name: 'Maison des Alpes', address: '71 Av. du Mont d’Arbois',
  category_id: 'cat-diner', subcategory_id: null,
  run: { city_id: 'city-sg', category_id: 'cat-diner', city: { latitude: 45.89, longitude: 6.71 } },
}

describe('071 — actions de revue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCandidateFindFirst.mockResolvedValue(candidate)
    mockCandidateUpdate.mockImplementation(async ({ data }: { data: object }) => ({ ...candidate, ...data }))
    mockMemoryFindFirst.mockResolvedValue(null)
  })

  it('AC-02-01 : rejeter mémorise le lieu pour la ville et la catégorie du run', async () => {
    const updated = await rejectCandidate('cand-1', 'admin-1')

    expect(updated.review_status).toBe('rejected')
    expect(mockMemoryCreate).toHaveBeenCalledWith({ data: {
      city_id: 'city-sg', google_place_id: 'gp-maison-alpes', kind: 'rejected', category_id: 'cat-diner',
      name: 'Maison des Alpes', address: '71 Av. du Mont d’Arbois', created_by: 'admin-1',
    } })
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'candidate_rejected' }) }))
  })

  it('AC-03-01 : exclure mémorise le lieu pour toute la ville', async () => {
    const updated = await excludeCandidate('cand-1', 'admin-1')

    expect(updated.review_status).toBe('excluded')
    expect(mockMemoryCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: 'excluded', category_id: null }) })
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'candidate_excluded' }) }))
  })

  it('pas de doublon de mémoire si elle existe déjà', async () => {
    mockMemoryFindFirst.mockResolvedValue({ id: 'mem-1' })
    await rejectCandidate('cand-1', 'admin-1')
    expect(mockMemoryCreate).not.toHaveBeenCalled()
  })

  it('BR-01 : sans google_place_id, aucune mémoire', async () => {
    mockCandidateFindFirst.mockResolvedValue({ ...candidate, google_place_id: null })
    await excludeCandidate('cand-1', 'admin-1')
    expect(mockMemoryCreate).not.toHaveBeenCalled()
  })

  it('candidat déjà traité → 409', async () => {
    mockCandidateFindFirst.mockResolvedValue({ ...candidate, review_status: 'published' })
    await expect(excludeCandidate('cand-1', 'admin-1')).rejects.toMatchObject({ code: 'CANDIDATE_NOT_REVIEWABLE', status: 409 })
  })

  it('AC-01-01 / AC-01-04 : modifier enregistre les champs, dont catégorie et sous-catégorie', async () => {
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-shop' })
    mockSubcategoryFindFirst.mockResolvedValue({ id: 'sub-bout', category_id: 'cat-shop' })

    await updateCandidate('cand-1', { name: 'Maison des Alpes', category_id: 'cat-shop', subcategory_id: 'sub-bout' }, 'admin-1')

    expect(mockCandidateUpdate).toHaveBeenCalledWith({
      where: { id: 'cand-1' },
      data: { name: 'Maison des Alpes', category_id: 'cat-shop', subcategory_id: 'sub-bout' },
    })
    expect(mockGeocode).not.toHaveBeenCalled()
    expect(mockAuditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'candidate_updated' }) }))
  })

  it('AC-01-02 : une nouvelle adresse est regéocodée par Mapbox', async () => {
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.9, longitude: 6.72, confidence: 0.9 })

    await updateCandidate('cand-1', { address: '72 Av. du Mont d’Arbois' }, 'admin-1')

    expect(mockGeocode).toHaveBeenCalledWith('72 Av. du Mont d’Arbois', { latitude: 45.89, longitude: 6.71 })
    expect(mockCandidateUpdate).toHaveBeenCalledWith({
      where: { id: 'cand-1' },
      data: {
        address: '72 Av. du Mont d’Arbois', latitude: 45.9, longitude: 6.72,
        geocode_status: 'success', geocode_provider: 'mapbox', geocode_confidence: 0.9,
      },
    })
  })

  it('AC-01-02 : géocodage en échec → coordonnées effacées, statut failed', async () => {
    mockGeocode.mockResolvedValue({ status: 'failed', reason: 'introuvable' })

    await updateCandidate('cand-1', { address: 'Adresse inconnue' }, 'admin-1')

    expect(mockCandidateUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      latitude: null, longitude: null, geocode_status: 'failed', geocode_provider: null, geocode_confidence: null,
    }) }))
  })

  it('AC-01-03 : sous-catégorie d’une autre catégorie → 400', async () => {
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-shop' })
    mockSubcategoryFindFirst.mockResolvedValue({ id: 'sub-resto', category_id: 'cat-diner' })

    await expect(updateCandidate('cand-1', { category_id: 'cat-shop', subcategory_id: 'sub-resto' }, 'admin-1'))
      .rejects.toMatchObject({ code: 'SUBCATEGORY_CATEGORY_MISMATCH', status: 400 })
  })

  it('AC-01-03 : catégorie inactive → 400', async () => {
    mockCategoryFindFirst.mockResolvedValue(null)
    await expect(updateCandidate('cand-1', { category_id: 'cat-x' }, 'admin-1'))
      .rejects.toMatchObject({ code: 'INVALID_CATEGORY', status: 400 })
  })

  it('changer de catégorie sans sous-catégorie retire l’ancienne sous-catégorie', async () => {
    mockCandidateFindFirst.mockResolvedValue({ ...candidate, subcategory_id: 'sub-resto' })
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-shop' })

    await updateCandidate('cand-1', { category_id: 'cat-shop' }, 'admin-1')

    expect(mockCandidateUpdate).toHaveBeenCalledWith({ where: { id: 'cand-1' }, data: { category_id: 'cat-shop', subcategory_id: null } })
  })
})
