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
    city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    items: [
      {
        id: 'article-1',
        slug: 'adresses-saint-gervais',
        title: 'Nos adresses à Saint-Gervais',
        excerpt: 'Une sélection locale pour un séjour fluide et bien préparé.',
        category: 'restaurants',
        tags: ['restaurants'],
        published_at: new Date('2026-06-15T10:00:00Z'),
        city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
        cover: null,
      },
    ],
  })),
}))

describe('029 blog city filter', () => {
  it('renders the city-filtered list and contextual title', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({ city: 'saint-gervais-les-bains' }) }))

    expect(screen.getByRole('heading', { name: /Blog Saint-Gervais-les-Bains/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nos adresses à Saint-Gervais/i })).toHaveAttribute(
      'href',
      '/blog/adresses-saint-gervais',
    )
  })
})
