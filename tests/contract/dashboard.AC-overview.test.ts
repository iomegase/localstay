import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
const mockCountAnalytics = jest.fn()
const mockFindManyAnalytics = jest.fn()
const mockFindManyCategories = jest.fn()
const mockFindManyPois = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async function() {
    return {
      auth: { getUser: function() { return mockGetUser.apply(this, arguments as any) } },
    }
  }),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: function() { return mockFindUser.apply(this, arguments as any) } },
    lodging: { findMany: function() { return mockFindManyLodgings.apply(this, arguments as any) } },
    analytics: {
      count: function() { return mockCountAnalytics.apply(this, arguments as any) },
      findMany: function() { return mockFindManyAnalytics.apply(this, arguments as any) },
    },
    category: { findMany: function() { return mockFindManyCategories.apply(this, arguments as any) } },
    pointOfInterest: { findMany: function() { return mockFindManyPois.apply(this, arguments as any) } },
  },
}))

import { GET } from '../../src/app/api/dashboard/overview/route'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

describe('GET /api/dashboard/overview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindManyLodgings.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }])
    mockCountAnalytics.mockResolvedValue(42)
    mockFindManyAnalytics.mockResolvedValue([])
    mockFindManyCategories.mockResolvedValue([])
    mockFindManyPois.mockResolvedValue([])
  })

  it('AC-01-01: returns 200 with zone-aware overview metrics', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('lodging_count', 2)
    expect(json).toHaveProperty('qr_scans_7d', 42)
    expect(json.top_categories).toEqual({ primary: [], nearby: [] })
    expect(json.top_pois).toEqual({ primary: [], nearby: [] })
  })

  it('AC-01-02: returns lodging_count = 0 when no lodgings', async () => {
    mockFindManyLodgings.mockResolvedValue([])
    mockCountAnalytics.mockResolvedValue(0)
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.lodging_count).toBe(0)
    expect(json.qr_scans_7d).toBe(0)
    expect(json.top_categories).toEqual({ primary: [], nearby: [] })
    expect(json.top_pois).toEqual({ primary: [], nearby: [] })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(401)
  })

  it('computes top categories and POIs independently for primary and nearby zones', async () => {
    const primaryCatId = 'cat-primary'
    const nearbyCatId = 'cat-nearby'
    const primaryPoiId = 'poi-primary'
    const nearbyPoiId = 'poi-nearby'
    mockFindManyAnalytics.mockImplementation(({ where }: { where: { event_type: string } }) => {
      if (where.event_type === 'category_click') {
        return Promise.resolve([
          { category_id: primaryCatId, poi_id: primaryPoiId },
          { category_id: primaryCatId, poi_id: primaryPoiId },
          { category_id: nearbyCatId, poi_id: nearbyPoiId },
        ])
      }
      if (where.event_type === 'poi_click') {
        return Promise.resolve([
          { poi_id: primaryPoiId },
          { poi_id: nearbyPoiId },
          { poi_id: nearbyPoiId },
        ])
      }
      return Promise.resolve([])
    })
    mockFindManyPois.mockResolvedValue([
      {
        id: primaryPoiId,
        name: 'Restaurant Centre',
        category_id: primaryCatId,
        latitude: 45.01,
        longitude: 6.0,
        city: { latitude: 45.0, longitude: 6.0 },
        category: { name: 'Restaurants' },
      },
      {
        id: nearbyPoiId,
        name: 'Auberge Alentours',
        category_id: nearbyCatId,
        latitude: 45.2,
        longitude: 6.0,
        city: { latitude: 45.0, longitude: 6.0 },
        category: { name: 'Auberges' },
      },
    ])
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.top_categories.primary[0]).toEqual({ name: 'Restaurants', clicks: 2 })
    expect(json.top_categories.nearby[0]).toEqual({ name: 'Auberges', clicks: 1 })
    expect(json.top_pois.primary[0]).toEqual({ name: 'Restaurant Centre', clicks: 1 })
    expect(json.top_pois.nearby[0]).toEqual({ name: 'Auberge Alentours', clicks: 2 })
  })
})
