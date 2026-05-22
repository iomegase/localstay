import { getInitialViewState, poisToGeoJson, shouldCluster } from '@/features/categories/lib/map-utils'
import type { PoiCard } from '@/features/categories/types'

function makePoi(override: Partial<PoiCard> = {}): PoiCard {
  return {
    id: '1', name: 'Test', slug: 'test', address: 'Addr',
    subcategory_name: null, rating: 4.2, rating_count: 10,
    is_open_now: true, distance_km: 0.5, photo_url: null,
    latitude: 45.89, longitude: 6.71,
    ...override,
  }
}

describe('getInitialViewState — AC-01-02', () => {
  it('returns center matching city coordinates', () => {
    const vs = getInitialViewState(45.8921, 6.7085)
    expect(vs.latitude).toBe(45.8921)
    expect(vs.longitude).toBe(6.7085)
  })

  it('returns zoom level 13', () => {
    const vs = getInitialViewState(45.8921, 6.7085)
    expect(vs.zoom).toBe(13)
  })
})

describe('shouldCluster — AC-01-03 / BR-05', () => {
  it('returns false for 10 or fewer POI', () => {
    expect(shouldCluster(10)).toBe(false)
    expect(shouldCluster(1)).toBe(false)
    expect(shouldCluster(0)).toBe(false)
  })

  it('returns true for more than 10 POI', () => {
    expect(shouldCluster(11)).toBe(true)
    expect(shouldCluster(50)).toBe(true)
  })
})

describe('poisToGeoJson', () => {
  it('produces a FeatureCollection with one feature per POI', () => {
    const pois = [makePoi({ id: 'a' }), makePoi({ id: 'b' })]
    const geojson = poisToGeoJson(pois)
    expect(geojson.type).toBe('FeatureCollection')
    expect(geojson.features).toHaveLength(2)
  })

  it('feature geometry uses [longitude, latitude]', () => {
    const pois = [makePoi({ latitude: 45.89, longitude: 6.71 })]
    const geojson = poisToGeoJson(pois)
    expect(geojson.features[0].geometry.coordinates).toEqual([6.71, 45.89])
  })

  it('feature properties include id, name, slug, photo_url, rating', () => {
    const poi = makePoi({ id: 'x', name: 'Le Bistrot', slug: 'bistrot', rating: 4.5, photo_url: 'https://img.jpg' })
    const geojson = poisToGeoJson([poi])
    const props = geojson.features[0].properties
    expect(props.id).toBe('x')
    expect(props.name).toBe('Le Bistrot')
    expect(props.slug).toBe('bistrot')
    expect(props.rating).toBe(4.5)
    expect(props.photo_url).toBe('https://img.jpg')
  })
})
