import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { runGoogleReviewsSync, syncErrorResponse } from '@/features/google-reviews/services/run-sync'

export const maxDuration = 60

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

/** Spec 062 AC-01-06 : synchronisation quotidienne des avis Google Business Profile. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) return apiError('UNAUTHORIZED', 'Accès réservé à la tâche planifiée', 401)
  try {
    return NextResponse.json(await runGoogleReviewsSync())
  } catch (error) {
    return syncErrorResponse(error)
  }
}
