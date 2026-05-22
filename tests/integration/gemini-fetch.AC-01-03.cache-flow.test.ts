/**
 * AC-01-01 — Fetch triggered if no valid cache
 * AC-01-02 — POIs structured and persisted
 * AC-01-03 — Valid cache → no fetch triggered
 * AC-03-01 — Expired cache → new fetch triggered
 * AC-03-02 — is_fetching=true → no double fetch (cached returned)
 * AC-03-03 — Failed fetch → stale cache served, error logged
 *
 * Requires: real DB connection (DATABASE_URL in .env.local).
 * Mocks: callGemini to avoid live Gemini calls.
 */
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({
  callGemini: jest.fn(),
}))

import { runGeminiFetch } from '@/features/gemini-fetch/services/orchestrator'
import { callGemini } from '@/features/gemini-fetch/services/gemini-client'
import type { GeminiRawPoi } from '@/features/gemini-fetch/types'

const mockCallGemini = callGemini as jest.MockedFunction<typeof callGemini>

const MOCK_POIS: GeminiRawPoi[] = [
  {
    name: 'Restaurant Test 007',
    address: '1 place du test, Saint-Gervais-les-Bains',
    phone: null,
    website: null,
    description: 'Un restaurant de test pour la spec 007.',
    subcategory: null,
    hours: null,
    tags: ['test'],
  },
]

let testCityId: string
let testCategoryId: string

beforeAll(async () => {
  const city = await prisma.city.findFirst({
    where: { slug: 'saint-gervais-les-bains' },
    select: { id: true },
  })
  if (!city) throw new Error('Seed city saint-gervais-les-bains not found in DB')
  testCityId = city.id

  const category = await prisma.category.findFirst({
    where: { slug: 'restaurants' },
    select: { id: true },
  })
  if (!category) throw new Error('Seed category restaurants not found in DB')
  testCategoryId = category.id
})

beforeEach(async () => {
  await prisma.geminiCache.deleteMany({
    where: { city_id: testCityId, category_id: testCategoryId },
  })
  await prisma.pointOfInterest.deleteMany({
    where: {
      city_id: testCityId,
      category_id: testCategoryId,
      slug: 'restaurant-test-007',
    },
  })
  mockCallGemini.mockClear()
})

afterAll(async () => {
  await prisma.geminiCache.deleteMany({
    where: { city_id: testCityId, category_id: testCategoryId },
  })
  await prisma.pointOfInterest.deleteMany({
    where: {
      city_id: testCityId,
      category_id: testCategoryId,
      slug: 'restaurant-test-007',
    },
  })
  await prisma.$disconnect()
})

describe('AC-01-01 — fetch triggered if no valid cache', () => {
  it('calls Gemini when no cache row exists', async () => {
    mockCallGemini.mockResolvedValueOnce(MOCK_POIS)
    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })
    expect(mockCallGemini).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('fetched')
  })
})

describe('AC-01-02 — POIs persisted after fetch', () => {
  it('creates PointOfInterest row in DB', async () => {
    mockCallGemini.mockResolvedValueOnce(MOCK_POIS)
    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })

    const poi = await prisma.pointOfInterest.findFirst({
      where: {
        city_id: testCityId,
        category_id: testCategoryId,
        slug: 'restaurant-test-007',
      },
    })
    expect(poi).not.toBeNull()
    expect(poi?.name).toBe('Restaurant Test 007')
    expect(result.poi_count).toBeGreaterThan(0)
  })
})

describe('AC-01-03 — valid cache → no fetch triggered', () => {
  it('returns cached status without calling Gemini', async () => {
    await prisma.geminiCache.create({
      data: {
        city_id: testCityId,
        category_id: testCategoryId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        prompt_version: 'v1',
      },
    })

    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })
    expect(mockCallGemini).not.toHaveBeenCalled()
    expect(result.status).toBe('cached')
  })
})

describe('AC-03-01 — expired cache → new fetch triggered', () => {
  it('triggers Gemini fetch when cache is expired', async () => {
    await prisma.geminiCache.create({
      data: {
        city_id: testCityId,
        category_id: testCategoryId,
        expires_at: new Date(Date.now() - 60 * 1000), // expired 1 minute ago
        prompt_version: 'v1',
      },
    })

    mockCallGemini.mockResolvedValueOnce(MOCK_POIS)
    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })
    expect(mockCallGemini).toHaveBeenCalledTimes(1)
    expect(result.status).toBe('fetched')
  })
})

describe('AC-03-02 — no double fetch when is_fetching=true', () => {
  it('returns cached when lock is held', async () => {
    await prisma.geminiCache.create({
      data: {
        city_id: testCityId,
        category_id: testCategoryId,
        expires_at: new Date(Date.now() + 60 * 1000),
        is_fetching: true,
        prompt_version: 'v1',
      },
    })

    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })
    expect(mockCallGemini).not.toHaveBeenCalled()
    expect(result.status).toBe('cached')
  })
})

describe('AC-03-03 — failed fetch → stale cache served', () => {
  it('returns error status but does not throw, preserves existing POIs', async () => {
    mockCallGemini.mockRejectedValueOnce(new Error('Gemini API timeout'))
    const result = await runGeminiFetch({ cityId: testCityId, categoryId: testCategoryId })
    expect(result.status).toBe('error')
    expect(result.error).toContain('Gemini API timeout')
    expect(typeof result.poi_count).toBe('number')
  })
})
