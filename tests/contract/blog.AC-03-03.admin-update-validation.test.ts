import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockUpdateBlogArticle = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  updateBlogArticle: (...args: unknown[]) => mockUpdateBlogArticle(...args),
  getAdminBlogArticle: jest.fn(),
}))

import { PATCH } from '@/app/api/admin/blog/[id]/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/blog/article-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('029 blog admin update API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('rejects an invalid payload before persistence', async () => {
    const response = await PATCH(
      request({
        title: '',
        slug: 'ok',
        excerpt: '',
        content_markdown: '',
        category: 'local_guide',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(400)
    expect(mockUpdateBlogArticle).not.toHaveBeenCalled()
  })

  it('normalizes the slug before updating the article', async () => {
    mockUpdateBlogArticle.mockResolvedValue({
      id: 'article-1',
      slug: 'vivre-a-saint-nicolas',
      status: 'draft',
    })

    const response = await PATCH(
      request({
        title: 'Vivre à Saint-Nicolas',
        slug: 'Vivre à Saint Nicolas',
        excerpt:
          'Un guide éditorial complet pour préparer un séjour local avec des repères utiles, des conseils pratiques et une lecture claire.',
        content_markdown: 'a'.repeat(320),
        category: 'local_guide',
        tags: ['saint-nicolas'],
        city_id: null,
        seo_title: 'Vivre à Saint-Nicolas — Guide local MyStay',
        seo_description:
          'Préparez un séjour à Saint-Nicolas avec les conseils MyStay, une lecture locale et des repères éditoriaux utiles.',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(200)
    expect(mockUpdateBlogArticle).toHaveBeenCalledWith(
      'article-1',
      expect.objectContaining({
        slug: 'vivre-a-saint-nicolas',
      }),
    )
  })
})
