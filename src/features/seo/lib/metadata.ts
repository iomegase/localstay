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

/**
 * Tronque proprement une description pour les balises meta
 * afin de rester autour de 160 caractères.
 */
export function truncate(
  text: string,
  max = MAX_DESCRIPTION,
): string {
  const clean = text.replace(/\s+/g, ' ').trim()

  if (clean.length <= max) {
    return clean
  }

  return `${clean.slice(0, max - 1).trimEnd()}…`
}

/**
 * Génère les données Open Graph communes aux pages publiques.
 */
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

    ...(input.images
      ? {
          images: input.images,
        }
      : {}),
  }
}

/**
 * HOME
 *
 * Positionnement principal :
 * - MyStay
 * - Conciergerie
 * - Saint-Gervais-les-Bains
 * - Pays du Mont-Blanc
 *
 * On évite volontairement les formulations de type
 * "gestion locative" ou "gestion immobilière".
 */
export function homeMetadata(): Metadata {
  const title =
    'Conciergerie à Saint-Gervais-les-Bains | MyStay'

  const description = truncate(
    'MyStay, conciergerie à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : accueil voyageurs, préparation des logements, ménage, linge et intendance.',
  )

  const path = '/'
  const images = ['/og-mystay.png']

  return {
    title: {
      absolute: title,
    },

    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

/**
 * POI / BONNE ADRESSE
 */
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
  const cityPart = input.cityName
    ? ` à ${input.cityName}`
    : ''

  const title =
    `${input.name} — ${input.categoryName}${cityPart}`

  const description = truncate(
    input.description ??
      `${input.name}, ${input.categoryName}${cityPart} — horaires, adresse et infos pratiques sur ${SITE.name}.`,
  )

  const path =
    `/guide/${input.citySlug}/${input.categorySlug}/${input.poiSlug}`

  const images = input.photo
    ? [input.photo]
    : undefined

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
      type: 'article',
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      ...(images
        ? {
            images,
          }
        : {}),
    },
  }
}

/**
 * GUIDE VILLE
 */
export function cityMetadata(input: {
  name: string
  region: string | null
  slug: string
}): Metadata {
  const regionPart = input.region
    ? ` (${input.region})`
    : ''

  const title =
    `${input.name}${regionPart} — Guide local MyStay`

  const description = truncate(
    `Découvrez le guide local MyStay de ${input.name}${
      input.region
        ? `, ${input.region}`
        : ''
    } : bonnes adresses, restaurants, activités et lieux à découvrir pendant votre séjour.`,
  )

  const path = `/guide/${input.slug}`

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

/**
 * CATÉGORIE D'UN GUIDE LOCAL
 */
export function categoryMetadata(input: {
  cityName: string
  categoryName: string
  citySlug: string
  categorySlug: string
}): Metadata {
  const title =
    `${input.categoryName} à ${input.cityName} — MyStay`

  const description = truncate(
    `Découvrez les meilleures adresses « ${input.categoryName} » à ${input.cityName}, sélectionnées par MyStay pour accompagner votre séjour.`,
  )

  const path =
    `/guide/${input.citySlug}/${input.categorySlug}`

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

/**
 * Retourne éventuellement une photo à utiliser
 * sur Open Graph / Twitter.
 */
function discoverySocialImages(
  photo: string | null,
): string[] | undefined {
  return photo
    ? [photo]
    : undefined
}

/**
 * INDEX /DÉCOUVRIR
 */
export function discoveryIndexMetadata(): Metadata {
  const title =
    'Découvrir le Pays du Mont-Blanc — Sélection MyStay'

  const description = truncate(
    'Découvrez les bonnes adresses, restaurants, commerces, activités et lieux sélectionnés par MyStay autour de Saint-Gervais-les-Bains et du Mont-Blanc.',
  )

  const path = '/decouvrir'
  const images = ['/og-mystay.png']

  return {
    title: {
      absolute: title,
    },

    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

/**
 * /DÉCOUVRIR/[VILLE]
 */
export function discoveryCityMetadata(
  city: DiscoveryCity,
): Metadata {
  const title =
    `Découvrir ${city.name} — Sélection locale MyStay`

  const location = [
    city.department,
    city.region,
  ].filter(
    (part): part is string => Boolean(part),
  )

  const locationPart =
    location.length > 0
      ? `, ${location.join(', ')}`
      : ''

  const description = truncate(
    `Découvrez la sélection locale MyStay à ${city.name}${locationPart} : bonnes adresses, restaurants, commerces et lieux recommandés pour votre séjour.`,
  )

  const path =
    `/decouvrir/${city.slug}`

  const photo =
    city.categories
      .flatMap(category => category.pois)[0]
      ?.photo_url ?? null

  const images =
    discoverySocialImages(photo)

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      ...(images
        ? {
            images,
          }
        : {}),
    },
  }
}

/**
 * /DÉCOUVRIR/[VILLE]/[CATÉGORIE]
 */
export function discoveryCategoryMetadata(
  category: DiscoveryCategory,
): Metadata {
  const title =
    `${category.name} à ${category.city.name} — MyStay`

  const description = truncate(
    `Découvrez les adresses « ${category.name} » sélectionnées par MyStay à ${category.city.name} pour préparer et profiter de votre séjour.`,
  )

  const path =
    `/decouvrir/${category.city.slug}/${category.slug}`

  const images =
    discoverySocialImages(
      category.pois[0]?.photo_url ?? null,
    )

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      ...(images
        ? {
            images,
          }
        : {}),
    },
  }
}

/**
 * /DÉCOUVRIR/[VILLE]/[CATÉGORIE]/[POI]
 */
export function discoveryPoiMetadata(
  poi: DiscoveryPoiDetail,
): Metadata {
  const title =
    `${poi.name} à ${poi.city.name} — MyStay`

  const description =
    truncate(poi.description)

  const path =
    `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`

  const images =
    discoverySocialImages(
      poi.hero_photo_url,
    )

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
      type: 'article',
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      ...(images
        ? {
            images,
          }
        : {}),
    },
  }
}

/**
 * LISTE PUBLIQUE DES LOGEMENTS
 */
export function lodgingListMetadata(): Metadata {
  const title =
    'Chalets et appartements dans le Pays du Mont-Blanc | MyStay'

  const description = truncate(
    'Découvrez les chalets et appartements accompagnés par MyStay à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc.',
  )

  const path =
    publicLodgingsPath()

  const images = ['/og-mystay.png']

  return {
    title: {
      absolute: title,
    },

    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

/**
 * FICHE PUBLIQUE D'UN LOGEMENT
 */
export function lodgingDetailMetadata(input: {
  title: string
  shortDescription: string
  lodgingSlug: string
  coverPhoto: string | null
}): Metadata {
  const title =
    `${input.title} — Séjour MyStay`

  const description =
    truncate(input.shortDescription)

  const path =
    publicLodgingPath(
      input.lodgingSlug,
    )

  const images =
    input.coverPhoto
      ? [input.coverPhoto]
      : undefined

  return {
    title,
    description,

    alternates: {
      canonical: path,
    },

    openGraph: openGraph({
      title,
      description,
      path,
      images,
      type: 'article',
    }),

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      ...(images
        ? {
            images,
          }
        : {}),
    },
  }
}