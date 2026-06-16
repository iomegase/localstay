import { buildSitemapEntries } from '@/features/seo/lib/sitemap'

const d1 = new Date('2026-06-01T00:00:00Z')
const d2 = new Date('2026-06-02T00:00:00Z')

describe('buildSitemapEntries', () => {
  const base = 'https://mystay.example.com'
  const result = buildSitemapEntries({
    baseUrl: base,
    staticPaths: ['/contact'],
    cities: [{ slug: 'saint-gervais-les-bains', updated_at: d1 }],
    pois: [
      { slug: 'jannett-glisse', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces', updated_at: d2 },
      { slug: 'col-de-voza', city_slug: 'saint-gervais-les-bains', category_slug: 'rando', updated_at: d2 },
      { slug: 'autre-magasin', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces', updated_at: d2 },
    ],
    lodgings: [
      { slug: 'chalet-hygge', city_slug: 'saint-gervais-les-bains', updated_at: d2 },
      { slug: 'appartement-soleil', city_slug: 'saint-gervais-les-bains', updated_at: d2 },
    ],
  })
  const urls = result.map(e => e.url)

  it('includes the homepage and static paths', () => {
    expect(urls).toContain(`${base}/`)
    expect(urls).toContain(`${base}/contact`)
  })

  it('includes one entry per city with its lastModified', () => {
    const city = result.find(e => e.url === `${base}/guide/saint-gervais-les-bains`)
    expect(city).toBeDefined()
    expect(city?.lastModified).toBe(d1)
  })

  it('includes every POI detail URL', () => {
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/commerces/jannett-glisse`)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/rando/col-de-voza`)
  })

  it('derives distinct category pages from POIs (no duplicates)', () => {
    const commerces = urls.filter(u => u === `${base}/guide/saint-gervais-les-bains/commerces`)
    expect(commerces).toHaveLength(1)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/rando`)
  })

  it('includes one lodging list per city and each published lodging detail', () => {
    expect(urls.filter(u => u === `${base}/guide/saint-gervais-les-bains/logements`)).toHaveLength(1)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/logements/chalet-hygge`)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/logements/appartement-soleil`)
  })
})
