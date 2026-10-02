/** @jest-environment node */

const mockContext = jest.fn()
const mockGuideData = jest.fn()
const mockTravel = jest.fn()
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({ getActiveLodgingContext: () => mockContext() }))
jest.mock('@/features/guide-app/queries/private-guide-data', () => ({ getPrivateGuideData: (id: string) => mockGuideData(id) }))
jest.mock('@/features/transport/travel-times', () => ({ getCachedTravelTimes: (...args: unknown[]) => mockTravel(...args) }))

import { GET } from '@/app/api/guide/travel-times/route'

const lodging = (overrides = {}) => ({ lodging: { latitude: 45.8915, longitude: 6.7085, locationPrecise: true, ...overrides }, pois: [{ id: 'p1', latitude: 45.9, longitude: 6.71 }] })
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  mockContext.mockResolvedValue({ lodgingId: 'lodging-1' })
  mockGuideData.mockResolvedValue(lodging())
  mockTravel.mockResolvedValue({ p1: { walkingSeconds: 360, drivingSeconds: 120 } })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => errorLog.mockRestore())

describe('057 GET /api/guide/travel-times', () => {
  it('returns the travel times from the session lodging', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'available', data: { p1: { walkingSeconds: 360, drivingSeconds: 120 } } })
    expect(mockTravel).toHaveBeenCalledWith({ latitude: 45.8915, longitude: 6.7085 }, [{ id: 'p1', latitude: 45.9, longitude: 6.71 }])
    expect(response.headers.get('cache-control')).toContain('private')
  })

  it('rejects calls without a stay', async () => {
    mockContext.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })

  it('never computes from the city centre fallback', async () => {
    mockGuideData.mockResolvedValue(lodging({ locationPrecise: false }))
    await expect((await GET()).json()).resolves.toEqual({ status: 'outside_coverage', data: {} })
    expect(mockTravel).not.toHaveBeenCalled()
  })

  it('AC-01-03: reports an outage without failing the guide', async () => {
    mockTravel.mockRejectedValue(new Error('mapbox down'))
    const response = await GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'unavailable', data: {} })
  })
})
