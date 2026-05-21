import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchCities } from '@/features/city-guide/queries/cities'

const querySchema = z.object({
  q: z.string().min(3),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({ q: searchParams.get('q') ?? '' })

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'QUERY_TOO_SHORT',
          message: 'Le paramètre q doit contenir au moins 3 caractères.',
        },
      },
      { status: 400 }
    )
  }

  const results = await searchCities(parsed.data.q)
  return NextResponse.json({ data: results })
}
