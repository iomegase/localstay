import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'
import { getSessionAdmin } from '@/features/merchant/lib/session'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // QR ville = promotion de l'app : réservé au super-admin (session, rôle 'admin').
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { slug } = await params
  const city = await prisma.city.findFirst({
    where: { slug: slug, is_active: true, deleted_at: null },
    select: { id: true, slug: true },
  })
  if (!city) {
    return NextResponse.json({ error: { code: 'CITY_NOT_FOUND' } }, { status: 404 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const guideUrl = `${baseUrl}/guide/${slug}`

  const buffer = await generateQrPng(guideUrl)
  const storageUrl = await uploadQrToStorage(city.slug, buffer)
  const result = await upsertQrCode(city.id, city.slug, guideUrl, storageUrl)

  return NextResponse.json({ data: result })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { slug } = await params
  const result = await getQrCode(slug)
  if (!result) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  return NextResponse.json({ data: result })
}
