import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { LandingReviewInputSchema } from '@/features/local-seo/schemas/landing-reviews'
import { createLandingReview, listAdminLandingPages } from '@/features/local-seo/queries/landing-reviews'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  return NextResponse.json({ items: await listAdminLandingPages() })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const parsed = LandingReviewInputSchema.safeParse(await request.json())
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  const review = await createLandingReview(parsed.data)
  revalidatePath(`/conciergerie/${review.destination_slug}`, 'page')
  return NextResponse.json(review, { status: 201 })
}
