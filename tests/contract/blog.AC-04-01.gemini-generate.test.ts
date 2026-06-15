import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockGenerateBlogDraft = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/blog/queries/admin-blog', () => ({
  generateBlogDraft: (...args: unknown[]) => mockGenerateBlogDraft(...args),
}))

import { POST } from '@/app/api/admin/blog/[id]/generate/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/blog/article-1/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('029 blog gemini generate API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('returns a generated draft payload when Gemini succeeds', async () => {
    mockGenerateBlogDraft.mockResolvedValue({
      id: 'generation-1',
      status: 'generated',
      provider: 'gemini',
      suggestion_title: 'Week-end à Saint-Gervais',
    })

    const response = await POST(
      request({
        brief: 'Rédige un article chaleureux sur un week-end à Saint-Gervais.',
        verified_facts:
          'Saint-Gervais dispose de thermes, de restaurants validés par MyStay et de sentiers déjà publiés dans le guide.',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: 'generation-1',
      status: 'generated',
    })
  })
})
