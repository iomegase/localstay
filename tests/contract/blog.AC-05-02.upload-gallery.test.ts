import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockUploadGuideImage = jest.fn()
const mockCreateBlogPhoto = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/shared/lib/image-upload-service', () => ({
  uploadGuideImage: (...args: unknown[]) => mockUploadGuideImage(...args),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  createBlogPhoto: (...args: unknown[]) => mockCreateBlogPhoto(...args),
}))

import { POST } from '@/app/api/admin/blog/[id]/photos/route'

describe('029 blog gallery upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('creates a gallery photo with alt text and sort order', async () => {
    const file = new File(['gallery'], 'gallery.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.set('kind', 'gallery')
    formData.set('alt', 'Balade dans le centre')
    formData.set('sort_order', '3')
    formData.set('file', file)

    mockUploadGuideImage.mockResolvedValue({ ok: true, url: 'https://img.test/blog/article-1/gallery-3.webp' })
    mockCreateBlogPhoto.mockResolvedValue({
      id: 'photo-3',
      kind: 'gallery',
      url: 'https://img.test/blog/article-1/gallery-3.webp',
      alt: 'Balade dans le centre',
      sort_order: 3,
    })

    const response = await POST(
      new NextRequest('http://localhost/api/admin/blog/article-1/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(201)
    expect(mockCreateBlogPhoto).toHaveBeenCalledWith('article-1', {
      kind: 'gallery',
      alt: 'Balade dans le centre',
      sort_order: 3,
      url: 'https://img.test/blog/article-1/gallery-3.webp',
    })
  })
})
