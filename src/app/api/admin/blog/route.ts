import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { BlogAdminFiltersSchema, BlogArticleUpsertSchema } from '@/features/blog/schemas'
import { ApiBlogError, createBlogArticle, listAdminBlogArticles } from '@/features/blog/queries/admin-blog'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = BlogAdminFiltersSchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
    category: req.nextUrl.searchParams.get('category') ?? undefined,
    city: req.nextUrl.searchParams.get('city') ?? undefined,
  })
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  const items = await listAdminBlogArticles(parsed.data)
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = BlogArticleUpsertSchema.safeParse(await req.json())
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  try {
    const data = await createBlogArticle(parsed.data, session.user.id)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof ApiBlogError) {
      return apiError(error.code, error.message, error.status, error.details)
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
