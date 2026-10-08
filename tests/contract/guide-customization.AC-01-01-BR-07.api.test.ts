import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockGetCustomization = jest.fn()
const mockSaveCustomization = jest.fn()

// Spec 070 : nettoyage du stockage simulé (aucun accès base ni stockage réels).
jest.mock('@/features/storage-cleanup/queries/references', () => ({
  poiPhotoUrls: jest.fn(async () => []),
  lodgingGuidePhotoUrls: jest.fn(async () => []),
}))
jest.mock('@/features/storage-cleanup/services/delete-files', () => ({
  cleanupRemovedPoiPhotos: jest.fn(async () => undefined),
  deleteUnreferencedFiles: jest.fn(async () => ({ deleted: 0 })),
}))
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
        category_order: ['restaurants'],
        featured_pois: [],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith('owner-1', 'lodging-1', {
      category_order: ['restaurants'],
      featured_pois: [],
      practical_blocks: [],
      arrival_instructions: [],
      presentation_video_url: null,
    })
    await expect(res.json()).resolves.toEqual(responseBody)
  })

  it('BR-07: returns 403 when the lodging belongs to another owner', async () => {
    mockSaveCustomization.mockRejectedValue(new Error('FORBIDDEN'))

    const res = await PUT(
      makeRequest('PUT', { category_order: [], featured_pois: [] }),
      { params: Promise.resolve({ id: 'other-lodging' }) },
    )

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error.code).toBe('FORBIDDEN')
  })

  it('077 AC-02-02 / AC-03-02 : message d’accueil, bacs et texte « déchets » ignorés', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)
    const tooManyWords = Array.from({ length: 401 }, () => 'mot').join(' ')

    const res = await PUT(
      makeRequest('PUT', {
        welcome_message: tooManyWords,
        trash_bins: [{ type: 'jaune' }],
        trash_info: 'Sortir les poubelles le mardi',
        trash_location: 'Place du marché',
        category_order: [],
        featured_pois: [],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    const input = mockSaveCustomization.mock.calls[0][2]
    expect(input).not.toHaveProperty('welcome_message')
    expect(input).not.toHaveProperty('trash_bins')
    expect(input).not.toHaveProperty('trash_info')
    expect(input.trash_location).toBe('Place du marché')
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

  it('080 AC-01-04 : code postal invalide → 400', async () => {
    const res = await PUT(
      makeRequest('PUT', { category_order: [], featured_pois: [], address_postal_code: '7417' }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('080 AC-01-02 : les parties de l’adresse sont transmises', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)
    const res = await PUT(
      makeRequest('PUT', { category_order: [], featured_pois: [], address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains' }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(200)
    expect(mockSaveCustomization.mock.calls[0][2]).toMatchObject({ address_number: '12', address_postal_code: '74170' })
  })

  it('083 AC-01-02 : le détail de l’erreur donne le chemin de chaque champ', async () => {
    const res = await PUT(
      makeRequest('PUT', { category_order: [], featured_pois: [], arrival_instructions: [{ text: ' ', sort_order: 0 }] }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.details.issues).toContainEqual({ path: 'arrival_instructions.0.text', message: 'Étape vide : ajoutez un titre, un texte ou une photo.' })
    expect(json.error.details.fieldErrors).toHaveProperty('arrival_instructions')
  })

  it('083 AC-01-04 : une étape avec un titre et sans texte est acceptée', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)
    const res = await PUT(
      makeRequest('PUT', { category_order: [], featured_pois: [], arrival_instructions: [{ title: 'Le portail', text: '', sort_order: 0 }] }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(200)
    expect(mockSaveCustomization.mock.calls[0][2].arrival_instructions[0]).toMatchObject({ title: 'Le portail', text: '' })
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
          // Spec 096 AC-03-02 : icône / photo / vidéo transmises telles quelles puis ignorées par la requête.
          { title: 'La plage', body: 'À 5 min à pied', icon: 'star', photo_url: '', video_url: null, sort_order: 0 },
        ],
      }),
    )
  })

  it('spec 096 : un équipement avec une icône hors catalogue n’est plus refusé (icône ignorée)', async () => {
    mockSaveCustomization.mockResolvedValue(responseBody)
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

    expect(res.status).toBe(200)
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
            practical_blocks: ['Le nom de l’équipement est requis.'],
          },
        },
      },
    })
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('returns 400 when a child item id does not belong to the lodging', async () => {
    mockSaveCustomization.mockRejectedValue(new Error('INVALID_CHILD_ITEM_ID'))

    const res = await PUT(
      makeRequest('PUT', {
        category_order: [],
        featured_pois: [],
        practical_blocks: [
          {
            id: 'b75f5a56-4e3d-42c1-9af2-28dc88d7cc5c',
            title: 'Bloc étranger',
            body: null,
            icon: 'info',
            photo_url: null,
            video_url: null,
            sort_order: 0,
          },
        ],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: {
        code: 'INVALID_CHILD_ITEM_ID',
        message: 'Élément du guide invalide',
        details: {},
      },
    })
  })
})
