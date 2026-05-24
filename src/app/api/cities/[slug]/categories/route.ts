import { NextRequest, NextResponse } from 'next/server'
import { getCategoriesForCity } from '@/features/categories/queries/categories'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const lodgingId = req.nextUrl.searchParams.get('lodging') ?? undefined
  const categories = await getCategoriesForCity(slug, { lodgingId })
  if (categories === null) {
    return NextResponse.json(
      { error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } },
      { status: 404 },
    )
  }
  return NextResponse.json({ data: categories })
}
