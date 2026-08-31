import {
  discoveryIndexMetadata,
  discoveryCategoryMetadata,
  discoveryCityMetadata,
  discoveryPoiMetadata,
} from '@/features/seo/lib/metadata'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryPoiCard,
  DiscoveryPoiDetail,
} from '@/features/public-discovery/types'

const poiCard: DiscoveryPoiCard = {
  name: 'Le Musée Alpin',
  slug: 'le-musee-alpin',
  address: '1 rue du Mont-Blanc',
  latitude: 45.8921,
  longitude: 6.7085,
  rating: 4.7,
  rating_count: 32,
  is_open_now: true,
  photo_url: 'https://images.example.com/musee.jpg',
  category: { name: 'Culture', slug: 'culture' },
  subcategory: { name: 'Musées', slug: 'musees' },
  distance_km: 0.4,
  zone: 'primary',
}

const city: DiscoveryCity = {
  name: 'Saint-Gervais-les-Bains',
  slug: 'saint-gervais-les-bains',
  postal_code: '74170',
  department: 'Haute-Savoie',
  region: 'Auvergne-Rhône-Alpes',
  categories: [{
    name: 'Culture',
    slug: 'culture',
    icon: 'landmark',
    sort_order: 1,
    poi_count: 1,
    pois: [poiCard],
  }],
}

const category: DiscoveryCategory = {
  name: 'Culture',
  slug: 'culture',
  icon: 'landmark',
  sort_order: 1,
  city: {
    name: city.name,
    slug: city.slug,
    postal_code: city.postal_code,
    department: city.department,
    region: city.region,
  },
  subcategories: [{ name: 'Musées', slug: 'musees' }],
  pois: [poiCard],
}

const poi: DiscoveryPoiDetail = {
  ...poiCard,
  description: 'Un musée consacré à l’histoire locale et au massif du Mont-Blanc.',
  phone: '+33 4 50 00 00 00',
  website: 'https://musee.example.com',
  hours: null,
  photos: [poiCard.photo_url, 'https://images.example.com/musee-2.jpg'],
  hero_photo_url: poiCard.photo_url,
  city: category.city,
}

describe('041 AC-01-05 discovery metadata', () => {
  it('keeps the discovery hub self-canonical without accepting lodging context', () => {
    expect(discoveryIndexMetadata).toHaveLength(0)

    const metadata = discoveryIndexMetadata()

    expect(metadata.alternates?.canonical).toBe('/decouvrir')
    expect(metadata.openGraph?.url).toBe('/decouvrir')
    expect(JSON.stringify(metadata).toLowerCase()).not.toContain('lodging')
  })

  it('builds city metadata on the self-referencing /decouvrir URL', () => {
    const metadata = discoveryCityMetadata(city)

    expect(metadata.title).toBe('Découvrir Saint-Gervais-les-Bains — Sélection locale MyStay')
    expect(metadata.alternates?.canonical).toBe('/decouvrir/saint-gervais-les-bains')
    expect(metadata.openGraph).toMatchObject({
      title: metadata.title,
      description: metadata.description,
      url: '/decouvrir/saint-gervais-les-bains',
      images: [poiCard.photo_url],
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [poiCard.photo_url],
    })
    expect(metadata.description).toContain('Haute-Savoie')
    expect(metadata.description).toContain('Auvergne-Rhône-Alpes')
  })

  it('omits unavailable geographic labels from the city description', () => {
    const metadata = discoveryCityMetadata({ ...city, department: null, region: null })

    expect(metadata.description).toBe(
      'Découvrez la sélection locale MyStay à Saint-Gervais-les-Bains : adresses et lieux validés pour préparer votre séjour.',
    )
    expect(metadata.openGraph?.images).toEqual([poiCard.photo_url])
    expect(JSON.stringify(metadata)).not.toContain('null')
  })

  it('builds category metadata from visible category and city facts', () => {
    const metadata = discoveryCategoryMetadata(category)

    expect(metadata.title).toBe('Culture à Saint-Gervais-les-Bains — Adresses MyStay')
    expect(metadata.alternates?.canonical).toBe(
      '/decouvrir/saint-gervais-les-bains/culture',
    )
    expect(metadata.openGraph?.url).toBe('/decouvrir/saint-gervais-les-bains/culture')
    expect(metadata.openGraph?.description).toBe(metadata.description)
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [poiCard.photo_url],
    })
  })

  it('builds POI metadata from its visible description and hero photo', () => {
    const metadata = discoveryPoiMetadata(poi)

    expect(metadata.title).toBe('Le Musée Alpin à Saint-Gervais-les-Bains — MyStay')
    expect(metadata.description).toBe(poi.description)
    expect(metadata.alternates?.canonical).toBe(
      '/decouvrir/saint-gervais-les-bains/culture/le-musee-alpin',
    )
    expect(metadata.openGraph).toMatchObject({
      url: '/decouvrir/saint-gervais-les-bains/culture/le-musee-alpin',
      title: metadata.title,
      description: poi.description,
      images: [poi.hero_photo_url],
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: poi.description,
      images: [poi.hero_photo_url],
    })
  })
})
