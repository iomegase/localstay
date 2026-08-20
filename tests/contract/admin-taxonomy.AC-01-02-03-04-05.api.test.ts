import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockGetAdminTaxonomy = jest.fn()
const mockCreateCategory = jest.fn()
const mockUpdateCategory = jest.fn()
const mockCreateSubCategory = jest.fn()
const mockUpdateSubCategory = jest.fn()
const mockRevalidatePath = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('@/features/admin-taxonomy/queries/taxonomy', () => ({
  ApiTaxonomyError: class ApiTaxonomyError extends Error {
    status: number

    constructor(code: string, status: number) {
      super(code)
      this.status = status
    }
  },
  getAdminTaxonomy: (...args: unknown[]) => mockGetAdminTaxonomy(...args),
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  createSubCategory: (...args: unknown[]) => mockCreateSubCategory(...args),
  updateSubCategory: (...args: unknown[]) => mockUpdateSubCategory(...args),
}))

import { ApiTaxonomyError } from '@/features/admin-taxonomy/queries/taxonomy'
import { GET as taxonomyGET } from '@/app/api/admin/taxonomy/route'
import { POST as categoryPOST } from '@/app/api/admin/taxonomy/categories/route'
import { PATCH as categoryPATCH } from '@/app/api/admin/taxonomy/categories/[id]/route'
import { POST as subCategoryPOST } from '@/app/api/admin/taxonomy/categories/[id]/subcategories/route'
import { PATCH as subCategoryPATCH } from '@/app/api/admin/taxonomy/subcategories/[id]/route'

const admin = { id: 'admin-1', role: 'admin' }

function request(method: string, url: string, body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('017 admin taxonomy API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: admin, error: null })
    mockGetAdminTaxonomy.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Dîner',
        slug: 'diner',
        icon: 'utensils',
        sort_order: 1,
        is_active: true,
        slug_locked: false,
        poi_count: 0,
        subcategory_count: 1,
        subcategories: [],
      },
    ])
  })

  it('AC-01-01: returns the full admin taxonomy for admins', async () => {
    const res = await taxonomyGET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: expect.arrayContaining([expect.objectContaining({ slug: 'diner' })]) })
  })

  it('BR-01/BR-02: returns admin auth errors unchanged', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await taxonomyGET()

    expect(res.status).toBe(403)
    expect(mockGetAdminTaxonomy).not.toHaveBeenCalled()
  })

  it('AC-02-01: creates a valid Category through the API', async () => {
    mockCreateCategory.mockResolvedValue({ id: 'cat-2', slug: 'bars', name: 'Bars' })

    const res = await categoryPOST(request('POST', 'http://localhost/api/admin/taxonomy/categories', {
      name: 'Bars',
      slug: 'bars',
      icon: 'wine',
      sort_order: 8,
    }))

    expect(res.status).toBe(201)
    expect(mockCreateCategory).toHaveBeenCalledWith(
      { name: 'Bars', slug: 'bars', icon: 'wine', sort_order: 8, is_active: true },
      'admin-1',
    )
  })

  it('AC-02-03: rejects invalid icon slugs before creating a Category', async () => {
    const res = await categoryPOST(request('POST', 'http://localhost/api/admin/taxonomy/categories', {
      name: 'Broken',
      slug: 'broken',
      icon: 'fake-icon',
      sort_order: 99,
    }))

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('INVALID_ICON')
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('AC-02-02/AC-03-02: maps taxonomy conflicts to contract errors', async () => {
    mockUpdateCategory.mockRejectedValue(new ApiTaxonomyError('SLUG_LOCKED', 409))

    const res = await categoryPATCH(
      request('PATCH', 'http://localhost/api/admin/taxonomy/categories/cat-1', { slug: 'new-slug' }),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('SLUG_LOCKED')
  })

  it('041 BR-05: revalidates affected discovery routes after Category deactivation without leaking context', async () => {
    mockUpdateCategory.mockResolvedValue({
      data: { id: 'cat-1', is_active: false },
      discovery_revalidation_paths: [
        '/decouvrir/saint-gervais',
        '/decouvrir/saint-gervais/diner',
        '/decouvrir/saint-gervais/diner/la-table',
      ],
    })

    const res = await categoryPATCH(
      request('PATCH', 'http://localhost/api/admin/taxonomy/categories/cat-1', { is_active: false }),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { id: 'cat-1', is_active: false } })
    expect(mockRevalidatePath.mock.calls).toEqual([
      ['/decouvrir/saint-gervais', 'page'],
      ['/decouvrir/saint-gervais/diner', 'page'],
      ['/decouvrir/saint-gervais/diner/la-table', 'page'],
      ['/sitemap.xml'],
    ])
  })

  it('AC-04-01: creates a SubCategory attached to its Category', async () => {
    mockCreateSubCategory.mockResolvedValue({ id: 'sub-1', slug: 'bar-a-vin', category_id: 'cat-1' })

    const res = await subCategoryPOST(
      request('POST', 'http://localhost/api/admin/taxonomy/categories/cat-1/subcategories', {
        name: 'Bar à vin',
        slug: 'bar-a-vin',
        sort_order: 2,
      }),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(201)
    expect(mockCreateSubCategory).toHaveBeenCalledWith(
      'cat-1',
      { name: 'Bar à vin', slug: 'bar-a-vin', sort_order: 2, is_active: true },
      'admin-1',
    )
  })

  it('AC-05-02: updates SubCategory status without physical deletion', async () => {
    mockUpdateSubCategory.mockResolvedValue({
      data: { id: 'sub-1', is_active: false },
      discovery_revalidation_paths: [],
    })

    const res = await subCategoryPATCH(
      request('PATCH', 'http://localhost/api/admin/taxonomy/subcategories/sub-1', { is_active: false }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockUpdateSubCategory).toHaveBeenCalledWith('sub-1', { is_active: false }, 'admin-1')
  })
})
