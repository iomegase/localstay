import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockFindLodging = jest.fn()
const mockFindQr = jest.fn()
const mockDeleteQr = jest.fn()
const mockCreateQr = jest.fn()
const mockGenerateQrPng = jest.fn()
const mockUploadQrToStorage = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: (...args: unknown[]) => mockFindLodging(...args) },
    qrCode: {
      findFirst: (...args: unknown[]) => mockFindQr(...args),
      deleteMany: (...args: unknown[]) => mockDeleteQr(...args),
      create: (...args: unknown[]) => mockCreateQr(...args),
    },
  },
}))
jest.mock('@/features/qr-code/services/generate-qr', () => ({
  generateQrPng: (...args: unknown[]) => mockGenerateQrPng(...args),
}))
jest.mock('@/features/qr-code/services/upload-qr', () => ({
  uploadQrToStorage: (...args: unknown[]) => mockUploadQrToStorage(...args),
}))

import { GET, POST } from '@/app/api/admin/lodgings/[id]/qr-code/route'

const LODGING_ID = '8c084485-9894-43e8-b91f-840d2ea0226d'
const LODGING = { id: LODGING_ID, city_id: 'city-1', city: { slug: 'saint-gervais-les-bains' } }
const QR = {
  id: 'qr-1',
  lodging_id: LODGING_ID,
  city_id: 'city-1',
  url: `https://www.mystay.city/guide/saint-gervais-les-bains?lodging=${LODGING_ID}`,
  storage_url: `https://cdn.example/qr-codes/lodgings/${LODGING_ID}.png`,
  created_at: new Date('2026-10-19T08:00:00Z'),
}
const params = (id = LODGING_ID) => ({ params: Promise.resolve({ id }) })
const req = (method: string) => new NextRequest(`http://localhost/api/admin/lodgings/${LODGING_ID}/qr-code`, { method })

const originalBase = process.env.NEXT_PUBLIC_BASE_URL

describe('011 US-03 — QR logement depuis l’admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'https://www.mystay.city/'
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockFindLodging.mockResolvedValue(LODGING)
    mockFindQr.mockResolvedValue(QR)
    mockGenerateQrPng.mockResolvedValue(Buffer.from('png'))
    mockUploadQrToStorage.mockResolvedValue(QR.storage_url)
    mockCreateQr.mockResolvedValue(QR)
  })
  afterAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalBase
  })

  it('AC-03-01 : GET renvoie le QR actif du logement', async () => {
    const response = await GET(req('GET'), params())
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      data: { url: QR.url, storage_url: QR.storage_url, created_at: QR.created_at.toISOString() },
    })
  })

  it('AC-03-01 : GET → 404 sans QR actif', async () => {
    mockFindQr.mockResolvedValue(null)
    const response = await GET(req('GET'), params())
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('NOT_FOUND')
  })

  it('AC-03-02 : POST génère le QR avec l’URL guide du logement, sans propriétaire requis', async () => {
    const response = await POST(req('POST'), params())
    expect(response.status).toBe(201)
    expect(mockGenerateQrPng).toHaveBeenCalledWith(`https://www.mystay.city/guide/saint-gervais-les-bains?lodging=${LODGING_ID}`)
    expect(mockUploadQrToStorage).toHaveBeenCalledWith('saint-gervais-les-bains', expect.any(Buffer), LODGING_ID)
    expect(mockFindLodging).toHaveBeenCalledWith(expect.objectContaining({ where: { id: LODGING_ID, deleted_at: null } }))
    expect((await response.json()).data.url).toBe(QR.url)
  })

  it('AC-03-02 : un échec de génération renvoie une erreur JSON', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUploadQrToStorage.mockRejectedValue(new Error('storage down'))
    const response = await POST(req('POST'), params())
    expect(response.status).toBe(500)
    expect((await response.json()).error.code).toBe('QR_GENERATION_FAILED')
  })

  it('AC-03-03 : réservé au super-admin', async () => {
    const { NextResponse } = await import('next/server')
    mockGetSessionAdmin.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }) })
    expect((await GET(req('GET'), params())).status).toBe(403)
    expect((await POST(req('POST'), params())).status).toBe(403)
    expect(mockGenerateQrPng).not.toHaveBeenCalled()
  })

  it('identifiant invalide → 404 sans requête', async () => {
    const response = await GET(req('GET'), params('pas-un-uuid'))
    expect(response.status).toBe(404)
    expect(mockFindLodging).not.toHaveBeenCalled()
  })
})
