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
import { markStalledRuns, processPendingCandidates, resumeAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

// Spec 072 — traitement par lots reprenables.
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

describe('spec 093 AC-01 / AC-04 — descriptions d’acquisition développées', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunUpdate.mockResolvedValue({})
    mockPoiFindMany.mockResolvedValue([])
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 })
    mockCandidateCreate.mockResolvedValue({})
  })

  it('demande 120 à 300 mots et coupe la réponse à 300 mots, à la fin d’une phrase', async () => {
    const sentence = 'Ce restaurant propose une cuisine savoyarde de saison dans une salle chaleureuse en bois.'
    mockCallGemini.mockResolvedValue([{ description: Array.from({ length: 40 }, () => sentence).join(' ') }])
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces([place(1)])))

    await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    expect(String(mockCallGemini.mock.calls[0][0])).toContain('120 à 300 mots')
    expect(String(mockCallGemini.mock.calls[0][0])).not.toContain('2 à 3 phrases')
    const description = mockCandidateCreate.mock.calls[0][0].data.description as string
    expect(description.split(/\s+/).length).toBeLessThanOrEqual(300)
    expect(description.endsWith('bois.')).toBe(true)
  })
})
