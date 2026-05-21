import { NextRequest, NextResponse } from 'next/server'
import { getCategoryDetail } from '@/features/categories/queries/categories'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; 'category-slug': string } },
) {
  const detail = await getCategoryDetail(params.slug, params['category-slug'])
  if (!detail) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Catégorie introuvable' } },
      { status: 404 },
    )
  }
  return NextResponse.json({ data: detail })
}
