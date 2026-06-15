import BlogListPage from '@/app/(public)/blog/page'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticles: jest.fn(async () => null),
}))

describe('029 blog city filter 404', () => {
  it('returns 404 for an unknown or inactive city filter', async () => {
    await BlogListPage({ searchParams: Promise.resolve({ city: 'unknown-city' }) })
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })
})
