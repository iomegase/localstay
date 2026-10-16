import { BlogArticleUpsertSchema } from '@/features/blog/schemas'
import { BLOG_ARTICLE_MAX_CHARS } from '@/features/blog/types'

describe('029 AC-02-17 — articles jusqu’à 30 000 caractères', () => {
  const content = (length: number) => 'a'.repeat(length)

  it('accepts up to 30 000 characters', () => {
    expect(BLOG_ARTICLE_MAX_CHARS).toBe(30_000)
    expect(BlogArticleUpsertSchema.safeParse({ category: 'local_guide', content_markdown: content(25_000) }).success).toBe(true)
    expect(BlogArticleUpsertSchema.safeParse({ category: 'local_guide', content_markdown: content(30_000) }).success).toBe(true)
  })

  it('rejects longer content with a French message', () => {
    const result = BlogArticleUpsertSchema.safeParse({ category: 'local_guide', content_markdown: content(30_001) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message.replace(/\s/gu, ' ')).toBe('Le contenu dépasse 30 000 caractères.')
  })
})
