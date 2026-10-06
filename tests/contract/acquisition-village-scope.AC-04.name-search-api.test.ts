import { NextRequest } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockSearchByName = jest.fn()
const mockCreateAcquisitionRun = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/poi-acquisition/queries/name-search', () => ({
  searchAcquisitionPlacesByName: (...args: unknown[]) => mockSearchByName(...args),
}))

jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  createAcquisitionRun: (...args: unknown[]) => mockCreateAcquisitionRun(...args),
  listAcquisitionRuns: jest.fn(),
}))

import { POST as nameSearchPOST } from '@/app/api/admin/poi-acquisition/name-search/route'
import { POST as runsPOST } from '@/app/api/admin/poi-acquisition/runs/route'

// Spec 066 US-04 — contrat de la recherche par nom.
function request(url: string, body: object) {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const result = {
  google_place_id: 'le-galeta',
  name: 'Restaurant Le Galeta',
  address: '150 Imp. des Lupins, 74170 Saint-Gervais-les-Bains, France',
  business_status: 'CLOSED_TEMPORARILY',
  nearest_city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
  is_other_village: false,
}

describe('066 AC-04 — POST /api/admin/poi-acquisition/name-search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-04-01 : renvoie les résultats au format du contrat', async () => {
    mockSearchByName.mockResolvedValue([result])

    const res = await nameSearchPOST(request('/api/admin/poi-acquisition/name-search', { city_id: 'city-sg', query: ' Le Galeta ' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [result] })
    expect(mockSearchByName).toHaveBeenCalledWith({ city_id: 'city-sg', query: 'Le Galeta' })
  })

  it('refuse une requête trop courte (Zod)', async () => {
    const res = await nameSearchPOST(request('/api/admin/poi-acquisition/name-search', { city_id: 'city-sg', query: 'a' }))

    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockSearchByName).not.toHaveBeenCalled()
  })

  it('404 CITY_NOT_FOUND pour une ville inconnue', async () => {
    mockSearchByName.mockRejectedValue(new PoiAcquisitionError('CITY_NOT_FOUND', 404))

    const res = await nameSearchPOST(request('/api/admin/poi-acquisition/name-search', { city_id: 'inconnue', query: 'Le Galeta' }))

    expect(res.status).toBe(404)
    expect((await res.json()).error.code).toBe('CITY_NOT_FOUND')
  })

  it('502 GOOGLE_PLACES_UNAVAILABLE quand Google échoue', async () => {
    mockSearchByName.mockRejectedValue(new PoiAcquisitionError('GOOGLE_PLACES_UNAVAILABLE', 502))

    const res = await nameSearchPOST(request('/api/admin/poi-acquisition/name-search', { city_id: 'city-sg', query: 'Le Galeta' }))

    expect(res.status).toBe(502)
    expect((await res.json()).error.code).toBe('GOOGLE_PLACES_UNAVAILABLE')
  })

  it('refuse un visiteur non admin', async () => {
    const { NextResponse } = await import('next/server')
    mockGetSessionAdmin.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }) })

    const res = await nameSearchPOST(request('/api/admin/poi-acquisition/name-search', { city_id: 'city-sg', query: 'Le Galeta' }))

    expect(res.status).toBe(403)
  })

  it('AC-04-02 : POST /runs accepte google_place_id', async () => {
    mockCreateAcquisitionRun.mockResolvedValue({ id: 'run-1', status: 'completed' })

    const res = await runsPOST(request('/api/admin/poi-acquisition/runs', {
      city_id: 'city-sg', category_id: 'cat-diner', google_place_id: 'le-galeta',
    }))

    expect(res.status).toBe(201)
    expect(mockCreateAcquisitionRun).toHaveBeenCalledWith(
      { city_id: 'city-sg', category_id: 'cat-diner', google_place_id: 'le-galeta' },
      'admin-1',
    )
  })
})
