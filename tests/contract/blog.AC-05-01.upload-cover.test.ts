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

describe('029 blog cover upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('uploads a cover image into the blog article storage path', async () => {
    const file = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.set('kind', 'cover')
    formData.set('alt', 'Couverture article')
    formData.set('file', file)

    mockUploadGuideImage.mockResolvedValue({ ok: true, url: 'https://img.test/blog/article-1/cover.webp' })
    mockCreateBlogPhoto.mockResolvedValue({
      id: 'photo-1',
      kind: 'cover',
      url: 'https://img.test/blog/article-1/cover.webp',
      alt: 'Couverture article',
      sort_order: 0,
    })

    const response = await POST(
      new NextRequest('http://localhost/api/admin/blog/article-1/photos', {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(201)
    expect(mockUploadGuideImage).toHaveBeenCalledWith(file, 'blog/article-1')
    expect(mockCreateBlogPhoto).toHaveBeenCalledWith('article-1', {
      kind: 'cover',
      alt: 'Couverture article',
      sort_order: 0,
      url: 'https://img.test/blog/article-1/cover.webp',
    })
  })
})
