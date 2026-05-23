import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
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
    analytics: { findMany: function() { return mockFindManyAnalytics.apply(this, arguments as any) } },
    category: { findMany: function() { return mockFindManyCategories.apply(this, arguments as any) } },
    pointOfInterest: { findMany: function() { return mockFindManyPois.apply(this, arguments as any) } },
  },
}))

import { GET } from '../../src/app/api/dashboard/stats/route'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

function makeRequest(days?: number): NextRequest {
  const url = days
    ? `http://localhost:3000/api/dashboard/stats?days=${days}`
    : 'http://localhost:3000/api/dashboard/stats'
  return new NextRequest(url)
}

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindManyLodgings.mockResolvedValue([{ id: 'l1' }])
    mockFindManyAnalytics.mockResolvedValue([])
    mockFindManyCategories.mockResolvedValue([])
    mockFindManyPois.mockResolvedValue([])
  })

  it('AC-03-01: returns 200 with scans_by_day array of correct length (default 30 days)', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('scans_by_day')
    expect(json).toHaveProperty('top_categories')
    expect(json).toHaveProperty('top_pois')
    expect(json.scans_by_day).toHaveLength(30)
  })

  it('returns scans_by_day of length `days` when ?days=7', async () => {
    const res = await GET(makeRequest(7))
    const json = await res.json()
    expect(json.scans_by_day).toHaveLength(7)
  })

  it('fills zeros for days with no scans', async () => {
    mockFindManyAnalytics.mockResolvedValue([])
    const res = await GET(makeRequest(7))
    const json = await res.json()
    const allZero = json.scans_by_day.every((d: { count: number }) => d.count === 0)
    expect(allZero).toBe(true)
  })

  it('counts scans correctly when events exist', async () => {
    const today = new Date().toISOString().split('T')[0]
    mockFindManyAnalytics.mockImplementation(({ where }: { where: { event_type: string } }) => {
      if (where.event_type === 'qr_scan') {
        return Promise.resolve([
          { event_type: 'qr_scan', created_at: new Date(), category_id: null, poi_id: null },
          { event_type: 'qr_scan', created_at: new Date(), category_id: null, poi_id: null },
        ])
      }
      return Promise.resolve([])
    })
    const res = await GET(makeRequest(7))
    const json = await res.json()
    const todayEntry = json.scans_by_day.find((d: { date: string }) => d.date === today)
    expect(todayEntry?.count).toBe(2)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })
})
