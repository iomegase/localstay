import { NextRequest, NextResponse } from 'next/server'
import { getPoiCards } from '@/features/categories/queries/poi-cards'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; 'category-slug': string } },
) {
  const { searchParams } = new URL(req.url)
  const subcategorySlug = searchParams.get('subcategory') ?? undefined
  const sort = searchParams.get('sort') === 'rating' ? 'rating' : 'distance'

  const pois = await getPoiCards(params.slug, params['category-slug'], { subcategorySlug, sort })

  if (pois === null) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Ville ou catégorie introuvable' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ data: pois })
}
