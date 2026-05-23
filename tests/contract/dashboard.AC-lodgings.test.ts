import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
const mockCreateLodging = jest.fn()
const mockFindFirstCity = jest.fn()
const mockFindFirstLodging = jest.fn()
const mockUpdateLodging = jest.fn()

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
    lodging: {
      findMany: function() { return mockFindManyLodgings.apply(this, arguments as any) },
      create: function() { return mockCreateLodging.apply(this, arguments as any) },
      findFirst: function() { return mockFindFirstLodging.apply(this, arguments as any) },
      update: function() { return mockUpdateLodging.apply(this, arguments as any) },
    },
    city: { findFirst: function() { return mockFindFirstCity.apply(this, arguments as any) } },
  },
}))

import { GET, POST } from '../../src/app/api/dashboard/lodgings/route'

const CITY_UUID = '00000000-0000-0000-0000-000000000001'
const UNKNOWN_CITY_UUID = '00000000-0000-0000-0000-000000000099'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

const mockLodging = {
  id: 'lodging-1',
  name: 'Chalet des Alpes',
  city_id: CITY_UUID,
  owner_id: 'owner-1',
  is_active: true,
  created_at: new Date('2026-01-01'),
  deleted_at: null,
  city: { name: 'Saint-Gervais' },
  analytics: [{ event_type: 'qr_scan' }, { event_type: 'qr_scan' }],
}

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/dashboard/lodgings', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/dashboard/lodgings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
  })

  it('AC-02-01: returns 200 with lodgings list and qr_scan_count', async () => {
    mockFindManyLodgings.mockResolvedValue([mockLodging])
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lodgings).toHaveLength(1)
    expect(json.lodgings[0].name).toBe('Chalet des Alpes')
    expect(json.lodgings[0].city_name).toBe('Saint-Gervais')
    expect(json.lodgings[0].qr_scan_count).toBe(2)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is not owner', async () => {
    mockFindUser.mockResolvedValue({ ...mockOwner, role: 'merchant' })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(403)
  })
})

describe('POST /api/dashboard/lodgings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindFirstCity.mockResolvedValue({ id: CITY_UUID, name: 'Saint-Gervais' })
  })

  it('AC-02-02: returns 201 with created lodging', async () => {
    mockCreateLodging.mockResolvedValue({
      ...mockLodging,
      analytics: [],
    })
    const res = await POST(makeRequest('POST', { name: 'Chalet des Alpes', city_id: CITY_UUID }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('Chalet des Alpes')
    expect(json.qr_scan_count).toBe(0)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest('POST', { city_id: CITY_UUID }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when city_id does not exist', async () => {
    mockFindFirstCity.mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { name: 'Test', city_id: UNKNOWN_CITY_UUID }))
    expect(res.status).toBe(404)
  })
})
