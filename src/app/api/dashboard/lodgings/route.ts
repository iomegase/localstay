import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getLodgingsForOwner } from '@/features/dashboard-owner/queries/lodgings'
import { CreateLodgingSchema } from '@/features/dashboard-owner/schemas'
import { prisma } from '@/shared/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const lodgings = await getLodgingsForOwner(owner.id)
  return NextResponse.json({ lodgings })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Corps de requête invalide' } },
      { status: 400 },
    )
  }

  const parsed = CreateLodgingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const city = await prisma.city.findFirst({ where: { id: parsed.data.city_id } })
  if (!city) {
    return NextResponse.json(
      { error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } },
      { status: 404 },
    )
  }

  const lodging = await prisma.lodging.create({
    data: {
      name: parsed.data.name,
      owner_id: owner.id,
      city_id: parsed.data.city_id,
    },
    include: { city: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: lodging.id,
      name: lodging.name,
      city_id: lodging.city_id,
      city_name: lodging.city.name,
      is_active: lodging.is_active,
      qr_scan_count: 0,
      created_at: lodging.created_at,
    },
    { status: 201 },
  )
}
