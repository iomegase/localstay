/**
 * @jest-environment jsdom
 */
import {
  haversineKm,
  readStoredLocation,
  storeLocation,
  clearStoredLocation,
  readDismissed,
  storeDismissed,
  USER_LOCATION_EVENT,
} from '@/features/geolocation/lib/user-location'

describe('haversineKm', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineKm(45.78, 6.71, 45.78, 6.71)).toBeCloseTo(0, 5)
  })

  it('computes a known distance (Paris ↔ Lyon ≈ 392 km)', () => {
    const d = haversineKm(48.8566, 2.3522, 45.764, 4.8357)
    expect(d).toBeGreaterThan(385)
    expect(d).toBeLessThan(400)
  })

  it('is symmetric', () => {
    const a = haversineKm(45.78, 6.71, 45.9, 6.86)
    const b = haversineKm(45.9, 6.86, 45.78, 6.71)
    expect(a).toBeCloseTo(b, 10)
  })
})

describe('stored location', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredLocation()).toBeNull()
  })

  it('round-trips a stored location', () => {
    storeLocation({ latitude: 45.78, longitude: 6.71 })
    expect(readStoredLocation()).toEqual({ latitude: 45.78, longitude: 6.71 })
  })

  it('clears a stored location', () => {
    storeLocation({ latitude: 1, longitude: 2 })
    clearStoredLocation()
    expect(readStoredLocation()).toBeNull()
  })

  it('returns null for malformed stored data', () => {
    window.localStorage.setItem('mystay:user-location', 'not-json')
    expect(readStoredLocation()).toBeNull()
  })

  it('migrates a location saved under the legacy staylocal key', () => {
    window.localStorage.setItem('staylocal:user-location', JSON.stringify({ latitude: 45.78, longitude: 6.71 }))

    expect(readStoredLocation()).toEqual({ latitude: 45.78, longitude: 6.71 })
    // Recopiée vers la nouvelle clé et l'ancienne purgée.
    expect(window.localStorage.getItem('mystay:user-location')).toBe(
      JSON.stringify({ latitude: 45.78, longitude: 6.71 }),
    )
    expect(window.localStorage.getItem('staylocal:user-location')).toBeNull()
  })

  it('dispatches a sync event when a location is stored', () => {
    const handler = jest.fn()
    window.addEventListener(USER_LOCATION_EVENT, handler)
    storeLocation({ latitude: 1, longitude: 2 })
    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener(USER_LOCATION_EVENT, handler)
  })
})

describe('dismissal flag', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults to not dismissed', () => {
    expect(readDismissed()).toBe(false)
  })

  it('persists a dismissal', () => {
    storeDismissed()
    expect(readDismissed()).toBe(true)
  })
})
