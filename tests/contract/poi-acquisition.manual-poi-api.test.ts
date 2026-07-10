import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreateManualPoi = jest.fn()
const mockSuggestManualPoiFromSourceUrl = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  createManualPoi: (...args: unknown[]) => mockCreateManualPoi(...args),
}))

jest.mock('@/features/poi-acquisition/services/manual-poi-source', () => ({
  suggestManualPoiFromSourceUrl: (...args: unknown[]) => mockSuggestManualPoiFromSourceUrl(...args),
}))

import { POST } from '@/app/api/admin/pois/route'
import { POST as SOURCE_POST } from '@/app/api/admin/pois/source-url/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/pois', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('018 admin manual POI API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-04-01/04-02/04-03: validates input and creates a geocoded manual POI', async () => {
    mockCreateManualPoi.mockResolvedValue({ id: 'poi-1', geocode_status: 'success', is_active: true })

    const res = await POST(request({
      name: 'Nouvelle Brasserie',
      address: '1 Rue Test, 74170 Saint-Gervais-les-Bains',
      city_id: 'city-1',
      category_id: 'cat-1',
      subcategory_id: null,
      website: 'https://example.com',
      description: 'Description MyStay',
    }))

    expect(res.status).toBe(201)
    expect(mockCreateManualPoi).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Nouvelle Brasserie',
      city_id: 'city-1',
      confirm_duplicate: false,
    }), 'admin-1')
  })

  it('AC-04-05: surfaces duplicate conflicts before creation', async () => {
    const error = new Error('DUPLICATE_POI_CANDIDATE')
    Reflect.set(error, 'status', 409)
    Reflect.set(error, 'details', { duplicates: ['poi-1'] })
    mockCreateManualPoi.mockRejectedValue(error)

    const res = await POST(request({
      name: 'Brasserie du Mont Blanc',
      address: '31 Avenue du Mont Paccard',
      city_id: 'city-1',
      category_id: 'cat-1',
    }))

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('DUPLICATE_POI_CANDIDATE')
  })

  it('AC-04-01/AC-06-05: imports official URL suggestions for manual creation', async () => {
    mockSuggestManualPoiFromSourceUrl.mockResolvedValue({
      source_url: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
      website: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
      name: 'Montenvelo',
      address: null,
      phone: null,
      description: 'Location de vélos et mobilité douce à Saint-Gervais.',
    })

    const res = await SOURCE_POST(request({
      source_url: 'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
    }))

    expect(res.status).toBe(200)
    expect(mockSuggestManualPoiFromSourceUrl).toHaveBeenCalledWith(
      'https://www.saintgervais.com/je-minforme/mobilite/montenvelo/',
    )
    const json = await res.json()
    expect(json.data.name).toBe('Montenvelo')
    expect(json.data.website).toBe('https://www.saintgervais.com/je-minforme/mobilite/montenvelo/')
  })
})
