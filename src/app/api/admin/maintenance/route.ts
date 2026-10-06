import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { MAINTENANCE_MESSAGE_MAX } from '@/features/maintenance/lib/maintenance'
import { getMaintenanceState, setMaintenanceState } from '@/features/maintenance/queries/maintenance'

// Spec 087 : lecture / écriture du mode maintenance (admin).
const MaintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(MAINTENANCE_MESSAGE_MAX, `Le message doit faire ${MAINTENANCE_MESSAGE_MAX} caractères maximum.`).nullable(),
})

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  return NextResponse.json({ data: await getMaintenanceState() })
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await req.json().catch(() => null)
  if (body === null) return apiError('VALIDATION_ERROR', 'Corps de requête invalide', 400)
  const parsed = MaintenanceSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error.flatten())

  return NextResponse.json({ data: await setMaintenanceState(parsed.data, session.user.id) })
}
