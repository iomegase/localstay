import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { reinstateReviewMemory } from '@/features/poi-acquisition/queries/review-memory'

// Spec 071 AC-03-03 : réintégrer un lieu exclu ou rejeté.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return validationError({ id: ['Identifiant invalide'] })

  try {
    await reinstateReviewMemory(id)
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
