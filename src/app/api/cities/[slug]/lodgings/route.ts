import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError } from '@/features/merchant/lib/responses'
import { listPublishedLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'

const listQuerySchema = z.object({
  guests: z.coerce.number().int().min(1).max(30).optional(),
  amenities: z.string().optional().transform(value => value ? value.split(',').filter(Boolean) : []),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const parsed = listQuerySchema.safeParse({
    guests: sp.get('guests') ?? undefined,
    amenities: sp.get('amenities') ?? undefined,
    page: sp.get('page') ?? undefined,
    limit: sp.get('limit') ?? undefined,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  const { slug } = await params
  const result = await listPublishedLodgingsForCity(slug, parsed.data)
  if (!result) {
    return apiError('NOT_FOUND', 'Ville introuvable', 404)
  }

  return NextResponse.json(result)
}
