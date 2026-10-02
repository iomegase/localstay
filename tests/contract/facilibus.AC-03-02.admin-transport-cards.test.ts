import { NextRequest, NextResponse } from 'next/server'
import { GET, PUT } from '@/app/api/admin/cities/[slug]/transport-cards/route'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'

const tx = {
  cityTransportCard: { findMany: jest.fn(), update: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
}
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    cityTransportCard: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const params = { params: Promise.resolve({ slug: 'saint-gervais-les-bains' }) }
const put = (body: unknown) => PUT(new NextRequest('http://localhost/api/admin/cities/saint-gervais-les-bains/transport-cards', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}), params)
const card = { id: 'card-1', title: 'Tramway du Mont-Blanc', tag: 'Gare du village', body: 'Monte vers Bellevue.', sort_order: 0 }

describe('055 AC-03-02 — admin city transport cards', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getSessionAdmin).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null } as never)
    jest.mocked(prisma.city.findFirst).mockResolvedValue({ id: 'city-1' } as never)
    jest.mocked(prisma.cityTransportCard.findMany).mockResolvedValue([card] as never)
    jest.mocked(prisma.$transaction).mockImplementation((async (callback: (client: typeof tx) => unknown) => callback(tx)) as never)
    tx.cityTransportCard.findMany.mockResolvedValue([{ id: 'card-1' }, { id: 'card-2' }])
  })

  it.each([401, 403])('rejects unauthorized access (%s)', async status => {
    jest.mocked(getSessionAdmin).mockResolvedValue({ user: null, error: NextResponse.json({}, { status }) } as never)
    expect((await GET(new NextRequest('http://localhost/x'), params)).status).toBe(status)
    expect((await put({ cards: [] })).status).toBe(status)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('lists the active cards of the city', async () => {
    const response = await GET(new NextRequest('http://localhost/x'), params)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ data: [card] })
    expect(prisma.cityTransportCard.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { city_id: 'city-1', deleted_at: null },
    }))
  })

  it('updates kept cards, creates new ones in order and soft deletes removed ones', async () => {
    const response = await put({ cards: [
      { id: 'card-1', title: ' Tramway du Mont-Blanc ', tag: '', body: 'Monte vers Bellevue.' },
      { title: 'Taxi', tag: 'Sur réservation', body: 'La conciergerie réserve un taxi local.' },
    ] })

    expect(response.status).toBe(200)
    expect(tx.cityTransportCard.update).toHaveBeenCalledWith({
      where: { id: 'card-1' },
      data: { title: 'Tramway du Mont-Blanc', tag: null, body: 'Monte vers Bellevue.', sort_order: 0 },
    })
    expect(tx.cityTransportCard.create).toHaveBeenCalledWith({
      data: { city_id: 'city-1', title: 'Taxi', tag: 'Sur réservation', body: 'La conciergerie réserve un taxi local.', sort_order: 1 },
    })
    expect(tx.cityTransportCard.updateMany).toHaveBeenCalledWith({
      where: { city_id: 'city-1', deleted_at: null, id: { in: ['card-2'] } },
      data: { deleted_at: expect.any(Date) },
    })
  })

  it.each([
    { cards: [{ title: '', body: 'x' }] },
    { cards: [{ title: 'x'.repeat(81), body: 'x' }] },
    { cards: [{ title: 'Taxi', tag: 'x'.repeat(25), body: 'x' }] },
    { cards: [{ title: 'Taxi', body: 'x'.repeat(401) }] },
    { cards: Array.from({ length: 13 }, () => ({ title: 'Taxi', body: 'x' })) },
  ])('rejects invalid cards: %#', async body => {
    expect((await put(body)).status).toBe(400)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects ids that do not belong to the city', async () => {
    const response = await put({ cards: [{ id: 'foreign', title: 'Taxi', body: 'x' }] })
    expect(response.status).toBe(400)
    expect(tx.cityTransportCard.update).not.toHaveBeenCalled()
  })

  it('returns 404 for an unknown city', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null)
    expect((await put({ cards: [] })).status).toBe(404)
  })
})
