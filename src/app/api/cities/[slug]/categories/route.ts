import { NextRequest, NextResponse } from 'next/server'
import { getCategoriesForCity } from '@/features/categories/queries/categories'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const categories = await getCategoriesForCity(slug)
  if (categories === null) {
    return NextResponse.json(
      { error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } },
      { status: 404 },
    )
  }
  return NextResponse.json({ data: categories })
}
