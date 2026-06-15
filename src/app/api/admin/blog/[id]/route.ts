import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { ApiBlogError, getAdminBlogArticle, updateBlogArticle } from '@/features/blog/queries/admin-blog'
import { BlogArticleUpsertSchema } from '@/features/blog/schemas'

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
