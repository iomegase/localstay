import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
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
  getLodgingCustomization: jest.fn(),
  saveLodgingCustomization: (...args: unknown[]) => mockSaveCustomization(...args),
}))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/customization/route'

function put(body: object) {
  return PUT(
    new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/customization', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: 'lodging-1' }) },
  )
}

const base = { welcome_message: null, category_order: [], featured_pois: [] }

describe('054 AC-05-01/02 — customization API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'owner-1', role: 'owner' }, error: null })
    mockSaveCustomization.mockResolvedValue({ lodging_id: 'lodging-1' })
  })

  it('accepts the key box code and typed arrival steps', async () => {
    const res = await put({
      ...base,
      key_box_code: ' 4810 ',
      arrival_instructions: [{
        text: 'Ouvrez la boîte à clés.', video_url: null, photos: [], sort_order: 0,
        kind: 'access', tip: 'Refermez le cache.',
        substeps: [{ title: 'Entrez le code', detail: 'Tirez le levier.' }],
        facts: [{ label: 'Étage', value: '3' }],
      }],
    })

    expect(res.status).toBe(200)
    const input = mockSaveCustomization.mock.calls[0][2]
    expect(input.key_box_code).toBe('4810')
    expect(input.arrival_instructions[0]).toMatchObject({
      kind: 'access', tip: 'Refermez le cache.',
      substeps: [{ title: 'Entrez le code', detail: 'Tirez le levier.' }],
      facts: [{ label: 'Étage', value: '3' }],
    })
  })

  it('rejects a key box code longer than 20 characters and an unknown step kind', async () => {
    expect((await put({ ...base, key_box_code: 'x'.repeat(21) })).status).toBe(400)
    expect((await put({
      ...base,
      arrival_instructions: [{ text: 'Entrez', video_url: null, photos: [], sort_order: 0, kind: 'roof' }],
    })).status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })

  it('AC-05-03: rejects more than five media per step (1 hero + 4 photos or video)', async () => {
    const photos = (count: number) => Array.from({ length: count }, (_, index) => `https://cdn.example.com/${index}.jpg`)
    const instruction = (count: number, video: string | null) => ({ text: 'Entrez', video_url: video, photos: photos(count), sort_order: 0 })

    expect((await put({ ...base, arrival_instructions: [instruction(6, null)] })).status).toBe(400)
    expect((await put({ ...base, arrival_instructions: [instruction(5, 'https://youtu.be/dQw4w9WgXcQ')] })).status).toBe(400)
    expect((await put({ ...base, arrival_instructions: [instruction(4, 'https://youtu.be/dQw4w9WgXcQ')] })).status).toBe(200)
  })
})
