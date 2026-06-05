import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockDeleteCategory = jest.fn()
const mockDeleteSubCategory = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/admin-taxonomy/queries/taxonomy', () => ({
  ApiTaxonomyError: class ApiTaxonomyError extends Error {
    status: number
    details: Record<string, unknown>

    constructor(code: string, status: number, details: Record<string, unknown> = {}) {
      super(code)
      this.status = status
      this.details = details
    }
  },
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
  deleteSubCategory: (...args: unknown[]) => mockDeleteSubCategory(...args),
}))

import { ApiTaxonomyError } from '@/features/admin-taxonomy/queries/taxonomy'
import { DELETE as categoryDELETE } from '@/app/api/admin/taxonomy/categories/[id]/route'
import { DELETE as subCategoryDELETE } from '@/app/api/admin/taxonomy/subcategories/[id]/route'

const admin = { id: 'admin-1', role: 'admin' }

function request(method: string, url: string): NextRequest {
  return new NextRequest(url, { method })
}

describe('017 admin taxonomy DELETE API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: admin, error: null })
  })

  it('deletes a Category and returns the deleted id', async () => {
    mockDeleteCategory.mockResolvedValue({ id: 'cat-1', deleted: true })

    const res = await categoryDELETE(
      request('DELETE', 'http://localhost/api/admin/taxonomy/categories/cat-1'),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: 'cat-1', deleted: true } })
    expect(mockDeleteCategory).toHaveBeenCalledWith('cat-1', 'admin-1')
  })

  it('maps a category-still-in-use conflict to a 409', async () => {
    mockDeleteCategory.mockRejectedValue(new ApiTaxonomyError('CATEGORY_HAS_POIS', 409))

    const res = await categoryDELETE(
      request('DELETE', 'http://localhost/api/admin/taxonomy/categories/cat-1'),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('CATEGORY_HAS_POIS')
  })

  it('deletes a SubCategory and returns the deleted id', async () => {
    mockDeleteSubCategory.mockResolvedValue({ id: 'sub-1', deleted: true })

    const res = await subCategoryDELETE(
      request('DELETE', 'http://localhost/api/admin/taxonomy/subcategories/sub-1'),
      { params: Promise.resolve({ id: 'sub-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: 'sub-1', deleted: true } })
    expect(mockDeleteSubCategory).toHaveBeenCalledWith('sub-1', 'admin-1')
  })

  it('rejects unauthenticated callers without touching the queries', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await categoryDELETE(
      request('DELETE', 'http://localhost/api/admin/taxonomy/categories/cat-1'),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(403)
    expect(mockDeleteCategory).not.toHaveBeenCalled()
  })
})
