import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyClaims = jest.fn()
const mockFindUniqueClaim = jest.fn()
const mockUpdateClaim = jest.fn()
const mockCreateProfile = jest.fn()
const mockTransaction = jest.fn()

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
    merchantClaim: {
      findMany: function() { return mockFindManyClaims.apply(this, arguments as any) },
      findUnique: function() { return mockFindUniqueClaim.apply(this, arguments as any) },
      update: function() { return mockUpdateClaim.apply(this, arguments as any) },
    },
    merchantProfile: { create: function() { return mockCreateProfile.apply(this, arguments as any) } },
    $transaction: function(callback: unknown) { return mockTransaction(callback) },
  },
}))

import { GET as claimsGET } from '@/app/api/admin/merchant-claims/route'
import { POST as approvePOST } from '@/app/api/admin/merchant-claims/[id]/approve/route'
import { POST as rejectPOST } from '@/app/api/admin/merchant-claims/[id]/reject/route'

const admin = { id: 'admin-1', supabase_id: 'supa-admin', role: 'admin', is_active: true, deleted_at: null }
const owner = { id: 'owner-1', supabase_id: 'supa-owner', role: 'owner', is_active: true, deleted_at: null }
const pendingClaim = {
  id: 'claim-1',
  merchant_id: 'merchant-1',
  poi_id: 'poi-1',
  status: 'pending',
  created_at: new Date('2026-05-24T12:00:00Z'),
  reviewed_at: null,
  admin_note: null,
}

function makeRequest(url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('014 admin merchant claims API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-admin' } } })
    mockFindUser.mockResolvedValue(admin)
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      merchantClaim: { update: mockUpdateClaim },
      merchantProfile: { create: mockCreateProfile },
    }))
  })

  it('AC-04-04: rejects non-admin users on admin claim routes', async () => {
    mockFindUser.mockResolvedValue(owner)

    const res = await claimsGET(new NextRequest('http://localhost/api/admin/merchant-claims'))

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('AC-04-01: approves a pending claim and creates MerchantProfile', async () => {
    mockFindUniqueClaim.mockResolvedValue(pendingClaim)
    mockUpdateClaim.mockResolvedValue({ ...pendingClaim, status: 'approved', reviewed_by: 'admin-1' })
    mockCreateProfile.mockResolvedValue({
      id: 'profile-1',
      merchant_id: 'merchant-1',
      poi_id: 'poi-1',
      status: 'active',
      approved_claim_id: 'claim-1',
    })

    const res = await approvePOST(makeRequest('http://localhost/api/admin/merchant-claims/claim-1/approve'), {
      params: Promise.resolve({ id: 'claim-1' }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ data: { id: 'profile-1', status: 'active' } })
    expect(mockUpdateClaim).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'claim-1' },
      data: expect.objectContaining({ status: 'approved', reviewed_by: 'admin-1' }),
    }))
    expect(mockCreateProfile).toHaveBeenCalledWith({
      data: {
        merchant_id: 'merchant-1',
        poi_id: 'poi-1',
        status: 'active',
        approved_claim_id: 'claim-1',
      },
    })
  })

  it('AC-04-02: rejects a pending claim with an admin note without creating profile', async () => {
    mockFindUniqueClaim.mockResolvedValue(pendingClaim)
    mockUpdateClaim.mockResolvedValue({ ...pendingClaim, status: 'rejected', admin_note: 'Document invalide' })

    const res = await rejectPOST(
      makeRequest('http://localhost/api/admin/merchant-claims/claim-1/reject', { admin_note: 'Document invalide' }),
      { params: Promise.resolve({ id: 'claim-1' }) },
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.status).toBe('rejected')
    expect(mockCreateProfile).not.toHaveBeenCalled()
  })

  it('AC-04-03: refuses to review an already reviewed claim', async () => {
    mockFindUniqueClaim.mockResolvedValue({ ...pendingClaim, status: 'approved' })

    const res = await approvePOST(makeRequest('http://localhost/api/admin/merchant-claims/claim-1/approve'), {
      params: Promise.resolve({ id: 'claim-1' }),
    })

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('CLAIM_ALREADY_REVIEWED')
  })
})
