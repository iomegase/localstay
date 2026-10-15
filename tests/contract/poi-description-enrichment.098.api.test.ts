import { NextResponse } from 'next/server'

const mockSession = jest.fn()
const mockList = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/admin-pois/queries/description-enrichment', () => ({ listDescriptionEnrichmentItems: () => mockList() }))

import { GET } from '@/app/api/admin/pois/enrichment/route'

describe('098 — GET /api/admin/pois/enrichment', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the short-description POIs without their description text', async () => {
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockList.mockResolvedValue([{ id: 'p1', name: 'Le 42', city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant', word_count: 28, public_path: '/decouvrir/saint-gervais-les-bains/diner/le-42', description: 'Texte' }])
    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ items: [{ id: 'p1', name: 'Le 42', city_name: 'Saint-Gervais-les-Bains', category_name: 'Restaurant', word_count: 28, public_path: '/decouvrir/saint-gervais-les-bains/diner/le-42' }] })
  })

  it('rejects non-admin sessions', async () => {
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Accès refusé', details: {} } }, { status: 403 }) })
    const response = await GET()
    expect(response.status).toBe(403)
    expect(mockList).not.toHaveBeenCalled()
  })
})
