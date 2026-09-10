const mockDestinations = jest.fn()
const mockProfiles = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  localLandingDestination: { findMany: (...args: unknown[]) => mockDestinations(...args) },
  lodgingPublicProfile: { findMany: (...args: unknown[]) => mockProfiles(...args) },
} }))

import { localSeoSitemapPaths } from '@/features/local-seo/lib/sitemap'
import { landingDate, landingDestinationRow } from '../fixtures/local-landing-management'

describe('048 local landing sitemap publication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDestinations.mockResolvedValue([landingDestinationRow()])
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
  })

  it('publishes all three paths for an active destination with eligible lodging', async () => {
    await expect(localSeoSitemapPaths(['megeve'])).resolves.toEqual([
      '/conciergerie/megeve',
      '/seminaires/megeve',
      '/locations-vacances/megeve',
    ])
    expect(mockDestinations).toHaveBeenCalledTimes(1)
    expect(mockProfiles).toHaveBeenCalledTimes(1)
  })

  it('publishes only service paths when no eligible lodging exists', async () => {
    mockProfiles.mockResolvedValue([])

    await expect(localSeoSitemapPaths([])).resolves.toEqual([
      '/conciergerie/megeve',
      '/seminaires/megeve',
    ])
  })

  it.each(['archived', 'deleted', 'incomplete'])('publishes no path for an %s destination', async state => {
    const destination = landingDestinationRow()
    if (state === 'archived') destination.is_active = false
    if (state === 'deleted') destination.deleted_at = landingDate
    if (state === 'incomplete') destination.pages[1].h1 = ''
    mockDestinations.mockResolvedValue([destination])

    await expect(localSeoSitemapPaths(['megeve'])).resolves.toEqual([])
  })

  it('preserves the repository deterministic order and deduplicated paths', async () => {
    const combloux = landingDestinationRow()
    combloux.id = 'destination-2'
    combloux.city_id = 'city-2'
    combloux.city = { ...combloux.city, id: 'city-2', name: 'Combloux', slug: 'combloux' }
    mockDestinations.mockResolvedValue([combloux, landingDestinationRow()])
    const paths = [
      '/conciergerie/combloux',
      '/conciergerie/megeve',
      '/seminaires/combloux',
      '/seminaires/megeve',
      '/locations-vacances/megeve',
    ]
    await expect(localSeoSitemapPaths(['megeve', 'megeve', 'combloux'])).resolves.toEqual(paths)
    expect(mockDestinations).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ city: { name: 'asc' } }, { city: { slug: 'asc' } }],
    }))
  })
})
