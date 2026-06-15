import { prisma } from '@/shared/lib/prisma'
import { blogCategoryLabel } from '../lib/category-label'
import type { PublicBlogArticle, PublicBlogListResult } from '../types'

const PUBLISHED_WHERE = {
  status: 'published' as const,
  deleted_at: null,
  NOT: { published_at: null },
}

export async function getPublishedBlogArticles(citySlug?: string): Promise<PublicBlogListResult | null> {
  const city = citySlug
    ? await prisma.city.findFirst({
        where: { slug: citySlug, is_active: true, deleted_at: null },
        select: { id: true, name: true, slug: true },
      })
    : null

  if (citySlug && !city) return null

  const items = await prisma.blogArticle.findMany({
    where: {
      ...PUBLISHED_WHERE,
      ...(city ? { city_id: city.id } : {}),
    },
    orderBy: { published_at: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      category: true,
      tags: true,
      published_at: true,
      city: { select: { name: true, slug: true } },
      photos: {
        where: { kind: 'cover', deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        select: { url: true, alt: true },
        take: 1,
      },
    },
  })

  return {
    city: city ? { name: city.name, slug: city.slug } : null,
    items: items.flatMap(article =>
      article.published_at
        ? [{
            id: article.id,
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt,
            category: article.category,
            tags: article.tags,
            published_at: article.published_at,
            city: article.city,
            cover: article.photos[0] ?? null,
            category_label: blogCategoryLabel(article.category),
          } as PublicBlogListResult['items'][number] & { category_label: string }]
        : [],
    ).map(({ category_label: _categoryLabel, ...item }) => item),
  }
}

export async function getPublishedBlogArticleBySlug(slug: string): Promise<PublicBlogArticle | null> {
  const article = await prisma.blogArticle.findFirst({
    where: {
      slug,
      ...PUBLISHED_WHERE,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content_markdown: true,
      category: true,
      tags: true,
      published_at: true,
      seo_title: true,
      seo_description: true,
      city: { select: { name: true, slug: true } },
      photos: {
        where: { deleted_at: null },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
        select: { id: true, kind: true, url: true, alt: true, sort_order: true },
      },
    },
  })

  if (!article || !article.published_at) return null

  const cover = article.photos.find(photo => photo.kind === 'cover') ?? null
  const gallery = article.photos.filter(photo => photo.kind === 'gallery')

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content_markdown: article.content_markdown,
    category: article.category,
    tags: article.tags,
    published_at: article.published_at,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    city: article.city,
    cover,
    gallery,
  }
}
