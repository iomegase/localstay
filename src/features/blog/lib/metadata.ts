import type { Metadata } from 'next'
import { SITE } from '@/features/seo/lib/site'
import { truncate } from '@/features/seo/lib/metadata'
import { buildBlogArticlePath } from './slug'

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

export function blogListMetadata(input: {
  city: { name: string; slug: string } | null
}): Metadata {
  const title = input.city
    ? `Journal ${input.city.name} — Guides locaux MyStay`
    : 'Journal MyStay — Guides locaux et conseils de séjour'
  const description = input.city
    ? truncate(`Découvrez nos articles, conseils et guides locaux pour préparer un séjour à ${input.city.name} avec MyStay.`)
    : truncate('Découvrez le journal MyStay : guides locaux, conseils de séjour et inspirations éditoriales pour voyager plus simplement.')

  return {
    title,
    description,
    alternates: { canonical: '/journal' },
    openGraph: openGraph({ title, description, path: '/journal' }),
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function blogArticleMetadata(input: {
  slug: string
  title: string
  excerpt: string
  seo_title: string | null
  seo_description: string | null
  coverUrl: string | null
}): Metadata {
  const title = input.seo_title?.trim() || input.title
  const description = truncate(input.seo_description?.trim() || input.excerpt)
  const path = buildBlogArticlePath(input.slug)
  const images = input.coverUrl ? [input.coverUrl] : undefined

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: openGraph({ title, description, path, images, type: 'article' }),
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images } : {}) },
  }
}
