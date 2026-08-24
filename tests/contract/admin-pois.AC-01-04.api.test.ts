import { NextRequest } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockListAdminPois = jest.fn()
const mockGetAdminPoi = jest.fn()
const mockUpdateAdminPoi = jest.fn()
const mockDisableAdminPoi = jest.fn()
const mockDeleteAdminPoi = jest.fn()
const mockRestoreAdminPoi = jest.fn()
const mockRefreshOfficialPhotos = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: (...args: unknown[]) => mockListAdminPois(...args),
  getAdminPoi: (...args: unknown[]) => mockGetAdminPoi(...args),
  updateAdminPoi: (...args: unknown[]) => mockUpdateAdminPoi(...args),
  disableAdminPoi: (...args: unknown[]) => mockDisableAdminPoi(...args),
  deleteAdminPoi: (...args: unknown[]) => mockDeleteAdminPoi(...args),
  restoreAdminPoi: (...args: unknown[]) => mockRestoreAdminPoi(...args),
  refreshAdminPoiOfficialPhotos: (...args: unknown[]) => mockRefreshOfficialPhotos(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { GET as listGET, POST as createPOST } from '@/app/api/admin/pois/route'
import { GET as detailGET, PATCH as detailPATCH } from '@/app/api/admin/pois/[id]/route'
import { POST as disablePOST } from '@/app/api/admin/pois/[id]/disable/route'
import { POST as deletePOST } from '@/app/api/admin/pois/[id]/delete/route'
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
      `http://localhost/api/admin/pois?city_id=${cityId}&status=archived&discovery_status=PUBLISHED&page=2&limit=10&q=expo`,
    ))

    expect(res.status).toBe(200)
    expect(mockListAdminPois).toHaveBeenCalledWith({
      city_id: cityId,
      status: 'archived',
      page: 2,
      limit: 10,
      q: 'expo',
      discovery_status: 'PUBLISHED',
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
    mockUpdateAdminPoi.mockResolvedValue({
      data: { id: poiId, name: 'Nom corrigé' },
      discovery_revalidation_paths: [
        '/decouvrir/saint-gervais',
        '/decouvrir/saint-gervais/manger',
        '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      ],
    })

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
    await expect(res.json()).resolves.toEqual({ data: { id: poiId, name: 'Nom corrigé' } })
    expect(mockRevalidatePath.mock.calls).toEqual([
      ['/decouvrir', 'page'],
      ['/decouvrir/saint-gervais', 'page'],
      ['/decouvrir/saint-gervais/manger', 'page'],
      ['/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc', 'page'],
      ['/sitemap.xml'],
    ])
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
    const paths = [
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
    ]
    mockDisableAdminPoi.mockResolvedValue({
      data: { id: poiId, status: 'inactive' },
      discovery_revalidation_paths: paths,
    })
    mockDeleteAdminPoi.mockResolvedValue({
      data: { id: poiId, status: 'archived' },
      discovery_revalidation_paths: paths,
    })
    mockRestoreAdminPoi.mockResolvedValue({
      data: { id: poiId, status: 'inactive' },
      discovery_revalidation_paths: paths,
    })

    const disableResponse = await disablePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/disable`),
      params,
    )
    const deleteResponse = await deletePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/delete`),
      params,
    )
    const restoreResponse = await restorePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/restore`),
      params,
    )

    expect(disableResponse.status).toBe(200)
    expect(deleteResponse.status).toBe(200)
    expect(restoreResponse.status).toBe(200)
    await expect(disableResponse.json()).resolves.toEqual({ data: { id: poiId, status: 'inactive' } })
    await expect(deleteResponse.json()).resolves.toEqual({ data: { id: poiId, status: 'archived' } })
    await expect(restoreResponse.json()).resolves.toEqual({ data: { id: poiId, status: 'inactive' } })

    expect(mockDisableAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
    expect(mockDeleteAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
    expect(mockRestoreAdminPoi).toHaveBeenCalledWith(poiId, 'admin-1')
    expect(mockRevalidatePath).toHaveBeenCalledTimes(15)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais/manger', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      'page',
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })

  it('revalidates discovery paths after an automatic unpublication from PATCH', async () => {
    const paths = [
      '/decouvrir/saint-gervais',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
    ]
    mockUpdateAdminPoi.mockResolvedValue({
      data: { id: poiId, discovery_status: 'DRAFT' },
      discovery_revalidation_paths: paths,
    })

    const res = await detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      description: null,
      category_id: categoryId,
    }), params)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: poiId, discovery_status: 'DRAFT' } })
    expect(mockRevalidatePath.mock.calls).toEqual([
      ['/decouvrir', 'page'],
      ['/decouvrir/saint-gervais', 'page'],
      ['/decouvrir/saint-gervais/manger', 'page'],
      ['/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc', 'page'],
      ['/sitemap.xml'],
    ])
    expect(mockRevalidatePath).not.toHaveBeenCalledWith('/decouvrir/saint-gervais/nouvelle-categorie', 'page')
    expect(mockRevalidatePath).not.toHaveBeenCalledWith(
      '/decouvrir/saint-gervais/nouvelle-categorie/brasserie-du-mont-blanc',
      'page',
    )
  })

  it('returns committed PATCH success when post-commit revalidation fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockUpdateAdminPoi.mockResolvedValue({
      data: { id: poiId, name: 'Nom persisté' },
      discovery_revalidation_paths: ['/decouvrir/saint-gervais'],
    })
    mockRevalidatePath.mockImplementationOnce(() => {
      throw new Error('cache unavailable')
    })

    const res = await detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      name: 'Nom persisté',
    }), params)

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: poiId, name: 'Nom persisté' } })
    expect(mockUpdateAdminPoi).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
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

  it.each([
    ['PATCH', mockUpdateAdminPoi, () => detailPATCH(jsonRequest(`http://localhost/api/admin/pois/${poiId}`, 'PATCH', {
      name: 'Nom corrigé',
    }), params)],
    ['disable', mockDisableAdminPoi, () => disablePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/disable`),
      params,
    )],
    ['archive', mockDeleteAdminPoi, () => deletePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/delete`),
      params,
    )],
    ['restore', mockRestoreAdminPoi, () => restorePOST(
      new NextRequest(`http://localhost/api/admin/pois/${poiId}/restore`),
      params,
    )],
  ])('maps an unexpected %s infrastructure failure to INTERNAL_ERROR', async (_action, query, invoke) => {
    query.mockRejectedValue(Object.assign(new Error('serialization conflict'), { code: 'P2034' }))

    const res = await invoke()

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erreur interne', details: {} },
    })
  })

  it('keeps POST /api/admin/pois available for the existing 018 manual creation contract', () => {
    expect(typeof createPOST).toBe('function')
  })
})
