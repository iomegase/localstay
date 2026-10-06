import { getPoiDiscoveryEligibility } from '@/features/public-discovery/lib/eligibility'
import { resolveDiscoveryCardPhoto } from '@/features/public-discovery/lib/discovery-photo'
import { getDiscoveryPoiVisibility } from '@/features/public-discovery/lib/visibility'

// Spec 065 US-03 (POI sans photo) et BR-08 (Urgences réservée au guide privé).
const LONG_DESCRIPTION = 'Une adresse locale vérifiée par MyStay. '.repeat(4).trim() // 159 caractères
const SHORT_DESCRIPTION = 'Une adresse locale vérifiée par MyStay.'

const completePoi = {
  is_active: true,
  deleted_at: null,
  description: LONG_DESCRIPTION,
  address: '100 rue du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  latitude: 45.89,
  longitude: 6.71,
  geocode_status: 'success',
  phone: '+33450000000',
  website: null,
  photos: [] as string[],
  city: { is_active: true, deleted_at: null },
  category: { is_active: true, deleted_at: null },
  subcategory: null,
}

describe('065 AC-03-01 / AC-03-02 — éligibilité sans photo', () => {
  it('AC-03-01 : sans photo, une description ≥ 150 caractères suffit', () => {
    expect(LONG_DESCRIPTION.length).toBeGreaterThanOrEqual(150)
    expect(getPoiDiscoveryEligibility(completePoi)).toEqual({ eligible: true, missing: [] })
  })

  it('AC-03-01 : la limite de 150 caractères est comptée après trim', () => {
    const exactly150 = 'a'.repeat(150)
    expect(getPoiDiscoveryEligibility({ ...completePoi, description: `  ${exactly150}  ` }).eligible).toBe(true)
    expect(getPoiDiscoveryEligibility({ ...completePoi, description: `  ${'a'.repeat(149)}  ` })).toEqual({
      eligible: false,
      missing: ['photo'],
    })
  })

  it('AC-03-02 : sans photo et description courte, le motif « photo » est renvoyé', () => {
    expect(getPoiDiscoveryEligibility({ ...completePoi, description: SHORT_DESCRIPTION })).toEqual({
      eligible: false,
      missing: ['photo'],
    })
  })

  it('une photo exploitable dispense toujours de la longueur minimale', () => {
    expect(getPoiDiscoveryEligibility({
      ...completePoi,
      description: SHORT_DESCRIPTION,
      photos: ['https://example.com/poi.jpg'],
    })).toEqual({ eligible: true, missing: [] })
  })
})

describe('065 AC-03-03 — image de remplacement', () => {
  it('garde la première photo réelle quand elle existe', () => {
    expect(resolveDiscoveryCardPhoto(['https://example.com/a.jpg'], 'shopping', { slug: 'location-de-ski', name: 'Location de ski' }))
      .toEqual({ photo_url: 'https://example.com/a.jpg', photo_is_fallback: false })
  })

  it('choisit l’image du type de lieu, sous-catégorie en priorité', () => {
    expect(resolveDiscoveryCardPhoto([], 'shopping', { slug: 'location-de-ski', name: 'Location de ski' }))
      .toEqual({ photo_url: '/fallback/fallback-location-de-ski.png', photo_is_fallback: true })
    expect(resolveDiscoveryCardPhoto([], 'diner', null))
      .toEqual({ photo_url: '/fallback/fallback-restaurant.png', photo_is_fallback: true })
  })

  it('retombe sur l’image MyStay quand aucun type ne correspond', () => {
    expect(resolveDiscoveryCardPhoto([], 'soin', { slug: 'spa', name: 'Spa' }))
      .toEqual({ photo_url: '/og-mystay.png', photo_is_fallback: true })
  })
})

describe('065 BR-08 — catégorie Urgences jamais publique', () => {
  const visible = {
    name: 'Pharmacie du Mont-Blanc',
    slug: 'pharmacie-du-mont-blanc',
    description: LONG_DESCRIPTION,
    address: 'Adresse',
    latitude: 45.8925,
    longitude: 6.7128,
    phone: '+33450000000',
    website: null,
    photos: ['https://example.com/p.jpg'],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-10-01T00:00:00.000Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: { slug: 'saint-gervais-les-bains', latitude: 45.8922, longitude: 6.7125, is_active: true, deleted_at: null },
    category: { id: 'cat-1', slug: 'shopping', is_active: true, deleted_at: null },
    subcategory: null,
  }

  it('une autre catégorie publiée reste visible', () => {
    expect(getDiscoveryPoiVisibility(visible)).not.toBeNull()
  })

  it('un POI publié de la catégorie urgences est masqué', () => {
    expect(getDiscoveryPoiVisibility({ ...visible, category: { ...visible.category, slug: 'urgences' } })).toBeNull()
  })
})
