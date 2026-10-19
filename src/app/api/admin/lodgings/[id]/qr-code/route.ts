import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  createLodgingQrCode,
  deleteExistingLodgingQrCodes,
  getActiveLodgingQrCode,
} from '@/features/dashboard-owner/queries/qr-code'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'
import { lodgingQrUrl } from '@/features/qr-code/lib/lodging-qr-url'

type Params = { params: Promise<{ id: string }> }

const idSchema = z.string().uuid()

function notFound(message: string) {
  return NextResponse.json({ error: { code: 'NOT_FOUND', message, details: {} } }, { status: 404 })
}

function toData(row: { url: string; storage_url: string; created_at: Date }) {
  return { url: row.url, storage_url: row.storage_url, created_at: row.created_at }
}

async function findLodging(id: string) {
  if (!idSchema.safeParse(id).success) return null
  return prisma.lodging.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, city_id: true, city: { select: { slug: true } } },
  })
}

/** Spec 011 AC-03-01 : QR actif d'un logement, consulté depuis l'admin (super-admin). */
export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  const lodging = await findLodging(id)
  if (!lodging) return notFound('Logement introuvable')

  const qr = await getActiveLodgingQrCode(lodging.id)
  if (!qr) return notFound('Aucun QR code actif pour ce logement')

  return NextResponse.json({ data: toData(qr) })
}

/** Spec 011 AC-03-02 : génère ou régénère le QR d'un logement depuis l'admin (même contrat que l'Owner). */
export async function POST(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  const lodging = await findLodging(id)
  if (!lodging) return notFound('Logement introuvable')

  const guideUrl = lodgingQrUrl(lodging.city.slug, lodging.id)
  try {
    const buffer = await generateQrPng(guideUrl)
    const storageUrl = await uploadQrToStorage(lodging.city.slug, buffer, lodging.id)
    await deleteExistingLodgingQrCodes(lodging.id)
    const qr = await createLodgingQrCode(lodging.id, lodging.city_id, guideUrl, storageUrl)
    return NextResponse.json({ data: toData(qr) }, { status: 201 })
  } catch (cause) {
    console.error(`[qr-code] admin generation failed for lodging ${lodging.id}:`, cause)
    return NextResponse.json(
      {
        error: {
          code: 'QR_GENERATION_FAILED',
          message: "Le QR code n'a pas pu être généré. Veuillez réessayer.",
          details: {},
        },
      },
      { status: 500 },
    )
  }
}
