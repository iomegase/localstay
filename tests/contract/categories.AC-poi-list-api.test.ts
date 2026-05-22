/**
 * Contract test — GET /api/cities/{slug}/categories/{category-slug}/pois
 */

jest.mock('@/features/categories/queries/poi-cards', () => ({
  getPoiCards: jest.fn(),
}))

import { GET } from '@/app/api/cities/[slug]/categories/[category-slug]/pois/route'
import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { NextRequest } from 'next/server'

function makeReq(url: string) {
  return new NextRequest(url)
}

const sampleCard = {
  id: '1', name: 'Le Bistrot', slug: 'bistrot', address: '1 rue Test',
  subcategory_name: 'Gastronomique', rating: 4.5, rating_count: 100,
  is_open_now: true, distance_km: 0.3, photo_url: null,
}

describe('GET /api/cities/[slug]/categories/[category-slug]/pois', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 200 with data array when city + category exist', async () => {
    jest.mocked(getPoiCards).mockResolvedValue([sampleCard])

    const res = await GET(
      makeReq('http://localhost/api/cities/saint-gervais-les-bains/categories/restaurants/pois'),
      { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'restaurants' } },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0]).toMatchObject({
      id: '1', name: 'Le Bistrot', slug: 'bistrot',
      rating: 4.5, distance_km: 0.3,
    })
  })

  it('returns 404 when city or category not found (getPoiCards returns null)', async () => {
    jest.mocked(getPoiCards).mockResolvedValue(null)

    const res = await GET(
      makeReq('http://localhost/api/cities/unknown-city/categories/restaurants/pois'),
      { params: { slug: 'unknown-city', 'category-slug': 'restaurants' } },
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('passes sort param to getPoiCards', async () => {
    jest.mocked(getPoiCards).mockResolvedValue([])

    await GET(
      makeReq('http://localhost/api/cities/city/categories/cat/pois?sort=rating'),
      { params: { slug: 'city', 'category-slug': 'cat' } },
    )

    expect(getPoiCards).toHaveBeenCalledWith('city', 'cat', {
      subcategorySlug: undefined,
      sort: 'rating',
    })
  })

  it('passes subcategory param to getPoiCards', async () => {
    jest.mocked(getPoiCards).mockResolvedValue([])

    await GET(
      makeReq('http://localhost/api/cities/city/categories/cat/pois?subcategory=gastronomique'),
      { params: { slug: 'city', 'category-slug': 'cat' } },
    )

    expect(getPoiCards).toHaveBeenCalledWith('city', 'cat', {
      subcategorySlug: 'gastronomique',
      sort: 'distance',
    })
  })
})
