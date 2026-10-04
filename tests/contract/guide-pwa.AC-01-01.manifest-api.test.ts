import { NextRequest } from 'next/server'

const mockFindLodging = jest.fn()

jest.mock('@/features/guide-pwa/queries/manifest-lodging', () => ({
  findManifestLodging: (...args: unknown[]) => mockFindLodging(...args),
}))

import { GET } from '@/app/api/guide/manifest/route'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'

function request(query: string) {
  return new NextRequest(`http://localhost:3000/api/guide/manifest${query}`)
}

beforeEach(() => mockFindLodging.mockReset())

describe('GET /api/guide/manifest — spec 059 AC-01-01', () => {
  it('200 : manifest du logement en application/manifest+json', async () => {
    mockFindLodging.mockResolvedValue({ id: LODGING_ID, name: 'Chalet des Aravis' })
    const res = await GET(request(`?lodging=${LODGING_ID}`))

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/manifest+json')
    const body = await res.json()
    expect(body).toMatchObject({
      id: `/sejour?lodging=${LODGING_ID}&source=pwa`,
      start_url: `/sejour?lodging=${LODGING_ID}&source=pwa`,
      scope: '/',
      display: 'standalone',
      name: 'MyStay — Chalet des Aravis',
      short_name: 'MyStay',
    })
    expect(mockFindLodging).toHaveBeenCalledWith(LODGING_ID)
  })

  it.each(['', '?lodging=', '?lodging=pas-un-uuid'])('400 INVALID_LODGING pour %s', async query => {
    const res = await GET(request(query))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: { code: 'INVALID_LODGING', message: expect.any(String), details: expect.any(Object) },
    })
    expect(mockFindLodging).not.toHaveBeenCalled()
  })

  it('404 LODGING_NOT_FOUND pour un logement inconnu, supprimé ou inactif', async () => {
    mockFindLodging.mockResolvedValue(null)
    const res = await GET(request(`?lodging=${LODGING_ID}`))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({
      error: { code: 'LODGING_NOT_FOUND', message: expect.any(String), details: {} },
    })
  })
})
