import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import {
  EquipmentLibraryError,
  EquipmentTemplatePatchSchema,
  updateEquipmentTemplate,
} from '@/features/equipment-library/queries/library'

/** Spec 095 AC-03-02 : modifier, valider ou refuser un équipement de la bibliothèque. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = EquipmentTemplatePatchSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Paramètres invalides', 400, parsed.error.flatten())

  const { id } = await params
  try {
    return NextResponse.json({ data: await updateEquipmentTemplate(id, parsed.data, session.user.id) })
  } catch (error) {
    if (error instanceof EquipmentLibraryError) {
      return apiError(error.code, error.code === 'NOT_FOUND' ? 'Équipement introuvable' : 'Un équipement porte déjà ce nom', error.status)
    }
    throw error
  }
}
