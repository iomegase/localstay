/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockGetAdminBlogArticle = jest.fn()
const mockListBlogAdminCities = jest.fn()

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  getAdminBlogArticle: (...args: unknown[]) => mockGetAdminBlogArticle(...args),
  listBlogAdminCities: (...args: unknown[]) => mockListBlogAdminCities(...args),
}))

jest.mock('@/features/blog/components/AdminBlogEditor', () => ({
  AdminBlogEditor: () => <div data-testid="blog-editor">Editor</div>,
}))

import AdminBlogDetailPage from '@/app/admin/blog/[id]/page'

describe('029 blog admin detail page public link', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListBlogAdminCities.mockResolvedValue([])
  })

  it('shows the public article link when the article is published', async () => {
    mockGetAdminBlogArticle.mockResolvedValue({
      id: 'article-1',
      status: 'published',
      title: 'Week-end à Saint-Gervais',
      slug: 'week-end-saint-gervais',
      excerpt: 'x'.repeat(80),
      content_markdown: 'x'.repeat(320),
      category: 'local_guide',
      tags: [],
      city_id: null,
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description: 'x'.repeat(120),
      photos: [],
    })

    render(await AdminBlogDetailPage({ params: Promise.resolve({ id: 'article-1' }) }))

    expect(screen.getByRole('link', { name: /ouvrir l’article public/i })).toHaveAttribute(
      'href',
      '/blog/week-end-saint-gervais',
    )
  })

  it('explains that the public slug is unavailable before publication', async () => {
    mockGetAdminBlogArticle.mockResolvedValue({
      id: 'article-1',
      status: 'draft',
      title: 'Week-end à Saint-Gervais',
      slug: 'week-end-saint-gervais',
      excerpt: 'x'.repeat(80),
      content_markdown: 'x'.repeat(320),
      category: 'local_guide',
      tags: [],
      city_id: null,
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description: 'x'.repeat(120),
      photos: [],
    })

    render(await AdminBlogDetailPage({ params: Promise.resolve({ id: 'article-1' }) }))

    expect(screen.getByText(/url publique disponible après publication/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ouvrir l’article public/i })).not.toBeInTheDocument()
  })
})
