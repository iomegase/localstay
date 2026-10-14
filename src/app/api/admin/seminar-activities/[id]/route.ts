import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { SeminarActivityPatchSchema, UuidSchema } from '@/features/seminar-activities/lib/schemas'
import { readJsonBody, seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { deleteSeminarActivity, updateSeminarActivity } from '@/features/seminar-activities/queries/admin'

type Context = { params: Promise<{ id: string }> }

/** Spec 097 AC-01 / AC-04 : mise à jour partielle et publication. */
export async function PATCH(req: NextRequest, { params }: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const id = UuidSchema.safeParse((await params).id)
  if (!id.success) return validationErrorResponse(id.error)
  const parsed = SeminarActivityPatchSchema.safeParse(await readJsonBody(req))
  if (!parsed.success) return validationErrorResponse(parsed.error)

  try {
    return NextResponse.json(await updateSeminarActivity(id.data, parsed.data))
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}

/** Spec 097 AC-01 / BR-11 : suppression douce. */
export async function DELETE(_req: NextRequest, { params }: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const id = UuidSchema.safeParse((await params).id)
  if (!id.success) return validationErrorResponse(id.error)

  try {
    await deleteSeminarActivity(id.data)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
