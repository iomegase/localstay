const mockCityFindFirst = jest.fn()
const mockCityFindMany = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockRunCreate = jest.fn()
const mockRunUpdate = jest.fn()
const mockRunFindFirst = jest.fn()
const mockCandidateCreate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockMemoryFindMany = jest.fn()
const mockCallGemini = jest.fn()
const mockGeocode = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: (...a: unknown[]) => mockCityFindFirst(...a), findMany: (...a: unknown[]) => mockCityFindMany(...a) },
    category: { findFirst: (...a: unknown[]) => mockCategoryFindFirst(...a) },
    poiAcquisitionRun: {
      findMany: async () => [],
      create: (...a: unknown[]) => mockRunCreate(...a),
      update: (...a: unknown[]) => mockRunUpdate(...a),
      findFirst: (...a: unknown[]) => mockRunFindFirst(...a),
    },
    poiAcquisitionCandidate: { create: (...a: unknown[]) => mockCandidateCreate(...a) },
    pointOfInterest: { findMany: (...a: unknown[]) => mockPoiFindMany(...a) },
    poiAcquisitionMemory: { findMany: (...a: unknown[]) => mockMemoryFindMany(...a) },
  },
}))
jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({ callGemini: (...a: unknown[]) => mockCallGemini(...a) }))
jest.mock('@/features/poi-acquisition/lib/geocode', () => ({ geocodeForAcquisition: (...a: unknown[]) => mockGeocode(...a) }))

import { createAcquisitionRun, getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

// Spec 071 — mémoire de revue dans le pipeline et le détail du run.
const SG = { id: 'city-sg', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', postal_code: '74170', latitude: 45.89227, longitude: 6.712007 }

function place(id: string) {
  return { id, displayName: { text: id }, formattedAddress: `${id}, Saint-Gervais`, location: { latitude: 45.8925, longitude: 6.7122 }, businessStatus: 'OPERATIONAL' }
}


// Spec 072 : file d'attente du lancement, écrite puis relue par le traitement par lots.
let pendingPlaces: unknown = []
function setRunDetail(detail: Record<string, unknown>) {
  pendingPlaces = []
  mockRunUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    if ('pending_places' in data) pendingPlaces = data.pending_places
    return { id: 'run-1' }
  })
  mockRunFindFirst.mockImplementation(async () => {
    const [city, category] = await Promise.all([mockCityFindFirst(), mockCategoryFindFirst()])
    return {
      ...detail,
      source_url: null,
      pending_places: pendingPlaces,
      processed_count: 0,
      city: { ...(detail.city as object), ...(city as object) },
      category: { ...(detail.category as object), ...(category as object) },
    }
  })
}

describe('071 — pipeline et mémoire', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue(SG)
    mockCityFindMany.mockResolvedValue([SG])
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-diner', name: 'Restaurant', subcategories: [] })
    mockRunCreate.mockResolvedValue({ id: 'run-1' })
    mockRunUpdate.mockResolvedValue({ id: 'run-1' })
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'D' }])
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 })
    setRunDetail({
      id: 'run-1', status: 'completed', error: null,
      skipped_other_village: 0, skipped_closed_permanently: 0, skipped_rejected: 1, skipped_excluded: 1,
      city: { name: 'Saint-Gervais-les-Bains' }, category: { name: 'Restaurant' }, candidates: [],
    })
    mockMemoryFindMany.mockResolvedValue([
      { google_place_id: 'rejete', kind: 'rejected', category_id: 'cat-diner', category: { name: 'Restaurant' } },
      { google_place_id: 'rejete-ailleurs', kind: 'rejected', category_id: 'cat-shop', category: { name: 'Shopping' } },
      { google_place_id: 'exclu', kind: 'excluded', category_id: null, category: null },
    ])
    global.fetch = jest.fn(async () => Response.json({ places: [place('nouveau'), place('rejete'), place('rejete-ailleurs'), place('exclu')] }))
  })

  it('AC-02-02 / AC-02-03 / AC-03-02 : écarte rejetés (même catégorie) et exclus, avant Gemini et Mapbox', async () => {
    await createAcquisitionRun({ city_id: SG.id, category_id: 'cat-diner' }, 'admin-1')

    const names = mockCandidateCreate.mock.calls.map(call => (call[0] as { data: { name: string } }).data.name)
    expect(names).toEqual(['nouveau', 'rejete-ailleurs'])
    expect(mockCallGemini).toHaveBeenCalledTimes(2)
    expect(mockMemoryFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { city_id: SG.id, deleted_at: null } }))
    expect(mockRunUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ skipped_rejected: 1, skipped_excluded: 1 }),
    }))
  })

  it('AC-04-01 : le détail du run expose les compteurs et masque les candidats exclus', async () => {
    const base = {
      name: 'x', address: 'a', source: 'google_places', match_status: 'matched', geocode_status: 'success',
      duplicate_poi_ids: [], google_place_id: null, google_review_payload: null, business_status: null,
    }
    mockRunFindFirst.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null,
      skipped_other_village: 0, skipped_closed_permanently: 0, skipped_rejected: 3, skipped_excluded: 2,
      city: { name: 'Saint-Gervais-les-Bains' }, category: { name: 'Restaurant' },
      candidates: [
        { ...base, id: 'c1', review_status: 'needs_review' },
        { ...base, id: 'c2', review_status: 'excluded' },
      ],
    })

    const run = await getAcquisitionRun('run-1')

    expect(run).toMatchObject({ skipped_rejected: 3, skipped_excluded: 2, excluded_candidates: 1 })
    expect(run?.candidates.map(candidate => candidate.id)).toEqual(['c1'])
  })
})
