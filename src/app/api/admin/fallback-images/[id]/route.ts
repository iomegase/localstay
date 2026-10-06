import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { removeFallbackImage } from '@/features/fallback-images/queries/library'
import { responseFromFallbackImageError } from '@/features/fallback-images/lib/api'

// Spec 070 AC-01-04 : retrait d'une image (soft delete).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return validationError({ id: ['Identifiant invalide'] })

  try {
    await removeFallbackImage(id)
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return responseFromFallbackImageError(error)
  }
}
