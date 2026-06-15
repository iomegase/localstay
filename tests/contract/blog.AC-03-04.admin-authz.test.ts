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

describe('029 blog admin authz API', () => {
  it('preserves the forbidden response from admin session guard', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const response = await GET(new NextRequest('http://localhost/api/admin/blog'))

    expect(response.status).toBe(403)
    expect(mockListAdminBlogArticles).not.toHaveBeenCalled()
  })
})
