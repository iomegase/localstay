import type { MetadataRoute } from 'next'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

export type SitemapCity = { slug: string; updated_at: Date }
export type SitemapPoi = {
  slug: string
  city_slug: string
  category_slug: string
  updated_at: Date
}
export type SitemapLodging = {
  slug: string
  city_slug: string
  updated_at: Date
}
export type SitemapBlogArticle = {
  slug: string
  updated_at: Date
}

/**
 * Construit toutes les entrées du sitemap public à partir des villes et POI.
 * Les pages catégorie sont dérivées (distinctes) des POI existants — on n'expose
 * que des couples ville/catégorie réellement peuplés.
 */
export function buildSitemapEntries(input: {
  baseUrl: string
  cities: SitemapCity[]
  pois: SitemapPoi[]
  lodgings: SitemapLodging[]
  blogArticles?: SitemapBlogArticle[]
  staticPaths: string[]
}): MetadataRoute.Sitemap {
  const { baseUrl, cities, pois, lodgings, blogArticles = [], staticPaths } = input
  const url = (path: string) => `${baseUrl}${path}`
  const entries: MetadataRoute.Sitemap = []

  entries.push({ url: url('/'), changeFrequency: 'daily', priority: 1 })

  for (const path of staticPaths) {
    entries.push({ url: url(path), changeFrequency: 'monthly', priority: 0.5 })
  }

  for (const city of cities) {
    entries.push({
      url: url(`/guide/${city.slug}`),
      lastModified: city.updated_at,
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  const seenCategory = new Set<string>()
  for (const poi of pois) {
    const categoryPath = `/guide/${poi.city_slug}/${poi.category_slug}`
    if (!seenCategory.has(categoryPath)) {
      seenCategory.add(categoryPath)
      entries.push({ url: url(categoryPath), changeFrequency: 'weekly', priority: 0.7 })
    }
    entries.push({
      url: url(`${categoryPath}/${poi.slug}`),
      lastModified: poi.updated_at,
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  const seenLodgingLists = new Set<string>()
  for (const lodging of lodgings) {
    const listPath = `/guide/${lodging.city_slug}/logements`
    if (!seenLodgingLists.has(listPath)) {
      seenLodgingLists.add(listPath)
      entries.push({
        url: url(listPath),
        changeFrequency: 'weekly',
        priority: 0.75,
      })
    }

    entries.push({
      url: url(`/guide/${lodging.city_slug}/logements/${lodging.slug}`),
      lastModified: lodging.updated_at,
      changeFrequency: 'weekly',
      priority: 0.65,
    })
  }

  for (const article of blogArticles) {
    entries.push({
      url: url(buildBlogArticlePath(article.slug)),
      lastModified: article.updated_at,
      changeFrequency: 'weekly',
      priority: 0.65,
    })
  }

  return entries
}
