import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyPois = jest.fn()
const mockFindFirstPoi = jest.fn()
const mockFindFirstProfile = jest.fn()
const mockFindFirstClaim = jest.fn()
const mockCreateClaim = jest.fn()

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
    pointOfInterest: {
      findMany: function() { return mockFindManyPois.apply(this, arguments as any) },
      findFirst: function() { return mockFindFirstPoi.apply(this, arguments as any) },
    },
    merchantProfile: { findFirst: function() { return mockFindFirstProfile.apply(this, arguments as any) } },
    merchantClaim: {
      findFirst: function() { return mockFindFirstClaim.apply(this, arguments as any) },
      create: function() { return mockCreateClaim.apply(this, arguments as any) },
    },
  },
}))

import { GET as searchGET } from '@/app/api/merchant/onboarding/search/route'
import { POST as claimPOST } from '@/app/api/merchant/onboarding/claim/route'
import { GET as statusGET } from '@/app/api/merchant/onboarding/status/route'

const merchant = { id: 'merchant-1', supabase_id: 'supa-merchant', role: 'merchant', is_active: true, deleted_at: null }

function makeRequest(url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('014 merchant onboarding API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindManyPois.mockReset()
    mockFindFirstPoi.mockReset()
    mockFindFirstProfile.mockReset()
    mockFindFirstClaim.mockReset()
    mockCreateClaim.mockReset()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-merchant' } } })
    mockFindUser.mockResolvedValue(merchant)
    mockFindFirstProfile.mockResolvedValue(null)
    mockFindFirstClaim.mockResolvedValue(null)
  })

  it('AC-02-01/03: searches only active, non-deleted, non-rejected, unclaimed POIs', async () => {
    mockFindManyPois.mockResolvedValue([
      {
        id: 'poi-1',
        name: 'La Table Alpine',
        address: '12 rue du Mont-Blanc',
        city: { name: 'Saint-Gervais-les-Bains' },
        category: { name: 'Dîner' },
        subcategory: { name: 'Restaurants' },
      },
    ])

    const res = await searchGET(makeRequest('http://localhost/api/merchant/onboarding/search?q=table'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([
      {
        id: 'poi-1',
        name: 'La Table Alpine',
        address: '12 rue du Mont-Blanc',
        city_name: 'Saint-Gervais-les-Bains',
        category_name: 'Dîner',
        subcategory_name: 'Restaurants',
      },
    ])
    expect(mockFindManyPois).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        is_active: true,
        deleted_at: null,
        NOT: { geocode_status: 'rejected' },
        merchant_profile: { is: null },
      }),
    }))
  })

  it('AC-02-01: tokenizes multi-word merchant searches for fuzzy matching', async () => {
    mockFindManyPois.mockResolvedValue([])

    const res = await searchGET(makeRequest('http://localhost/api/merchant/onboarding/search?q=brasserie%20du%20mont%20blanc'))

    expect(res.status).toBe(200)
    expect(mockFindManyPois).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { name: { contains: 'brasserie', mode: 'insensitive' } },
          { address: { contains: 'brasserie', mode: 'insensitive' } },
          { name: { contains: 'mont', mode: 'insensitive' } },
          { address: { contains: 'mont', mode: 'insensitive' } },
          { name: { contains: 'blanc', mode: 'insensitive' } },
          { address: { contains: 'blanc', mode: 'insensitive' } },
        ]),
      }),
    }))
  })

  it('AC-02-01: rejects search terms shorter than 3 characters', async () => {
    const res = await searchGET(makeRequest('http://localhost/api/merchant/onboarding/search?q=ab'))
    expect(res.status).toBe(400)
    expect(mockFindManyPois).not.toHaveBeenCalled()
  })

  it('AC-03-01: creates a pending claim for a claimable POI', async () => {
    mockFindFirstPoi.mockResolvedValue({ id: 'poi-1' })
    mockCreateClaim.mockResolvedValue({
      id: 'claim-1',
      merchant_id: 'merchant-1',
      poi_id: 'poi-1',
      status: 'pending',
      created_at: new Date('2026-05-24T12:00:00Z'),
      reviewed_at: null,
      admin_note: null,
    })

    const res = await claimPOST(makeRequest('http://localhost/api/merchant/onboarding/claim', { poi_id: 'poi-1' }))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.status).toBe('pending')
    expect(mockCreateClaim).toHaveBeenCalledWith({
      data: { merchant_id: 'merchant-1', poi_id: 'poi-1', status: 'pending' },
    })
  })

  it('AC-03-02: returns 409 when merchant already has a pending claim', async () => {
    mockFindFirstClaim.mockResolvedValue({ id: 'claim-existing', status: 'pending' })

    const res = await claimPOST(makeRequest('http://localhost/api/merchant/onboarding/claim', { poi_id: 'poi-1' }))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('CLAIM_ALREADY_PENDING')
    expect(mockCreateClaim).not.toHaveBeenCalled()
  })

  it('AC-03-03: returns 409 when merchant already has an active profile', async () => {
    mockFindFirstProfile.mockResolvedValue({ id: 'profile-1', status: 'active', deleted_at: null })

    const res = await claimPOST(makeRequest('http://localhost/api/merchant/onboarding/claim', { poi_id: 'poi-1' }))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('MERCHANT_ALREADY_LINKED')
    expect(mockCreateClaim).not.toHaveBeenCalled()
  })

  it('AC-03-04: returns 409 when POI already has an active MerchantProfile', async () => {
    mockFindFirstProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'profile-existing', status: 'active', deleted_at: null })

    const res = await claimPOST(makeRequest('http://localhost/api/merchant/onboarding/claim', { poi_id: 'poi-1' }))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('POI_ALREADY_CLAIMED')
    expect(mockCreateClaim).not.toHaveBeenCalled()
  })

  it('AC-05-02/03: returns onboarding state from profile or pending claim', async () => {
    mockFindFirstProfile.mockResolvedValueOnce({ id: 'profile-1', merchant_id: 'merchant-1', poi_id: 'poi-1', status: 'active', approved_claim_id: 'claim-1' })

    const approvedRes = await statusGET(makeRequest('http://localhost/api/merchant/onboarding/status'))
    expect(approvedRes.status).toBe(200)
    await expect(approvedRes.json()).resolves.toMatchObject({ data: { state: 'approved' } })

    mockFindFirstProfile.mockResolvedValueOnce(null)
    mockFindFirstClaim.mockResolvedValueOnce({ id: 'claim-1', merchant_id: 'merchant-1', poi_id: 'poi-1', status: 'pending', created_at: new Date(), reviewed_at: null, admin_note: null })

    const pendingRes = await statusGET(makeRequest('http://localhost/api/merchant/onboarding/status'))
    expect(pendingRes.status).toBe(200)
    await expect(pendingRes.json()).resolves.toMatchObject({ data: { state: 'pending_review' } })
  })
})
