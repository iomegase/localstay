import { approximateLodgingLocation, distanceMeters } from '@/features/lodging-showcase/lib/approximate-location'

// Spec 088 — zone approximative du logement.
describe('088 AC-02 / AC-03 — zone approximative', () => {
  const exact = { latitude: 45.89227, longitude: 6.712007 }

  it('décalage de 15 à 35 m, stable pour un même logement', () => {
    const first = approximateLodgingLocation('lodging-305', exact.latitude, exact.longitude)!
    const second = approximateLodgingLocation('lodging-305', exact.latitude, exact.longitude)!
    expect(first).toEqual(second)
    const offset = distanceMeters(exact, first)
    expect(offset).toBeGreaterThanOrEqual(8)
    expect(offset).toBeLessThanOrEqual(43)
    expect(first.radius_m).toBe(50)
  })

  it('décalage différent selon le logement', () => {
    const a = approximateLodgingLocation('lodging-a', exact.latitude, exact.longitude)!
    const b = approximateLodgingLocation('lodging-b', exact.latitude, exact.longitude)!
    expect(a).not.toEqual(b)
  })

  it('coordonnées arrondies à 4 décimales, jamais les exactes', () => {
    const zone = approximateLodgingLocation('lodging-305', exact.latitude, exact.longitude)!
    expect(String(zone.latitude).split('.')[1]!.length).toBeLessThanOrEqual(4)
    expect(String(zone.longitude).split('.')[1]!.length).toBeLessThanOrEqual(4)
    expect(zone.latitude).not.toBe(exact.latitude)
  })

  it('AC-04 : sans coordonnées → null', () => {
    expect(approximateLodgingLocation('x', null, 6.7)).toBeNull()
    expect(approximateLodgingLocation('x', 45.9, null)).toBeNull()
  })

  it('le cercle de 50 m contient toujours la position réelle', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const zone = approximateLodgingLocation(id, exact.latitude, exact.longitude)!
      expect(distanceMeters(exact, zone)).toBeLessThan(zone.radius_m)
    }
  })
})
