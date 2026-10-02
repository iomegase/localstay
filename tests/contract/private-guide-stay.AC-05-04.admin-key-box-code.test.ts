import { NextRequest, NextResponse } from 'next/server'
import { GET, PUT } from '@/app/api/admin/lodgings/[id]/key-box-code/route'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn(), upsert: jest.fn() },
  },
}))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: jest.fn() }))

const params = { params: Promise.resolve({ id: '63defcbb-977a-40be-ba36-0c26fa9e76fa' }) }
const put = (body: unknown) => PUT(new NextRequest('http://localhost/x', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}), params)

describe('054 AC-05-04 — admin key box code', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getSessionAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null } as never)
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({ id: 'l1' } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({ key_box_code: '4810' } as never)
    jest.mocked(prisma.lodgingCustomization.upsert).mockResolvedValue({ key_box_code: '2255' } as never)
  })

  it.each([401, 403])('rejects non-admins (%s)', async status => {
    jest.mocked(getSessionAdmin).mockResolvedValue({ user: null, error: NextResponse.json({}, { status }) } as never)
    expect((await GET(new NextRequest('http://localhost/x'), params)).status).toBe(status)
    expect((await put({ key_box_code: '1234' })).status).toBe(status)
    expect(prisma.lodgingCustomization.upsert).not.toHaveBeenCalled()
  })

  it('reads the current code', async () => {
    const response = await GET(new NextRequest('http://localhost/x'), params)
    await expect(response.json()).resolves.toEqual({ data: { key_box_code: '4810' } })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('saves a trimmed code, creating the customization when missing', async () => {
    const response = await put({ key_box_code: ' 2255 ' })
    expect(response.status).toBe(200)
    expect(prisma.lodgingCustomization.upsert).toHaveBeenCalledWith({
      where: { lodging_id: '63defcbb-977a-40be-ba36-0c26fa9e76fa' },
      update: { key_box_code: '2255' },
      create: { lodging_id: '63defcbb-977a-40be-ba36-0c26fa9e76fa', category_order: [], key_box_code: '2255' },
      select: { key_box_code: true },
    })
  })

  it('clears the code with an empty value', async () => {
    await put({ key_box_code: '' })
    expect(jest.mocked(prisma.lodgingCustomization.upsert).mock.calls[0][0].update).toEqual({ key_box_code: null })
  })

  it('rejects codes longer than 20 characters and unknown lodgings', async () => {
    expect((await put({ key_box_code: 'x'.repeat(21) })).status).toBe(400)
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue(null)
    expect((await put({ key_box_code: '1234' })).status).toBe(404)
  })
})
