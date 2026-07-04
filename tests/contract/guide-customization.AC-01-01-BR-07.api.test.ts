import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockGetCustomization = jest.fn()
const mockSaveCustomization = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))

jest.mock('@/features/guide-customization/queries/customization', () => ({
  getLodgingCustomization: (...args: unknown[]) => mockGetCustomization(...args),
  saveLodgingCustomization: (...args: unknown[]) => mockSaveCustomization(...args),
}))

import { GET, PUT } from '@/app/api/dashboard/lodgings/[id]/customization/route'

const owner = { id: 'owner-1', role: 'owner' }
const responseBody = {
  lodging_id: 'lodging-1',
  welcome_message: 'Bienvenue au chalet',
  category_order: ['restaurants'],
  featured_pois: [],
  ignored_category_slugs: [],
}

function makeRequest(method: string, body?: object) {
  return new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/customization', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET/PUT /api/dashboard/lodgings/[id]/customization — 012', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner, error: null })
  })

  it('AC-01-01: saves and returns lodging customization for the authenticated owner', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)

    const res = await PUT(
      makeRequest('PUT', {
        welcome_message: 'Bienvenue au chalet',
        category_order: ['restaurants'],
        featured_pois: [],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith('owner-1', 'lodging-1', {
      welcome_message: 'Bienvenue au chalet',
      category_order: ['restaurants'],
      featured_pois: [],
      practical_blocks: [],
      trash_bins: [],
      presentation_video_url: null,
      parking_video_url: null,
    })
    await expect(res.json()).resolves.toEqual(responseBody)
  })

  it('BR-07: returns 403 when the lodging belongs to another owner', async () => {
    mockSaveCustomization.mockRejectedValue(new Error('FORBIDDEN'))

    const res = await PUT(
      makeRequest('PUT', { welcome_message: 'Hello', category_order: [], featured_pois: [] }),
      { params: Promise.resolve({ id: 'other-lodging' }) },
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('accepts a long welcome message over 300 characters but within 400 words', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)
    // 350 mots ≈ 1 400 caractères : refusé par l'ancienne limite de 300 caractères,
    // accepté par la nouvelle limite de 400 mots.
    const longMessage = Array.from({ length: 350 }, () => 'mot').join(' ')

    const res = await PUT(
      makeRequest('PUT', { welcome_message: longMessage, category_order: [], featured_pois: [] }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalled()
  })

  it('AC-02-02: accepts owner_note but strips owner_rating', async () => {
    mockSaveCustomization.mockResolvedValue({
      ...responseBody,
      featured_pois: [{
        poi_id: 'poi-1',
        category_id: 'cat-1',
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
      }],
    })

    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [
          {
            poi_id: 'poi-1',
            owner_note: '  Notre terrasse préférée.  ',
            owner_rating: 5,
            sort_order: 0,
          },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith(
      'owner-1',
      'lodging-1',
      expect.objectContaining({
        featured_pois: [{
          poi_id: 'poi-1',
          owner_note: 'Notre terrasse préférée.',
          sort_order: 0,
        }],
      }),
    )
  })

  it('AC-02-04: rejects owner_note over 300 words', async () => {
    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [{
          poi_id: 'poi-1',
          owner_note: Array.from({ length: 301 }, () => 'mot').join(' '),
          sort_order: 0,
        }],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('returns 400 when the welcome message exceeds 400 words', async () => {
    const tooManyWords = Array.from({ length: 401 }, () => 'mot').join(' ')

    const res = await PUT(
      makeRequest('PUT', { welcome_message: tooManyWords, category_order: [], featured_pois: [] }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('returns 401 when owner session is missing', async () => {
    const error = Response.json({ error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, { status: 401 })
    mockGetSessionOwner.mockResolvedValue({ owner: null, error })

    const res = await GET(makeRequest('GET'), { params: Promise.resolve({ id: 'lodging-1' }) })

    expect(res.status).toBe(401)
    expect(mockGetCustomization).not.toHaveBeenCalled()
  })

  it('forwards valid practical_blocks to the save query', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)

    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          { title: 'La plage', body: 'À 5 min à pied', icon: 'star', photo_url: '', sort_order: 0 },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith(
      'owner-1',
      'lodging-1',
      expect.objectContaining({
        practical_blocks: [
          { title: 'La plage', body: 'À 5 min à pied', icon: 'star', photo_url: null, video_url: null, sort_order: 0 },
        ],
      }),
    )
  })

  it('rejects a practical block with an icon outside the catalog', async () => {
    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          { title: 'X', body: null, icon: 'not-a-real-icon', photo_url: null, sort_order: 0 },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('returns a readable validation detail when a practical block title is missing', async () => {
    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          { title: '   ', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0 },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({
      error: {
        code: 'INVALID_BODY',
        details: {
          fieldErrors: {
            practical_blocks: ['Le titre du bloc est requis.'],
          },
        },
      },
    })
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })
})
