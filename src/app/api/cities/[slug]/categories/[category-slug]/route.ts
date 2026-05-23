import { NextRequest, NextResponse } from 'next/server'
import { getCategoryDetail } from '@/features/categories/queries/categories'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; 'category-slug': string }> },
) {
  const { slug, 'category-slug': categorySlug } = await params
  const detail = await getCategoryDetail(slug, categorySlug)
  if (!detail) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Catégorie introuvable' } },
      { status: 404 },
    )
  }
  return NextResponse.json({ data: detail })
}
