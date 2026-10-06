import { NextRequest } from 'next/server'

const mockFindCity = jest.fn()
const mockFindFirstProfile = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: (...args: unknown[]) => mockFindCity(...args) },
    lodgingPublicProfile: { findFirst: (...args: unknown[]) => mockFindFirstProfile(...args) },
  },
}))

import { GET } from '@/app/api/cities/[slug]/lodgings/[lodgingSlug]/route'

const profile = (customization: { lodging_latitude: number | null; lodging_longitude: number | null } | null) => ({
  id: 'profile-1',
  slug: 'chalet-hygge',
  title: 'Chalet Hygge',
  short_description: 'Un chalet chaleureux.',
  property_type: 'Chalet',
  max_guests: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 1,
  surface_m2: 70,
  description: null,
  public_area_label: 'Centre-ville',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: null,
  external_booking_platform: null,
  public_contact_enabled: false,
  seo_title: null,
  seo_description: null,
  updated_at: new Date('2026-10-01'),
  city: { slug: 'annecy', name: 'Annecy' },
  photos: [],
  amenities: [],
  faq_items: [],
  lodging: { customization, featured_pois: [] },
})

async function fetchDetail() {
  const res = await GET(
    new NextRequest('http://localhost:3000/api/cities/annecy/lodgings/chalet-hygge'),
    { params: Promise.resolve({ slug: 'annecy', lodgingSlug: 'chalet-hygge' }) },
  )
  expect(res.status).toBe(200)
  return res.json()
}

describe('spec 088 — approximate_location in the public lodging detail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy', is_active: true, deleted_at: null, region: 'ARA' })
  })

  it('AC-03: exposes only a fuzzed centre and radius, never the exact address coordinates', async () => {
    mockFindFirstProfile.mockResolvedValue(profile({ lodging_latitude: 45.899247, lodging_longitude: 6.129384 }))
    const json = await fetchDetail()

    expect(json.approximate_location).toEqual({ latitude: expect.any(Number), longitude: expect.any(Number), radius_m: 50 })
    expect(json.approximate_location.latitude).not.toBe(45.899247)
    const body = JSON.stringify(json)
    expect(body).not.toContain('45.899247')
    expect(body).not.toContain('6.129384')
    expect(body).not.toContain('lodging_latitude')
    expect(mockFindFirstProfile.mock.calls[0][0].select.lodging.select.customization).toEqual({
      select: { lodging_latitude: true, lodging_longitude: true },
    })
  })

  it('AC-04: returns null when the lodging address is not geocoded', async () => {
    mockFindFirstProfile.mockResolvedValue(profile({ lodging_latitude: null, lodging_longitude: null }))
    expect((await fetchDetail()).approximate_location).toBeNull()

    mockFindFirstProfile.mockResolvedValue(profile(null))
    expect((await fetchDetail()).approximate_location).toBeNull()
  })
})
