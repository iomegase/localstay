/**
 * Contract test — GET /api/cities/{slug}/categories/{category-slug}/pois/{poi-slug}
 */

jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: jest.fn(),
}))

import { GET } from '@/app/api/cities/[slug]/categories/[category-slug]/pois/[poi-slug]/route'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { NextRequest } from 'next/server'

function makeReq(url: string) {
  return new NextRequest(url)
}

const sampleDetail = {
  id: '1', name: 'Le Bistrot', slug: 'restaurants-gastro-demo',
  description: null, address: '1 rue Test',
  latitude: 45.89, longitude: 6.71,
  phone: '+33 4 50 78 24 90', website: null,
  rating: 4.5, rating_count: 120,
  is_open_now: true, hours: null, photos: [],
  distance_km: 0.3,
  category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
  subcategory: null, hiking_detail: null,
}

const BASE = 'http://localhost/api/cities/saint-gervais-les-bains/categories/restaurants/pois'

describe('GET /api/cities/[slug]/categories/[category-slug]/pois/[poi-slug]', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 200 with data when POI exists', async () => {
    jest.mocked(getPoiDetail).mockResolvedValue(sampleDetail)

    const res = await GET(
      makeReq(`${BASE}/restaurants-gastro-demo`),
      { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'restaurants', 'poi-slug': 'restaurants-gastro-demo' } },
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.name).toBe('Le Bistrot')
    expect(body.data.phone).toBe('+33 4 50 78 24 90')
  })

  it('returns 404 when getPoiDetail returns null', async () => {
    jest.mocked(getPoiDetail).mockResolvedValue(null)

    const res = await GET(
      makeReq(`${BASE}/unknown-poi`),
      { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'restaurants', 'poi-slug': 'unknown-poi' } },
    )

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('calls getPoiDetail with correct slugs', async () => {
    jest.mocked(getPoiDetail).mockResolvedValue(sampleDetail)

    await GET(
      makeReq(`${BASE}/restaurants-gastro-demo`),
      { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'restaurants', 'poi-slug': 'restaurants-gastro-demo' } },
    )

    expect(getPoiDetail).toHaveBeenCalledWith(
      'saint-gervais-les-bains', 'restaurants', 'restaurants-gastro-demo',
    )
  })
})
