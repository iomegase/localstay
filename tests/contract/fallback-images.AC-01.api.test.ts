import { NextRequest, NextResponse } from 'next/server'
import { FallbackImageError } from '@/features/fallback-images/lib/errors'

const mockSession = jest.fn()
const mockList = jest.fn()
const mockCreate = jest.fn()
const mockClassify = jest.fn()
const mockRemove = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/fallback-images/queries/library', () => ({
  listFallbackImages: (...args: unknown[]) => mockList(...args),
  createFallbackImages: (...args: unknown[]) => mockCreate(...args),
  classifyFallbackImages: (...args: unknown[]) => mockClassify(...args),
  removeFallbackImage: (...args: unknown[]) => mockRemove(...args),
}))

import { GET, POST } from '@/app/api/admin/fallback-images/route'
import { POST as classifyPOST } from '@/app/api/admin/fallback-images/classify/route'
import { DELETE } from '@/app/api/admin/fallback-images/[id]/route'

// Spec 070 — contrat des routes de la médiathèque.
const UUID_A = '11111111-1111-4111-8111-111111111111'
const UUID_B = '22222222-2222-4222-8222-222222222222'
const UUID_C = '33333333-3333-4333-8333-333333333333'

function json(url: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

describe('070 — /api/admin/fallback-images', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('refuse un non-admin', async () => {
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }) })
    const res = await GET(new NextRequest('http://localhost/api/admin/fallback-images'))
    expect(res.status).toBe(403)
  })

  it('GET : liste filtrée', async () => {
    mockList.mockResolvedValue([{ id: UUID_A, url: 'u', category: null, subcategory: null, usage_count: 0 }])

    const res = await GET(new NextRequest(`http://localhost/api/admin/fallback-images?category_id=${UUID_B}&subcategory_id=${UUID_C}`))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: [{ id: UUID_A, url: 'u', category: null, subcategory: null, usage_count: 0 }] })
    expect(mockList).toHaveBeenCalledWith({ category_id: UUID_B, subcategory_id: UUID_C })
  })

  it('GET : filtre « non classées »', async () => {
    mockList.mockResolvedValue([])
    await GET(new NextRequest('http://localhost/api/admin/fallback-images?filter=unclassified'))
    expect(mockList).toHaveBeenCalledWith({ filter: 'unclassified' })
  })

  it('AC-01-01 POST : envoi multiple → 201 avec créées et refusées', async () => {
    mockCreate.mockResolvedValue({ created: [{ id: UUID_A, url: 'u' }], rejected: [{ name: 'b.gif', code: 'INVALID_TYPE' }] })
    const form = new FormData()
    form.append('files', new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
    form.append('files', new File([new Uint8Array([1])], 'b.gif', { type: 'image/gif' }))

    const res = await POST(new NextRequest('http://localhost/api/admin/fallback-images', { method: 'POST', body: form }))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ data: { created: [{ id: UUID_A, url: 'u' }], rejected: [{ name: 'b.gif', code: 'INVALID_TYPE' }] } })
    expect((mockCreate.mock.calls[0]![0] as File[]).map(file => file.name)).toEqual(['a.png', 'b.gif'])
  })

  it('POST : sans fichier → 400 VALIDATION_ERROR', async () => {
    const res = await POST(new NextRequest('http://localhost/api/admin/fallback-images', { method: 'POST', body: new FormData() }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('AC-01-02 classify : 200 avec le nombre mis à jour', async () => {
    mockClassify.mockResolvedValue({ updated: 2 })

    const res = await classifyPOST(json('/api/admin/fallback-images/classify', { image_ids: [UUID_A, UUID_B], category_id: UUID_B, subcategory_id: UUID_C }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { updated: 2 } })
  })

  it('classify : identifiants invalides → 400', async () => {
    const res = await classifyPOST(json('/api/admin/fallback-images/classify', { image_ids: ['pas-un-uuid'], category_id: null }))
    expect(res.status).toBe(400)
    expect(mockClassify).not.toHaveBeenCalled()
  })

  it('classify : sous-catégorie d’une autre catégorie → 400 SUBCATEGORY_CATEGORY_MISMATCH', async () => {
    mockClassify.mockRejectedValue(new FallbackImageError('SUBCATEGORY_CATEGORY_MISMATCH', 400))
    const res = await classifyPOST(json('/api/admin/fallback-images/classify', { image_ids: [UUID_A], category_id: UUID_B, subcategory_id: UUID_C }))
    expect(res.status).toBe(400)
    expect((await res.json()).error.code).toBe('SUBCATEGORY_CATEGORY_MISMATCH')
  })

  it('AC-01-04 DELETE : 200 / 404', async () => {
    mockRemove.mockResolvedValueOnce(undefined)
    const ok = await DELETE(new NextRequest(`http://localhost/api/admin/fallback-images/${UUID_A}`, { method: 'DELETE' }), { params: Promise.resolve({ id: UUID_A }) })
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ data: { id: UUID_A } })

    mockRemove.mockRejectedValueOnce(new FallbackImageError('NOT_FOUND', 404))
    const missing = await DELETE(new NextRequest(`http://localhost/api/admin/fallback-images/${UUID_B}`, { method: 'DELETE' }), { params: Promise.resolve({ id: UUID_B }) })
    expect(missing.status).toBe(404)
  })
})
