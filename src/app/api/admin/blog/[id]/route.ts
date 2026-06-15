import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { ApiBlogError, deleteBlogArticle, getAdminBlogArticle, updateBlogArticle } from '@/features/blog/queries/admin-blog'
import { BlogArticleUpsertSchema } from '@/features/blog/schemas'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

type Context = {
  params: Promise<{ id: string }>
}

export async function GET(_: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const article = await getAdminBlogArticle(id)
  if (!article) return apiError('NOT_FOUND', 'Article introuvable', 404)
  return NextResponse.json(article)
}

export async function PATCH(req: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = BlogArticleUpsertSchema.safeParse(await req.json())
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  try {
    const { id } = await context.params
    const data = await updateBlogArticle(id, parsed.data)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ApiBlogError) {
      return apiError(error.code, error.message, error.status, error.details)
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}

export async function DELETE(_: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await context.params
    const article = await deleteBlogArticle(id)
    revalidatePath('/blog', 'page')
    revalidatePath(buildBlogArticlePath(article.slug), 'page')
    revalidatePath('/sitemap.xml')
    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof ApiBlogError) {
      return apiError(error.code, error.message, error.status, error.details)
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
