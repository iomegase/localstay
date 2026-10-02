/** @jest-environment node */

import { formatTravelDuration, primaryTravel } from '@/features/guide-app/components/stay/poi-search'
import { computeTravelTimes } from '@/features/transport/travel-times'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('057 travel helpers', () => {
  it('AC-01-01: picks walking up to 25 minutes, otherwise driving', () => {
    expect(primaryTravel({ walkingSeconds: 360, drivingSeconds: 120 })).toEqual({ mode: 'walking', label: '6 min' })
    expect(primaryTravel({ walkingSeconds: 1500, drivingSeconds: 400 })).toEqual({ mode: 'walking', label: '25 min' })
    expect(primaryTravel({ walkingSeconds: 1560, drivingSeconds: 1080 })).toEqual({ mode: 'driving', label: '18 min' })
    expect(primaryTravel({ walkingSeconds: null, drivingSeconds: 600 })).toEqual({ mode: 'driving', label: '10 min' })
    expect(primaryTravel({ walkingSeconds: null, drivingSeconds: null })).toBeNull()
  })

  it('formats durations', () => {
    expect(formatTravelDuration(20)).toBe('1 min')
    expect(formatTravelDuration(3900)).toBe('1 h 05')
    expect(formatTravelDuration(7200)).toBe('2 h')
  })

  it('AC-03-01: demo places carry computed travel times instead of made-up labels', () => {
    for (const poi of demoPois) {
      expect(poi.distanceLabel).toBeUndefined()
      expect(poi.travel).toEqual(expect.objectContaining({ drivingSeconds: expect.any(Number) }))
    }
  })
})

describe('057 BR-01 — MapBox matrix', () => {
  const originalFetch = globalThis.fetch
  const originalToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  beforeEach(() => { process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test' })
  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = originalToken
  })

  it('queries walking and driving in batches of 24 destinations and maps durations by POI', async () => {
    const pois = Array.from({ length: 30 }, (_, index) => ({ id: `p${index}`, latitude: 45.9, longitude: 6.7 + index / 1000 }))
    const calls: string[] = []
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      calls.push(url)
      const count = url.split('?')[0].split(';').length - 1
      const durations = Array.from({ length: count }, (_, index) => (index === 0 ? null : (url.includes('/walking/') ? 600 : 120)))
      return new Response(JSON.stringify({ code: 'Ok', durations: [[0, ...durations]] }), { status: 200 })
    }) as typeof fetch

    const result = await computeTravelTimes({ latitude: 45.8915, longitude: 6.7085 }, pois)

    expect(calls).toHaveLength(4)
    expect(calls.every(url => url.startsWith('https://api.mapbox.com/directions-matrix/v1/mapbox/'))).toBe(true)
    expect(calls[0]).toContain('6.708500,45.891500;')
    expect(result.p1).toEqual({ walkingSeconds: 600, drivingSeconds: 120 })
    expect(result.p0).toEqual({ walkingSeconds: null, drivingSeconds: null })
    expect(Object.keys(result)).toHaveLength(30)
  })

  it('rejects an invalid MapBox response', async () => {
    globalThis.fetch = jest.fn(async () => new Response(JSON.stringify({ code: 'InvalidInput' }), { status: 200 })) as typeof fetch
    await expect(computeTravelTimes({ latitude: 45.89, longitude: 6.7 }, [{ id: 'a', latitude: 45.9, longitude: 6.71 }])).rejects.toThrow()
  })
})
