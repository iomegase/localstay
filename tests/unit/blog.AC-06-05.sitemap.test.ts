import { buildSitemapEntries } from '@/features/seo/lib/sitemap'

describe('029 blog sitemap entries', () => {
  it('includes only published blog article URLs', () => {
    const result = buildSitemapEntries({
      baseUrl: 'https://mystay.example.com',
      staticPaths: ['/contact', '/blog'],
      cities: [],
      pois: [],
      lodgings: [],
      blogArticles: [
        { slug: 'week-end-saint-gervais', updated_at: new Date('2026-06-15T10:00:00Z') },
        { slug: 'adresses-megeve', updated_at: new Date('2026-06-16T10:00:00Z') },
      ],
    })

    const urls = result.map(entry => entry.url)
    expect(urls).toContain('https://mystay.example.com/blog/week-end-saint-gervais')
    expect(urls).toContain('https://mystay.example.com/blog/adresses-megeve')
  })
})
