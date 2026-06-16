import {
  lodgingItemListSchema,
  lodgingPlaceSchema,
  vacationRentalSchema,
} from '@/features/seo/lib/structured-data'

const BASE = 'https://mystay.example.com'

describe('lodging showcase structured data', () => {
  const realBase = process.env.NEXT_PUBLIC_BASE_URL

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = BASE
  })

  afterAll(() => {
    if (realBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = realBase
  })

  const input = {
    id: 'profile-1',
    title: 'Chalet Hygge',
    shortDescription: 'Un chalet lumineux a Annecy.',
    description: 'Une description detaillee du logement pour la page publique MyStay.',
    cityName: 'Annecy',
    cityRegion: 'Auvergne-Rhone-Alpes',
    citySlug: 'annecy',
    slug: 'chalet-hygge',
    propertyType: 'Chalet',
    maxGuests: 4,
    publicAreaLabel: 'Annecy-le-Vieux',
    preciseLocationPublic: false,
    publicLatitude: null,
    publicLongitude: null,
    photos: [
      { url: 'https://img.test/cover.webp', alt: 'Salon', is_cover: true, room_type: 'common_area' },
    ],
    amenities: [{ code: 'wifi', label: 'Wi-Fi' }],
  } as const

  it('builds a LodgingBusiness fallback schema', () => {
    const schema = lodgingPlaceSchema(input)
    expect(schema['@type']).toBe('LodgingBusiness')
    expect(schema.url).toBe(`${BASE}/guide/annecy/logements/chalet-hygge`)
  })

  it('does not emit VacationRental without public coordinates and enough classified photos', () => {
    expect(vacationRentalSchema(input)).toBeNull()
  })

  it('builds an ItemList for city lodging pages', () => {
    const schema = lodgingItemListSchema({
      cityName: 'Annecy',
      citySlug: 'annecy',
      items: [
        {
          id: 'profile-1',
          slug: 'chalet-hygge',
          title: 'Chalet Hygge',
          short_description: 'Desc',
          property_type: 'Chalet',
          max_guests: 4,
          public_area_label: 'Annecy-le-Vieux',
          cover_photo_url: 'https://img.test/cover.webp',
          amenities: [],
          href: '/guide/annecy/logements/chalet-hygge',
          bedroom_count: 2,
          external_booking_platform: null,
          public_contact_enabled: true,
          description: 'Desc',
          bathroom_count: 1,
          bed_count: 2,
          surface_m2: 70,
          precise_location_public: false,
          public_latitude: null,
          public_longitude: null,
          external_booking_url: null,
          photos: [],
          owner_recommendations: [],
        },
      ],
    })

    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toHaveLength(1)
  })
})
