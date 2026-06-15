import type { BlogBreadcrumbItem } from '../types'

export function buildBlogArticleBreadcrumb(input: {
  articleTitle: string
  city: { name: string; slug: string } | null
}): BlogBreadcrumbItem[] {
  if (input.city) {
    return [
      { label: 'Accueil', href: '/' },
      { label: `Guide ${input.city.name}`, href: `/guide/${input.city.slug}` },
      { label: 'Blog', href: `/blog?city=${input.city.slug}` },
      { label: input.articleTitle, href: null },
    ]
  }

  return [
    { label: 'Accueil', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: input.articleTitle, href: null },
  ]
}
