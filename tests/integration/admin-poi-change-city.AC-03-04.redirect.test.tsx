const mockPermanentRedirect = jest.fn((path: string) => { throw new Error(`REDIRECT ${path}`) })
const mockNotFound = jest.fn(() => { throw new Error('NOT_FOUND') })
const mockGetDiscoveryPoi = jest.fn()
const mockRedirectFindFirst = jest.fn()

jest.mock('next/navigation', () => ({
  permanentRedirect: (path: string) => mockPermanentRedirect(path),
  notFound: () => mockNotFound(),
}))

describe('spec 092 — ancienne adresse d’un POI déplacé', () => {
  describe('page publique du POI', () => {
    const mockFindPath = jest.fn()
    beforeAll(() => {
      jest.doMock('@/features/public-discovery/queries/public-discovery', () => ({
        getDiscoveryPoi: (...args: unknown[]) => mockGetDiscoveryPoi(...args),
        findPoiCityRedirectPath: (...args: unknown[]) => mockFindPath(...args),
      }))
    })
    beforeEach(() => jest.clearAllMocks())

    const render = async () => {
      const { default: Page } = await import('@/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page')
      return Page({ params: Promise.resolve({ 'city-slug': 'combloux', 'category-slug': 'animaux', 'poi-slug': 'cani-smile' }) })
    }

    it('AC-03 : 301 vers la nouvelle adresse', async () => {
      mockGetDiscoveryPoi.mockResolvedValue(null)
      mockFindPath.mockResolvedValue('/decouvrir/passy/animaux/cani-smile')
      await expect(render()).rejects.toThrow('REDIRECT /decouvrir/passy/animaux/cani-smile')
      expect(mockFindPath).toHaveBeenCalledWith('combloux', 'cani-smile')
      expect(mockNotFound).not.toHaveBeenCalled()
    })

    it('AC-04 : POI plus publié → 404', async () => {
      mockGetDiscoveryPoi.mockResolvedValue(null)
      mockFindPath.mockResolvedValue(null)
      await expect(render()).rejects.toThrow('NOT_FOUND')
      expect(mockPermanentRedirect).not.toHaveBeenCalled()
    })

    it('BR-03 : une page existante l’emporte, aucune recherche de redirection', async () => {
      mockGetDiscoveryPoi.mockResolvedValue(null)
      mockGetDiscoveryPoi.mockResolvedValueOnce({
        slug: 'cani-smile', name: 'Cani Smile', city: { slug: 'combloux', name: 'Combloux' }, category: { slug: 'animaux', name: 'Animaux' },
      })
      await render().catch(() => undefined)
      expect(mockFindPath).not.toHaveBeenCalled()
    })
  })

  describe('findPoiCityRedirectPath', () => {
    beforeAll(() => {
      jest.resetModules()
      jest.dontMock('@/features/public-discovery/queries/public-discovery')
      jest.doMock('server-only', () => ({}))
      jest.doMock('@/shared/lib/prisma', () => ({
        prisma: {
          poiCityRedirect: { findFirst: (...args: unknown[]) => mockRedirectFindFirst(...args) },
          pointOfInterest: { findMany: jest.fn(async () => []) },
        },
      }))
      jest.doMock('@/features/poi-photos/queries/photo-mirror-map', () => ({
        getPoiPhotoMirrorMap: jest.fn(async () => new Map()),
        resolvePoiPhotoList: jest.fn(),
        resolvePoiPhotoUrl: jest.fn(),
      }))
    })

    it('aucune redirection connue → null, recherche par ancienne ville + ancien slug', async () => {
      const { findPoiCityRedirectPath } = await import('@/features/public-discovery/queries/public-discovery')
      mockRedirectFindFirst.mockResolvedValue(null)
      await expect(findPoiCityRedirectPath('combloux', 'cani-smile')).resolves.toBeNull()
      expect(mockRedirectFindFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: { from_slug: 'cani-smile', deleted_at: null, from_city: { slug: 'combloux' } },
      }))
    })

    it('AC-04 : POI cible non publié (introuvable dans /decouvrir) → null', async () => {
      const { findPoiCityRedirectPath } = await import('@/features/public-discovery/queries/public-discovery')
      mockRedirectFindFirst.mockResolvedValue({ poi: { slug: 'cani-smile', city: { slug: 'passy' }, category: { slug: 'animaux' } } })
      await expect(findPoiCityRedirectPath('combloux', 'cani-smile')).resolves.toBeNull()
    })
  })
})
