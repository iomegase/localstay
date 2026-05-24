import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPoiCards } from '@/features/categories/queries/poi-cards'

const querySchema = z.object({
  subcategory: z.string().min(1).optional(),
  sort: z.enum(['distance', 'rating']).default('distance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lodging: z.string().min(1).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; 'category-slug': string }> },
) {
  const { searchParams } = new URL(req.url)
  const parsedQuery = querySchema.safeParse({
    subcategory: searchParams.get('subcategory') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    lodging: searchParams.get('lodging') ?? undefined,
  })

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_QUERY',
          message: 'Paramètres de requête invalides',
          details: parsedQuery.error.flatten(),
        },
      },
      { status: 400 },
    )
  }

  const { subcategory: subcategorySlug, sort, page, limit, lodging: lodgingId } = parsedQuery.data

  const { slug, 'category-slug': categorySlug } = await params
  const pois = await getPoiCards(slug, categorySlug, { subcategorySlug, sort, page, limit, lodgingId })

  if (pois === null) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Ville ou catégorie introuvable' } },
      { status: 404 },
    )
  }

  const { meta, ...data } = pois
  return NextResponse.json({ data, meta })
}
