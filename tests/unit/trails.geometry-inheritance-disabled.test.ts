import { inheritGeometryByTitle } from '@/features/trails-acquisition/lib/geometry-inheritance'

type C = {
  primary_source_type: string
  title: string
  source_refs?: unknown
  geometry_geojson?: unknown
  geometry_status?: string
  start_latitude?: number | null
  start_longitude?: number | null
}

describe('inheritGeometryByTitle — DISABLED (no fabricated geometry)', () => {
  it('does NOT copy a same-named donor geometry onto a geometry-less candidate', () => {
    const donor: C = {
      primary_source_type: 'overpass',
      title: 'Mont Joly',
      geometry_status: 'valid',
      geometry_geojson: { type: 'LineString', coordinates: [[6.70, 45.80], [6.71, 45.81]] },
      start_latitude: 45.8,
      start_longitude: 6.7,
    }
    const recipient: C = {
      primary_source_type: 'gemini',
      title: 'Mont Joly par les Communailles',
      geometry_status: 'missing',
    }

    const result = inheritGeometryByTitle([donor, recipient])

    expect(result.inherited).toBe(0)
    expect(result.details).toHaveLength(0)
    expect(recipient.geometry_geojson).toBeUndefined()
    expect(recipient.geometry_status).toBe('missing')
  })
})
