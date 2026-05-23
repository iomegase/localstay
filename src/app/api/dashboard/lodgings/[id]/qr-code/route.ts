import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { prisma } from '@/shared/lib/prisma'
import {
  getActiveLodgingQrCode,
  archiveExistingQrCodes,
  createLodgingQrCode,
} from '@/features/dashboard-owner/queries/qr-code'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'

type Params = { params: Promise<{ id: string }> }

function toResponse(row: {
  id: string
  lodging_id: string
  city_id: string
  url: string
  storage_url: string
  created_at: Date
}) {
  return {
    id: row.id,
    lodging_id: row.lodging_id,
    city_id: row.city_id,
    url: row.url,
    storage_url: row.storage_url,
    created_at: row.created_at,
  }
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const { id } = await params

  const lodging = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null },
    include: { city: { select: { slug: true } } },
  })
  if (!lodging) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Logement introuvable' } },
      { status: 404 },
    )
  }

  const qr = await getActiveLodgingQrCode(id)
  if (!qr) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Aucun QR code actif pour ce logement' } },
      { status: 404 },
    )
  }

  return NextResponse.json(toResponse(qr))
}

export async function POST(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const { id } = await params

  const lodging = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null },
    include: { city: { select: { slug: true } } },
  })
  if (!lodging) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Logement introuvable' } },
      { status: 404 },
    )
  }

  const domain = process.env.NEXT_PUBLIC_APP_URL ?? 'https://staylocal.app'
  const guideUrl = `${domain}/guide/${lodging.city.slug}?lodging=${id}`

  const buffer = await generateQrPng(guideUrl)
  const storageUrl = await uploadQrToStorage(lodging.city.slug, buffer, id)

  await archiveExistingQrCodes(id)
  const qr = await createLodgingQrCode(id, lodging.city_id, guideUrl, storageUrl)

  return NextResponse.json(toResponse(qr), { status: 201 })
}
