const mockListPublishedLocalLandingPaths = jest.fn()

jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingPaths: (...args: unknown[]) => mockListPublishedLocalLandingPaths(...args),
}))

import { localSeoSitemapPaths } from '@/features/local-seo/lib/sitemap'

describe('046 local SEO sitemap publication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('publishes persisted active services and only inventory-backed rental destinations', async () => {
    mockListPublishedLocalLandingPaths.mockResolvedValue([
      '/conciergerie/saint-gervais-les-bains',
      '/conciergerie/saint-nicolas-de-veroce',
      '/seminaires/saint-gervais-les-bains',
      '/seminaires/saint-nicolas-de-veroce',
      '/locations-vacances/saint-gervais-les-bains',
      '/locations-vacances/megeve',
    ])
    const lodgingCitySlugs = [
      'saint-gervais-les-bains',
      'saint-gervais-les-bains',
      'megeve',
      'outside-catalogue',
    ]
    const paths = await localSeoSitemapPaths(lodgingCitySlugs)

    expect(paths).toEqual([
      '/conciergerie/saint-gervais-les-bains',
      '/conciergerie/saint-nicolas-de-veroce',
      '/seminaires/saint-gervais-les-bains',
      '/seminaires/saint-nicolas-de-veroce',
      '/locations-vacances/saint-gervais-les-bains',
      '/locations-vacances/megeve',
    ])
    expect(mockListPublishedLocalLandingPaths).toHaveBeenCalledWith(lodgingCitySlugs)
    expect(paths).not.toContain('/conciergerie/megeve')
    expect(paths).not.toContain('/seminaires/combloux')
    expect(paths).not.toContain('/locations-vacances/combloux')
    expect(paths).not.toContain('/locations-vacances/outside-catalogue')
    expect(paths.filter(path => path === '/locations-vacances/saint-gervais-les-bains')).toHaveLength(1)
  })
})
