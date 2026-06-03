import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindFirstLodging = jest.fn()
const mockFindFirstQrCode = jest.fn()
const mockUpdateManyQrCode = jest.fn()
const mockCreateQrCode = jest.fn()
const mockGenerateQrPng = jest.fn()
const mockUploadQrToStorage = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: (...args: unknown[]) => mockFindUser(...args) },
    lodging: { findFirst: (...args: unknown[]) => mockFindFirstLodging(...args) },
    qrCode: {
      findFirst: (...args: unknown[]) => mockFindFirstQrCode(...args),
      updateMany: (...args: unknown[]) => mockUpdateManyQrCode(...args),
      create: (...args: unknown[]) => mockCreateQrCode(...args),
    },
  },
}))

jest.mock('@/features/qr-code/services/generate-qr', () => ({
  generateQrPng: (...args: unknown[]) => mockGenerateQrPng(...args),
}))

jest.mock('@/features/qr-code/services/upload-qr', () => ({
  uploadQrToStorage: (...args: unknown[]) => mockUploadQrToStorage(...args),
}))

import { GET, POST } from '../../src/app/api/dashboard/lodgings/[id]/qr-code/route'

const OWNER = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }
const LODGING = { id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1', city: { slug: 'saint-gervais' }, deleted_at: null }
const QR_ROW = {
  id: 'qr-1',
  lodging_id: 'lodging-1',
  city_id: 'city-1',
  url: 'https://staylocal.app/guide/saint-gervais?lodging=lodging-1',
  storage_url: 'https://cdn.supabase.co/qr-codes/lodgings/lodging-1.png',
  created_at: new Date('2026-05-23T10:00:00Z'),
  is_active: true,
  deleted_at: null,
}

function makeReq(method: string, id = 'lodging-1'): NextRequest {
  return new NextRequest(`http://localhost:3000/api/dashboard/lodgings/${id}/qr-code`, { method })
}

describe('GET /api/dashboard/lodgings/[id]/qr-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(OWNER)
    mockFindFirstLodging.mockResolvedValue(LODGING)
  })

  it('AC-01: returns 200 with active QR code', async () => {
    mockFindFirstQrCode.mockResolvedValue(QR_ROW)
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lodging_id).toBe('lodging-1')
    expect(json.storage_url).toContain('lodging-1')
  })

  it('returns 404 when no active QR code exists', async () => {
    mockFindFirstQrCode.mockResolvedValue(null)
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when lodging does not belong to owner', async () => {
    mockFindFirstLodging.mockResolvedValue(null)
    const res = await GET(makeReq('GET'), { params: Promise.resolve({ id: 'other-lodging' }) })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/dashboard/lodgings/[id]/qr-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(OWNER)
    mockFindFirstLodging.mockResolvedValue(LODGING)
    mockGenerateQrPng.mockResolvedValue(Buffer.from('fake-png'))
    mockUploadQrToStorage.mockResolvedValue('https://cdn.supabase.co/qr-codes/lodgings/lodging-1.png')
    mockUpdateManyQrCode.mockResolvedValue({ count: 0 })
    mockCreateQrCode.mockResolvedValue(QR_ROW)
  })

  it('AC-01-01: returns 201 with generated QR code', async () => {
    const res = await POST(makeReq('POST'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.lodging_id).toBe('lodging-1')
    expect(json.url).toContain('saint-gervais')
    expect(json.url).toContain('lodging-1')
  })

  it('AC-01-02: encodes the lodging guide URL on the configured base domain (NEXT_PUBLIC_BASE_URL)', async () => {
    const previous = process.env.NEXT_PUBLIC_BASE_URL
    process.env.NEXT_PUBLIC_BASE_URL = 'https://staylocal.example'
    try {
      await POST(makeReq('POST'), { params: Promise.resolve({ id: 'lodging-1' }) })
      expect(mockGenerateQrPng).toHaveBeenCalledWith(
        'https://staylocal.example/guide/saint-gervais?lodging=lodging-1',
      )
    } finally {
      process.env.NEXT_PUBLIC_BASE_URL = previous
    }
  })

  it('AC-01-02b: trims a trailing slash on the base URL (no // in the guide URL)', async () => {
    const previous = process.env.NEXT_PUBLIC_BASE_URL
    process.env.NEXT_PUBLIC_BASE_URL = 'https://localstay-psi.vercel.app/'
    try {
      await POST(makeReq('POST'), { params: Promise.resolve({ id: 'lodging-1' }) })
      expect(mockGenerateQrPng).toHaveBeenCalledWith(
        'https://localstay-psi.vercel.app/guide/saint-gervais?lodging=lodging-1',
      )
    } finally {
      process.env.NEXT_PUBLIC_BASE_URL = previous
    }
  })

  it('AC-01-03: archives existing QR codes before creating new one', async () => {
    await POST(makeReq('POST'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(mockUpdateManyQrCode).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ lodging_id: 'lodging-1', is_active: true }),
        data: expect.objectContaining({ is_active: false }),
      }),
    )
  })

  it('returns 404 when lodging not found', async () => {
    mockFindFirstLodging.mockResolvedValue(null)
    const res = await POST(makeReq('POST'), { params: Promise.resolve({ id: 'x' }) })
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeReq('POST'), { params: Promise.resolve({ id: 'lodging-1' }) })
    expect(res.status).toBe(401)
  })
})
