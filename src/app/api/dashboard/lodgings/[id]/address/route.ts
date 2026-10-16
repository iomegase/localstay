import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { saveLodgingAddress } from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'

export const runtime = 'nodejs'

const part = (max: number) => z.string().trim().max(max).nullable()

/** Spec 080 AC-03-02 : adresse privée saisie dans la section Caractéristiques de la page Logement. */
const addressSchema = z.object({
  address_number: part(10),
  address_street: part(200),
  address_postal_code: z.string().trim().regex(/^(\d{5})?$/, 'Le code postal doit contenir 5 chiffres.').nullable(),
  address_city: part(120),
}).strict()

function errorResponse(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details: details ?? {} } }, { status })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const parsed = addressSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return errorResponse('INVALID_BODY', 'Adresse invalide', 400, {
      issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })),
    })
  }

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
