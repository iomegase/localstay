import { buildSitemapEntries } from '@/features/seo/lib/sitemap'
import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'

const d1 = new Date('2026-06-01T00:00:00Z')
const d2 = new Date('2026-06-02T00:00:00Z')

describe('buildSitemapEntries', () => {
  const base = 'https://mystay.example.com'
  const buildMinimalSitemap = (baseUrl: string) => buildSitemapEntries({
    baseUrl,
    staticPaths: ['/logements'],
    cities: [],
    pois: [],
    lodgings: [],
  })
  const result = buildSitemapEntries({
    baseUrl: base,
    staticPaths: [
      '/',
      '/decouvrir',
      '/logements',
      '/guide/legacy',
      '/contact',
      '/sejour',
      '/acces-reserve',
      '/le-logement',
      '/nos-recommandations',
      '/map',
      '/mes-favoris',
      '/services-prives',
      '/api/private',
      '/concept?lodging=secret',
    ],
    cities: [{ slug: 'saint-gervais-les-bains' }],
    pois: [
      { slug: 'jannett-glisse', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces' },
      { slug: 'col-de-voza', city_slug: 'saint-gervais-les-bains', category_slug: 'rando' },
      { slug: 'autre-magasin', city_slug: 'saint-gervais-les-bains', category_slug: 'commerces' },
    ],
    lodgings: [
      { slug: 'chalet-hygge', updated_at: d2 },
      { slug: 'appartement-soleil', updated_at: d2 },
      { slug: '550e8400-e29b-41d4-a716-446655440000', updated_at: d2 },
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
    expect(urls).toContain(`${base}/logements`)
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

  it('includes each published lodging once under its canonical short URL', () => {
    expect(urls.filter(u => u === `${base}/logements/chalet-hygge`)).toHaveLength(1)
    expect(urls).toContain(`${base}/logements/appartement-soleil`)
    expect(urls.some(url => url.includes('/guide/'))).toBe(false)
  })

  it('uses the canonical lodging path builder to keep reserved characters in one segment', () => {
    const reservedSlug = 'cabane/été neige'
    const reservedResult = buildSitemapEntries({
      baseUrl: base,
      staticPaths: [],
      cities: [],
      pois: [],
      lodgings: [{ slug: reservedSlug, updated_at: d2 }],
    })
    const expectedUrl = `${base}${publicLodgingPath(reservedSlug)}`

    expect(expectedUrl).toBe(`${base}/logements/cabane%2F%C3%A9t%C3%A9%20neige`)
    expect(reservedResult.map(entry => entry.url)).toContain(expectedUrl)
    expect(new URL(expectedUrl).pathname.split('/').filter(Boolean)).toHaveLength(2)
  })

  it('keeps a legitimate slug containing a UUID while excluding an exact UUID segment', () => {
    const exactUuid = '550e8400-e29b-41d4-a716-446655440000'
    const legitimateSlug = `chalet-${exactUuid}-alpin`
    const uuidResult = buildSitemapEntries({
      baseUrl: base,
      staticPaths: [],
      cities: [],
      pois: [],
      lodgings: [
        { slug: exactUuid, updated_at: d2 },
        { slug: legitimateSlug, updated_at: d2 },
      ],
    })
    const uuidUrls = uuidResult.map(entry => entry.url)

    expect(uuidUrls).not.toContain(`${base}${publicLodgingPath(exactUuid)}`)
    expect(uuidUrls).toContain(`${base}${publicLodgingPath(legitimateSlug)}`)
  })

  it('reserves private namespaces only at the root path segment', () => {
    const namespaceResult = buildSitemapEntries({
      baseUrl: base,
      staticPaths: [
        '/contact',
        '/guide/legacy',
        '/api/private',
      ],
      cities: [],
      pois: [{ slug: 'contact', city_slug: 'annecy', category_slug: 'restaurants' }],
      lodgings: [{ slug: 'contact', updated_at: d2 }],
      blogArticles: [{ slug: 'map', updated_at: d2 }],
    })
    const namespaceUrls = namespaceResult.map(entry => entry.url)

    expect(namespaceUrls).not.toContain(`${base}/contact`)
    expect(namespaceUrls).not.toContain(`${base}/guide/legacy`)
    expect(namespaceUrls).not.toContain(`${base}/api/private`)
    expect(namespaceUrls).toContain(`${base}/logements/contact`)
    expect(namespaceUrls).toContain(`${base}/blog/map`)
    expect(namespaceUrls).toContain(`${base}/decouvrir/annecy/restaurants/contact`)
  })

  it.each([
    'https://mystay.example.com/#token=secret',
    'https://mystay.example.com/?preview=secret',
    'https://user:password@mystay.example.com',
    'ftp://mystay.example.com',
    'javascript:alert("secret")',
  ])('emits nothing for an unsafe base URL: %s', unsafeBaseUrl => {
    const unsafeResult = buildMinimalSitemap(unsafeBaseUrl)

    expect(unsafeResult).toEqual([])
    expect(JSON.stringify(unsafeResult)).not.toContain('secret')
  })

  it.each([
    ['https://mystay.example.com/nested/path///', 'https://mystay.example.com'],
    ['http://localhost:3000/', 'http://localhost:3000'],
  ])('normalizes a valid HTTP(S) base to its site origin: %s', (validBaseUrl, expectedOrigin) => {
    expect(buildMinimalSitemap(validBaseUrl).map(entry => entry.url)).toEqual([
      `${expectedOrigin}/`,
      `${expectedOrigin}/logements`,
    ])
  })

  it('decodes path segments before namespace and UUID validation without false positives', () => {
    const encodedUuid = '550e8400%2De29b%2D41d4%2Da716%2D446655440000'
    const encodedResult = buildSitemapEntries({
      baseUrl: base,
      staticPaths: [
        '/g%75ide/legacy',
        `/logements/${encodedUuid}`,
        '/logements/c%6Fntact',
        '/blog/%6Dap',
        '/logements/%E0%A4%A',
      ],
      cities: [],
      pois: [],
      lodgings: [],
    })
    const encodedUrls = encodedResult.map(entry => entry.url)

    expect(encodedUrls).not.toContain(`${base}/g%75ide/legacy`)
    expect(encodedUrls).not.toContain(`${base}/logements/${encodedUuid}`)
    expect(encodedUrls).not.toContain(`${base}/logements/%E0%A4%A`)
    expect(encodedUrls).toContain(`${base}/logements/c%6Fntact`)
    expect(encodedUrls).toContain(`${base}/blog/%6Dap`)
  })

  it('rejects private, historical, API, query-string, and UUID URLs defensively', () => {
    const forbiddenFragments = [
      '/guide',
      '/sejour',
      '/acces-reserve',
      '/contact',
      '/le-logement',
      '/nos-recommandations',
      '/map',
      '/mes-favoris',
      '/services-prives',
      '/api/',
      '?',
    ]

    for (const url of urls) {
      for (const fragment of forbiddenFragments) {
        expect(url).not.toContain(fragment)
      }
      expect(new URL(url).pathname.split('/')).not.toContain('550e8400-e29b-41d4-a716-446655440000')
    }
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
    expect(result.find(entry => entry.url === `${base}/logements/chalet-hygge`)).toEqual(expect.objectContaining({
      lastModified: d2, changeFrequency: 'weekly', priority: 0.65,
    }))
    expect(result.find(entry => entry.url === `${base}/blog/adresses-locales`)).toEqual(expect.objectContaining({
      lastModified: d2, changeFrequency: 'weekly', priority: 0.65,
    }))
  })

  it('returns a deterministic order within each sitemap group', () => {
    expect(urls).toEqual([
      `${base}/`,
      `${base}/decouvrir`,
      `${base}/logements`,
      `${base}/decouvrir/saint-gervais-les-bains`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces/autre-magasin`,
      `${base}/decouvrir/saint-gervais-les-bains/commerces/jannett-glisse`,
      `${base}/decouvrir/saint-gervais-les-bains/rando`,
      `${base}/decouvrir/saint-gervais-les-bains/rando/col-de-voza`,
      `${base}/logements/appartement-soleil`,
      `${base}/logements/chalet-hygge`,
      `${base}/blog/adresses-locales`,
      `${base}/blog/week-end-alpin`,
    ])
  })
})
