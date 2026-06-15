import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { ApiBlogError, publishBlogArticle } from '@/features/blog/queries/admin-blog'
import { buildBlogArticlePath } from '@/features/blog/lib/slug'

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  try {
    const { id } = await context.params
    const article = await publishBlogArticle(id)
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
