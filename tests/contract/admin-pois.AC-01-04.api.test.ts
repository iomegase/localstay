import { NextRequest } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockListAdminPois = jest.fn()
const mockGetAdminPoi = jest.fn()
const mockUpdateAdminPoi = jest.fn()
const mockDisableAdminPoi = jest.fn()
const mockArchiveAdminPoi = jest.fn()
const mockRestoreAdminPoi = jest.fn()
const mockRefreshOfficialPhotos = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: (...args: unknown[]) => mockListAdminPois(...args),
  getAdminPoi: (...args: unknown[]) => mockGetAdminPoi(...args),
  updateAdminPoi: (...args: unknown[]) => mockUpdateAdminPoi(...args),
  disableAdminPoi: (...args: unknown[]) => mockDisableAdminPoi(...args),
  archiveAdminPoi: (...args: unknown[]) => mockArchiveAdminPoi(...args),
  restoreAdminPoi: (...args: unknown[]) => mockRestoreAdminPoi(...args),
  refreshAdminPoiOfficialPhotos: (...args: unknown[]) => mockRefreshOfficialPhotos(...args),
}))

import { GET as listGET, POST as createPOST } from '@/app/api/admin/pois/route'
import { GET as detailGET, PATCH as detailPATCH } from '@/app/api/admin/pois/[id]/route'
import { POST as disablePOST } from '@/app/api/admin/pois/[id]/disable/route'
import { POST as archivePOST } from '@/app/api/admin/pois/[id]/archive/route'
import { POST as restorePOST } from '@/app/api/admin/pois/[id]/restore/route'
import { POST as refreshPOST } from '@/app/api/admin/pois/[id]/refresh-official-photos/route'

const cityId = '11111111-1111-4111-8111-111111111111'
const categoryId = '22222222-2222-4222-8222-222222222222'
const poiId = '44444444-4444-4444-8444-444444444444'

function jsonRequest(url: string, method: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const params = { params: Promise.resolve({ id: poiId }) }

describe('022 admin POI API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-01-01/01-02: lists POIs filtered by city with parsed filters', async () => {
    mockListAdminPois.mockResolvedValue({ data: [], pagination: { page: 2, limit: 10, total: 0, total_pages: 0 }, kpis: {} })

    const res = await listGET(new NextRequest(
      `http://localhost/api/admin/pois?city_id=${cityId}&status=archived&page=2&limit=10&q=expo`,
    ))

    expect(res.status).toBe(200)
    expect(mockListAdminPois).toHaveBeenCalledWith({
      city_id: cityId,
      status: 'archived',
      page: 2,
      limit: 10,
      q: 'expo',
    })
  })

  it('AC-01-02: validates required city filter', async () => {
    const res = await listGET(new NextRequest('http://localhost/api/admin/pois'))

    expect(res.status).toBe(400)
    expect(mockListAdminPois).not.toHaveBeenCalled()
  })

  it('AC-02-01: returns a POI detail', async () => {
    mockGetAdminPoi.mockResolvedValue({ id: poiId, name: 'Le Pile Pont Expo' })

    const res = await detailGET(new NextRequest(`http://localhost/api/admin/pois/${poiId}`), params)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: poiId, name: 'Le Pile Pont Expo' } })
  })

  it('AC-02-02: validates and patches editable POI fields', async () => {
    mockUpdateAdminPoi.mockResolvedValue({ id: poiId, name: 'Nom corrigé' })

    const res = await detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      name: 'Nom corrigé',
      category_id: categoryId,
      photos: ['https://example.com/photo.jpg'],
      tags: ['culture', 'exposition'],
    }), params)

    expect(res.status).toBe(200)
    expect(mockUpdateAdminPoi).toHaveBeenCalledWith(
      poiId,
      {
        name: 'Nom corrigé',
        category_id: categoryId,
        photos: ['https://example.com/photo.jpg'],
        tags: ['culture', 'exposition'],
        force_geocode: false,
        confirm_geocode_pending_review: false,
      },
      'admin-1',
    )
  })

  it('AC-02-05: returns TRAIL_FIELDS_LOCKED for trail-specific PATCH fields', async () => {
    const res = await detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      distance_km: 8,
    }), params)

    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'TRAIL_FIELDS_LOCKED', message: 'Données randonnée verrouillées dans ce backoffice', details: {} },
    })
    expect(mockUpdateAdminPoi).not.toHaveBeenCalled()
  })

  it('AC-04-01/04-02/04-04: routes sensitive status actions', async () => {
    mockDisableAdminPoi.mockResolvedValue({ id: poiId, status: 'inactive' })
    mockArchiveAdminPoi.mockResolvedValue({ id: poiId, status: 'archived' })
    mockRestoreAdminPoi.mockResolvedValue({ id: poiId, status: 'inactive' })

    await expect(disablePOST(new NextRequest(`http://localhost/api/admin/pois/${poiId}/disable`), params))
      .resolves.toHaveProperty('status', 200)
    await expect(archivePOST(new NextRequest(`http://localhost/api/admin/pois/${poiId}/archive`), params))
      .resolves.toHaveProperty('status', 200)
    await expect(restorePOST(new NextRequest(`http://localhost/api/admin/pois/${poiId}/restore`), params))
      .resolves.toHaveProperty('status', 200)

    expect(mockDisableAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
    expect(mockArchiveAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
    expect(mockRestoreAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
  })

  it('AC-03-02/03-03: refreshes official photos without blocking on zero additions', async () => {
    mockRefreshOfficialPhotos.mockResolvedValue({
      photos: ['https://example.com/existing.jpg'],
      photos_added: 0,
    })

    const res = await refreshPOST(new NextRequest(`http://localhost/api/admin/pois/${poiId}/refresh-official-photos`), params)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      data: {
        photos: ['https://example.com/existing.jpg'],
        photos_added: 0,
      },
    })
  })

  it('maps domain errors to standard API error responses', async () => {
    mockUpdateAdminPoi.mockRejectedValue(new PoiAcquisitionError('INVALID_CATEGORY', 400))

    const res = await detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      category_id: categoryId,
    }), params)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'INVALID_CATEGORY', message: 'Catégorie invalide', details: {} },
    })
  })

  it('keeps POST /api/admin/pois available for the existing 018 manual creation contract', () => {
    expect(typeof createPOST).toBe('function')
  })
})
