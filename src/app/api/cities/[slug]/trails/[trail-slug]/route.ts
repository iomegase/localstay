import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { getPublishedTrail } from '@/features/trails-acquisition/queries/public-trails'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; 'trail-slug': string }> },
): Promise<NextResponse> {
  const { slug, 'trail-slug': trailSlug } = await params
  const data = await getPublishedTrail(slug, trailSlug)
  if (!data) return apiError('NOT_FOUND', 'Ressource introuvable', 404)
  return NextResponse.json({ data })
}
