import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  createBlogPhoto: jest.fn(),
}))

import { POST } from '@/app/api/admin/blog/[id]/photos/route'

describe('029 blog invalid upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('rejects a request without file before creating a blog photo', async () => {
    const formData = new FormData()
    formData.set('kind', 'cover')
    formData.set('alt', 'Couverture article')

    const response = await POST(
      new NextRequest('http://localhost/api/admin/blog/article-1/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })
  })
})
