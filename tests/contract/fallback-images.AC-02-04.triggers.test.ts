import { NextRequest } from 'next/server'

const mockSession = jest.fn()
const mockRefresh = jest.fn()
const mockUpdate = jest.fn()
const mockCreate = jest.fn()
const mockPublish = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/fallback-images/services/reassign', () => ({
  refreshFallbackImagesSafely: (...args: unknown[]) => mockRefresh(...args),
}))
jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  getAdminPoi: jest.fn(),
  listAdminPois: jest.fn(),
  updateAdminPoi: (...args: unknown[]) => mockUpdate(...args),
}))
jest.mock('@/features/poi-acquisition/queries/manual-poi', () => ({
  createManualPoi: (...args: unknown[]) => mockCreate(...args),
}))
jest.mock('@/features/poi-acquisition/queries/review', () => ({
  publishCandidate: (...args: unknown[]) => mockPublish(...args),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn(), revalidateTag: jest.fn() }))
const mockPoiPhotoUrls = jest.fn()
const mockCleanupPoi = jest.fn()
jest.mock('@/features/storage-cleanup/queries/references', () => ({
  poiPhotoUrls: (...args: unknown[]) => mockPoiPhotoUrls(...args),
  lodgingGuidePhotoUrls: jest.fn(async () => []),
}))
jest.mock('@/features/storage-cleanup/services/delete-files', () => ({
  cleanupRemovedPoiPhotos: (...args: unknown[]) => mockCleanupPoi(...args),
  deleteUnreferencedFiles: jest.fn(),
}))

import { PATCH } from '@/app/api/admin/pois/[id]/route'
import { POST as createPOST } from '@/app/api/admin/pois/route'
import { POST as publishPOST } from '@/app/api/admin/poi-acquisition/candidates/[id]/publish/route'

// Spec 070 AC-02-04 : recalcul de l'image de remplacement après chaque écriture de fiche.
const POI_ID = '44444444-4444-4444-8444-444444444444'
const CITY_ID = '11111111-1111-4111-8111-111111111111'
const CAT_ID = '22222222-2222-4222-8222-222222222222'

function json(url: string, method: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

describe('070 AC-02-04 — déclencheurs d’attribution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockRefresh.mockResolvedValue(undefined)
    mockPoiPhotoUrls.mockResolvedValue([])
    mockCleanupPoi.mockResolvedValue(undefined)
  })

  it('après enregistrement d’une fiche', async () => {
    mockUpdate.mockResolvedValue({ data: { id: POI_ID, photos: [] }, discovery_revalidation_paths: [] })

    const res = await PATCH(json(`/api/admin/pois/${POI_ID}`, 'PATCH', { name: 'Blanc Sport' }), { params: Promise.resolve({ id: POI_ID }) })

    expect(res.status).toBe(200)
    expect(mockRefresh).toHaveBeenCalledWith([POI_ID])
  })

  it('après création manuelle', async () => {
    mockCreate.mockResolvedValue({ id: POI_ID })

    const res = await createPOST(json('/api/admin/pois', 'POST', {
      name: 'Le Galeta', address: '150 Imp. des Lupins', city_id: CITY_ID, category_id: CAT_ID,
    }))

    expect(res.status).toBe(201)
    expect(mockRefresh).toHaveBeenCalledWith([POI_ID])
  })

  it('après publication d’un candidat', async () => {
    mockPublish.mockResolvedValue({ id: 'cand-1', published_poi_id: POI_ID })

    const res = await publishPOST(json('/api/admin/poi-acquisition/candidates/cand-1/publish', 'POST', {}), { params: Promise.resolve({ id: 'cand-1' }) })

    expect(res.status).toBe(200)
    expect(mockRefresh).toHaveBeenCalledWith([POI_ID])
  })

  it('070 AC-03-01 : enregistrer une fiche supprime les photos retirées', async () => {
    mockPoiPhotoUrls.mockResolvedValue(['https://x/a.webp', 'https://x/b.webp'])
    mockUpdate.mockResolvedValue({ data: { id: POI_ID, photos: ['https://x/b.webp'] }, discovery_revalidation_paths: [] })

    const res = await PATCH(json(`/api/admin/pois/${POI_ID}`, 'PATCH', { photos: ['https://x/b.webp'] }), { params: Promise.resolve({ id: POI_ID }) })

    expect(res.status).toBe(200)
    expect(mockCleanupPoi).toHaveBeenCalledWith(POI_ID, ['https://x/a.webp'])
  })
})
