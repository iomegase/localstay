const mockFindMany = jest.fn()
const mockUpdate = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    trailDetail: { findMany: (...a: unknown[]) => mockFindMany(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

const mockRefine = jest.fn()
jest.mock('@/features/trails-acquisition/services/refine-geometry', () => ({
  refineTrailGeometry: (...a: unknown[]) => mockRefine(...a),
}))

import { refinePendingTrailGeometries } from '@/features/trails-acquisition/queries/refine-geometry'

const tx = { trailDetail: { update: (...a: unknown[]) => mockUpdate(...a) } }

const sparse = { type: 'LineString', coordinates: [[6.70, 45.80], [6.70, 45.818]] }
function denseRefined() {
  const coords: Array<[number, number]> = []
  for (let i = 0; i <= 100; i += 1) coords.push([6.70 + i * 0.0001, 45.80 + i * 0.0001])
  return {
    geometry: { type: 'LineString' as const, coordinates: coords },
    source_ref: { type: 'ors_match', attribution: 'ORS', used_for: ['geometry'] },
  }
}

describe('refinePendingTrailGeometries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdate.mockResolvedValue({})
    mockTransaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
  })

  it('only selects trails that are not already complete (leaves good OSM tracks untouched)', async () => {
    mockFindMany.mockResolvedValue([])
    await refinePendingTrailGeometries(10)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          geometry_refined_at: null,
          data_quality_status: { not: 'complete' },
        }),
      }),
    )
  })

  it('refines, backs up raw geometry, appends provenance, and reclassifies to complete', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'td-1', geometry_geojson: sparse, source_refs: [{ type: 'manual' }], geometry_raw_geojson: null },
    ])
    mockRefine.mockResolvedValue(denseRefined())

    const result = await refinePendingTrailGeometries(10)

    expect(result).toEqual({ processed: 1, refined: 1, skipped: 0 })
    const data = (mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.geometry_raw_geojson).toEqual(sparse) // raw backed up
    expect((data.geometry_geojson as { coordinates: unknown[] }).coordinates.length).toBeGreaterThan(2)
    expect(data.geometry_refined_at).toBeInstanceOf(Date)
    expect(data.data_quality_status).toBe('complete')
    expect(data.source_refs).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'ors_match' })]),
    )
  })

  it('does not overwrite an already-present raw backup', async () => {
    const existingRaw = { type: 'LineString', coordinates: [[1, 1], [2, 2]] }
    mockFindMany.mockResolvedValue([
      { id: 'td-1', geometry_geojson: sparse, source_refs: [], geometry_raw_geojson: existingRaw },
    ])
    mockRefine.mockResolvedValue(denseRefined())

    await refinePendingTrailGeometries(10)

    const data = (mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.geometry_raw_geojson).toBeUndefined() // left intact
  })

  it('marks refined_at but leaves geometry untouched when ORS returns null', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'td-1', geometry_geojson: sparse, source_refs: [], geometry_raw_geojson: null },
    ])
    mockRefine.mockResolvedValue(null)

    const result = await refinePendingTrailGeometries(10)

    expect(result).toEqual({ processed: 1, refined: 0, skipped: 1 })
    const data = (mockUpdate.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(data.geometry_refined_at).toBeInstanceOf(Date)
    expect(data.geometry_geojson).toBeUndefined()
    expect(data.data_quality_status).toBeUndefined()
  })
})
