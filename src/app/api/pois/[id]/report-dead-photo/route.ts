import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { belongsToPoi } from '@/features/poi-photos/lib/liveness'
import { checkPhotoUrl } from '@/features/poi-photos/services/check-photo-url'
import { healPoiPhotos } from '@/features/poi-photos/services/heal-poi-photos'

type RouteContext = { params: Promise<{ id: string }> }

const BodySchema = z.object({ url: z.string().url() })

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const poi = await prisma.pointOfInterest.findUnique({ where: { id }, select: { photos: true } })
  if (!poi || !belongsToPoi(poi.photos, parsed.data.url)) {
    return NextResponse.json({ data: { acted: false } })
  }

  // Anti-abus : on ne retire que si NOTRE serveur confirme aussi que l'URL est morte.
  if ((await checkPhotoUrl(parsed.data.url)) === 'alive') {
    return NextResponse.json({ data: { acted: false } })
  }

  const result = await healPoiPhotos({ poiId: id, deadUrls: [parsed.data.url] })
  return NextResponse.json({ data: { acted: true, removed: result.removed, status: result.status } })
}
