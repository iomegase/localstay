/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import BlogListPage from '@/app/(public)/journal/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

const article = (id: string, category: string) => ({
  id,
  slug: id,
  title: `Article ${id}`,
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
    items: [article('guide-a', 'local_guide'), article('resto-b', 'restaurants')],
  })),
}))

describe('029 AC-01-17 public category filter', () => {
  it('renders category pills as links and shows all articles by default', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('link', { name: 'Toutes' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: 'Toutes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Guide local' })).toHaveAttribute('href', '/journal?category=local_guide')
    expect(screen.getByRole('link', { name: /Article guide-a/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Article resto-b/ })).toBeInTheDocument()
  })

  it('filters articles by the selected category and keeps every pill visible', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({ category: 'restaurants' }) }))

    expect(screen.getByRole('link', { name: 'Restaurants' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Guide local' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Article guide-a/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Article resto-b/ })).toBeInTheDocument()
  })

  it('preserves the city filter in pill links', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({ city: 'chamonix' }) }))

    expect(screen.getByRole('link', { name: 'Toutes' })).toHaveAttribute('href', '/journal?city=chamonix')
    expect(screen.getByRole('link', { name: 'Restaurants' })).toHaveAttribute(
      'href',
      '/journal?city=chamonix&category=restaurants',
    )
  })

  it('ignores an unknown category and shows all articles', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({ category: 'nope' }) }))

    expect(screen.getByRole('link', { name: 'Toutes' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Article guide-a/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Article resto-b/ })).toBeInTheDocument()
  })
})
