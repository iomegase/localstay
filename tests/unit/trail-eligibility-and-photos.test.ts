import { getPoiDiscoveryEligibility } from '@/features/public-discovery/lib/eligibility'
import {
  enrichCandidatesWithCamptocampPhotos,
  findCamptocampPhotos,
  isSamePlace,
  placeQueries,
} from '@/features/trails-acquisition/services/camptocamp-photos'
import { lngToMercatorX, latToMercatorY } from '@/features/trails-acquisition/lib/projection'

const base = {
  is_active: true, deleted_at: null, description: 'x'.repeat(200), address: '', latitude: 45.82, longitude: 6.72,
  geocode_status: 'success', phone: null, website: null, photos: [],
  city: { is_active: true, deleted_at: null }, category: { is_active: true, deleted_at: null }, subcategory: null,
}

describe('PO 2026-10-08 — une randonnée se publie sans contact ni adresse', () => {
  it('randonnée sans téléphone, site ni adresse : publiable', () => {
    expect(getPoiDiscoveryEligibility({ ...base, trail_detail: { deleted_at: null } })).toEqual({ eligible: true, missing: [] })
  })
  it('autre lieu : contact et adresse toujours exigés', () => {
    expect(getPoiDiscoveryEligibility(base).missing).toEqual(['address', 'contact'])
    expect(getPoiDiscoveryEligibility({ ...base, trail_detail: { deleted_at: new Date() } }).missing).toEqual(['address', 'contact'])
  })
  it('une randonnée reste soumise au départ géolocalisé et à la description', () => {
    expect(getPoiDiscoveryEligibility({ ...base, trail_detail: { deleted_at: null }, geocode_status: 'pending', description: null }).missing)
      .toEqual(['description', 'photo', 'geocode'])
  })
})

const city = { latitude: 45.8228, longitude: 6.7272 }
const point = (lng: number, lat: number) => JSON.stringify({ type: 'Point', coordinates: [lngToMercatorX(lng), latToMercatorY(lat)] })
const image = (filename: string) => ({ filename, author: 'Alice', locales: [{ lang: 'fr', title: 'Vue' }] })

describe('spec 019 AC-02-09 — photos Camptocamp des randonnées', () => {
  it('noms de lieux cherchés et correspondance stricte', () => {
    expect(placeQueries('Refuge du Truc et Chalets de Miage')).toEqual(['refuge du truc et chalets de miage', 'refuge du truc', 'chalets de miage'])
    expect(placeQueries('Boucle de Miage')).toEqual(['miage'])
    expect(isSamePlace('lacs jovet', 'Lacs Jovet')).toBe(true)
    expect(isSamePlace('refuge de la balme', 'Refuge de la Balme (Contamines)')).toBe(true)
    expect(isSamePlace('miage', 'Dômes de Miage')).toBe(false)
    expect(isSamePlace('lac de roselette', 'Lac de Roselend')).toBe(false)
  })

  it('itinéraire Camptocamp sans image : photos de ses lieux associés, créditées', async () => {
    const fetcher = jest.fn(async (path: string) => (path === '/waypoints/11' ? { associations: { images: [image('a.jpg'), image('b.jpg')] } } : {}))
    const photos = await findCamptocampPhotos(
      { title: 'Depuis la Gruvaz', primary_source_type: 'camptocamp', raw_payload: { associations: { waypoints: [{ document_id: 11 }] } } },
      city, fetcher,
    )
    expect(photos.map(photo => [photo.url, photo.source_url, photo.attribution])).toEqual([
      ['https://media.camptocamp.org/c2corg-active/a.jpg', 'https://www.camptocamp.org/waypoints/11', 'Alice — Camptocamp.org'],
      ['https://media.camptocamp.org/c2corg-active/b.jpg', 'https://www.camptocamp.org/waypoints/11', 'Alice — Camptocamp.org'],
    ])
  })

  it('tracé OSM : lieu du même nom à moins de 10 km ; homonyme lointain ou nom différent ignorés', async () => {
    const fetcher = jest.fn(async (path: string) => {
      if (path.startsWith('/search')) return { waypoints: { documents: [
        { document_id: 1, locales: [{ title: 'Lacs Jovet' }], geometry: { geom: point(6.0, 45.0) } },
        { document_id: 2, locales: [{ title: 'Lacs Jovet' }], geometry: { geom: point(6.736, 45.766) } },
      ] } }
      if (path === '/waypoints/2') return { associations: { images: [image('jovet.jpg')] } }
      return { associations: { images: [image('faux.jpg')] } }
    })
    const photos = await findCamptocampPhotos({ title: 'Les Lacs Jovet', primary_source_type: 'overpass', raw_payload: {} }, city, fetcher)
    expect(photos.map(photo => photo.url)).toEqual(['https://media.camptocamp.org/c2corg-active/jovet.jpg'])
    expect(fetcher).not.toHaveBeenCalledWith('/waypoints/1', undefined)
  })

  it('enrichissement : seuls les candidats sans photo, échecs comptés sans bloquer', async () => {
    const withPhoto = { title: 'A', primary_source_type: 'camptocamp', raw_payload: { acquired_photos: [{ url: 'https://x/a.jpg', source_url: 'https://x', attribution: 'X' }] } }
    const found = { title: 'Les Lacs Jovet', primary_source_type: 'overpass', raw_payload: {} as unknown }
    const failing = { title: 'Lac de Roselette', primary_source_type: 'gemini', raw_payload: {} as unknown }
    const fetcher = jest.fn(async (path: string) => {
      if (path.includes('roselette')) throw new Error('Camptocamp HTTP 500')
      if (path.startsWith('/search')) return { waypoints: { documents: [{ document_id: 2, locales: [{ title: 'Lacs Jovet' }], geometry: { geom: point(6.736, 45.766) } }] } }
      return { associations: { images: [image('jovet.jpg')] } }
    })
    const result = await enrichCandidatesWithCamptocampPhotos([withPhoto, found, failing], city, undefined, fetcher)
    expect(result).toEqual({ enriched: 1, errors: 1 })
    expect((found.raw_payload as { acquired_photos: unknown[] }).acquired_photos).toHaveLength(1)
    expect(fetcher.mock.calls.some(([path]) => String(path).includes('q=a&'))).toBe(false)
  })
})
