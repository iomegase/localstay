import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import {
  createEquipmentTemplate,
  EquipmentLibraryError,
  EquipmentTemplateCreateSchema,
} from '@/features/equipment-library/queries/library'

/** Spec 096 AC-01-01 : l'admin crée un équipement, directement validé. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = EquipmentTemplateCreateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Paramètres invalides', 400, parsed.error.flatten())

  try {
    return NextResponse.json({ data: await createEquipmentTemplate(parsed.data, session.user.id) }, { status: 201 })
  } catch (error) {
    if (error instanceof EquipmentLibraryError) return apiError(error.code, 'Un équipement porte déjà ce nom', error.status)
    throw error
  }
}
