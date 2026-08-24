import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindFirstProfile = jest.fn()
const mockUpdatePoi = jest.fn()
const mockFindFirstPoi = jest.fn()
const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()
const mockDiscoveryAuditCreate = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async function() {
    return {
      auth: { getUser: function() { return mockGetUser.apply(this, arguments as any) } },
    }
  }),
  createSupabaseServer: jest.fn(function() {
    return {
      storage: {
        from: function() {
          return {
            upload: function() { return mockUpload.apply(this, arguments as any) },
            getPublicUrl: function() { return mockGetPublicUrl.apply(this, arguments as any) },
          }
        },
      },
    }
  }),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: function() { return mockFindUser.apply(this, arguments as any) } },
    merchantProfile: { findFirst: function() { return mockFindFirstProfile.apply(this, arguments as any) } },
    pointOfInterest: {
      update: function() { return mockUpdatePoi.apply(this, arguments as any) },
      findFirst: function() { return mockFindFirstPoi.apply(this, arguments as any) },
    },
    poiAcquisitionAuditLog: {
      create: function() { return mockDiscoveryAuditCreate.apply(this, arguments as any) },
    },
    $transaction: function() { return mockTransaction.apply(this, arguments as any) },
  },
}))

import { GET as profileGET, PATCH as profilePATCH } from '@/app/api/merchant/profile/route'
import { POST as photosPOST } from '@/app/api/merchant/photos/route'

const merchant = { id: 'merchant-1', supabase_id: 'supa-merchant', role: 'merchant', is_active: true, deleted_at: null }
const activeProfile = {
  id: 'profile-1',
  merchant_id: 'merchant-1',
  poi_id: 'poi-1',
  status: 'active',
  approved_claim_id: 'claim-1',
  poi: {
    id: 'poi-1',
    name: 'La Table Alpine',
    slug: 'la-table-alpine',
    description: 'Cuisine locale',
    hours: { monday: '10:00-18:00' },
    phone: '+33450780000',
    website: 'https://table.example',
    photos: ['https://cdn.example/one.webp'],
    city: { slug: 'saint-gervais-les-bains' },
    category: { slug: 'diner' },
  },
}

function jsonRequest(url: string, method: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function formRequest(file: File): NextRequest {
  const form = new FormData()
  form.set('file', file)
  return new NextRequest('http://localhost/api/merchant/photos', { method: 'POST', body: form })
}

describe('015 merchant profile and photos API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-merchant' } } })
    mockFindUser.mockResolvedValue(merchant)
    mockFindFirstProfile.mockResolvedValue(activeProfile)
    mockFindFirstPoi.mockImplementation(async ({ where }: { where?: { discovery_status?: string } }) =>
      where?.discovery_status === 'PUBLISHED' ? null : activeProfile.poi,
    )
    mockTransaction.mockImplementation(async callback => callback({
      pointOfInterest: { findFirst: mockFindFirstPoi, update: mockUpdatePoi },
      poiAcquisitionAuditLog: { create: mockDiscoveryAuditCreate },
    }))
    mockGetPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://storage.supabase.co/storage/v1/object/public/merchant-poi-photos/merchant-1/poi-1/photo.webp',
      },
    })
  })

  it('AC-01-01: returns the active merchant profile and public URL', async () => {
    const res = await profileGET(jsonRequest('http://localhost/api/merchant/profile', 'GET'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toMatchObject({
      id: 'profile-1',
      poi: {
        id: 'poi-1',
        name: 'La Table Alpine',
        public_url: '/guide/saint-gervais-les-bains/diner/la-table-alpine',
      },
    })
    expect(mockFindFirstProfile).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchant_id: 'merchant-1', status: 'active', deleted_at: null },
    }))
  })

  it('AC-01-01/04: patches only editable POI fields for the active merchant profile', async () => {
    mockUpdatePoi.mockResolvedValue({ ...activeProfile.poi, name: 'Nouvelle Table', website: null })

    const res = await profilePATCH(jsonRequest('http://localhost/api/merchant/profile', 'PATCH', {
      name: 'Nouvelle Table',
      website: null,
    }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ data: { poi: { name: 'Nouvelle Table', website: null } } })
    expect(mockUpdatePoi).toHaveBeenCalledWith({
      where: { id: 'poi-1' },
      data: { name: 'Nouvelle Table', website: null },
      select: expect.any(Object),
    })
  })

  it('AC-01-01: accepts a phone number and normalizes website without protocol', async () => {
    mockUpdatePoi.mockResolvedValue({
      ...activeProfile.poi,
      phone: '+33 4 50 78 00 00',
      website: 'https://latablealpine.fr',
    })

    const res = await profilePATCH(jsonRequest('http://localhost/api/merchant/profile', 'PATCH', {
      phone: ' +33 4 50 78 00 00 ',
      website: 'latablealpine.fr',
    }))

    expect(res.status).toBe(200)
    expect(mockUpdatePoi).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'poi-1' },
      data: expect.objectContaining({
        phone: '+33 4 50 78 00 00',
        website: 'https://latablealpine.fr',
      }),
    }))
  })

  it('AC-01-04: rejects non-editable POI fields', async () => {
    const res = await profilePATCH(jsonRequest('http://localhost/api/merchant/profile', 'PATCH', {
      address: 'Nouvelle adresse interdite',
    }))

    expect(res.status).toBe(400)
    expect(mockUpdatePoi).not.toHaveBeenCalled()
  })

  it('AC-01-03: rejects photo upload when the POI already has 5 photos', async () => {
    mockFindFirstPoi.mockResolvedValue({ ...activeProfile.poi, photos: ['1', '2', '3', '4', '5'] })

    const res = await photosPOST(formRequest(new File(['img'], 'photo.webp', { type: 'image/webp' })))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('PHOTO_LIMIT_REACHED')
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockUpdatePoi).not.toHaveBeenCalled()
  })

  it('AC-01-02: uploads a valid photo and appends its public URL to POI photos', async () => {
    mockFindFirstPoi.mockResolvedValue(activeProfile.poi)
    mockUpload.mockResolvedValue({ data: { path: 'merchant-1/poi-1/photo.webp' }, error: null })
    mockUpdatePoi.mockResolvedValue({
      ...activeProfile.poi,
      photos: [
        ...activeProfile.poi.photos,
        'https://storage.supabase.co/storage/v1/object/public/merchant-poi-photos/merchant-1/poi-1/photo.webp',
      ],
    })

    const res = await photosPOST(formRequest(new File(['img'], 'photo.webp', { type: 'image/webp' })))

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.photos).toHaveLength(2)
    expect(mockUpload).toHaveBeenCalled()
    expect(mockGetPublicUrl).toHaveBeenCalledWith('merchant-1/poi-1/photo.webp')
    expect(mockUpdatePoi).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'poi-1' },
      data: expect.objectContaining({
        photos: expect.arrayContaining([
          'https://storage.supabase.co/storage/v1/object/public/merchant-poi-photos/merchant-1/poi-1/photo.webp',
        ]),
      }),
    }))
  })
})
