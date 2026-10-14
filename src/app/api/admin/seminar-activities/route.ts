import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { SeminarActivityCreateSchema } from '@/features/seminar-activities/lib/schemas'
import { readJsonBody, seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { createSeminarActivity, listSeminarActivitiesForAdmin } from '@/features/seminar-activities/queries/admin'

/** Spec 097 AC-01 : catalogue admin. */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  try {
    return NextResponse.json({ items: await listSeminarActivitiesForAdmin() })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}

/** Spec 097 AC-01 : création d'une activité non publiée. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = SeminarActivityCreateSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) return validationErrorResponse(parsed.error)

  try {
    return NextResponse.json(await createSeminarActivity(parsed.data), { status: 201 })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
