import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { LodgingRewriteRequestSchema } from '@/features/lodging-showcase/schemas'
import {
  getOwnerRewriteContext,
  saveGeneratedRewrite,
} from '@/features/lodging-showcase/queries/owner-public-profile'
import { generateLodgingRewrite } from '@/features/lodging-showcase/services/gemini-rewrite'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const body = await req.json().catch(() => null)
  const parsed = LodgingRewriteRequestSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Parametre manquant ou invalide', 400, parsed.error.flatten())
  }

  const { id } = await params
  const context = await getOwnerRewriteContext(session.owner.id, id)

  if (!context) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  try {
    const rewrite = await generateLodgingRewrite({
      sourceText: parsed.data.source_description_text,
      facts: context,
    })

    const saved = await saveGeneratedRewrite(session.owner.id, id, {
      sourceDescriptionText: parsed.data.source_description_text,
      rewriteSuggestion: rewrite,
    })

    if (!saved) {
      return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
    }

    return NextResponse.json(saved)
  } catch {
    return apiError('GEMINI_REWRITE_UNAVAILABLE', 'Reecriture indisponible', 503)
  }
}
