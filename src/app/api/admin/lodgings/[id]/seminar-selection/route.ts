import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { setSeminarSelection } from '@/features/lodging-showcase/queries/seminar-lodgings'

const ParamsSchema = z.object({ id: z.string().uuid() })
const SelectionSchema = z.object({ seminar_selected: z.boolean() }).strict()

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionAdmin({ unavailableAccountStatus: 403 })
  if (!session.user) return session.error

  const parsedParams = ParamsSchema.safeParse(await params)
  const parsedBody = SelectionSchema.safeParse(await request.json().catch(() => null))
  if (!parsedParams.success || !parsedBody.success) {
    return apiError('VALIDATION_ERROR', 'Sélection invalide.', 400)
  }

  try {
    const lodging = await setSeminarSelection(parsedParams.data.id, parsedBody.data.seminar_selected)
    if (!lodging) return apiError('LODGING_NOT_FOUND', 'Logement introuvable.', 404)
    return NextResponse.json(lodging)
  } catch {
    return apiError('SEMINAR_SELECTION_FAILED', 'Impossible d’enregistrer la sélection.', 500)
  }
}
