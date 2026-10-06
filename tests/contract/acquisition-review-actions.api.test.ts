import { NextRequest } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockSession = jest.fn()
const mockUpdate = jest.fn()
const mockExclude = jest.fn()
const mockList = jest.fn()
const mockReinstate = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/poi-acquisition/queries/review', () => ({
  updateCandidate: (...args: unknown[]) => mockUpdate(...args),
  excludeCandidate: (...args: unknown[]) => mockExclude(...args),
}))
jest.mock('@/features/poi-acquisition/queries/review-memory', () => ({
  listReviewMemories: (...args: unknown[]) => mockList(...args),
  reinstateReviewMemory: (...args: unknown[]) => mockReinstate(...args),
}))

import { PATCH } from '@/app/api/admin/poi-acquisition/candidates/[id]/route'
import { POST as excludePOST } from '@/app/api/admin/poi-acquisition/candidates/[id]/exclude/route'
import { GET as memoriesGET } from '@/app/api/admin/poi-acquisition/memories/route'
import { DELETE as reinstateDELETE } from '@/app/api/admin/poi-acquisition/memories/[id]/route'

// Spec 071 — contrat des routes de revue.
const UUID = '11111111-1111-4111-8111-111111111111'
const params = (id: string) => ({ params: Promise.resolve({ id }) })

function json(url: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

describe('071 — routes de revue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-01-01 PATCH candidat : 200', async () => {
    mockUpdate.mockResolvedValue({ id: 'cand-1', category_id: UUID })
    const res = await PATCH(json('/api/admin/poi-acquisition/candidates/cand-1', 'PATCH', { category_id: UUID, subcategory_id: null }), params('cand-1'))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('cand-1', { category_id: UUID, subcategory_id: null }, 'admin-1')
  })

  it('PATCH : champ inconnu ou invalide → 400', async () => {
    const res = await PATCH(json('/api/admin/poi-acquisition/candidates/cand-1', 'PATCH', { website: 'pas une url' }), params('cand-1'))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('AC-01-03 PATCH : sous-catégorie incohérente → 400', async () => {
    mockUpdate.mockRejectedValue(new PoiAcquisitionError('SUBCATEGORY_CATEGORY_MISMATCH', 400))
    const res = await PATCH(json('/api/admin/poi-acquisition/candidates/cand-1', 'PATCH', { subcategory_id: UUID }), params('cand-1'))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('SUBCATEGORY_CATEGORY_MISMATCH')
  })

  it('AC-03-01 POST exclude : 200 / 409', async () => {
    mockExclude.mockResolvedValueOnce({ id: 'cand-1', review_status: 'excluded' })
    expect((await excludePOST(json('/api/admin/poi-acquisition/candidates/cand-1/exclude', 'POST'), params('cand-1'))).status).toBe(200)

    mockExclude.mockRejectedValueOnce(new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409))
    expect((await excludePOST(json('/api/admin/poi-acquisition/candidates/cand-1/exclude', 'POST'), params('cand-1'))).status).toBe(409)
  })

  it('AC-03-03 GET mémoires (filtre ville) et DELETE réintégrer', async () => {
    mockList.mockResolvedValue([{ id: UUID }])
    const list = await memoriesGET(new NextRequest(`http://localhost/api/admin/poi-acquisition/memories?city_id=${UUID}`))
    expect(await list.json()).toEqual({ data: [{ id: UUID }] })
    expect(mockList).toHaveBeenCalledWith(UUID)

    mockReinstate.mockResolvedValue(undefined)
    const res = await reinstateDELETE(json(`/api/admin/poi-acquisition/memories/${UUID}`, 'DELETE'), params(UUID))
    expect(res.status).toBe(200)
    expect(mockReinstate).toHaveBeenCalledWith(UUID)
  })

  it('DELETE : mémoire inconnue → 404', async () => {
    mockReinstate.mockRejectedValue(new PoiAcquisitionError('NOT_FOUND', 404))
    const res = await reinstateDELETE(json(`/api/admin/poi-acquisition/memories/${UUID}`, 'DELETE'), params(UUID))
    expect(res.status).toBe(404)
  })
})
