import { NextResponse } from 'next/server'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getPublishedBlogArticleBySlug } from '@/features/blog/queries/public-blog'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import type { GuideBlogDetail } from '@/features/guide-app/types'

/**
 * Détail d'un article pour la vue interne du guide. Réservé aux guests en séjour
 * actif (confinement) ; renvoie du JSON de données publiques publiées — jamais
 * une redirection vers le site public.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const context = await getActiveLodgingContext()
  if (!context) {
    return NextResponse.json({ error: 'no-active-stay' }, { status: 403 })
  }

  const { slug } = await params
  const article = await getPublishedBlogArticleBySlug(slug)
  if (!article) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const detail: GuideBlogDetail = {
    title: article.title,
    categoryLabel: blogCategoryLabel(article.category),
    cityName: article.city?.name ?? null,
    coverUrl: article.cover?.url ?? null,
    contentMarkdown: article.content_markdown,
  }
  return NextResponse.json(detail)
}
