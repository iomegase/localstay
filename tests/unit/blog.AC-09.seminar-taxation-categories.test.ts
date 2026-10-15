import { BlogAdminFiltersSchema, BlogArticleUpsertSchema } from '@/features/blog/schemas'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { BLOG_ARTICLE_CATEGORIES } from '@/features/blog/types'
import { BlogArticleCategory } from '@prisma/client'

describe('029 — catégories Séminaire et Fiscalité', () => {
  it('AC-09-01 exposes both categories after the existing ones, with French labels', () => {
    expect(BLOG_ARTICLE_CATEGORIES.slice(-2)).toEqual(['seminar', 'taxation'])
    expect(blogCategoryLabel('seminar')).toBe('Séminaire')
    expect(blogCategoryLabel('taxation')).toBe('Fiscalité')
  })

  it('AC-09-02 accepts both values in article writes and admin filters', () => {
    for (const category of ['seminar', 'taxation'] as const) {
      expect(BlogArticleUpsertSchema.parse({ category }).category).toBe(category)
      expect(BlogAdminFiltersSchema.parse({ category }).category).toBe(category)
    }
    expect(BlogArticleUpsertSchema.safeParse({ category: 'fiscalite' }).success).toBe(false)
  })

  it('AC-09-03 supports persistence through the Prisma enum', () => {
    expect(BlogArticleCategory.seminar).toBe('seminar')
    expect(BlogArticleCategory.taxation).toBe('taxation')
  })
})
