import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockUpdateCategory = jest.fn()
const mockUpdateSubCategory = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/features/admin-taxonomy/queries/taxonomy', () => ({
  ApiTaxonomyError: class ApiTaxonomyError extends Error {},
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  updateSubCategory: (...args: unknown[]) => mockUpdateSubCategory(...args),
}))

import { PATCH as categoryPATCH } from '@/app/api/admin/taxonomy/categories/[id]/route'
import { PATCH as subCategoryPATCH } from '@/app/api/admin/taxonomy/subcategories/[id]/route'

// Spec 073 AC-01-01 — champ google_types sur les PATCH taxonomie.
function patch(url: string, body: object): NextRequest {
  return new NextRequest(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

describe('073 — google_types (API taxonomie)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockUpdateCategory.mockResolvedValue({ data: { id: 'cat-1', google_types: ['cafe'] }, discovery_revalidation_paths: [] })
    mockUpdateSubCategory.mockResolvedValue({ data: { id: 'sub-1', google_types: ['tea_house'] }, discovery_revalidation_paths: [] })
  })

  it('catégorie : types exacts et motif *_suffixe acceptés', async () => {
    const res = await categoryPATCH(
      patch('http://localhost/api/admin/taxonomy/categories/cat-1', { google_types: ['cafe', '*_restaurant'] }),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockUpdateCategory).toHaveBeenCalledWith('cat-1', { google_types: ['cafe', '*_restaurant'] }, 'admin-1')
  })

  it('sous-catégorie : liste vide acceptée (retour à la recherche texte)', async () => {
    const res = await subCategoryPATCH(
      patch('http://localhost/api/admin/taxonomy/subcategories/sub-1', { google_types: [] }),
      { params: Promise.resolve({ id: 'sub-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockUpdateSubCategory).toHaveBeenCalledWith('sub-1', { google_types: [] }, 'admin-1')
  })

  it.each([
    ['caractères invalides', ['Café!']],
    ['trop court', ['a']],
    ['plus de 20 types', Array.from({ length: 21 }, (_, index) => `type_${'x'.repeat(index + 1)}`)],
  ])('refus 400 : %s', async (_label, google_types) => {
    const res = await categoryPATCH(
      patch('http://localhost/api/admin/taxonomy/categories/cat-1', { google_types }),
      { params: Promise.resolve({ id: 'cat-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockUpdateCategory).not.toHaveBeenCalled()
  })
})
