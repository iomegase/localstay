import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { ApiBlogError, applyBlogGeneration } from '@/features/blog/queries/admin-blog'
import { BlogApplyGenerationSchema } from '@/features/blog/schemas'

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = BlogApplyGenerationSchema.safeParse(await req.json())
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  try {
    const { id } = await context.params
    const article = await applyBlogGeneration(id, parsed.data.generation_id)
    return NextResponse.json(article)
  } catch (error) {
    if (error instanceof ApiBlogError) {
      return apiError(error.message, error.message, error.status, error.details)
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
