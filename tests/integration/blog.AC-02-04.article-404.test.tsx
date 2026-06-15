import BlogArticlePage from '@/app/(public)/blog/[slug]/page'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticleBySlug: jest.fn(async () => null),
}))

describe('029 blog article 404', () => {
  it('returns 404 for an unknown or non-published article', async () => {
    await BlogArticlePage({ params: Promise.resolve({ slug: 'ghost-article' }) })
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })
})
