jest.mock('@/features/qr-code/queries/qr-code')
jest.mock('@/features/qr-code/services/generate-qr')
jest.mock('@/features/qr-code/services/upload-qr')
jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: jest.fn(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
  },
}))

import { NextRequest, NextResponse } from 'next/server'
import { POST, GET } from '@/app/api/admin/cities/[slug]/qr-code/route'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { prisma } from '@/shared/lib/prisma'

const BASE_URL = 'https://example.com'

beforeAll(() => {
  process.env.NEXT_PUBLIC_BASE_URL = BASE_URL
})

// Le QR ville est réservé au super-admin : on contrôle l'accès via la session (rôle 'admin'),
// pas via un secret partagé exposé au client.
const adminSession = () => ({ user: { id: 'admin-1', role: 'admin' }, error: null })
const unauthenticated = () => ({
  user: null,
  error: NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
})
const notAdmin = () => ({
  user: null,
  error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }),
})

function makeReq(method: string, slug: string) {
  return new NextRequest(`http://localhost/api/admin/cities/${slug}/qr-code`, { method })
}

const mockCity = { id: 'city-1', slug: 'saint-gervais-les-bains' }
const mockResult = {
  id: 'qr-1',
  city_slug: 'saint-gervais-les-bains',
  url: 'https://example.com/guide/saint-gervais-les-bains',
  storage_url: 'https://storage.supabase.co/qr-codes/saint-gervais-les-bains.png',
  created_at: '2026-05-22T10:00:00.000Z',
}

describe('POST /api/admin/cities/[slug]/qr-code — AC-02-01 (super-admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSessionAdmin as jest.Mock).mockResolvedValue(adminSession())
    ;(prisma.city.findFirst as jest.Mock).mockResolvedValue(mockCity)
    ;(generateQrPng as jest.Mock).mockResolvedValue(Buffer.from('fake-png'))
    ;(uploadQrToStorage as jest.Mock).mockResolvedValue(mockResult.storage_url)
    ;(upsertQrCode as jest.Mock).mockResolvedValue(mockResult)
  })

  it('returns 401 when not authenticated', async () => {
    ;(getSessionAdmin as jest.Mock).mockResolvedValue(unauthenticated())
    const res = await POST(makeReq('POST', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when authenticated but not a super-admin', async () => {
    ;(getSessionAdmin as jest.Mock).mockResolvedValue(notAdmin())
    const res = await POST(makeReq('POST', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(403)
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

describe('GET /api/admin/cities/[slug]/qr-code (super-admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getSessionAdmin as jest.Mock).mockResolvedValue(adminSession())
    ;(getQrCode as jest.Mock).mockResolvedValue(mockResult)
  })

  it('returns 401 when not authenticated', async () => {
    ;(getSessionAdmin as jest.Mock).mockResolvedValue(unauthenticated())
    const res = await GET(makeReq('GET', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 when no QR code exists for city', async () => {
    ;(getQrCode as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeReq('GET', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(404)
  })

  it('returns 200 with existing QrCodeResult', async () => {
    const res = await GET(makeReq('GET', 'saint-gervais-les-bains'), {
      params: { slug: 'saint-gervais-les-bains' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('qr-1')
  })
})
