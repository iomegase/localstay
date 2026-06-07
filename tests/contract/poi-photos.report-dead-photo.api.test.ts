import { NextRequest } from 'next/server'

const mockFindUnique = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findUnique: (...a: unknown[]) => mockFindUnique(...a) } },
}))
const mockCheck = jest.fn()
jest.mock('@/features/poi-photos/services/check-photo-url', () => ({
  checkPhotoUrl: (...a: unknown[]) => mockCheck(...a),
}))
const mockHeal = jest.fn()
jest.mock('@/features/poi-photos/services/heal-poi-photos', () => ({
  healPoiPhotos: (...a: unknown[]) => mockHeal(...a),
}))

import { POST } from '@/app/api/pois/[id]/report-dead-photo/route'

function req(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/pois/p1/report-dead-photo', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}
const ctx = { params: Promise.resolve({ id: 'p1' }) }

beforeEach(() => jest.clearAllMocks())

it('ignores a url that does not belong to the POI', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['a.jpg'] })
  const res = await POST(req({ url: 'https://evil/x.jpg' }), ctx)
  expect(res.status).toBe(200)
  await expect(res.json()).resolves.toEqual({ data: { acted: false } })
  expect(mockHeal).not.toHaveBeenCalled()
})

it('ignores a url that is actually still alive (anti-abuse server confirm)', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['https://x/a.jpg'] })
  mockCheck.mockResolvedValue('alive')
  const res = await POST(req({ url: 'https://x/a.jpg' }), ctx)
  await expect(res.json()).resolves.toEqual({ data: { acted: false } })
  expect(mockHeal).not.toHaveBeenCalled()
})

it('heals when the url belongs to the POI and is confirmed dead', async () => {
  mockFindUnique.mockResolvedValue({ photos: ['https://x/a.jpg'] })
  mockCheck.mockResolvedValue('dead')
  mockHeal.mockResolvedValue({ removed: 1, status: 'needs_refresh' })
  const res = await POST(req({ url: 'https://x/a.jpg' }), ctx)
  await expect(res.json()).resolves.toEqual({ data: { acted: true, removed: 1, status: 'needs_refresh' } })
  expect(mockHeal).toHaveBeenCalledWith({ poiId: 'p1', deadUrls: ['https://x/a.jpg'] })
})

it('rejects an invalid body with 400', async () => {
  const res = await POST(req({ nope: true }), ctx)
  expect(res.status).toBe(400)
})
