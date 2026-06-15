import { lodgingDetailMetadata, lodgingListMetadata } from '@/features/seo/lib/metadata'

describe('lodgingListMetadata', () => {
  it('builds a title and canonical for the city lodging list', () => {
    const metadata = lodgingListMetadata({ cityName: 'Annecy', citySlug: 'annecy' })
    expect(metadata.title).toContain('Logements à Annecy')
    expect(metadata.alternates?.canonical).toBe('/guide/annecy/logements')
  })
})

describe('lodgingDetailMetadata', () => {
  it('builds a title, canonical and Open Graph image for a lodging detail', () => {
    const metadata = lodgingDetailMetadata({
      title: 'Chalet Hygge',
      shortDescription: 'Un chalet lumineux au calme pour profiter d Annecy.',
      citySlug: 'annecy',
      lodgingSlug: 'chalet-hygge',
      coverPhoto: 'https://img.test/cover.webp',
    })

    expect(metadata.title).toContain('Chalet Hygge')
    expect(metadata.alternates?.canonical).toBe('/guide/annecy/logements/chalet-hygge')
    expect(metadata.openGraph?.images).toEqual(['https://img.test/cover.webp'])
  })
})
