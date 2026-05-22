jest.mock('@/features/qr-code/queries/qr-code')
jest.mock('@/features/qr-code/services/generate-qr')
jest.mock('@/features/qr-code/services/upload-qr')
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
  },
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/admin/cities/[slug]/qr-code/route'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'
import { prisma } from '@/shared/lib/prisma'

const ADMIN_SECRET = 'test-secret'
const BASE_URL = 'https://example.com'

beforeAll(() => {
  process.env.ADMIN_SECRET = ADMIN_SECRET
  process.env.NEXT_PUBLIC_BASE_URL = BASE_URL
})

function makeReq(method: string, slug: string) {
  return new NextRequest(`http://localhost/api/admin/cities/${slug}/qr-code`, {
    method,
    headers: { Authorization: `Bearer ${ADMIN_SECRET}` },
  })
}

const mockCity = { id: 'city-1', slug: 'saint-gervais-les-bains' }
const mockResult = {
  id: 'qr-1',
  city_slug: 'saint-gervais-les-bains',
  url: 'https://example.com/guide/saint-gervais-les-bains',
  storage_url: 'https://storage.supabase.co/qr-codes/saint-gervais-les-bains.png',
  created_at: '2026-05-22T10:00:00.000Z',
}

describe('POST /api/admin/cities/[slug]/qr-code — AC-02-01', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(mockCity)
    ;(generateQrPng as jest.Mock).mockResolvedValue(Buffer.from('fake-png'))
    ;(uploadQrToStorage as jest.Mock).mockResolvedValue(mockResult.storage_url)
    ;(upsertQrCode as jest.Mock).mockResolvedValue(mockResult)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/admin/cities/saint-gervais-les-bains/qr-code', {
      method: 'POST',
    })
    const res = await POST(req, { params: { slug: 'saint-gervais-les-bains' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when city not found', async () => {
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq('POST', 'unknown-city'), { params: { slug: 'unknown-city' } })
    expect(res.status).toBe(404)
  })

  it('returns 200 with QrCodeResult on success — AC-02-01', async () => {
    const res = await POST(makeReq('POST', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.city_slug).toBe('saint-gervais-les-bains')
    expect(body.data.url).toBe('https://example.com/guide/saint-gervais-les-bains')
    expect(body.data.storage_url).toContain('saint-gervais-les-bains.png')
  })

  it('calls generateQrPng with the correct guide URL', async () => {
    await POST(makeReq('POST', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(generateQrPng).toHaveBeenCalledWith(
      'https://example.com/guide/saint-gervais-les-bains',
    )
  })
})

describe('GET /api/admin/cities/[slug]/qr-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getQrCode as jest.Mock).mockResolvedValue(mockResult)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost/api/admin/cities/saint-gervais-les-bains/qr-code', {
      method: 'GET',
    })
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when no QR code exists for city', async () => {
    ;(getQrCode as jest.Mock).mockResolvedValue(null)
    const req = makeReq('GET', 'saint-gervais-les-bains')
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains' } })
    expect(res.status).toBe(404)
  })

  it('returns 200 with existing QrCodeResult', async () => {
    const req = makeReq('GET', 'saint-gervais-les-bains')
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('qr-1')
  })
})
