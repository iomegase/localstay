import type { Metadata } from 'next'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryPoiDetail,
} from '@/features/public-discovery/types'
import {
  publicLodgingPath,
  publicLodgingsPath,
} from '@/features/lodging-showcase/lib/public-paths'
import { SITE } from './site'

const MAX_DESCRIPTION = 160

/** Tronque proprement une description pour les balises meta (~160 caractères). */
export function truncate(text: string, max = MAX_DESCRIPTION): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

function openGraph(input: {
  title: string
  description: string
  path: string
  images?: string[]
  type?: 'website' | 'article'
}): Metadata['openGraph'] {
  return {
    title: input.title,
    description: input.description,
    url: input.path,
    siteName: SITE.name,
    locale: SITE.locale,
    type: input.type ?? 'website',
    ...(input.images ? { images: input.images } : {}),
  }
}

export function homeMetadata(): Metadata {
  const title = 'Conciergerie en Haute-Savoie | MyStay'
  const description =
    'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.'
  const path = '/'
  const images = ['/og-mystay.png']

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images }),
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export function poiMetadata(input: {
  name: string
  description: string | null
  cityName: string | null
  categoryName: string
  citySlug: string
  categorySlug: string
  poiSlug: string
  photo: string | null
}): Metadata {
  const cityPart = input.cityName ? ` à ${input.cityName}` : ''
  const title = `${input.name} — ${input.categoryName}${cityPart}`
  const description = truncate(
    input.description ??
      `${input.name}, ${input.categoryName}${cityPart} — horaires, adresse et infos pratiques sur ${SITE.name}.`,
  )
  const path = `/guide/${input.citySlug}/${input.categorySlug}/${input.poiSlug}`
  const images = input.photo ? [input.photo] : undefined

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images, type: 'article' }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}

export function cityMetadata(input: { name: string; region: string | null; slug: string }): Metadata {
  const regionPart = input.region ? ` (${input.region})` : ''
  const title = `${input.name}${regionPart} — Guide local`
  const description = truncate(
    `Le guide local de ${input.name}${input.region ? `, ${input.region}` : ''} : meilleures adresses, randonnées et activités autour de votre séjour.`,
  )
  const path = `/guide/${input.slug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path }),
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function categoryMetadata(input: {
  cityName: string
  categoryName: string
  citySlug: string
  categorySlug: string
}): Metadata {
  const title = `${input.categoryName} à ${input.cityName} — Guide local`
  const description = truncate(
    `Découvrez les meilleures adresses « ${input.categoryName} » à ${input.cityName}, sélectionnées pour votre séjour sur ${SITE.name}.`,
  )
  const path = `/guide/${input.citySlug}/${input.categorySlug}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path }),
    twitter: { card: 'summary_large_image', title, description },
  }
}

function discoverySocialImages(photo: string | null): string[] | undefined {
  return photo ? [photo] : undefined
}

export function discoveryIndexMetadata(): Metadata {
  const title = 'Découvrir les bonnes adresses locales — MyStay'
  const description = 'Découvrez les adresses locales sélectionnées par MyStay, dans les villes où elles sont actuellement publiées.'
  const path = '/decouvrir'
  const images = ['/og-mystay.png']

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images }),
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export function discoveryCityMetadata(city: DiscoveryCity): Metadata {
  const title = `Découvrir ${city.name} — Sélection locale MyStay`
  const location = [city.department, city.region].filter((part): part is string => Boolean(part))
  const locationPart = location.length > 0 ? `, ${location.join(', ')}` : ''
  const description = truncate(
    `Découvrez la sélection locale MyStay à ${city.name}${locationPart} : adresses et lieux validés pour préparer votre séjour.`,
  )
  const path = `/decouvrir/${city.slug}`
  const photo = city.categories.flatMap(category => category.pois)[0]?.photo_url ?? null
  const images = discoverySocialImages(photo)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}

export function discoveryCategoryMetadata(category: DiscoveryCategory): Metadata {
  const title = `${category.name} à ${category.city.name} — Adresses MyStay`
  const description = truncate(
    `Découvrez les adresses « ${category.name} » sélectionnées par MyStay à ${category.city.name}.`,
  )
  const path = `/decouvrir/${category.city.slug}/${category.slug}`
  const images = discoverySocialImages(category.pois[0]?.photo_url ?? null)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}

export function discoveryPoiMetadata(poi: DiscoveryPoiDetail): Metadata {
  const title = `${poi.name} à ${poi.city.name} — MyStay`
  const description = truncate(poi.description)
  const path = `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`
  const images = discoverySocialImages(poi.hero_photo_url)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images, type: 'article' }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}

export function lodgingListMetadata(): Metadata {
  const title = 'Nos logements — MyStay'
  const description = truncate(
    'Découvrez les logements accompagnés par la conciergerie MyStay en Haute-Savoie.',
  )
  const path = publicLodgingsPath()
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path }),
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function lodgingDetailMetadata(input: {
  title: string
  shortDescription: string
  lodgingSlug: string
  coverPhoto: string | null
}): Metadata {
  const title = `${input.title} — Logement MyStay`
  const description = truncate(input.shortDescription)
  const path = publicLodgingPath(input.lodgingSlug)
  const images = input.coverPhoto ? [input.coverPhoto] : undefined

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path, images, type: 'article' }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}
