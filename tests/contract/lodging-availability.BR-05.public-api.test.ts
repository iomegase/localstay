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

describe('spec 089 BR-05 — le lien iCal n’est jamais exposé publiquement', () => {
  it('ni sélectionné par la requête publique, ni présent dans la réponse', async () => {
    mockFindCity.mockResolvedValue({ id: 'city-1', slug: 'annecy', name: 'Annecy', is_active: true, deleted_at: null, region: 'ARA' })
    mockFindFirstProfile.mockResolvedValue({ ...profile(null), availability_ical_url: 'https://www.airbnb.fr/calendar/ical/1.ics?s=secret' })
    const json = await fetchDetail()

    expect(JSON.stringify(json)).not.toMatch(/ical|secret/)
    expect(mockFindFirstProfile.mock.calls[0][0].select).not.toHaveProperty('availability_ical_url')
  })
})
