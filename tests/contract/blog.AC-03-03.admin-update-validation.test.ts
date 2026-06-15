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
        title: 'abc',
        slug: 'ok',
        excerpt: 'court',
        content_markdown: 'short',
        category: 'local_guide',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(400)
    expect(mockUpdateBlogArticle).not.toHaveBeenCalled()
  })
})
