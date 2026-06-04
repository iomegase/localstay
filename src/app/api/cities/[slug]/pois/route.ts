import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllPoiCards } from '@/features/categories/queries/all-poi-cards'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['distance', 'rating']).default('distance'),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const parsed = querySchema.safeParse({
    page: sp.get('page') ?? undefined,
    limit: sp.get('limit') ?? undefined,
    sort: sp.get('sort') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID_QUERY', message: 'Paramètres invalides' } }, { status: 400 })
  }

  const { slug } = await params
  const result = await getAllPoiCards(slug, parsed.data)
  if (!result) {
    return NextResponse.json({ error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } }, { status: 404 })
  }

  return NextResponse.json({ data: result.items, meta: result.meta })
}
