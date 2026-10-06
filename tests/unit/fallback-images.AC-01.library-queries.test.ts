const mockImageFindMany = jest.fn()
const mockImageCreate = jest.fn()
const mockImageUpdateMany = jest.fn()
const mockImageFindFirst = jest.fn()
const mockImageUpdate = jest.fn()
const mockSubcategoryFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockUpload = jest.fn()
const mockReassign = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    fallbackImage: {
      findMany: (...args: unknown[]) => mockImageFindMany(...args),
      create: (...args: unknown[]) => mockImageCreate(...args),
      updateMany: (...args: unknown[]) => mockImageUpdateMany(...args),
      findFirst: (...args: unknown[]) => mockImageFindFirst(...args),
      update: (...args: unknown[]) => mockImageUpdate(...args),
    },
    subCategory: { findFirst: (...args: unknown[]) => mockSubcategoryFindFirst(...args) },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
  },
}))
jest.mock('@/shared/lib/image-upload-service', () => ({
  uploadGuideImage: (...args: unknown[]) => mockUpload(...args),
}))
jest.mock('@/features/fallback-images/services/reassign', () => ({
  reassignFallbackImages: (...args: unknown[]) => mockReassign(...args),
}))

import {
  classifyFallbackImages,
  createFallbackImages,
  listFallbackImages,
  removeFallbackImage,
} from '@/features/fallback-images/queries/library'

// Spec 070 US-01 — médiathèque.
const STORAGE = 'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/'

function file(name: string) {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' })
}

describe('070 — médiathèque des images de remplacement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReassign.mockResolvedValue({ examined: 0, updated: 0 })
  })

  it('AC-01-01 : chaque fichier est converti dans son dossier fallbacks/<uuid>, non classé, puis les attributions sont recalculées', async () => {
    mockUpload
      .mockResolvedValueOnce({ ok: true, url: `${STORAGE}fallbacks/u1/1.webp` })
      .mockResolvedValueOnce({ ok: false, code: 'INVALID_TYPE' })
    mockImageCreate.mockImplementation(async ({ data }: { data: { url: string } }) => ({ id: 'img-1', url: data.url }))

    const result = await createFallbackImages([file('a.png'), file('b.gif')])

    expect(mockUpload.mock.calls[0]![1]).toMatch(/^fallbacks\/[0-9a-f-]{36}$/)
    expect(mockImageCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: { url: `${STORAGE}fallbacks/u1/1.webp`, storage_path: 'fallbacks/u1/1.webp' },
    }))
    expect(result).toEqual({
      created: [{ id: 'img-1', url: `${STORAGE}fallbacks/u1/1.webp` }],
      rejected: [{ name: 'b.gif', code: 'INVALID_TYPE' }],
    })
    expect(mockReassign).toHaveBeenCalledTimes(1)
  })

  it('AC-01-03 : liste filtrable avec nombre d’utilisations', async () => {
    mockImageFindMany.mockResolvedValue([{
      id: 'img-1', url: 'u', category: { id: 'shop', name: 'Shopping' }, subcategory: { id: 'ski', name: 'Location de ski' },
      _count: { pois: 3 },
    }])

    const unclassified = await listFallbackImages({ filter: 'unclassified' })
    expect(mockImageFindMany.mock.calls[0]![0].where).toEqual({ deleted_at: null, category_id: null })

    await listFallbackImages({ category_id: 'shop', subcategory_id: 'ski' })
    expect(mockImageFindMany.mock.calls[1]![0].where).toEqual({ deleted_at: null, category_id: 'shop', subcategory_id: 'ski' })
    expect(mockImageFindMany.mock.calls[1]![0].select._count).toEqual({ select: { pois: { where: { deleted_at: null, is_active: true } } } })

    expect(unclassified).toEqual([{
      id: 'img-1', url: 'u', category: { id: 'shop', name: 'Shopping' }, subcategory: { id: 'ski', name: 'Location de ski' }, usage_count: 3,
    }])
  })

  it('AC-01-02 : classement groupé dans une sous-catégorie de la catégorie choisie', async () => {
    mockCategoryFindFirst.mockResolvedValue({ id: 'shop' })
    mockSubcategoryFindFirst.mockResolvedValue({ id: 'ski', category_id: 'shop' })
    mockImageUpdateMany.mockResolvedValue({ count: 2 })

    const result = await classifyFallbackImages({ image_ids: ['a', 'b'], category_id: 'shop', subcategory_id: 'ski' })

    expect(mockImageUpdateMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] }, deleted_at: null },
      data: { category_id: 'shop', subcategory_id: 'ski' },
    })
    expect(result).toEqual({ updated: 2 })
    expect(mockReassign).toHaveBeenCalledTimes(1)
  })

  it('BR-02 : refuse une sous-catégorie d’une autre catégorie', async () => {
    mockCategoryFindFirst.mockResolvedValue({ id: 'diner' })
    mockSubcategoryFindFirst.mockResolvedValue({ id: 'ski', category_id: 'shop' })

    await expect(classifyFallbackImages({ image_ids: ['a'], category_id: 'diner', subcategory_id: 'ski' }))
      .rejects.toMatchObject({ code: 'SUBCATEGORY_CATEGORY_MISMATCH', status: 400 })
    expect(mockImageUpdateMany).not.toHaveBeenCalled()
  })

  it('AC-01-02 : catégorie nulle → retour en « Non classées »', async () => {
    mockImageUpdateMany.mockResolvedValue({ count: 1 })

    await classifyFallbackImages({ image_ids: ['a'], category_id: null })

    expect(mockImageUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { category_id: null, subcategory_id: null } }))
  })

  it('AC-01-04 : retirer = soft delete, fichier conservé, attributions recalculées', async () => {
    mockImageFindFirst.mockResolvedValue({ id: 'img-1' })
    mockImageUpdate.mockResolvedValue({ id: 'img-1' })

    await removeFallbackImage('img-1')

    expect(mockImageUpdate).toHaveBeenCalledWith({ where: { id: 'img-1' }, data: { deleted_at: expect.any(Date) } })
    expect(mockReassign).toHaveBeenCalledTimes(1)
  })

  it('retirer une image inconnue → NOT_FOUND', async () => {
    mockImageFindFirst.mockResolvedValue(null)

    await expect(removeFallbackImage('x')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})
