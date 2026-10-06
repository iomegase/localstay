const mockCategoryFindFirst = jest.fn()
const mockSubCategoryFindFirst = jest.fn()
const mockPoiCount = jest.fn()
const mockFallbackUpdateMany = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    category: { findFirst: (...a: unknown[]) => mockCategoryFindFirst(...a) },
    subCategory: { findFirst: (...a: unknown[]) => mockSubCategoryFindFirst(...a) },
    pointOfInterest: { count: (...a: unknown[]) => mockPoiCount(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

import { deleteCategory, deleteSubCategory } from '@/features/admin-taxonomy/queries/taxonomy'

// Spec 074 — reclassement des images de remplacement à la suppression.
const tx = {
  category: { update: jest.fn(async () => ({ id: 'cat-1' })) },
  subCategory: { update: jest.fn(async () => ({ id: 'sub-1' })), updateMany: jest.fn(async () => ({ count: 0 })) },
  fallbackImage: { updateMany: (...a: unknown[]) => mockFallbackUpdateMany(...a) },
  taxonomyChangeLog: { create: jest.fn(async () => ({})) },
}

describe('074 — images de remplacement à la suppression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiCount.mockResolvedValue(0)
    mockFallbackUpdateMany.mockResolvedValue({ count: 3 })
    mockTransaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1', name: 'Cafés', slug: 'cafes', icon: 'coffee', sort_order: 1, is_active: true })
    mockSubCategoryFindFirst.mockResolvedValue({ id: 'sub-1', category_id: 'cat-1', name: 'Salon de thé', slug: 'salon-de-the', sort_order: 1, is_active: true })
  })

  it('AC-01-01 : sous-catégorie supprimée → images en « catégorie seule »', async () => {
    await deleteSubCategory('sub-1', 'admin-1')

    expect(mockFallbackUpdateMany).toHaveBeenCalledWith({
      where: { subcategory_id: 'sub-1', deleted_at: null },
      data: { subcategory_id: null },
    })
  })

  it('AC-01-02 : catégorie supprimée → images « Non classées »', async () => {
    await deleteCategory('cat-1', 'admin-1')

    expect(mockFallbackUpdateMany).toHaveBeenCalledWith({
      where: { category_id: 'cat-1', deleted_at: null },
      data: { category_id: null, subcategory_id: null },
    })
  })

  it('AC-01-03 : suppression refusée (POI actifs) → aucune image modifiée', async () => {
    mockPoiCount.mockResolvedValue(2)

    await expect(deleteCategory('cat-1', 'admin-1')).rejects.toMatchObject({ status: 409 })
    await expect(deleteSubCategory('sub-1', 'admin-1')).rejects.toMatchObject({ status: 409 })
    expect(mockFallbackUpdateMany).not.toHaveBeenCalled()
  })
})
