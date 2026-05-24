import { NextRequest, NextResponse } from 'next/server'
import { getCityGuide } from '@/features/city-guide/queries/cities'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const lodgingId = req.nextUrl.searchParams.get('lodging') ?? undefined
  const guide = await getCityGuide(slug, { lodgingId })

  if (!guide) {
    return NextResponse.json(
      {
        error: {
          code: 'CITY_NOT_FOUND',
          message: 'Aucune ville trouvée pour ce slug.',
        },
      },
      { status: 404 }
    )
  }

  // BR-01: valid city always returns 200, even with empty categories (AC-03-04)
  return NextResponse.json({ data: guide })
}
