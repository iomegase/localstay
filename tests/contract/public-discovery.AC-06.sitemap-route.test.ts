const mockGetSitemapData = jest.fn()
const mockListPublishedLocalLandingPaths = jest.fn()

jest.mock('@/features/seo/queries/sitemap-data', () => ({
  getSitemapData: (...args: unknown[]) => mockGetSitemapData(...args),
}))

jest.mock('@/features/seo/lib/site', () => ({
  siteBaseUrl: () => 'https://mystay.test',
}))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingPaths: (...args: unknown[]) => mockListPublishedLocalLandingPaths(...args),
}))

import sitemap from '@/app/sitemap'

describe('041 AC-06-05 application sitemap route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSitemapData.mockResolvedValue({
      cities: [],
      pois: [],
      lodgings: [
        { slug: 'chalet-hygge', city_slug: 'megeve', updated_at: new Date('2026-08-28T12:00:00Z') },
      ],
      blogArticles: [],
    })
    mockListPublishedLocalLandingPaths.mockResolvedValue([
      '/conciergerie/megeve',
      '/seminaires/megeve',
      '/locations-vacances/megeve',
    ])
  })

  it('wires the public discovery root into the actual sitemap route exactly once', async () => {
    const result = await sitemap()
    const urls = result.map(entry => entry.url)

    expect(mockGetSitemapData).toHaveBeenCalledTimes(1)
    expect(mockListPublishedLocalLandingPaths).toHaveBeenCalledWith(['megeve'])
    expect(urls.filter(url => url === 'https://mystay.test/decouvrir')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/logements')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/logements/chalet-hygge')).toHaveLength(1)
    expect(urls).toEqual(expect.arrayContaining([
      'https://mystay.test/conciergerie/megeve',
      'https://mystay.test/seminaires/megeve',
      'https://mystay.test/locations-vacances/megeve',
    ]))
    expect(urls).not.toContain('https://mystay.test/contact')
    expect(urls.some(url => url.includes('/guide'))).toBe(false)
  })

  it('deduplicates persisted paths and excludes obsolete guide routes at the public sitemap boundary', async () => {
    mockListPublishedLocalLandingPaths.mockResolvedValue([
      '/conciergerie/megeve', '/conciergerie/megeve',
      '/guide/megeve', '/guide/megeve/restaurants',
    ])

    const urls = (await sitemap()).map(entry => entry.url)
    expect(urls.filter(url => url === 'https://mystay.test/conciergerie/megeve')).toHaveLength(1)
    expect(urls.some(url => new URL(url).pathname.startsWith('/guide'))).toBe(false)
  })
})
