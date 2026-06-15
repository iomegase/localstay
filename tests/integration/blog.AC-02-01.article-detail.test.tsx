/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import BlogArticlePage from '@/app/(public)/blog/[slug]/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticleBySlug: jest.fn(async () => ({
    id: 'article-1',
    slug: 'week-end-saint-gervais',
    title: 'Un week-end à Saint-Gervais',
    excerpt: 'Un article éditorial pour préparer un séjour alpin avec des repères utiles.',
    content_markdown: '# Programme\n\nDeux jours pour profiter du village et des alentours.',
    category: 'local_guide',
    tags: ['sejour', 'alpes'],
    published_at: new Date('2026-06-15T10:00:00Z'),
    seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
    seo_description:
      'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
    city: {
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
    },
    cover: {
      id: 'cover-1',
      kind: 'cover',
      url: 'https://img.test/cover.jpg',
      alt: 'Vue sur Saint-Gervais',
      sort_order: 0,
    },
    gallery: [
      {
        id: 'gallery-1',
        kind: 'gallery',
        url: 'https://img.test/gallery-1.jpg',
        alt: 'Rue du centre',
        sort_order: 1,
      },
    ],
  })),
}))

describe('029 blog article detail page', () => {
  it('renders the published article content, photos and breadcrumb', async () => {
    const { container } = render(await BlogArticlePage({ params: Promise.resolve({ slug: 'week-end-saint-gervais' }) }))

    expect(screen.getByRole('heading', { name: 'Un week-end à Saint-Gervais' })).toBeInTheDocument()
    expect(screen.getByText('Guide local')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Guide Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog?city=saint-gervais-les-bains')
    expect(screen.getByAltText('Vue sur Saint-Gervais')).toHaveAttribute('src', 'https://img.test/cover.jpg')
    expect(screen.getByAltText('Rue du centre')).toHaveAttribute('src', 'https://img.test/gallery-1.jpg')
    expect(screen.getByText(/Deux jours pour profiter du village/i)).toBeInTheDocument()

    const schema = container.querySelector('script[type="application/ld+json"]')
    expect(schema).not.toBeNull()
    expect(schema?.textContent).toContain('"@type":"BlogPosting"')
  })
})
