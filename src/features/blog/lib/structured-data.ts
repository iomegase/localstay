import { siteBaseUrl } from '@/features/seo/lib/site'

export function blogPostingSchema(input: {
  slug: string
  title: string
  excerpt: string
  publishedAt: Date
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
    mainEntityOfPage: `${siteBaseUrl()}/blog/${input.slug}`,
    ...(input.coverUrl ? { image: [input.coverUrl] } : {}),
    author: {
      '@type': 'Organization',
      name: 'MyStay',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MyStay',
    },
    ...(input.cityName ? { contentLocation: { '@type': 'Place', name: input.cityName } } : {}),
    ...(input.coverAlt ? { alternativeHeadline: input.coverAlt } : {}),
  }
}
