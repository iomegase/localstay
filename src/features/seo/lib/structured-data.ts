import { organizationId, SITE, siteBaseUrl } from './site'
import { canEmitVacationRentalSchema } from '@/features/lodging-showcase/lib/completeness'
import type { PublicLodgingCardDto } from '@/features/lodging-showcase/types'
import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'
import { selectVisibleLodgingPhotos } from '@/features/lodging-showcase/lib/detail-view'
import type { DiscoveryPoiDetail } from '@/features/public-discovery/types'

const SCHEMA = 'https://schema.org'
const DISCOVERY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
type MappedPoiSchemaType =
  | 'Restaurant'
  | 'Bakery'
  | 'BarOrPub'
  | 'Hotel'
  | 'Store'
  | 'DaySpa'
  | 'Museum'
  | 'TouristAttraction'

const POI_SCHEMA_TYPE_SLUGS: ReadonlyArray<readonly [MappedPoiSchemaType, ReadonlySet<string>]> = [
  ['Restaurant', new Set(['restaurant'])],
  ['Bakery', new Set(['boulangerie'])],
  ['BarOrPub', new Set(['bar'])],
  ['Hotel', new Set(['hotel'])],
  ['Store', new Set(['magasin'])],
  ['DaySpa', new Set(['spa'])],
  ['Museum', new Set(['musee'])],
  ['TouristAttraction', new Set(['activite-touristique'])],
]

// Index = jour (0 = dimanche … 6 = samedi), aligné sur le format hours stocké.
const DAY_URIS = [
  'https://schema.org/Sunday',
  'https://schema.org/Monday',
  'https://schema.org/Tuesday',
  'https://schema.org/Wednesday',
  'https://schema.org/Thursday',
  'https://schema.org/Friday',
  'https://schema.org/Saturday',
] as const

export type JsonLdObject = Record<string, unknown>

export type PoiSchemaInput = {
  name: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  rating: number | null
  ratingCount: number
  hours: Record<string, { open: string; close: string } | null> | null
  photos: string[]
  cityName: string
  cityRegion: string | null
  postalCode: string
  /** Chemin canonique de la fiche, ex. /guide/ville/cat/slug */
  path: string
}

export function organizationSchema(): JsonLdObject {
  const base = siteBaseUrl()
  return {
    '@context': SCHEMA,
    '@type': 'Organization',
    '@id': organizationId(),
    name: SITE.name,
    url: base,
    logo: `${base}/mystay-logo-approved/mystay-logo-approved.png`,
    description:
      'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.',
    email: 'bonjour@mystay.city',
    areaServed: 'Haute-Savoie, France',
  }
}

export function websiteSchema(): JsonLdObject {
  const base = siteBaseUrl()
  return {
    '@context': SCHEMA,
    '@type': 'WebSite',
    name: SITE.name,
    url: base,
    inLanguage: 'fr-FR',
    publisher: { '@id': organizationId() },
  }
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLdObject {
  const base = siteBaseUrl()
  return {
    '@context': SCHEMA,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  }
}

export function discoveryItemListSchema(input: {
  name: string
  items: Array<{ name: string; path: string }>
}): JsonLdObject {
  const publicItems = input.items.filter(item => isCanonicalDiscoveryPath(item.path))

  return {
    '@context': SCHEMA,
    '@type': 'ItemList',
    name: input.name,
    itemListElement: publicItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `${siteBaseUrl()}${item.path}`,
    })),
  }
}

function isCanonicalDiscoveryPath(path: string): boolean {
  const segments = path.split('/')
  if (segments.length < 3 || segments.length > 5) return false
  if (segments[0] !== '' || segments[1] !== 'decouvrir') return false
  return segments.slice(2).every(segment => DISCOVERY_SLUG_PATTERN.test(segment))
}

function openingHoursSpecification(hours: PoiSchemaInput['hours']): JsonLdObject[] | undefined {
  if (!hours) return undefined
  const specs: JsonLdObject[] = []
  for (let day = 0; day < 7; day += 1) {
    const slot = hours[String(day)]
    if (!slot) continue
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAY_URIS[day],
      opens: slot.open,
      closes: slot.close,
    })
  }
  return specs.length > 0 ? specs : undefined
}

function poiUrl(path: string): string {
  return `${siteBaseUrl()}${path}`
}

export function localBusinessSchema(poi: PoiSchemaInput): JsonLdObject {
  const hoursSpec = openingHoursSpecification(poi.hours)
  return {
    '@context': SCHEMA,
    '@type': 'LocalBusiness',
    name: poi.name,
    ...(poi.description ? { description: poi.description } : {}),
    url: poiUrl(poi.path),
    ...(poi.photos.length > 0 ? { image: poi.photos } : {}),
    ...(poi.phone ? { telephone: poi.phone } : {}),
    ...(poi.website ? { sameAs: [poi.website] } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: poi.address,
      addressLocality: poi.cityName,
      postalCode: poi.postalCode,
      ...(poi.cityRegion ? { addressRegion: poi.cityRegion } : {}),
      addressCountry: 'FR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: poi.latitude, longitude: poi.longitude },
    ...(poi.rating != null && poi.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: poi.rating,
            ratingCount: poi.ratingCount,
          },
        }
      : {}),
    ...(hoursSpec ? { openingHoursSpecification: hoursSpec } : {}),
  }
}

export function touristAttractionSchema(poi: PoiSchemaInput): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type': 'TouristAttraction',
    name: poi.name,
    ...(poi.description ? { description: poi.description } : {}),
    url: poiUrl(poi.path),
    ...(poi.photos.length > 0 ? { image: poi.photos } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: poi.cityName,
      ...(poi.cityRegion ? { addressRegion: poi.cityRegion } : {}),
      addressCountry: 'FR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: poi.latitude, longitude: poi.longitude },
  }
}

function normalizeTaxonomySlug(slug: string): string {
  return slug
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function mappedPoiType(slug: string): MappedPoiSchemaType | null {
  const normalizedSlug = normalizeTaxonomySlug(slug)
  return POI_SCHEMA_TYPE_SLUGS.find(([, slugs]) => slugs.has(normalizedSlug))?.[0] ?? null
}

function discoveryPoiType(poi: DiscoveryPoiDetail): string {
  const subcategoryType = poi.subcategory === null ? null : mappedPoiType(poi.subcategory.slug)
  const categoryType = mappedPoiType(poi.category.slug)

  if (subcategoryType === null) return categoryType ?? 'LocalBusiness'
  if (categoryType === null || categoryType === subcategoryType) return subcategoryType
  if (subcategoryType === 'TouristAttraction') return categoryType
  if (categoryType === 'TouristAttraction') return subcategoryType
  return 'LocalBusiness'
}

/**
 * Schéma dédié à `/decouvrir`: la taxonomie visible choisit le type et seuls
 * les faits effectivement rendus par DiscoveryPoiView sont balisés.
 */
export function discoveryPoiSchema(poi: DiscoveryPoiDetail): JsonLdObject {
  const path = `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`
  const hoursSpec = openingHoursSpecification(poi.hours)

  return {
    '@context': SCHEMA,
    '@type': discoveryPoiType(poi),
    name: poi.name,
    description: poi.description,
    url: poiUrl(path),
    image: [poi.hero_photo_url],
    ...(poi.phone ? { telephone: poi.phone } : {}),
    ...(poi.website ? { sameAs: [poi.website] } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: poi.address,
      addressLocality: poi.city.name,
    },
    geo: { '@type': 'GeoCoordinates', latitude: poi.latitude, longitude: poi.longitude },
    ...(poi.rating !== null && poi.rating_count !== null && poi.rating_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: poi.rating,
            ratingCount: poi.rating_count,
          },
        }
      : {}),
    ...(hoursSpec ? { openingHoursSpecification: hoursSpec } : {}),
  }
}

export type LodgingSchemaInput = {
  id: string
  title: string
  shortDescription: string
  description: string
  cityName: string
  cityRegion: string | null
  slug: string
  propertyType: string
  maxGuests: number
  publicAreaLabel: string | null
  preciseLocationPublic: boolean
  publicLatitude: number | null
  publicLongitude: number | null
  photos: Array<{ url: string; alt: string; is_cover: boolean; room_type: string | null }>
  amenities: Array<{ code: string; label: string }>
}

export function lodgingPlaceSchema(input: LodgingSchemaInput): JsonLdObject {
  const path = publicLodgingPath(input.slug)
  return {
    '@context': SCHEMA,
    '@type': 'LodgingBusiness',
    '@id': `${siteBaseUrl()}${path}#lodging`,
    name: input.title,
    description: input.shortDescription,
    url: `${siteBaseUrl()}${path}`,
    provider: { '@id': organizationId() },
    image: selectVisibleLodgingPhotos(input.photos).map(photo => photo.url),
    amenityFeature: input.amenities.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity.label,
      value: true,
    })),
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.publicAreaLabel ?? input.cityName,
      addressCountry: 'FR',
    },
    ...(input.preciseLocationPublic && input.publicLatitude != null && input.publicLongitude != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: input.publicLatitude, longitude: input.publicLongitude } }
      : {}),
  }
}

export function vacationRentalSchema(input: LodgingSchemaInput): JsonLdObject | null {
  const canEmit = canEmitVacationRentalSchema({
    title: input.title,
    short_description: input.shortDescription,
    description: input.description,
    property_type: input.propertyType,
    max_guests: input.maxGuests,
    photos: input.photos,
    amenities: input.amenities,
    precise_location_public: input.preciseLocationPublic,
    public_latitude: input.publicLatitude,
    public_longitude: input.publicLongitude,
  })

  if (!canEmit) return null

  return {
    ...lodgingPlaceSchema(input),
    '@type': 'VacationRental',
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: input.maxGuests,
      unitText: 'personnes',
    },
  }
}

export function lodgingItemListSchema(input: {
  cityName: string
  citySlug: string
  items: PublicLodgingCardDto[]
}): JsonLdObject {
  return {
    '@context': SCHEMA,
    '@type': 'ItemList',
    name: `Logements à ${input.cityName}`,
    itemListElement: input.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteBaseUrl()}${item.href}`,
      name: item.title,
    })),
  }
}
