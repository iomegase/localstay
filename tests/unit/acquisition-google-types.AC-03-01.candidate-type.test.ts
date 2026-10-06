const mockRunFindFirst = jest.fn()
const mockRunFindMany = jest.fn()
const mockRunUpdate = jest.fn()
const mockCandidateCreate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockCallGemini = jest.fn()
const mockGeocode = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    poiAcquisitionRun: {
      findFirst: (...a: unknown[]) => mockRunFindFirst(...a),
      findMany: (...a: unknown[]) => mockRunFindMany(...a),
      update: (...a: unknown[]) => mockRunUpdate(...a),
    },
    poiAcquisitionCandidate: { create: (...a: unknown[]) => mockCandidateCreate(...a) },
    pointOfInterest: { findMany: (...a: unknown[]) => mockPoiFindMany(...a) },
  },
}))
jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({ callGemini: (...a: unknown[]) => mockCallGemini(...a) }))
jest.mock('@/features/poi-acquisition/lib/geocode', () => ({ geocodeForAcquisition: (...a: unknown[]) => mockGeocode(...a) }))

import { serializePendingPlaces } from '@/features/poi-acquisition/lib/pending-places'
import { processPendingCandidates } from '@/features/poi-acquisition/queries/runs'

// Spec 073 AC-03-01 — type principal et correspondance enregistrés sur le candidat.
function place(index: number) {
  return {
    name: `Lieu ${index}`, address: `${index} rue`, phone: null, website: null, google_place_id: `gp-${index}`,
    review_payload: null, google_review_expires_at: null, hours: null, query_subcategory_name: null,
    business_status: 'OPERATIONAL' as const, location: null,
  }
}

function runRow(pending: unknown, status = 'running') {
  return {
    id: 'run-1', status, error: null, source_url: null, pending_places: pending, processed_count: 0,
    city: { id: 'city-sg', name: 'Saint-Gervais-les-Bains', latitude: 45.89, longitude: 6.71 },
    category: { id: 'cat-diner', name: 'Restaurant', subcategories: [] },
    candidates: [],
  }
}

describe('073 AC-03-01 — correspondance de type à la création', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunUpdate.mockResolvedValue({})
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'D' }])
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 })
    mockCandidateCreate.mockResolvedValue({})
  })

  it('primary / secondary / unknown selon les types de la catégorie et des sous-catégories', async () => {
    const row = runRow(serializePendingPlaces([
      { ...place(1), primary_type: 'cafe', types: ['cafe'] },
      { ...place(2), primary_type: 'french_restaurant', types: ['french_restaurant', 'cafe'] },
      { ...place(3), primary_type: null, types: [] },
      { ...place(4), primary_type: 'tea_house', types: ['tea_house'] },
    ]))
    row.category = {
      id: 'cat-cafes', name: 'Cafés', google_types: ['cafe', 'coffee_shop'],
      subcategories: [{ id: 'sub-the', name: 'Salon de thé', google_types: ['tea_house'] }],
    } as typeof row.category
    mockRunFindFirst.mockResolvedValue(row)

    await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    const created = mockCandidateCreate.mock.calls.map(call => call[0].data)
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      .map(data => [data.name, data.primary_type, data.type_match])
    expect(created).toEqual([
      ['Lieu 1', 'cafe', 'primary'],
      ['Lieu 2', 'french_restaurant', 'secondary'],
      ['Lieu 3', null, 'unknown'],
      ['Lieu 4', 'tea_house', 'primary'],
    ])
  })

  it('lieux en attente d’avant la migration (sans type) : unknown', async () => {
    const row = runRow(serializePendingPlaces([place(1)]))
    row.category = { id: 'c', name: 'Cafés', google_types: ['cafe'], subcategories: [] } as typeof row.category
    mockRunFindFirst.mockResolvedValue(row)

    await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    expect(mockCandidateCreate.mock.calls[0]![0].data).toMatchObject({ primary_type: null, type_match: 'unknown' })
  })
})
