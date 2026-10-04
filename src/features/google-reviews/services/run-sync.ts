import { revalidatePath } from 'next/cache'
import type { NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { fetchAllGoogleReviews, GoogleBusinessError, googleBusinessConfigFromEnv } from '@/shared/lib/google-business'
import { prismaGoogleReviewStore } from '../queries/store'
import type { SyncSummary } from '../types'
import { syncGoogleReviews } from './sync'

export async function runGoogleReviewsSync(): Promise<SyncSummary> {
  const config = googleBusinessConfigFromEnv()
  if (!config) {
    throw new GoogleBusinessError('GOOGLE_NOT_CONFIGURED', 'Connexion Google Business Profile non configurée.')
  }
  const summary = await syncGoogleReviews({
    fetchReviews: () => fetchAllGoogleReviews(config),
    store: prismaGoogleReviewStore,
  })
  // Les avis publiés s'affichent sur les landings conciergerie.
  if (summary.updated > 0 || summary.deleted > 0) revalidatePath('/conciergerie/[city-slug]', 'page')
  return summary
}

export function syncErrorResponse(error: unknown): NextResponse {
  if (error instanceof GoogleBusinessError) {
    return apiError(error.code, error.message, error.code === 'GOOGLE_NOT_CONFIGURED' ? 503 : 502)
  }
  return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
}
