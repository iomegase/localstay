import { NextRequest } from 'next/server'

const afterCallbacks: Array<() => unknown> = []
let afterThrows = false
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  after: (callback: () => unknown) => {
    if (afterThrows) throw new Error('`after` was called outside a request scope')
    afterCallbacks.push(callback)
  },
}))
jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: jest.fn(async () => ({ user: { id: 'admin-1' }, error: null })),
}))
const mockUpdate = jest.fn()
jest.mock('@/features/public-discovery/queries/admin-publication', () => ({
  updatePoiDiscoveryPublication: (...a: unknown[]) => mockUpdate(...a),
}))
jest.mock('@/features/public-discovery/lib/revalidation', () => ({ safelyRevalidateDiscoveryPaths: jest.fn() }))
const mockMirror = jest.fn()
jest.mock('@/features/poi-photos/services/mirror-poi-photos', () => ({
  mirrorPoiPhotos: (...a: unknown[]) => mockMirror(...a),
}))

import { PATCH } from '@/app/api/admin/pois/[id]/discovery-publication/route'

const POI_ID = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'
const call = (status: 'DRAFT' | 'PUBLISHED') => PATCH(
  new NextRequest(`http://localhost/api/admin/pois/${POI_ID}/discovery-publication`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  { params: Promise.resolve({ id: POI_ID }) },
)

beforeEach(() => {
  afterCallbacks.length = 0
  afterThrows = false
  mockMirror.mockReset().mockResolvedValue({ mirrored: 1, skipped: 0, failed: 0 })
  mockUpdate.mockImplementation(async (_id: string, status: string) => ({
    id: POI_ID, discovery_status: status, discovery_published_at: null,
    public_url: null, invalidation_paths: [], eligibility: { eligible: true, reasons: [] },
  }))
})

describe('063 AC-01-01 — copie à la publication', () => {
  it('programme la copie après la réponse quand le POI est publié', async () => {
    const response = await call('PUBLISHED')
    expect(response.status).toBe(200)
    expect(mockMirror).not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(1)
    await afterCallbacks[0]()
    expect(mockMirror).toHaveBeenCalledWith(POI_ID)
  })

  it('ne programme rien quand le POI repasse en brouillon', async () => {
    await call('DRAFT')
    expect(afterCallbacks).toHaveLength(0)
  })

  it('n’expose pas d’erreur si la copie échoue en arrière-plan', async () => {
    mockMirror.mockRejectedValue(new Error('storage down'))
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    const response = await call('PUBLISHED')
    expect(response.status).toBe(200)
    await expect(afterCallbacks[0]()).resolves.toBeUndefined()
    expect(errorLog).toHaveBeenCalledWith('POI_PHOTO_MIRROR_FAILED', expect.objectContaining({ poiId: POI_ID }))
    errorLog.mockRestore()
  })

  it('publie quand même si la programmation de la copie échoue', async () => {
    afterThrows = true
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
    const response = await call('PUBLISHED')
    expect(response.status).toBe(200)
    expect(errorLog).toHaveBeenCalledWith('POI_PHOTO_MIRROR_SCHEDULE_FAILED', expect.objectContaining({ poiId: POI_ID }))
    errorLog.mockRestore()
  })
})
