import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'
import { getQrCode, upsertQrCode } from '@/features/qr-code/queries/qr-code'

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${process.env.ADMIN_SECRET}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

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
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  const { slug } = await params
  const result = await getQrCode(slug)
  if (!result) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })
  }

  return NextResponse.json({ data: result })
}
