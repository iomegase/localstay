import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { deeplConfigFromEnv } from '@/shared/lib/deepl'
import { collectAllTranslationSources, prismaTranslationStore } from '@/features/content-translation/queries/store'
import { translateSources } from '@/features/content-translation/services/translate-sources'

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

/**
 * Spec 061 A1 AC-02-01 / AC-02-04 : traduit en anglais (DeepL) les contenus du
 * guide privé manquants ou modifiés, par lots, avec un plafond par exécution.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return apiError('UNAUTHORIZED', 'Accès réservé à la tâche planifiée', 401)
  }
  const sources = await collectAllTranslationSources()
  const result = await translateSources(sources, {
    config: deeplConfigFromEnv(),
    store: prismaTranslationStore,
    limit: 400,
  })
  return NextResponse.json(result)
}
