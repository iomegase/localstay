import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreateBlogArticle = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  createBlogArticle: (...args: unknown[]) => mockCreateBlogArticle(...args),
  listAdminBlogArticles: jest.fn(),
}))

import { POST } from '@/app/api/admin/blog/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('029 blog admin create API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('creates a draft article for an admin', async () => {
    mockCreateBlogArticle.mockResolvedValue({ id: 'article-1', status: 'draft', slug: 'week-end-saint-gervais' })

    const response = await POST(request({
      title: 'Week-end à Saint-Gervais',
      slug: 'week-end-saint-gervais',
      excerpt:
        'Un guide éditorial complet pour préparer un séjour local avec des repères utiles, des conseils pratiques et une lecture claire.',
      content_markdown: 'a'.repeat(320),
      category: 'local_guide',
      tags: ['sejour', 'alpes'],
      city_id: null,
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description:
        'Préparez un week-end à Saint-Gervais avec les conseils MyStay, une lecture locale et des repères éditoriaux utiles.',
    }))

    expect(response.status).toBe(201)
    expect(mockCreateBlogArticle).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Week-end à Saint-Gervais',
      category: 'local_guide',
    }), 'admin-1')
  })

  it('accepts a minimal draft payload for onboarding and fills server defaults later', async () => {
    mockCreateBlogArticle.mockResolvedValue({ id: 'article-1', status: 'draft', slug: 'article-temporaire' })

    const response = await POST(request({
      category: 'local_guide',
    }))

    expect(response.status).toBe(201)
    expect(mockCreateBlogArticle).toHaveBeenCalledWith({
      title: '',
      slug: '',
      excerpt: '',
      content_markdown: '',
      category: 'local_guide',
      tags: [],
      city_id: null,
      seo_title: null,
      seo_description: null,
    }, 'admin-1')
  })

  it('normalizes the admin slug to a canonical public slug before persistence', async () => {
    mockCreateBlogArticle.mockResolvedValue({ id: 'article-1', status: 'draft', slug: 'vivre-a-saint-nicolas' })

    const response = await POST(request({
      title: 'Vivre à Saint-Nicolas',
      slug: 'Vivre à Saint Nicolas',
      excerpt:
        'Un guide éditorial complet pour préparer un séjour local avec des repères utiles, des conseils pratiques et une lecture claire.',
      content_markdown: 'a'.repeat(320),
      category: 'local_guide',
      tags: ['saint-nicolas'],
      city_id: null,
      seo_title: 'Vivre à Saint-Nicolas — Guide local MyStay',
      seo_description:
        'Préparez un séjour à Saint-Nicolas avec les conseils MyStay, une lecture locale et des repères éditoriaux utiles.',
    }))

    expect(response.status).toBe(201)
    expect(mockCreateBlogArticle).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'vivre-a-saint-nicolas',
      }),
      'admin-1',
    )
  })
})
