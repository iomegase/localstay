const mockGetSessionOwner = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { GET } from '@/app/api/dashboard/cities/[slug]/pois/route'

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) }
}

describe('GET /api/dashboard/cities/[slug]/pois', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'o1' }, error: null })
  })

  it('returns the active POIs of the city', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue({ id: 'cityB', name: 'Annecy' } as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      { id: 'p1', name: 'Lac', category: { slug: 'nature', name: 'Nature' } },
    ] as never)

    const res = await GET(new Request('http://t/api/dashboard/cities/annecy/pois'), makeParams('annecy'))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      data: {
        city: { slug: 'annecy', name: 'Annecy' },
        pois: [{ id: 'p1', name: 'Lac', category_slug: 'nature', category_name: 'Nature' }],
      },
    })
  })

  it('returns 401 when there is no owner session', async () => {
    const unauthorized = new Response(null, { status: 401 })
    mockGetSessionOwner.mockResolvedValue({ owner: null, error: unauthorized })
    const res = await GET(new Request('http://t/api/dashboard/cities/annecy/pois'), makeParams('annecy'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when the city does not exist', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null as never)
    const res = await GET(new Request('http://t/api/dashboard/cities/zzz/pois'), makeParams('zzz'))
    expect(res.status).toBe(404)
  })
})
