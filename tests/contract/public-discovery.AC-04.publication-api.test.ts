import { NextRequest, NextResponse } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockUpdatePoiDiscoveryPublication = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/public-discovery/queries/admin-publication', () => ({
  updatePoiDiscoveryPublication: (...args: unknown[]) => mockUpdatePoiDiscoveryPublication(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { PATCH } from '@/app/api/admin/pois/[id]/discovery-publication/route'

const poiId = '44444444-4444-4444-8444-444444444444'
const context = { params: Promise.resolve({ id: poiId }) }

function request(body: string | object): NextRequest {
  return new NextRequest(`http://localhost/api/admin/pois/${poiId}/discovery-publication`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('041 AC-04 Admin discovery publication API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('publishes an eligible POI and returns only the exact public publication DTO', async () => {
    mockUpdatePoiDiscoveryPublication.mockResolvedValue({
      id: poiId,
      discovery_status: 'PUBLISHED',
      discovery_published_at: '2026-08-20T16:00:00.000Z',
      public_url: '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      eligibility: {
        eligible: true,
        checks: {
          active: true,
          city: true,
          category: true,
          subcategory: true,
          description: true,
          photo: true,
          address: true,
          geocode: true,
          contact: true,
        },
      },
    })

    const response = await PATCH(request({ status: 'PUBLISHED' }), context)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        id: poiId,
        discovery_status: 'PUBLISHED',
        discovery_published_at: '2026-08-20T16:00:00.000Z',
        public_url: '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
        eligibility: expect.objectContaining({ eligible: true }),
      },
    })
    expect(mockUpdatePoiDiscoveryPublication).toHaveBeenCalledWith(poiId, 'PUBLISHED', 'admin-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais/manger', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      'page',
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })

  it('unpublishes to DRAFT, clears the date and preserves no public URL', async () => {
    mockUpdatePoiDiscoveryPublication.mockResolvedValue({
      id: poiId,
      discovery_status: 'DRAFT',
      discovery_published_at: null,
      public_url: null,
      eligibility: { eligible: true, checks: { active: true } },
      invalidation_paths: [
        '/decouvrir/saint-gervais',
        '/decouvrir/saint-gervais/manger',
        '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      ],
    })

    const response = await PATCH(request({ status: 'DRAFT' }), context)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: {
        id: poiId,
        discovery_status: 'DRAFT',
        discovery_published_at: null,
        public_url: null,
        eligibility: { eligible: true, checks: { active: true } },
      },
    })
    expect(mockUpdatePoiDiscoveryPublication).toHaveBeenCalledWith(poiId, 'DRAFT', 'admin-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir/saint-gervais/manger', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/decouvrir/saint-gervais/manger/brasserie-du-mont-blanc',
      'page',
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })

  it.each([
    ['unknown fields', { status: 'DRAFT', private_note: 'secret' }],
    ['unsupported status', { status: 'ARCHIVED' }],
  ])('returns the standard 400 validation response for %s', async (_label, body) => {
    const response = await PATCH(request(body), context)

    expect(response.status).toBe(400)
    expect((await response.json()).error).toEqual(expect.objectContaining({
      code: 'VALIDATION_ERROR',
      message: 'Paramètre manquant ou invalide',
    }))
    expect(mockUpdatePoiDiscoveryPublication).not.toHaveBeenCalled()
  })

  it('returns the standard 400 response for invalid JSON', async () => {
    const response = await PATCH(request('{'), context)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: {} },
    })
  })

  it('rejects an invalid UUID before invoking the publication query', async () => {
    const response = await PATCH(request({ status: 'DRAFT' }), {
      params: Promise.resolve({ id: 'not-a-uuid' }),
    })

    expect(response.status).toBe(400)
    expect(mockUpdatePoiDiscoveryPublication).not.toHaveBeenCalled()
  })

  it.each([
    ['unauthorized', 401, 'UNAUTHORIZED'],
    ['forbidden', 403, 'FORBIDDEN'],
  ])('returns the getSessionAdmin %s response', async (_label, status, code) => {
    mockGetSessionAdmin.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: { code, message: code, details: {} } }, { status }),
    })

    const response = await PATCH(request({ status: 'PUBLISHED' }), context)

    expect(response.status).toBe(status)
    expect(mockUpdatePoiDiscoveryPublication).not.toHaveBeenCalled()
  })

  it('maps incomplete publication to 409 with the missing checklist', async () => {
    mockUpdatePoiDiscoveryPublication.mockRejectedValue(new PoiAcquisitionError(
      'DISCOVERY_PUBLICATION_INCOMPLETE',
      409,
      { missing: ['description', 'photo'] },
    ))

    const response = await PATCH(request({ status: 'PUBLISHED' }), context)

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'DISCOVERY_PUBLICATION_INCOMPLETE',
        message: 'Publication Découvrir impossible : fiche incomplète',
        details: { missing: ['description', 'photo'] },
      },
    })
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it.each([
    ['POI_NOT_FOUND', 404, 'POI introuvable'],
    ['INVALID_CATEGORY', 400, 'Catégorie invalide'],
  ])('maps %s through the established Admin POI error contract', async (code, status, message) => {
    mockUpdatePoiDiscoveryPublication.mockRejectedValue(new PoiAcquisitionError(code, status))

    const response = await PATCH(request({ status: 'DRAFT' }), context)

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ error: { code, message, details: {} } })
  })

  it('maps unexpected infrastructure failures to a truthful 500 response', async () => {
    mockUpdatePoiDiscoveryPublication.mockRejectedValue(new Error('database unavailable'))

    const response = await PATCH(request({ status: 'DRAFT' }), context)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Erreur interne', details: {} },
    })
  })

  it('returns committed success when post-commit cache invalidation fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockUpdatePoiDiscoveryPublication.mockResolvedValue({
      id: poiId,
      discovery_status: 'DRAFT',
      discovery_published_at: null,
      public_url: null,
      eligibility: { eligible: true, checks: { active: true } },
      invalidation_paths: ['/decouvrir/saint-gervais'],
    })
    mockRevalidatePath.mockImplementationOnce(() => {
      throw new Error('cache unavailable')
    })

    const response = await PATCH(request({ status: 'DRAFT' }), context)

    expect(response.status).toBe(200)
    expect(mockUpdatePoiDiscoveryPublication).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })
})
