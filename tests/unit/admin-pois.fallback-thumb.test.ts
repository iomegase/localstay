const mockFindMany = jest.fn()
const mockCount = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockFindMany(...args), count: (...args: unknown[]) => mockCount(...args) },
    city: { findFirst: jest.fn(async () => ({ id: 'city-1' })) },
    poiAcquisitionRun: { findMany: jest.fn(async () => []) },
  },
}))

import { listAdminPois } from '@/features/admin-pois/queries/admin-pois'

const row = (overrides: Record<string, unknown>) => ({
  id: 'poi-1', name: 'Blanc Sport', slug: 'blanc-sport', description: null, address: 'x', latitude: 45.9, longitude: 6.7,
  phone: null, website: null, photos: [], tags: [], is_active: true, deleted_at: null, geocode_status: 'success',
  review_source: 'MANUAL', photos_status: 'ok', updated_at: new Date(), discovery_status: 'DRAFT', discovery_published_at: null,
  city: { id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais', is_active: true, deleted_at: null },
  category: { id: 'cat-1', name: 'Shopping', slug: 'shopping', is_active: true, deleted_at: null },
  subcategory: null, merchant_profile: null, fallback_image: null, trail_detail: null,
  ...overrides,
})

describe('spec 070 — vignette de remplacement dans la liste admin', () => {
  beforeEach(() => { jest.clearAllMocks(); mockCount.mockResolvedValue(1) })

  async function firstItem(overrides: Record<string, unknown>) {
    mockFindMany.mockResolvedValueOnce([row(overrides)]).mockResolvedValue([])
    const result = await listAdminPois({ city_id: 'city-1', status: 'current', page: 1, limit: 25 } as never)
    return result.data[0]!
  }

  it('image attribuée dans la médiathèque en priorité', async () => {
    expect((await firstItem({ fallback_image: { url: 'https://cdn.test/media.jpg', deleted_at: null } })).fallback_photo_url).toBe('https://cdn.test/media.jpg')
  })

  it('image retirée de la médiathèque → image du type de lieu, sinon image MyStay', async () => {
    const shop = await firstItem({ fallback_image: { url: 'https://cdn.test/old.jpg', deleted_at: new Date() } })
    expect(shop.fallback_photo_url).not.toBe('https://cdn.test/old.jpg')
    expect(shop.fallback_photo_url).toMatch(/^\//)
    const other = await firstItem({ category: { id: 'cat-x', name: 'Zzz', slug: 'zzz', is_active: true, deleted_at: null } })
    expect(other.fallback_photo_url).toBe('/og-mystay.png')
  })
})
