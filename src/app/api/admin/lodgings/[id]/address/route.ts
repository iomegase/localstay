import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { saveLodgingAddressAsAdmin } from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'
import { invalidAddressResponseBody, LodgingAddressSchema } from '@/features/guide-customization/lib/address-schema'

export const runtime = 'nodejs'

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message, details: {} } }, { status })
}

/** Spec 080 AC-03-03 : l'admin saisit l'adresse privée d'un logement (page Logement admin). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) return errorResponse('NOT_FOUND', 'Logement introuvable', 404)
  const parsed = LodgingAddressSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json(invalidAddressResponseBody(parsed.error), { status: 400 })

  try {
    return NextResponse.json(await saveLodgingAddressAsAdmin(id, parsed.data), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const code = error instanceof GuideCustomizationError ? error.code : 'INTERNAL_ERROR'
    if (code === 'NOT_FOUND') return errorResponse('NOT_FOUND', 'Logement introuvable', 404)
    console.error('[admin-lodging-address]', { code })
    return errorResponse('INTERNAL_ERROR', 'L’adresse n’a pas pu être enregistrée.', 500)
  }
}
