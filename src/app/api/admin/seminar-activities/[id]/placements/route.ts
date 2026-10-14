import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { SeminarActivityPlacementsSchema, UuidSchema } from '@/features/seminar-activities/lib/schemas'
import { readJsonBody, seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { setSeminarActivityPlacements } from '@/features/seminar-activities/queries/admin'

/** Spec 097 AC-07 / BR-05 : surfaces où l'activité est diffusée. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const id = UuidSchema.safeParse((await params).id)
  if (!id.success) return validationErrorResponse(id.error)
  const parsed = SeminarActivityPlacementsSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) return validationErrorResponse(parsed.error)

  try {
    return NextResponse.json(await setSeminarActivityPlacements(id.data, parsed.data))
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
