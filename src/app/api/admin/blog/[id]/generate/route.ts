import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { generateBlogDraft } from '@/features/blog/queries/admin-blog'
import { BlogGenerateSchema } from '@/features/blog/schemas'

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = BlogGenerateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  try {
    const { id } = await context.params
    const draft = await generateBlogDraft(id, parsed.data, session.user.id)
    return NextResponse.json(draft)
  } catch (error) {
    if (
      error instanceof Error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      const apiLikeError = error as unknown as Error & {
        code?: string
        status: number
        details?: Record<string, unknown>
      }
      return apiError(
        apiLikeError.code ?? apiLikeError.message,
        apiLikeError.message,
        apiLikeError.status,
        apiLikeError.details ?? {},
      )
    }
    return apiError('GEMINI_UNAVAILABLE', 'Gemini indisponible', 503)
  }
}
