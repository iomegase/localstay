import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { UpdateLodgingSchema } from '@/features/dashboard-owner/schemas'
import { prisma } from '@/shared/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Corps de requête invalide' } },
      { status: 400 },
    )
  }

  const parsed = UpdateLodgingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const existing = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null },
  })

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Logement introuvable' } },
      { status: 404 },
    )
  }

  if (parsed.data.city_id !== undefined) {
    const city = await prisma.city.findFirst({
      where: { id: parsed.data.city_id, deleted_at: null, is_active: true },
    })

    if (!city) {
      return NextResponse.json(
        { error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } },
        { status: 404 },
      )
    }
  }

  const updated = await prisma.lodging.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.city_id !== undefined && { city_id: parsed.data.city_id }),
      ...(parsed.data.is_active === false && {
        is_active: false,
        deleted_at: new Date(),
      }),
    },
    include: {
      city: { select: { name: true } },
      analytics: { where: { event_type: 'qr_scan' } },
      qr_codes: {
        where: { is_active: true, deleted_at: null },
        select: { id: true },
        take: 1,
      },
    },
  })

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    city_id: updated.city_id,
    city_name: updated.city.name,
    is_active: updated.is_active,
    qr_code_status: updated.qr_codes.length > 0 ? 'generated' : 'missing',
    qr_scan_count: updated.analytics.length,
    created_at: updated.created_at,
  })
}
