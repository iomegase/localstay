import { NextRequest, NextResponse } from 'next/server'
import { getPoiDetail } from '@/features/categories/queries/poi-detail'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; 'category-slug': string; 'poi-slug': string } },
) {
  const poi = await getPoiDetail(params.slug, params['category-slug'], params['poi-slug'])

  if (!poi) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'POI introuvable' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: poi })
}
