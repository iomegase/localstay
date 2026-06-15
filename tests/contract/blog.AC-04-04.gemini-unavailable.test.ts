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

describe('029 blog gemini unavailable API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('returns a structured 503 error when Gemini is unavailable', async () => {
    const error = new Error('GEMINI_UNAVAILABLE')
    Reflect.set(error, 'status', 503)
    mockGenerateBlogDraft.mockRejectedValue(error)

    const response = await POST(
      request({
        brief: 'Rédige un article chaleureux sur un week-end à Saint-Gervais.',
        verified_facts:
          'Saint-Gervais dispose de thermes, de restaurants validés par MyStay et de sentiers déjà publiés dans le guide.',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'GEMINI_UNAVAILABLE' },
    })
  })

  it('returns the structured Gemini validation error details', async () => {
    const error = new Error('La proposition Gemini reçue est invalide.')
    Reflect.set(error, 'code', 'GEMINI_INVALID_RESPONSE')
    Reflect.set(error, 'status', 502)
    Reflect.set(error, 'details', {
      fieldErrors: {
        seo_title: ['Le SEO title doit contenir entre 30 et 70 caractères.'],
      },
    })
    mockGenerateBlogDraft.mockRejectedValue(error)

    const response = await POST(
      request({
        brief: 'Rédige un article chaleureux sur un week-end à Saint-Gervais.',
        verified_facts:
          'Saint-Gervais dispose de thermes, de restaurants validés par MyStay et de sentiers déjà publiés dans le guide.',
      }),
      { params: Promise.resolve({ id: 'article-1' }) },
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'GEMINI_INVALID_RESPONSE',
        message: 'La proposition Gemini reçue est invalide.',
        details: {
          fieldErrors: {
            seo_title: ['Le SEO title doit contenir entre 30 et 70 caractères.'],
          },
        },
      },
    })
  })
})
