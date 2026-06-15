import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockListAdminBlogArticles = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  listAdminBlogArticles: (...args: unknown[]) => mockListAdminBlogArticles(...args),
}))

import { GET } from '@/app/api/admin/blog/route'

describe('029 blog admin list API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('returns the filtered admin article list for admins', async () => {
    mockListAdminBlogArticles.mockResolvedValue([
      {
        id: 'article-1',
        title: 'Week-end à Saint-Gervais',
        slug: 'week-end-saint-gervais',
        status: 'draft',
        category: 'local_guide',
        city_name: 'Saint-Gervais-les-Bains',
        published_at: null,
        updated_at: '2026-06-15T10:00:00.000Z',
      },
    ])

    const request = new NextRequest('http://localhost/api/admin/blog?status=draft&category=local_guide&city=city-1')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockListAdminBlogArticles).toHaveBeenCalledWith({
      status: 'draft',
      category: 'local_guide',
      city: 'city-1',
    })
  })
})
