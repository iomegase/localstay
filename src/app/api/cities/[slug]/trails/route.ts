import { NextRequest, NextResponse } from 'next/server'
import { listPublishedTrails } from '@/features/trails-acquisition/queries/public-trails'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params
  const data = await listPublishedTrails(slug)
  return NextResponse.json({ data })
}
