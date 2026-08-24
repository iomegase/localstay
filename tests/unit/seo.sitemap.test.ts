import { buildSitemapEntries } from '@/features/seo/lib/sitemap'

const d1 = new Date('2026-06-01T00:00:00Z')
const d2 = new Date('2026-06-02T00:00:00Z')

describe('buildSitemapEntries', () => {
  const base = 'https://mystay.example.com'
  const result = buildSitemapEntries({
    baseUrl: base,
    staticPaths: ['/', '/decouvrir', '/contact'],
    cities: [{ slug: 'saint-gervais-les-bains' }],
    pois: [
      { slug: 'jannett-glisse', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces' },
      { slug: 'col-de-voza', city_slug: 'saint-gervais-les-bains', category_slug: 'rando' },
      { slug: 'autre-magasin', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces' },
    ],
    lodgings: [
      { slug: 'chalet-hygge', city_slug: 'saint-gervais-les-bains', updated_at: d2 },
      { slug: 'appartement-soleil', city_slug: 'saint-gervais-les-bains', updated_at: d2 },
    ],
    blogArticles: [
      { slug: 'week-end-alpin', updated_at: d1 },
      { slug: 'adresses-locales', updated_at: d2 },
    ],
  })
  const urls = result.map(e => e.url)

  it('includes the homepage and static paths', () => {
    expect(urls.filter(url => url === `${base}/`)).toHaveLength(1)
    expect(urls.filter(url => url === `${base}/decouvrir`)).toHaveLength(1)
    expect(urls).toContain(`${base}/contact`)
  })

  it('uses the existing static metadata for the public discovery root', () => {
    expect(result.find(entry => entry.url === `${base}/decouvrir`)).toEqual({
      url: `${base}/decouvrir`,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  })

  it('includes one canonical discovery entry per city without a misleading lastModified', () => {
    const cityUrl = `${base}/decouvrir/saint-gervais-les-bains`
    const city = result.find(e => e.url === cityUrl)
    expect(urls.filter(url => url === cityUrl)).toHaveLength(1)
    expect(city).toBeDefined()
    expect(city?.lastModified).toBeUndefined()
  })

  it('includes every POI under its canonical discovery URL', () => {
    expect(urls).toContain(`${base}/decouvrir/saint-gervais-les-bains/commerces/jannett-glisse`)
    expect(urls).toContain(`${base}/decouvrir/saint-gervais-les-bains/rando/col-de-voza`)
  })

  it('derives distinct category pages from POIs (no duplicates)', () => {
    const commercesUrl = `${base}/decouvrir/saint-gervais-les-bains/commerces`
    const commerces = urls.filter(u => u === commercesUrl)
    expect(commerces).toHaveLength(1)
    expect(result.find(entry => entry.url === commercesUrl)?.lastModified).toBeUndefined()
    const randoUrl = `${base}/decouvrir/saint-gervais-les-bains/rando`
    expect(urls).toContain(randoUrl)
    expect(result.find(entry => entry.url === randoUrl)?.lastModified).toBeUndefined()
  })

  it('does not expose historical generic guide URLs', () => {
    expect(urls).not.toContain(`${base}/guide/saint-gervais-les-bains`)
    expect(urls).not.toContain(`${base}/guide/saint-gervais-les-bains/commerces`)
    expect(urls).not.toContain(`${base}/guide/saint-gervais-les-bains/commerces/jannett-glisse`)
  })

  it('includes one lodging list per city and each published lodging detail', () => {
    expect(urls.filter(u => u === `${base}/guide/saint-gervais-les-bains/logements`)).toHaveLength(1)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/logements/chalet-hygge`)
    expect(urls).toContain(`${base}/guide/saint-gervais-les-bains/logements/appartement-soleil`)
  })

  it('preserves explicit sitemap metadata without inventing discovery dates', () => {
    expect(result.find(entry => entry.url === `${base}/`)).toEqual(expect.objectContaining({
      changeFrequency: 'daily', priority: 1,
    }))
    expect(result.find(entry => entry.url === `${base}/decouvrir/saint-gervais-les-bains`)).toEqual({
      url: `${base}/decouvrir/saint-gervais-les-bains`,
      changeFrequency: 'daily',
      priority: 0.9,
    })
    expect(result.find(entry => entry.url === `${base}/decouvrir/saint-gervais-les-bains/commerces`)).toEqual({
      url: `${base}/decouvrir/saint-gervais-les-bains/commerces`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
    expect(result.find(entry => entry.url === `${base}/decouvrir/saint-gervais-les-bains/commerces/jannett-glisse`)).toEqual({
      url: `${base}/decouvrir/saint-gervais-les-bains/commerces/jannett-glisse`,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
    for (const entry of result.filter(item => item.url.includes('/decouvrir/'))) {
      expect(Object.hasOwn(entry, 'lastModified')).toBe(false)
    }
    expect(result.find(entry => entry.url === `${base}/guide/saint-gervais-les-bains/logements/chalet-hygge`)).toEqual(expect.objectContaining({
      lastModified: d2, changeFrequency: 'weekly', priority: 0.65,
    }))
    expect(result.find(entry => entry.url === `${base}/guide/saint-gervais-les-bains/logements`)).toEqual({
      url: `${base}/guide/saint-gervais-les-bains/logements`,
      changeFrequency: 'weekly',
      priority: 0.75,
    })
    expect(result.find(entry => entry.url === `${base}/blog/adresses-locales`)).toEqual(expect.objectContaining({
      lastModified: d2, changeFrequency: 'weekly', priority: 0.65,
    }))
  })

  it('returns a deterministic order within each sitemap group', () => {
    expect(urls).toEqual([
      `${base}/`,
      `${base}/decouvrir`,
      `${base}/contact`,
      `${base}/decouvrir/saint-gervais-les-bains`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces/autre-magasin`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces/jannett-glisse`,
      `${base}/decouvrir/saint-gervais-les-bains/rando`,
      `${base}/decouvrir/saint-gervais-les-bains/rando/col-de-voza`,
      `${base}/guide/saint-gervais-les-bains/logements`,
      `${base}/guide/saint-gervais-les-bains/logements/appartement-soleil`,
      `${base}/guide/saint-gervais-les-bains/logements/chalet-hygge`,
      `${base}/blog/adresses-locales`,
      `${base}/blog/week-end-alpin`,
    ])
  })
})
