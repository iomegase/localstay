import { lodgingDetailMetadata, lodgingListMetadata } from '@/features/seo/lib/metadata'
import { lodgingPlaceSchema } from '@/features/seo/lib/structured-data'

describe('lodgingListMetadata', () => {
  it('builds metadata for the canonical global lodging list', () => {
    const metadata = lodgingListMetadata()
    expect(metadata.title).toBe('Nos logements')
    expect(metadata.title).not.toContain('MyStay')
    expect(metadata.alternates?.canonical).toBe('/logements')
  })
})

describe('lodgingDetailMetadata', () => {
  it('builds a title, canonical and Open Graph image for a lodging detail', () => {
    const metadata = lodgingDetailMetadata({
      title: 'Chalet Hygge',
      shortDescription: 'Un chalet lumineux au calme pour profiter d Annecy.',
      lodgingSlug: 'chalet-hygge',
      coverPhoto: 'https://img.test/cover.webp',
    })

    expect(metadata.title).toContain('Chalet Hygge')
    expect(metadata.alternates?.canonical).toBe('/logements/chalet-hygge')
    expect(metadata.openGraph).toEqual(expect.objectContaining({ url: '/logements/chalet-hygge' }))
    expect(metadata.openGraph?.images).toEqual(['https://img.test/cover.webp'])
  })

  it('uses the short public URL in lodging structured data', () => {
    const schema = lodgingPlaceSchema({
      id: 'profile-1',
      title: 'Chalet Hygge',
      shortDescription: 'Un chalet lumineux au calme.',
      description: 'Une description visible et detaillee.',
      cityName: 'Annecy',
      cityRegion: 'Auvergne-Rhone-Alpes',
      slug: 'chalet-hygge',
      propertyType: 'Chalet',
      maxGuests: 4,
      publicAreaLabel: 'Annecy-le-Vieux',
      preciseLocationPublic: false,
      publicLatitude: null,
      publicLongitude: null,
      photos: [{ url: 'https://img.test/cover.webp', alt: 'Salon', is_cover: true, room_type: 'common_area' }],
      amenities: [{ code: 'wifi', label: 'Wi-Fi' }],
    })

    expect(schema.url).toBe('https://www.mystay.city/logements/chalet-hygge')
    expect(schema['@id']).toBe('https://www.mystay.city/logements/chalet-hygge#lodging')
  })
})
