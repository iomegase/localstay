import { NextRequest } from 'next/server'

const mockSaveCustomization = jest.fn()

jest.mock('@/features/storage-cleanup/queries/references', () => ({
  poiPhotoUrls: jest.fn(async () => []),
  lodgingGuidePhotoUrls: jest.fn(async () => []),
}))
jest.mock('@/features/storage-cleanup/services/delete-files', () => ({
  cleanupRemovedPoiPhotos: jest.fn(async () => undefined),
  deleteUnreferencedFiles: jest.fn(async () => ({ deleted: 0 })),
}))
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: async () => ({ owner: { id: 'owner-1', role: 'owner' }, error: null }),
}))
jest.mock('@/features/guide-customization/queries/customization', () => ({
  getLodgingCustomization: jest.fn(),
  saveLodgingCustomization: (...args: unknown[]) => mockSaveCustomization(...args),
}))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/customization/route'

const params = { params: Promise.resolve({ id: 'lodging-1' }) }
const photo = (n: number) => `https://cdn.example.com/lodgings/l/${n}.webp`

function put(thingsToKnow: unknown[]) {
  return PUT(new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/customization', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_order: [], featured_pois: [], things_to_know: thingsToKnow }),
  }), params)
}

// Spec 099 — contrat de PUT /api/dashboard/lodgings/{id}/customization (things_to_know).
describe('099 API — things_to_know', () => {
  beforeEach(() => { jest.clearAllMocks(); mockSaveCustomization.mockResolvedValue({ lodging_id: 'lodging-1' }) })

  it('AC-01-03 : une carte sans titre est refusée avec le chemin du champ', async () => {
    const res = await put([{ title: '  ', body: 'Texte', photos: [], sort_order: 0 }])
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('INVALID_BODY')
    expect(json.error.details.issues).toContainEqual({ path: 'things_to_know.0.title', message: 'Le titre est requis.' })
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('BR-01 : plus de 5 photos par carte est refusé', async () => {
    const res = await put([{ title: 'Volets', photos: [1, 2, 3, 4, 5, 6].map(photo), sort_order: 0 }])
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.details.issues).toContainEqual({ path: 'things_to_know.0.photos', message: '5 photos maximum par carte.' })
  })

  it('AC-01-01 : titre, description et photos valides sont transmis', async () => {
    const res = await put([{ id: 'tmp-1', title: ' Volets ', body: ' ', photos: [photo(1)], sort_order: 0 }])
    expect(res.status).toBe(200)
    expect(mockSaveCustomization.mock.calls[0][2].things_to_know).toEqual([
      { id: 'tmp-1', title: 'Volets', body: null, photos: [photo(1)], sort_order: 0 },
    ])
  })
})
