import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { saveLodgingAddress } from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'
import { invalidAddressResponseBody, LodgingAddressSchema } from '@/features/guide-customization/lib/address-schema'

export const runtime = 'nodejs'

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: {} } }, { status })
}

/** Spec 080 AC-03-02 : adresse privée saisie dans la section Caractéristiques (Owner). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const parsed = LodgingAddressSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(invalidAddressResponseBody(parsed.error), { status: 400 })

  const { id } = await params
  try {
    return NextResponse.json(await saveLodgingAddress(session.owner.id, id, parsed.data))
  } catch (error) {
    const code = error instanceof GuideCustomizationError ? error.code : 'INTERNAL_ERROR'
    if (code === 'FORBIDDEN') return errorResponse('FORBIDDEN', 'Acces interdit', 403)
    if (code === 'NOT_FOUND') return errorResponse('NOT_FOUND', 'Logement introuvable', 404)
    console.error('[lodging-address]', { code })
    return errorResponse('INTERNAL_ERROR', 'L’adresse n’a pas pu être enregistrée.', 500)
  }
}
