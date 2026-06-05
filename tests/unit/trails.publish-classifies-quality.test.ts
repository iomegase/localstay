const mockCandidateFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockTransaction = jest.fn()
const mockPoiFindFirst = jest.fn()
const mockPoiCreate = jest.fn()
const mockTrailDetailCreate = jest.fn()
const mockCandidateUpdate = jest.fn()
const mockAuditCreate = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    trailCandidate: { findFirst: (...a: unknown[]) => mockCandidateFindFirst(...a) },
    category: { findFirst: (...a: unknown[]) => mockCategoryFindFirst(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

import { publishTrailCandidate } from '@/features/trails-acquisition/queries/review'

const tx = {
  pointOfInterest: {
    findFirst: (...a: unknown[]) => mockPoiFindFirst(...a),
    create: (...a: unknown[]) => mockPoiCreate(...a),
  },
  trailDetail: { create: (...a: unknown[]) => mockTrailDetailCreate(...a) },
  trailCandidate: { update: (...a: unknown[]) => mockCandidateUpdate(...a) },
  trailAuditLog: { create: (...a: unknown[]) => mockAuditCreate(...a) },
}

const auditShape = {
  id: 'cand-1',
  review_status: 'published',
  published_poi_id: 'poi-1',
  trail_detail_id: 'td-1',
  admin_note: null,
}

function baseCandidate(geometry: unknown) {
  return {
    id: 'cand-1',
    title: 'Col de la Forclaz',
    description: 'desc',
    primary_source_type: 'manual',
    source_refs: [{ type: 'manual', attribution: 'Saisie admin', used_for: ['geometry'] }],
    difficulty: 'medium',
    distance_km: 4,
    elevation_gain_m: 300,
    estimated_duration_min: 120,
    loop_type: null,
    activity_type: 'hiking',
    data_quality_status: 'needs_review',
    start_label: 'Parking',
    start_latitude: 45.8,
    start_longitude: 6.7,
    geometry_status: 'valid', // <- old code would mark this 'complete' regardless of density
    geometry_geojson: geometry,
    duplicate_poi_ids: [],
    review_status: 'needs_review',
    published_poi_id: null,
    trail_detail_id: null,
    admin_note: null,
    raw_payload: null,
    city_id: 'city-1',
    city: { id: 'city-1', name: 'Saint-Gervais', is_active: true, deleted_at: null },
  }
}

describe('publishTrailCandidate — data_quality_status comes from the geometry classifier', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCategoryFindFirst.mockResolvedValue({ id: 'rando-cat' })
    mockPoiFindFirst.mockResolvedValue(null) // slug unique on first try
    mockPoiCreate.mockResolvedValue({ id: 'poi-1' })
    mockTrailDetailCreate.mockResolvedValue({ id: 'td-1' })
    mockCandidateUpdate.mockResolvedValue(auditShape)
    mockAuditCreate.mockResolvedValue({})
    mockTransaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
  })

  it('stores "indicative" for a sparse 2-point straight geometry even when geometry_status=valid', async () => {
    mockCandidateFindFirst.mockResolvedValue(
      baseCandidate({ type: 'LineString', coordinates: [[6.70, 45.80], [6.70, 45.82]] }),
    )

    await publishTrailCandidate('cand-1', 'admin-1', { confirm_duplicate: false, confirm_incomplete_geometry: false })

    expect(mockTrailDetailCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ data_quality_status: 'indicative' }) }),
    )
  })

  it('stores "complete" for a dense self-sourced geometry', async () => {
    const coords: Array<[number, number]> = []
    for (let i = 0; i <= 100; i += 1) coords.push([6.70 + i * 0.0001, 45.80 + i * 0.0001])
    mockCandidateFindFirst.mockResolvedValue(baseCandidate({ type: 'LineString', coordinates: coords }))

    await publishTrailCandidate('cand-1', 'admin-1', { confirm_duplicate: false, confirm_incomplete_geometry: false })

    expect(mockTrailDetailCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ data_quality_status: 'complete' }) }),
    )
  })
})
