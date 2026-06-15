/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import BlogListPage from '@/app/(public)/blog/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticles: jest.fn(async () => ({
    city: null,
    items: [
      {
        id: 'article-1',
        slug: 'week-end-saint-gervais',
        title: 'Un week-end à Saint-Gervais',
        excerpt: 'Un article éditorial pour préparer un séjour alpin avec des repères utiles.',
        category: 'local_guide',
        tags: ['sejour'],
        published_at: new Date('2026-06-15T10:00:00Z'),
        city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
        cover: { url: 'https://img.test/cover.jpg', alt: 'Saint-Gervais' },
      },
    ],
  })),
  getPublishedBlogArticleBySlug: jest.fn(),
}))

describe('029 blog public list', () => {
  it('renders only published articles ordered for /blog', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByRole('heading', { name: /Blog/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Un week-end à Saint-Gervais/i })).toHaveAttribute(
      'href',
      '/blog/week-end-saint-gervais',
    )
    expect(screen.getByText(/préparer un séjour alpin/i)).toBeInTheDocument()
  })
})
