import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockDeleteBlogArticle = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => {
  class ApiBlogError extends Error {
    code: string
    status: number
    details: Record<string, unknown>
    constructor(code: string, status: number, details: Record<string, unknown> = {}) {
      super(code)
      this.code = code
      this.status = status
      this.details = details
    }
  }
  return {
    ApiBlogError,
    deleteBlogArticle: (...args: unknown[]) => mockDeleteBlogArticle(...args),
  }
})

import { DELETE } from '@/app/api/admin/blog/[id]/route'

function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('029 blog admin delete API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('soft-deletes the article and revalidates public surfaces for admins', async () => {
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockDeleteBlogArticle.mockResolvedValue({ id: 'article-1', slug: 'week-end-saint-gervais' })

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/blog/article-1', { method: 'DELETE' }),
      context('article-1'),
    )

    expect(response.status).toBe(200)
    expect(mockDeleteBlogArticle).toHaveBeenCalledWith('article-1')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/blog', 'page')
  })

  it('preserves the forbidden response from the admin session guard', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/blog/article-1', { method: 'DELETE' }),
      context('article-1'),
    )

    expect(response.status).toBe(403)
    expect(mockDeleteBlogArticle).not.toHaveBeenCalled()
  })
})
