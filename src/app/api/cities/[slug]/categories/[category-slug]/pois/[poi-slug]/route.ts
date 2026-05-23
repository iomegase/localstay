import { NextRequest, NextResponse } from 'next/server'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; 'category-slug': string; 'poi-slug': string }> },
) {
  const { slug, 'category-slug': categorySlug, 'poi-slug': poiSlug } = await params
  const poi = await getPoiDetail(slug, categorySlug, poiSlug)

  if (!poi) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'POI introuvable' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: poi })
}
