import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import {
  APPROVED_DEMO_LODGING_MEDIA,
  isApprovedDemoLodgingMedia,
} from '@/features/guide-demo/demo-media-policy'
import { demoPois } from '@/features/guide-demo/demo-pois'
import { isValidTrailGeometry } from '@/features/trail-navigation/lib/geo'

describe('public guide demo data', () => {
  it('exposes one credible public POI collection without real UUIDs', () => {
    expect(demoPois.length).toBeGreaterThanOrEqual(12)
    expect(demoPois.length).toBeLessThanOrEqual(15)
    expect(new Set(demoPois.map(poi => poi.id)).size).toBe(demoPois.length)
    expect(demoPois.some(poi => poi.category.slug === 'rando')).toBe(true)
    expect(
      new Set(demoPois.map(poi => poi.category.slug)).size,
    ).toBeGreaterThanOrEqual(6)
    expect([demoLodging.id, ...demoPois.map(poi => poi.id)].join(' ')).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    )
  })

  it('keeps every public interaction on the same POI source', () => {
    const featured = demoPois.filter(poi => poi.recommended).slice(0, 3)
    expect(featured).toHaveLength(3)
    for (const poi of featured) {
      expect(poi.photos[0]).toMatch(/^https:\/\//)
      expect(poi.photos[0]).not.toContain('/fallback/')
    }

    for (const poi of demoPois) {
      expect(poi.name).not.toHaveLength(0)
      expect(poi.address).not.toHaveLength(0)
      expect(Number.isFinite(poi.latitude)).toBe(true)
      expect(Number.isFinite(poi.longitude)).toBe(true)
      expect(poi.directionsUrl).toContain('google.com/maps/dir/')
      expect(poi.photos[0]).toBeTruthy()
    }
  })

  it('includes the published Porcherey trail geometry without enabling tracking', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')

    expect(isValidTrailGeometry(porcherey?.trail?.geometry)).toBe(true)
    expect(porcherey?.trail).toMatchObject({
      startLatitude: 45.8535446,
      startLongitude: 6.7236865,
      reliability: 'reliable',
      trackingEnabled: false,
    })
  })

  it('presents Le 305 with the complete fictitious lodging guide data', () => {
    expect(demoLodging).toMatchObject({
      id: 'demo-le-305',
      name: 'Le 305',
      city: 'Saint-Gervais-les-Bains',
      addressLabel: 'Résidence de démonstration, 74170 Saint-Gervais-les-Bains',
      checkIn: '16:00',
      checkOut: '10:00',
      wifiName: 'MyStay-Demo',
      wifiPassword: 'Demo-Uniquement',
    })
    expect(demoLodging.arrivalInstructions).toHaveLength(3)
    expect(demoLodging.practicalCards).toHaveLength(3)
    expect(demoLodging.houseRules.length).toBeGreaterThanOrEqual(3)
    expect(demoLodging.departureInstructions).toHaveLength(9)
  })

  it('contains no real access secret or private lodging location', () => {
    const serialized = JSON.stringify(demoLodging)

    expect(serialized).not.toMatch(
      /300 route du Mont-Blanc|1789|Bienvenue2026|Refuge-Mont-Blanc/i,
    )
    expect(serialized).not.toMatch(
      /bo[iî]te (?:à|a) cl[ée]s|digicode|code d['’]acc[eè]s|garage/i,
    )
    expect(serialized).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    )
  })

  it('uses only the closed allowlist of reviewed non-sensitive lodging media', () => {
    const media = [
      demoLodging.coverImage,
      ...demoLodging.gallery,
      ...demoLodging.arrivalInstructions.flatMap(item => [
        ...(item.videoUrl ? [item.videoUrl] : []),
        ...item.photos,
      ]),
      ...demoLodging.practicalCards.flatMap(item => [
        ...(item.photoUrl ? [item.photoUrl] : []),
        ...(item.videoUrl ? [item.videoUrl] : []),
      ]),
    ]

    expect(APPROVED_DEMO_LODGING_MEDIA).toHaveLength(4)
    expect(media.every(isApprovedDemoLodgingMedia)).toBe(true)
  })
})
