const mockFindFirst = jest.fn()
const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { blogArticle: {
  findFirst: (...args: unknown[]) => mockFindFirst(...args), findMany: (...args: unknown[]) => mockFindMany(...args),
} } }))
import { getAdminBlogArticle } from '@/features/blog/queries/admin-blog'
import { getPublishedBlogArticleBySlug } from '@/features/blog/queries/public-blog'

const content = String.raw`Introduction.\n\n### Le Refuge du Mont-Joly\nUne table locale.`
const expected = 'Introduction.\n\n### Le Refuge du Mont-Joly\nUne table locale.'
beforeEach(() => jest.clearAllMocks())

it('AC-03-03: reads legacy serialized Markdown as editable multiline text without changing stored data', async () => {
  const stored = { id: 'article', content_markdown: content }
  mockFindFirst.mockResolvedValue(stored)
  expect((await getAdminBlogArticle('article'))?.content_markdown).toBe(expected)
  expect(stored.content_markdown).toBe(content)
})

it('AC-02-01: reads existing published articles with real paragraph and heading boundaries', async () => {
  mockFindMany.mockResolvedValue([{ id: 'article', slug: 'article', published_at: new Date(), photos: [], content_markdown: content }])
  expect((await getPublishedBlogArticleBySlug('article'))?.content_markdown).toBe(expected)
})
