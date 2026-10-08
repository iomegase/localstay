import { NextRequest } from 'next/server'

const mockSession = jest.fn()
const mockCreate = jest.fn()
const mockUpload = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/equipment-library/queries/library', () => {
  const actual = jest.requireActual('@/features/equipment-library/queries/library')
  return { ...actual, createEquipmentTemplate: (...a: unknown[]) => mockCreate(...a) }
})
jest.mock('@/shared/lib/image-upload-service', () => ({ uploadGuideImage: (...a: unknown[]) => mockUpload(...a) }))
jest.mock('@/shared/lib/prisma', () => ({ prisma: {} }))

import { POST } from '@/app/api/admin/equipment-library/route'
import { POST as UPLOAD } from '@/app/api/admin/equipment-library/photo/route'
import { EquipmentLibraryError } from '@/features/equipment-library/queries/library'

const call = (body: unknown) => POST(new NextRequest('http://localhost/api/admin/equipment-library', {
  method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
}))

describe('POST /api/admin/equipment-library — spec 096 AC-01-01', () => {
  beforeEach(() => { jest.clearAllMocks(); mockSession.mockResolvedValue({ user: { id: 'admin-1' }, error: null }) })

  it('201 avec photo et vidéo', async () => {
    mockCreate.mockResolvedValue({ id: 't9', status: 'approved' })
    const res = await call({ title: 'Barbecue', icon: 'umbrella', body: 'Terrasse', photo_url: 'https://cdn/bbq.webp', video_url: 'https://youtu.be/abc12345678' })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ data: { id: 't9', status: 'approved' } })
    expect(mockCreate).toHaveBeenCalledWith(
      { title: 'Barbecue', icon: 'umbrella', body: 'Terrasse', photo_url: 'https://cdn/bbq.webp', video_url: 'https://youtu.be/abc12345678' },
      'admin-1',
    )
  })

  it('400 sans nom, icône inconnue ou vidéo invalide ; 409 si le nom existe', async () => {
    expect((await call({ title: '', icon: 'info' })).status).toBe(400)
    expect((await call({ title: 'Spa', icon: 'nope' })).status).toBe(400)
    expect((await call({ title: 'Spa', icon: 'info', video_url: 'https://vimeo.com/1' })).status).toBe(400)
    mockCreate.mockRejectedValue(new EquipmentLibraryError('TITLE_ALREADY_EXISTS', 409))
    const res = await call({ title: 'Spa', icon: 'info' })
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('TITLE_ALREADY_EXISTS')
  })

  it('réservé à l’admin (création et photo)', async () => {
    const denied = new Response(null, { status: 403 })
    mockSession.mockResolvedValue({ error: denied })
    expect(await call({ title: 'Spa', icon: 'info' })).toBe(denied)
    const form = new FormData()
    form.append('file', new File(['x'], 'a.png', { type: 'image/png' }))
    expect(await UPLOAD(new NextRequest('http://localhost/api/admin/equipment-library/photo', { method: 'POST', body: form }))).toBe(denied)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('photo : 201 { url } dans le dossier equipment', async () => {
    mockUpload.mockResolvedValue({ ok: true, url: 'https://cdn/equipment/a.webp' })
    const form = new FormData()
    form.append('file', new File(['x'], 'a.png', { type: 'image/png' }))
    const res = await UPLOAD(new NextRequest('http://localhost/api/admin/equipment-library/photo', { method: 'POST', body: form }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ url: 'https://cdn/equipment/a.webp' })
    expect(mockUpload.mock.calls[0][1]).toBe('equipment')
  })
})
