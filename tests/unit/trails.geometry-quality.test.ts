import { assessGeometryQuality, classifyTrailQuality } from '@/features/trails-acquisition/lib/geometry-quality'

const lineString = (coords: Array<[number, number]>) => ({ type: 'LineString', coordinates: coords })

const denseTrack = () => {
  const coords: Array<[number, number]> = []
  for (let i = 0; i <= 100; i += 1) coords.push([6.70 + i * 0.0001, 45.80 + i * 0.0001])
  return lineString(coords)
}

describe('assessGeometryQuality', () => {
  it('returns null for missing or degenerate geometry', () => {
    expect(assessGeometryQuality(null)).toBeNull()
    expect(assessGeometryQuality(lineString([[6.7, 45.8]]))).toBeNull() // 1 point
    expect(assessGeometryQuality({ type: 'Point', coordinates: [6.7, 45.8] })).toBeNull()
  })

  it('flags a 2-point straight line as a huge gap and very low density', () => {
    const q = assessGeometryQuality(lineString([[6.70, 45.80], [6.70, 45.82]]))!
    expect(q.point_count).toBe(2)
    expect(q.max_gap_m).toBeGreaterThan(1000)
    expect(q.density_per_km).toBeLessThan(2)
  })

  it('reports high density and small gaps for a dense track', () => {
    const q = assessGeometryQuality(denseTrack())!
    expect(q.point_count).toBe(101)
    expect(q.max_gap_m).toBeLessThan(50)
    expect(q.density_per_km).toBeGreaterThan(20)
  })

  it('handles MultiLineString by summing segments', () => {
    const q = assessGeometryQuality({
      type: 'MultiLineString',
      coordinates: [
        [[6.70, 45.80], [6.7001, 45.8001]],
        [[6.71, 45.81], [6.7101, 45.8101]],
      ],
    })!
    expect(q.segment_count).toBe(2)
    expect(q.point_count).toBe(4)
  })
})

describe('classifyTrailQuality', () => {
  it('marks a dense, non-inherited geometry as complete', () => {
    expect(classifyTrailQuality({ geometry: denseTrack(), sourceRefs: [] })).toBe('complete')
  })

  it('marks a 2-point straight line as indicative', () => {
    expect(classifyTrailQuality({ geometry: lineString([[6.70, 45.80], [6.70, 45.82]]), sourceRefs: [] }))
      .toBe('indicative')
  })

  it('marks inherited geometry as indicative even when dense', () => {
    expect(classifyTrailQuality({ geometry: denseTrack(), sourceRefs: [{ type: 'inherited' }] }))
      .toBe('indicative')
  })

  it('marks missing geometry as incomplete', () => {
    expect(classifyTrailQuality({ geometry: null, sourceRefs: [] })).toBe('incomplete')
  })
})
