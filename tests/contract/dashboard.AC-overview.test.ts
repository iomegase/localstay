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

  it('AC-01-01: returns 200 with overview metrics', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('lodging_count', 2)
    expect(json).toHaveProperty('qr_scans_7d', 42)
    expect(json).toHaveProperty('top_categories')
    expect(json).toHaveProperty('top_pois')
    expect(Array.isArray(json.top_categories)).toBe(true)
    expect(Array.isArray(json.top_pois)).toBe(true)
  })

  it('AC-01-02: returns lodging_count = 0 when no lodgings', async () => {
    mockFindManyLodgings.mockResolvedValue([])
    mockCountAnalytics.mockResolvedValue(0)
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.lodging_count).toBe(0)
    expect(json.qr_scans_7d).toBe(0)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(401)
  })

  it('computes top_categories from analytics events', async () => {
    const catId = 'cat-1'
    mockFindManyAnalytics.mockImplementation(({ where }: { where: { event_type: string } }) => {
      if (where.event_type === 'category_click') {
        return Promise.resolve([{ category_id: catId }, { category_id: catId }])
      }
      return Promise.resolve([])
    })
    mockFindManyCategories.mockResolvedValue([{ id: catId, name: 'Restaurants' }])
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.top_categories[0]).toEqual({ name: 'Restaurants', clicks: 2 })
  })
})
