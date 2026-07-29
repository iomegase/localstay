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
  getPublishedBlogArticles: jest.fn(async () => ({
    city: null,
    items: [
      {
        id: 'article-1',
        slug: 'week-end-saint-gervais',
        title: 'Un week-end à Saint-Gervais',
        excerpt: 'Article courant',
        category: 'local_guide',
        tags: [],
        published_at: new Date('2026-06-15T10:00:00Z'),
        city: null,
        cover: null,
      },
      {
        id: 'article-2',
        slug: 'adresses-du-mont-blanc',
        title: 'Les adresses du Mont-Blanc',
        excerpt: 'Une sélection locale pour prolonger la lecture.',
        category: 'travel_tips',
        tags: [],
        published_at: new Date('2026-06-10T10:00:00Z'),
        city: null,
        cover: {
          url: 'https://img.test/related.jpg',
          alt: 'Montagnes au soleil',
        },
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
    expect(
      screen
        .getAllByRole('link', { name: 'Blog' })
        .some(link => link.getAttribute('href') === '/blog?city=saint-gervais-les-bains'),
    ).toBe(true)
    // Toutes les photos (couverture + galerie) alimentent le carousel du hero :
    // la couverture est la première image affichée, et la navigation n'apparaît
    // que lorsqu'il y a plusieurs photos.
    expect(screen.getByTestId('poi-detail-hero-carousel')).toBeInTheDocument()
    expect(screen.getByAltText('Un week-end à Saint-Gervais')).toHaveAttribute('src', 'https://img.test/cover.jpg')
    expect(screen.getByRole('button', { name: 'Photo suivante' })).toBeInTheDocument()
    expect(screen.getByText(/Deux jours pour profiter du village/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
    expect(screen.getAllByText('15 juin 2026')).toHaveLength(2)
    expect(screen.getByText('1 min')).toBeInTheDocument()
    expect(screen.getByTestId('blog-article-cover')).toHaveClass(
      'rounded-[26px]',
      'min-[701px]:rounded-[28px]',
    )
    expect(screen.getByTestId('blog-article-intro')).toHaveClass(
      'min-[701px]:grid-cols-[0.88fr_1.12fr]',
    )
    expect(screen.getByRole('navigation', { name: 'Sommaire de l’article' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Envie d’un accueil plus simple/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Continuer la lecture/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Les adresses du Mont-Blanc/i })).toHaveAttribute(
      'href',
      '/blog/adresses-du-mont-blanc',
    )
    expect(screen.getByText('SEJOUR')).toBeInTheDocument()
    expect(screen.getByText('ALPES')).toBeInTheDocument()

    const schema = container.querySelector('script[type="application/ld+json"]')
    expect(schema).not.toBeNull()
    expect(schema?.textContent).toContain('"@type":"BlogPosting"')
  })
})
