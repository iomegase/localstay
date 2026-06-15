import { isBlogArticlePubliclyVisible } from '@/features/blog/lib/public-visibility'

describe('029 blog public visibility status', () => {
  it('keeps only published non-deleted articles with published_at set', () => {
    expect(
      isBlogArticlePubliclyVisible({
        status: 'published',
        published_at: new Date('2026-06-15T10:00:00Z'),
        deleted_at: null,
      }),
    ).toBe(true)

    expect(
      isBlogArticlePubliclyVisible({
        status: 'draft',
        published_at: new Date('2026-06-15T10:00:00Z'),
        deleted_at: null,
      }),
    ).toBe(false)

    expect(
      isBlogArticlePubliclyVisible({
        status: 'published',
        published_at: null,
        deleted_at: null,
      }),
    ).toBe(false)

    expect(
      isBlogArticlePubliclyVisible({
        status: 'published',
        published_at: new Date('2026-06-15T10:00:00Z'),
        deleted_at: new Date('2026-06-16T10:00:00Z'),
      }),
    ).toBe(false)
  })
})
