import { NextRequest, NextResponse } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockUploadGuideImage = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))
jest.mock('@/shared/lib/image-upload-service', () => ({
  uploadGuideImage: (...args: unknown[]) => mockUploadGuideImage(...args),
}))

import { POST } from '@/app/api/admin/cities/[slug]/transport-cards/image/route'

const context = { params: Promise.resolve({ slug: 'saint-gervais-les-bains' }) }

function request(file?: File) {
  const form = new FormData()
  if (file) form.set('file', file)
  return new NextRequest('http://localhost/api/admin/cities/saint-gervais-les-bains/transport-cards/image', {
    method: 'POST', body: form,
  })
}

describe('055 AC-03-04 — transport card image upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('uploads an image to the city transport folder', async () => {
    const file = new File(['image'], 'navette.png', { type: 'image/png' })
    mockUploadGuideImage.mockResolvedValue({ ok: true, url: 'https://img.test/navette.webp' })
    const response = await POST(request(file), context)
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ url: 'https://img.test/navette.webp' })
    expect(mockUploadGuideImage).toHaveBeenCalledWith(file, 'transport-cards/saint-gervais-les-bains')
  })

  it('rejects anonymous or missing-file requests', async () => {
    mockGetSessionAdmin.mockResolvedValueOnce({ user: null, error: NextResponse.json({}, { status: 403 }) })
    expect((await POST(request(), context)).status).toBe(403)
    expect((await POST(request(), context)).status).toBe(400)
    expect(mockUploadGuideImage).not.toHaveBeenCalled()
  })
})
