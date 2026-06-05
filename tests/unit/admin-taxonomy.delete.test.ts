const mockCategoryFindFirst = jest.fn()
const mockSubCategoryFindFirst = jest.fn()
const mockPoiCount = jest.fn()
const mockCategoryUpdate = jest.fn()
const mockSubCategoryUpdate = jest.fn()
const mockSubCategoryUpdateMany = jest.fn()
const mockChangeLogCreate = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    category: { findFirst: (...a: unknown[]) => mockCategoryFindFirst(...a) },
    subCategory: { findFirst: (...a: unknown[]) => mockSubCategoryFindFirst(...a) },
    pointOfInterest: { count: (...a: unknown[]) => mockPoiCount(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))

import { deleteCategory, deleteSubCategory, ApiTaxonomyError } from '@/features/admin-taxonomy/queries/taxonomy'

const tx = {
  category: { update: (...a: unknown[]) => mockCategoryUpdate(...a) },
  subCategory: {
    update: (...a: unknown[]) => mockSubCategoryUpdate(...a),
    updateMany: (...a: unknown[]) => mockSubCategoryUpdateMany(...a),
  },
  taxonomyChangeLog: { create: (...a: unknown[]) => mockChangeLogCreate(...a) },
}

describe('admin taxonomy deletion (soft-delete)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiCount.mockResolvedValue(0)
    mockCategoryUpdate.mockResolvedValue({ id: 'cat-1' })
    mockSubCategoryUpdate.mockResolvedValue({ id: 'sub-1' })
    mockSubCategoryUpdateMany.mockResolvedValue({ count: 0 })
    mockChangeLogCreate.mockResolvedValue({})
    mockTransaction.mockImplementation(async (fn: (client: typeof tx) => unknown) => fn(tx))
  })

  describe('deleteCategory', () => {
    it('throws NOT_FOUND when the category does not exist', async () => {
      mockCategoryFindFirst.mockResolvedValue(null)

      await expect(deleteCategory('missing', 'admin-1')).rejects.toMatchObject({ status: 404 })
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('blocks deletion (409) when the category still has active POIs', async () => {
      mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, is_active: true })
      mockPoiCount.mockResolvedValue(16)

      await expect(deleteCategory('cat-1', 'admin-1')).rejects.toBeInstanceOf(ApiTaxonomyError)
      await expect(deleteCategory('cat-1', 'admin-1')).rejects.toMatchObject({ code: 'CATEGORY_HAS_POIS', status: 409 })
      expect(mockPoiCount).toHaveBeenCalledWith({ where: { category_id: 'cat-1', is_active: true, deleted_at: null } })
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('soft-deletes the category and cascades to its sub-categories when clean', async () => {
      mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1', name: 'Rando', slug: 'rando', icon: 'mountain', sort_order: 1, is_active: true })

      const result = await deleteCategory('cat-1', 'admin-1')

      expect(result).toEqual({ id: 'cat-1', deleted: true })

      // cascade: sub-categories of this category get soft-deleted
      expect(mockSubCategoryUpdateMany).toHaveBeenCalledWith({
        where: { category_id: 'cat-1', deleted_at: null },
        data: expect.objectContaining({ deleted_at: expect.any(Date), is_active: false }),
      })
      // category itself soft-deleted (deleted_at set), not hard-deleted
      expect(mockCategoryUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'cat-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date), is_active: false }),
      }))
      expect(mockChangeLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'category_deleted', target_id: 'cat-1' }),
      }))
    })
  })

  describe('deleteSubCategory', () => {
    it('throws NOT_FOUND when the sub-category does not exist', async () => {
      mockSubCategoryFindFirst.mockResolvedValue(null)

      await expect(deleteSubCategory('missing', 'admin-1')).rejects.toMatchObject({ status: 404 })
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('blocks deletion (409) when active POIs use the sub-category', async () => {
      mockSubCategoryFindFirst.mockResolvedValue({ id: 'sub-1', category_id: 'cat-1', name: 'Bar', slug: 'bar', sort_order: 1, is_active: true })
      mockPoiCount.mockResolvedValue(3)

      await expect(deleteSubCategory('sub-1', 'admin-1')).rejects.toMatchObject({ code: 'SUBCATEGORY_HAS_POIS', status: 409 })
      expect(mockPoiCount).toHaveBeenCalledWith({ where: { subcategory_id: 'sub-1', is_active: true, deleted_at: null } })
      expect(mockTransaction).not.toHaveBeenCalled()
    })

    it('soft-deletes the sub-category when clean', async () => {
      mockSubCategoryFindFirst.mockResolvedValue({ id: 'sub-1', category_id: 'cat-1', name: 'Bar', slug: 'bar', sort_order: 1, is_active: true })

      const result = await deleteSubCategory('sub-1', 'admin-1')

      expect(result).toEqual({ id: 'sub-1', deleted: true })
      expect(mockSubCategoryUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sub-1' },
        data: expect.objectContaining({ deleted_at: expect.any(Date), is_active: false }),
      }))
      expect(mockChangeLogCreate).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ action: 'subcategory_deleted', target_id: 'sub-1' }),
      }))
    })
  })
})
