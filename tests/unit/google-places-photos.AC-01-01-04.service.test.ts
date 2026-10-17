import { fetchGooglePlacePhotos } from '@/features/google-places-photos/services/place-photos'
import { googlePlacesPhotosEnabled, isEligibleForGooglePhotos } from '@/features/google-places-photos/lib/eligibility'

const env = { ...process.env }
const photo = (n: number) => ({
  name: `places/ChIJq3SzvCpaiUcRh_PkysWmD9k/photos/AF${n}`,
  widthPx: 4000,
  heightPx: 3000,
  authorAttributions: [{ displayName: `Auteur ${n}`, uri: `//maps.google.com/maps/contrib/${n}` }],
})

// Spec 103 — photos Google Maps en direct.
describe('103 — éligibilité', () => {
  afterEach(() => { process.env = { ...env } })

  it('AC-02-01 : désactivé par défaut, actif seulement avec GOOGLE_PLACES_PHOTOS_ENABLED=true et une clé', () => {
    delete process.env.GOOGLE_PLACES_PHOTOS_ENABLED
    process.env.GOOGLE_PLACES_API_KEY = 'k'
    expect(googlePlacesPhotosEnabled()).toBe(false)
    process.env.GOOGLE_PLACES_PHOTOS_ENABLED = 'true'
    expect(googlePlacesPhotosEnabled()).toBe(true)
    delete process.env.GOOGLE_PLACES_API_KEY
    expect(googlePlacesPhotosEnabled()).toBe(false)
  })

  it('BR-03 : un POI qui a des photos MyStay ou pas de google_place_id n’est jamais éligible', () => {
    process.env.GOOGLE_PLACES_PHOTOS_ENABLED = 'true'
    process.env.GOOGLE_PLACES_API_KEY = 'k'
    expect(isEligibleForGooglePhotos({ photos: [], google_place_id: 'ChIJ1' })).toBe(true)
    expect(isEligibleForGooglePhotos({ photos: ['https://upload.wikimedia.org/a.jpg'], google_place_id: 'ChIJ1' })).toBe(false)
    expect(isEligibleForGooglePhotos({ photos: [], google_place_id: null })).toBe(false)
  })
})

describe('103 — fetchGooglePlacePhotos', () => {
  const originalFetch = global.fetch
  beforeEach(() => { process.env.GOOGLE_PLACES_API_KEY = 'test-key' })
  afterEach(() => { global.fetch = originalFetch; process.env = { ...env } })

  it('AC-01-01 / AC-01-03 : 3 photos au plus, URL temporaires et auteurs, sans cache', async () => {
    const fetchMock = jest.fn(async (url: string) => {
      if (url.endsWith('/places/ChIJq3SzvCpaiUcRh_PkysWmD9k')) return Response.json({ photos: [photo(1), photo(2), photo(3), photo(4)] })
      const n = /AF(\d)/.exec(url)![1]
      return Response.json({ name: 'x', photoUri: `https://lh3.googleusercontent.com/p/${n}=s1200` })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const photos = await fetchGooglePlacePhotos('ChIJq3SzvCpaiUcRh_PkysWmD9k')
    expect(photos).toHaveLength(3)
    expect(photos[0]).toEqual({
      url: 'https://lh3.googleusercontent.com/p/1=s1200', width: 4000, height: 3000,
      authors: [{ name: 'Auteur 1', uri: 'https://maps.google.com/maps/contrib/1' }],
    })
    const [, detailsInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(detailsInit).toMatchObject({ cache: 'no-store', headers: { 'X-Goog-FieldMask': 'photos.name,photos.widthPx,photos.heightPx,photos.authorAttributions' } })
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/media?maxWidthPx=1200&skipHttpRedirect=true')
  })

  it('AC-01-04 : aucune photo, erreur Google ou identifiant invalide → liste vide', async () => {
    global.fetch = jest.fn(async () => Response.json({})) as unknown as typeof fetch
    await expect(fetchGooglePlacePhotos('ChIJ1')).resolves.toEqual([])
    global.fetch = jest.fn(async () => new Response('denied', { status: 403 })) as unknown as typeof fetch
    await expect(fetchGooglePlacePhotos('ChIJ1')).resolves.toEqual([])
    global.fetch = jest.fn(async () => { throw new Error('réseau') }) as unknown as typeof fetch
    await expect(fetchGooglePlacePhotos('ChIJ1')).resolves.toEqual([])
    await expect(fetchGooglePlacePhotos('../admin')).resolves.toEqual([])
  })
})
