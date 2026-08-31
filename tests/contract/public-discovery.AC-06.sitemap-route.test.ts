const mockGetSitemapData = jest.fn()

jest.mock('@/features/seo/queries/sitemap-data', () => ({
  getSitemapData: (...args: unknown[]) => mockGetSitemapData(...args),
}))

jest.mock('@/features/seo/lib/site', () => ({
  siteBaseUrl: () => 'https://mystay.test',
}))

import sitemap from '@/app/sitemap'

describe('041 AC-06-05 application sitemap route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSitemapData.mockResolvedValue({
      cities: [],
      pois: [],
      lodgings: [
        { slug: 'chalet-hygge', updated_at: new Date('2026-08-28T12:00:00Z') },
      ],
      blogArticles: [],
    })
  })

  it('wires the public discovery root into the actual sitemap route exactly once', async () => {
    const result = await sitemap()
    const urls = result.map(entry => entry.url)

    expect(mockGetSitemapData).toHaveBeenCalledTimes(1)
    expect(urls.filter(url => url === 'https://mystay.test/decouvrir')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/logements')).toHaveLength(1)
    expect(urls.filter(url => url === 'https://mystay.test/logements/chalet-hygge')).toHaveLength(1)
    expect(urls).not.toContain('https://mystay.test/contact')
    expect(urls.some(url => url.includes('/guide'))).toBe(false)
  })
})
