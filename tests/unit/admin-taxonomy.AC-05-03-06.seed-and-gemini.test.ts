const mockCategoryUpsert = jest.fn()
const mockSubCategoryUpsert = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    category: { upsert: (...args: unknown[]) => mockCategoryUpsert(...args) },
    subCategory: { upsert: (...args: unknown[]) => mockSubCategoryUpsert(...args) },
  },
}))

import { RECOMMENDED_TAXONOMY, seedRecommendedTaxonomy } from '@/features/admin-taxonomy/lib/recommended-taxonomy'
import { buildGeminiCategoryWhere } from '@/features/admin-taxonomy/lib/gemini-taxonomy'

describe('017 recommended taxonomy and Gemini eligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCategoryUpsert.mockImplementation(async ({ create }) => ({ id: `id-${create.slug}`, ...create }))
    mockSubCategoryUpsert.mockImplementation(async ({ create }) => ({ id: `id-${create.slug}`, ...create }))
  })

  it('AC-06-01/06-02/BR-03: seeds the recommended taxonomy by non-destructive upsert without Tous', async () => {
    await seedRecommendedTaxonomy()

    expect(RECOMMENDED_TAXONOMY).toHaveLength(11)
    expect(RECOMMENDED_TAXONOMY.some(category => category.slug === 'tous')).toBe(false)
    expect(RECOMMENDED_TAXONOMY[0]).toEqual(expect.objectContaining({
      name: 'Restaurant',
      slug: 'diner',
    }))
    expect(mockCategoryUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'diner' },
      update: {},
      create: expect.objectContaining({ name: 'Restaurant', slug: 'diner', is_active: true }),
    }))
    expect(mockSubCategoryUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'restaurants' },
      update: {},
      create: expect.objectContaining({ slug: 'restaurants', is_active: true }),
    }))
  })

  it('AC-05-03/BR-10: asks Gemini Fetch only for active non-deleted categories', () => {
    expect(buildGeminiCategoryWhere()).toEqual({ is_active: true, deleted_at: null })
  })
})
