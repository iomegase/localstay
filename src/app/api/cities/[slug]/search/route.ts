import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchGuide } from '@/features/city-guide/queries/cities'

const querySchema = z.object({ q: z.string().trim().min(2) })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const parsed = querySchema.safeParse({ q: req.nextUrl.searchParams.get('q') ?? '' })
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'QUERY_TOO_SHORT', message: 'Le paramètre q doit contenir au moins 2 caractères.' } },
      { status: 400 },
    )
  }

  const { slug } = await params
  const data = await searchGuide(slug, parsed.data.q)
  return NextResponse.json({ data })
}
