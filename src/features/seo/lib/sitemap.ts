import type { MetadataRoute } from 'next'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

export type SitemapCity = { slug: string }
export type SitemapPoi = {
  slug: string
  city_slug: string
  category_slug: string
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
 * Construit les entrées du sitemap public à partir des destinations et POI publiés.
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
  const seenUrls = new Set<string>()
  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (seenUrls.has(entry.url)) return
    seenUrls.add(entry.url)
    entries.push(entry)
  }

  addEntry({ url: url('/'), changeFrequency: 'daily', priority: 1 })

  for (const path of staticPaths) {
    addEntry({ url: url(path), changeFrequency: 'monthly', priority: 0.5 })
  }

  for (const city of [...cities].sort((left, right) => compareText(left.slug, right.slug))) {
    addEntry({
      url: url(`/decouvrir/${city.slug}`),
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }

  const sortedPois = [...pois].sort((left, right) => (
    compareText(left.city_slug, right.city_slug)
    || compareText(left.category_slug, right.category_slug)
    || compareText(left.slug, right.slug)
  ))
  const seenCategory = new Set<string>()
  for (const poi of sortedPois) {
    const categoryPath = `/decouvrir/${poi.city_slug}/${poi.category_slug}`
    if (!seenCategory.has(categoryPath)) {
      seenCategory.add(categoryPath)
      addEntry({
        url: url(categoryPath),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
    addEntry({
      url: url(`${categoryPath}/${poi.slug}`),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  }

  const seenLodgingLists = new Set<string>()
  const sortedLodgings = [...lodgings].sort((left, right) => (
    compareText(left.city_slug, right.city_slug) || compareText(left.slug, right.slug)
  ))
  for (const lodging of sortedLodgings) {
    const listPath = `/guide/${lodging.city_slug}/logements`
    if (!seenLodgingLists.has(listPath)) {
      seenLodgingLists.add(listPath)
      addEntry({
        url: url(listPath),
        changeFrequency: 'weekly',
        priority: 0.75,
      })
    }

    addEntry({
      url: url(`/guide/${lodging.city_slug}/logements/${lodging.slug}`),
      lastModified: lodging.updated_at,
      changeFrequency: 'weekly',
      priority: 0.65,
    })
  }

  for (const article of [...blogArticles].sort((left, right) => compareText(left.slug, right.slug))) {
    addEntry({
      url: url(buildBlogArticlePath(article.slug)),
      lastModified: article.updated_at,
      changeFrequency: 'weekly',
      priority: 0.65,
    })
  }

  return entries
}

function compareText(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}
