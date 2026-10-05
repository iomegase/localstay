import { organizationId, siteBaseUrl } from '@/features/seo/lib/site'
import { buildBlogArticlePath } from './slug'

export function blogPostingSchema(input: {
  slug: string
  title: string
  excerpt: string
  publishedAt: Date
  updatedAt: Date
  coverUrl: string | null
  coverAlt: string | null
  cityName: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.title,
    description: input.excerpt,
    datePublished: input.publishedAt.toISOString(),
    // Audit C-15 : date réelle de dernière modification de l'article.
    dateModified: input.updatedAt.toISOString(),
    mainEntityOfPage: `${siteBaseUrl()}${buildBlogArticlePath(input.slug)}`,
    ...(input.coverUrl ? { image: [input.coverUrl] } : {}),
    author: { '@id': organizationId() },
    publisher: { '@id': organizationId() },
    ...(input.cityName ? { contentLocation: { '@type': 'Place', name: input.cityName } } : {}),
  }
}
