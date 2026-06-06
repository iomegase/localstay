import { poiMetadata, cityMetadata, categoryMetadata } from '@/features/seo/lib/metadata'

describe('poiMetadata', () => {
  const base = {
    name: 'Jannett Glisse',
    description: 'Location de skis et snowboards au pied de la télécabine.',
    cityName: 'Saint-Gervais-les-Bains',
    categoryName: 'Commerces',
    citySlug: 'saint-gervais-les-bains',
    categorySlug: 'commerces',
    poiSlug: 'jannett-glisse',
    photo: 'https://img/p.jpg',
  }

  it('builds a title with the POI name, category and city', () => {
    const m = poiMetadata(base)
    expect(m.title).toContain('Jannett Glisse')
    expect(m.title).toContain('Commerces')
    expect(m.title).toContain('Saint-Gervais-les-Bains')
  })

  it('uses the description and keeps it under ~160 chars', () => {
    const long = poiMetadata({ ...base, description: 'x'.repeat(400) })
    expect((long.description ?? '').length).toBeLessThanOrEqual(160)
  })

  it('falls back to a generated description when none is set', () => {
    const m = poiMetadata({ ...base, description: null })
    expect(m.description).toBeTruthy()
    expect(m.description).toContain('Jannett Glisse')
  })

  it('sets a param-free canonical to the POI detail path', () => {
    expect(poiMetadata(base).alternates?.canonical).toBe(
      '/guide/saint-gervais-les-bains/commerces/jannett-glisse',
    )
  })

  it('exposes the first photo as the Open Graph image', () => {
    expect(poiMetadata(base).openGraph?.images).toEqual(['https://img/p.jpg'])
    expect(poiMetadata({ ...base, photo: null }).openGraph?.images).toBeUndefined()
  })
})

describe('cityMetadata', () => {
  it('builds a title with the city name and a canonical to /guide/{slug}', () => {
    const m = cityMetadata({ name: 'Saint-Gervais-les-Bains', region: 'Auvergne-Rhône-Alpes', slug: 'saint-gervais-les-bains' })
    expect(m.title).toContain('Saint-Gervais-les-Bains')
    expect(m.alternates?.canonical).toBe('/guide/saint-gervais-les-bains')
  })
})

describe('categoryMetadata', () => {
  it('builds a title with category + city and a canonical to /guide/{city}/{cat}', () => {
    const m = categoryMetadata({
      cityName: 'Saint-Gervais-les-Bains',
      categoryName: 'Randonnées',
      citySlug: 'saint-gervais-les-bains',
      categorySlug: 'rando',
    })
    expect(m.title).toContain('Randonnées')
    expect(m.title).toContain('Saint-Gervais-les-Bains')
    expect(m.alternates?.canonical).toBe('/guide/saint-gervais-les-bains/rando')
  })
})
