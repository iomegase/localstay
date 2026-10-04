import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { runGoogleReviewsSync, syncErrorResponse } from '@/features/google-reviews/services/run-sync'

export const maxDuration = 60

/** Spec 062 AC-02-05 : « Synchroniser maintenant » depuis l'admin. */
export async function POST(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  try {
    return NextResponse.json(await runGoogleReviewsSync())
  } catch (error) {
    return syncErrorResponse(error)
  }
}
