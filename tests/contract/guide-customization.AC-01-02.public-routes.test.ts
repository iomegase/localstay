import { NextRequest } from 'next/server'

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn(),
}))

jest.mock('@/features/categories/queries/categories', () => ({
  getCategoriesForCity: jest.fn(),
}))

jest.mock('@/features/categories/queries/poi-cards', () => ({
  getPoiCards: jest.fn(),
}))

import { GET as cityGET } from '@/app/api/cities/[slug]/route'
import { GET as categoriesGET } from '@/app/api/cities/[slug]/categories/route'
import { GET as poisGET } from '@/app/api/cities/[slug]/categories/[category-slug]/pois/route'
import { getCityGuide } from '@/features/city-guide/queries/cities'
import { getCategoriesForCity } from '@/features/categories/queries/categories'
import { getPoiCards } from '@/features/categories/queries/poi-cards'

const cityGuide = {
  city: { id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais', postal_code: '74170', department: null },
  categories: [],
  welcome_message: 'Bienvenue',
}

const poiGroups = {
  primary: [],
  nearby: [],
  meta: {
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
    primary_total: 0,
    nearby_total: 0,
    primary_total_pages: 0,
    nearby_total_pages: 0,
  },
}

describe('public guide customization routes — 012', () => {
  afterEach(() => jest.clearAllMocks())

  it('AC-01-02: passes lodging query param to getCityGuide', async () => {
    jest.mocked(getCityGuide).mockResolvedValue(cityGuide)

    const res = await cityGET(
      new NextRequest('http://localhost/api/cities/saint-gervais?lodging=lodging-1'),
      { params: Promise.resolve({ slug: 'saint-gervais' }) },
    )

    expect(res.status).toBe(200)
    expect(getCityGuide).toHaveBeenCalledWith('saint-gervais', { lodgingId: 'lodging-1' })
    const json = await res.json()
    expect(json.data.welcome_message).toBe('Bienvenue')
  })

  it('AC-03-01: passes lodging query param to category list query', async () => {
    jest.mocked(getCategoriesForCity).mockResolvedValue([])

    await categoriesGET(
      new NextRequest('http://localhost/api/cities/saint-gervais/categories?lodging=lodging-1'),
      { params: Promise.resolve({ slug: 'saint-gervais' }) },
    )

    expect(getCategoriesForCity).toHaveBeenCalledWith('saint-gervais', { lodgingId: 'lodging-1' })
  })

  it('AC-02-01: passes lodging query param to POI list query', async () => {
    jest.mocked(getPoiCards).mockResolvedValue(poiGroups)

    await poisGET(
      new NextRequest('http://localhost/api/cities/saint-gervais/categories/restaurants/pois?lodging=lodging-1'),
      { params: Promise.resolve({ slug: 'saint-gervais', 'category-slug': 'restaurants' }) },
    )

    expect(getPoiCards).toHaveBeenCalledWith('saint-gervais', 'restaurants', {
      subcategorySlug: undefined,
      sort: 'distance',
      page: 1,
      limit: 20,
      lodgingId: 'lodging-1',
    })
  })
})
