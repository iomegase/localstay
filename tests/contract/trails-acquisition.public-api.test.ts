import { NextRequest } from 'next/server'

const mockListPublishedTrails = jest.fn()
const mockGetPublishedTrail = jest.fn()

jest.mock('@/features/trails-acquisition/queries/public-trails', () => ({
  listPublishedTrails: (...args: unknown[]) => mockListPublishedTrails(...args),
  getPublishedTrail: (...args: unknown[]) => mockGetPublishedTrail(...args),
}))

import { GET as listGET } from '@/app/api/cities/[slug]/trails/route'
import { GET as detailGET } from '@/app/api/cities/[slug]/trails/[trail-slug]/route'

describe('019 public trails APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC-05-01: lists published trails by city slug', async () => {
    mockListPublishedTrails.mockResolvedValue([{ id: 'poi-1', slug: 'boucle-des-alpages', difficulty: 'medium' }])

    const res = await listGET(new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/trails'), {
      params: Promise.resolve({ slug: 'saint-gervais-les-bains' }),
    })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(mockListPublishedTrails).toHaveBeenCalledWith('saint-gervais-les-bains')
  })

  it('AC-05-02: returns one published trail detail', async () => {
    mockGetPublishedTrail.mockResolvedValue({ id: 'poi-1', slug: 'boucle-des-alpages', trail_detail: { difficulty: 'medium' } })

    const res = await detailGET(new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/trails/boucle-des-alpages'), {
      params: Promise.resolve({ slug: 'saint-gervais-les-bains', 'trail-slug': 'boucle-des-alpages' }),
    })

    expect(res.status).toBe(200)
    expect(mockGetPublishedTrail).toHaveBeenCalledWith('saint-gervais-les-bains', 'boucle-des-alpages')
  })

  it('AC-05-04: returns 404 for non published trail detail', async () => {
    mockGetPublishedTrail.mockResolvedValue(null)

    const res = await detailGET(new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/trails/missing'), {
      params: Promise.resolve({ slug: 'saint-gervais-les-bains', 'trail-slug': 'missing' }),
    })

    expect(res.status).toBe(404)
  })
})
