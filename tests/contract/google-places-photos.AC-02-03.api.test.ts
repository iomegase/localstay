import { NextRequest } from 'next/server'

const mockFindFirst = jest.fn()
const mockFetchPhotos = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { pointOfInterest: { findFirst: (...args: unknown[]) => mockFindFirst(...args) } } }))
jest.mock('@/features/google-places-photos/services/place-photos', () => ({ fetchGooglePlacePhotos: (...args: unknown[]) => mockFetchPhotos(...args) }))

import { GET } from '@/app/api/places/photos/route'

const POI = '0f6b8a1e-2b6f-4f3c-9d7e-1a2b3c4d5e6f'
const env = { ...process.env }
const get = (query: string) => GET(new NextRequest(`http://localhost/api/places/photos${query}`))

// Spec 103 AC-02-03 — GET /api/places/photos?poi=<uuid>.
describe('103 API — /api/places/photos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GOOGLE_PLACES_PHOTOS_ENABLED = 'true'
    process.env.GOOGLE_PLACES_API_KEY = 'k'
    mockFindFirst.mockResolvedValue({ photos: [], google_place_id: 'ChIJ1' })
    mockFetchPhotos.mockResolvedValue([{ url: 'https://lh3.googleusercontent.com/p/1', width: 1200, height: 900, authors: [{ name: 'A', uri: null }] }])
  })
  afterEach(() => { process.env = { ...env } })

  it('200 : photos d’un POI éligible, jamais en cache', async () => {
    const res = await get(`?poi=${POI}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    await expect(res.json()).resolves.toEqual({ data: { photos: [{ url: 'https://lh3.googleusercontent.com/p/1', width: 1200, height: 900, authors: [{ name: 'A', uri: null }] }] } })
    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: POI, deleted_at: null, is_active: true } }))
    expect(mockFetchPhotos).toHaveBeenCalledWith('ChIJ1')
  })

  it('400 INVALID_INPUT : identifiant non UUID', async () => {
    const res = await get('?poi=abc')
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: { code: 'INVALID_INPUT' } })
  })

  it('404 NOT_FOUND : POI avec photos MyStay, sans Google, inconnu, ou fonction désactivée — sans appel Google', async () => {
    for (const setup of [
      () => mockFindFirst.mockResolvedValue({ photos: ['https://upload.wikimedia.org/a.jpg'], google_place_id: 'ChIJ1' }),
      () => mockFindFirst.mockResolvedValue({ photos: [], google_place_id: null }),
      () => mockFindFirst.mockResolvedValue(null),
      () => { process.env.GOOGLE_PLACES_PHOTOS_ENABLED = 'false' },
    ]) {
      setup()
      const res = await get(`?poi=${POI}`)
      expect(res.status).toBe(404)
      expect(res.headers.get('Cache-Control')).toBe('no-store')
    }
    expect(mockFetchPhotos).not.toHaveBeenCalled()
  })
})
