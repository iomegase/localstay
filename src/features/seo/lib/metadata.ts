import type { Metadata } from 'next'
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
