import { NextRequest } from 'next/server'

const mockFindCity = jest.fn()
const mockFindManyProfiles = jest.fn()
const mockFindFirstProfile = jest.fn()
const mockCountProfiles = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: {
      findFirst: (...args: unknown[]) => mockFindCity(...args),
    },
    lodgingPublicProfile: {
      findMany: (...args: unknown[]) => mockFindManyProfiles(...args),
      findFirst: (...args: unknown[]) => mockFindFirstProfile(...args),
      count: (...args: unknown[]) => mockCountProfiles(...args),
    },
  },
}))

import { GET } from '@/app/api/cities/[slug]/lodgings/route'
import { GET as DETAIL_GET } from '@/app/api/cities/[slug]/lodgings/[lodgingSlug]/route'

const publishedProfile = {
  id: 'profile-1',
  slug: 'chalet-hygge',
  title: 'Chalet Hygge',
  short_description: 'Un chalet chaleureux pour decouvrir Annecy et son guide MyStay.',
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  public_area_label: 'Annecy-le-Vieux',
  city: { slug: 'annecy', name: 'Annecy', region: 'Auvergne-Rhone-Alpes' },
  photos: [{ id: 'photo-1', url: 'https://img.test/cover.webp', alt: 'Salon', room_type: 'common_area', sort_order: 0, is_cover: true }],
  amenities: [{ code: 'wifi', label: 'Wi-Fi' }, { code: 'parking', label: 'Parking' }],
  description: 'Description detaillee du chalet pour le detail public.',
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  external_booking_url: 'https://www.airbnb.fr/rooms/123456789',
  external_booking_platform: 'airbnb',
  public_contact_enabled: true,
  lodging: {
    featured_pois: [],
  },
}

describe('GET /api/cities/[slug]/lodgings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy', is_active: true, deleted_at: null, region: 'Auvergne-Rhone-Alpes' })
  })

  it('AC-01-01: lists only published lodging profiles for a city', async () => {
    mockFindManyProfiles.mockResolvedValue([publishedProfile])
    mockCountProfiles.mockResolvedValue(1)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/cities/annecy/lodgings'),
      { params: Promise.resolve({ slug: 'annecy' }) },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.items).toHaveLength(1)
    expect(json.meta.total).toBe(1)
    expect(mockFindManyProfiles).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ city_id: 'city-1', publication_status: 'published', deleted_at: null }),
    }))
  })

  it('AC-01-03: parses guests and amenities filters', async () => {
    mockFindManyProfiles.mockResolvedValue([])
    mockCountProfiles.mockResolvedValue(0)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/cities/annecy/lodgings?guests=4&amenities=wifi,parking&page=2&limit=6'),
      { params: Promise.resolve({ slug: 'annecy' }) },
    )

    expect(res.status).toBe(200)
    expect(mockFindManyProfiles).toHaveBeenCalledWith(expect.objectContaining({
      skip: 6,
      take: 6,
      where: expect.objectContaining({
        max_guests: { gte: 4 },
      }),
    }))
    expect(mockCountProfiles).toHaveBeenCalled()
  })

  it('returns 400 for invalid query parameters', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/cities/annecy/lodgings?limit=999'),
      { params: Promise.resolve({ slug: 'annecy' }) },
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockFindManyProfiles).not.toHaveBeenCalled()
  })

  it('returns 404 when the city does not exist', async () => {
    mockFindCity.mockResolvedValue(null)

    const res = await GET(
      new NextRequest('http://localhost:3000/api/cities/inconnue/lodgings'),
      { params: Promise.resolve({ slug: 'inconnue' }) },
    )

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error.code).toBe('NOT_FOUND')
  })
})

describe('GET /api/cities/[slug]/lodgings/[lodgingSlug]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy', is_active: true, deleted_at: null, region: 'Auvergne-Rhone-Alpes' })
  })

  it('AC-02-01: returns the published lodging detail for a city slug and lodging slug', async () => {
    mockFindFirstProfile.mockResolvedValue(publishedProfile)

    const res = await DETAIL_GET(
      new NextRequest('http://localhost:3000/api/cities/annecy/lodgings/chalet-hygge'),
      { params: Promise.resolve({ slug: 'annecy', lodgingSlug: 'chalet-hygge' }) },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.slug).toBe('chalet-hygge')
    expect(json.external_booking_platform).toBe('airbnb')
    expect(mockFindFirstProfile).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ city_id: 'city-1', slug: 'chalet-hygge', publication_status: 'published', deleted_at: null }),
    }))
  })

  it('AC-02-03: returns 404 for non-published detail', async () => {
    mockFindFirstProfile.mockResolvedValue(null)

    const res = await DETAIL_GET(
      new NextRequest('http://localhost:3000/api/cities/annecy/lodgings/draft'),
      { params: Promise.resolve({ slug: 'annecy', lodgingSlug: 'draft' }) },
    )

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error.code).toBe('NOT_FOUND')
  })
})
