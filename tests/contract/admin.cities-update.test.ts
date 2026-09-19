import { NextRequest, NextResponse } from 'next/server'
import { PATCH } from '@/app/api/admin/cities/[slug]/route'
import { prisma } from '@/shared/lib/prisma'
import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import { getSessionAdmin } from '@/features/merchant/lib/session'

jest.mock('@/shared/lib/prisma', () => ({ prisma: { city: { findFirst: jest.fn(), update: jest.fn() } } }))
jest.mock('@/features/geocoding/services/mapbox-client', () => ({ geocodeAddress: jest.fn() }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const current = { id: 'city-1', name: 'Saint-Gervais', postal_code: '74170', latitude: 45.89, longitude: 6.71 }
const slug = 'saint-gervais'
const input = { name: 'Saint-Gervais-les-Bains', postal_code: '74170' }

function request(body: unknown = input, citySlug = slug) {
  return PATCH(new NextRequest(`http://localhost/api/admin/cities/${citySlug}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ slug: citySlug }) })
}

describe('Admin city update', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    const authMock = getSessionAdmin as jest.Mock
    authMock.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    const findMock = prisma.city.findFirst as jest.Mock
    findMock.mockResolvedValue(current)
    const updateMock = prisma.city.update as jest.Mock
    updateMock.mockResolvedValue({ id: current.id, slug, ...input })
    jest.mocked(geocodeAddress).mockResolvedValue({ latitude: 45.90, longitude: 6.72, relevance: 1, place_name: input.name })
  })

  it.each([401, 403])('rejects unauthorized access (%s) before querying or geocoding', async status => {
    const authMock = getSessionAdmin as jest.Mock
    authMock.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status }) })
    expect((await request()).status).toBe(status)
    expect(prisma.city.findFirst).not.toHaveBeenCalled()
    expect(geocodeAddress).not.toHaveBeenCalled()
  })

  it.each([{ name: '', postal_code: '74170' }, { ...input, postal_code: '123' }, { ...input, slug: 'replacement' }])('rejects invalid fields and slug changes: %j', async body => {
    expect((await request(body)).status).toBe(400)
    expect(prisma.city.update).not.toHaveBeenCalled()
  })

  it('rejects an invalid route identifier', async () => {
    expect((await request(input, 'not_a_slug')).status).toBe(400)
    expect(prisma.city.findFirst).not.toHaveBeenCalled()
  })

  it('returns 404 for missing or soft-deleted cities', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null)
    expect((await request()).status).toBe(404)
    expect(prisma.city.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug, deleted_at: null } }))
    expect(prisma.city.update).not.toHaveBeenCalled()
  })

  it('saves validated fields and Mapbox coordinates while preserving the slug and unrelated data', async () => {
    const response = await request({ ...input, name: ` ${input.name} ` })
    expect(response.status).toBe(200)
    expect(geocodeAddress).toHaveBeenCalledWith(`${input.name} 74170 France`, current)
    expect(prisma.city.update).toHaveBeenCalledWith({
      where: { id: current.id, deleted_at: null },
      data: { ...input, latitude: 45.90, longitude: 6.72 },
      select: { id: true, name: true, slug: true, postal_code: true },
    })
    expect(await response.json()).toEqual({ data: { id: current.id, slug, ...input } })
  })

  it('does not geocode unchanged fields', async () => {
    expect((await request({ name: current.name, postal_code: current.postal_code })).status).toBe(200)
    expect(geocodeAddress).not.toHaveBeenCalled()
  })

  it('does not save when Mapbox returns no match', async () => {
    jest.mocked(geocodeAddress).mockResolvedValue(null)
    expect((await request()).status).toBe(422)
    expect(prisma.city.update).not.toHaveBeenCalled()
  })

  it('does not save when Mapbox is unavailable', async () => {
    jest.mocked(geocodeAddress).mockRejectedValue(new Error('Network error'))
    expect((await request()).status).toBe(502)
    expect(prisma.city.update).not.toHaveBeenCalled()
  })
})
