/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import BlogListPage from '@/app/(public)/journal/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, scroll: _scroll, ...rest }: { href: string; children: React.ReactNode; scroll?: boolean }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const article = (index: number, category = 'local_guide') => ({
  id: `a${index}`,
  slug: `article-${index}`,
  title: `Article ${index}`,
  excerpt: 'Extrait',
  category,
  tags: [],
  published_at: new Date('2026-06-15T10:00:00Z'),
  city: null,
  cover: null,
})

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticles: jest.fn(async () => ({
    city: null,
    items: [
      ...Array.from({ length: 13 }, (_, index) => article(index + 1)),
      { ...article(14), category: 'restaurants' },
    ],
  })),
}))

const cards = () => within(screen.getByTestId('blog-grid')).getAllByRole('link')

describe('029 AC-01-19 — 6 articles puis « Voir plus »', () => {
  it('shows the first 6 articles and a link to the next page', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({}) }))
    expect(cards()).toHaveLength(6)
    expect(screen.getByRole('link', { name: 'Voir plus d’articles (8)' })).toHaveAttribute('href', '/journal?page=2')
  })

  it('shows 6 more per page and hides the link at the end', async () => {
    const { unmount } = render(await BlogListPage({ searchParams: Promise.resolve({ page: '2' }) }))
    expect(cards()).toHaveLength(12)
    expect(screen.getByRole('link', { name: 'Voir plus d’articles (2)' })).toHaveAttribute('href', '/journal?page=3')
    unmount()

    render(await BlogListPage({ searchParams: Promise.resolve({ page: '3' }) }))
    expect(cards()).toHaveLength(14)
    expect(screen.queryByRole('link', { name: /Voir plus d’articles/ })).not.toBeInTheDocument()
  })

  it('keeps the category filter and ignores an invalid page', async () => {
    const { unmount } = render(await BlogListPage({ searchParams: Promise.resolve({ category: 'local_guide' }) }))
    expect(screen.getByRole('link', { name: 'Voir plus d’articles (7)' })).toHaveAttribute('href', '/journal?category=local_guide&page=2')
    unmount()

    render(await BlogListPage({ searchParams: Promise.resolve({ page: 'abc' }) }))
    expect(cards()).toHaveLength(6)
  })
})
