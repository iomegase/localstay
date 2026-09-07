import { localSeoSitemapPaths } from '@/features/local-seo/lib/sitemap'

describe('046 local SEO sitemap publication', () => {
  it('publishes active services and only inventory-backed rental destinations', () => {
    const paths = localSeoSitemapPaths([
      'saint-gervais-les-bains',
      'saint-gervais-les-bains',
      'megeve',
      'outside-catalogue',
    ])

    expect(paths).toEqual(expect.arrayContaining([
      '/conciergerie/saint-gervais-les-bains',
      '/conciergerie/saint-nicolas-de-veroce',
      '/seminaires/saint-gervais-les-bains',
      '/seminaires/saint-nicolas-de-veroce',
      '/locations-vacances/saint-gervais-les-bains',
      '/locations-vacances/megeve',
    ]))
    expect(paths).not.toContain('/conciergerie/megeve')
    expect(paths).not.toContain('/seminaires/combloux')
    expect(paths).not.toContain('/locations-vacances/combloux')
    expect(paths).not.toContain('/locations-vacances/outside-catalogue')
    expect(paths.filter(path => path === '/locations-vacances/saint-gervais-les-bains')).toHaveLength(1)
  })
})
