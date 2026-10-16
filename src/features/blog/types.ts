export const BLOG_ARTICLE_CATEGORIES = [
  'local_guide',
  'lodging',
  'restaurants',
  'activities',
  'travel_tips',
  'concierge',
  'seminar',
  'taxation',
] as const

/** Spec 029 AC-02-17 (PO 2026-10-16) : longueur maximale du contenu Markdown d'un article. */
export const BLOG_ARTICLE_MAX_CHARS = 30_000
export const BLOG_ARTICLE_TOO_LONG = `Le contenu dépasse ${BLOG_ARTICLE_MAX_CHARS.toLocaleString('fr-FR')} caractères.`

export const BLOG_ARTICLE_STATUSES = ['draft', 'review', 'published', 'archived'] as const

export type BlogArticleCategory = (typeof BLOG_ARTICLE_CATEGORIES)[number]
export type BlogArticleStatus = (typeof BLOG_ARTICLE_STATUSES)[number]

export type BlogBreadcrumbItem = {
  label: string
  href: string | null
}

export type BlogListArticleCard = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogArticleCategory
  tags: string[]
  published_at: Date
  city: { name: string; slug: string } | null
  cover: { url: string; alt: string } | null
}

export type PublicBlogListResult = {
  city: { name: string; slug: string } | null
  items: BlogListArticleCard[]
}

export type PublicBlogArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  content_markdown: string
  category: BlogArticleCategory
  tags: string[]
  published_at: Date
  updated_at: Date
  seo_title: string | null
  seo_description: string | null
  city: { name: string; slug: string } | null
  cover: { url: string; alt: string } | null
  gallery: Array<{ id: string; url: string; alt: string; sort_order: number }>
}
