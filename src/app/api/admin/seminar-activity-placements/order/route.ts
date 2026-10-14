import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { SeminarPlacementOrderSchema } from '@/features/seminar-activities/lib/schemas'
import { readJsonBody, seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { reorderSeminarSurface } from '@/features/seminar-activities/queries/admin'

/** Spec 097 AC-08 / BR-10 : ordre des cartes d'une surface. */
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = SeminarPlacementOrderSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) return validationErrorResponse(parsed.error)

  try {
    await reorderSeminarSurface(parsed.data)
    return NextResponse.json({ surface_key: parsed.data.surface_key, activity_ids: parsed.data.activity_ids })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
