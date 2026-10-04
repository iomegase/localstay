import { BlogAdminFiltersSchema, BlogArticleUpsertSchema } from '@/features/blog/schemas'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import { BLOG_ARTICLE_CATEGORIES } from '@/features/blog/types'
import { BlogArticleCategory } from '@prisma/client'

describe('029 — catégorie Conciergerie', () => {
  it('AC-08-01 exposes the category with its French label', () => {
    expect(BLOG_ARTICLE_CATEGORIES).toContain('concierge')
    expect(blogCategoryLabel('concierge')).toBe('Conciergerie')
  })

  it('AC-08-02 accepts concierge in article writes and admin filters', () => {
    expect(BlogArticleUpsertSchema.parse({ category: 'concierge' }).category).toBe('concierge')
    expect(BlogAdminFiltersSchema.parse({ category: 'concierge' }).category).toBe('concierge')
    expect(BlogArticleUpsertSchema.safeParse({ category: 'unknown' }).success).toBe(false)
    expect(BlogAdminFiltersSchema.safeParse({ category: 'unknown' }).success).toBe(false)
  })

  it('AC-08-03 supports persistence through the Prisma enum', () => {
    expect(BlogArticleCategory.concierge).toBe('concierge')
  })
})
