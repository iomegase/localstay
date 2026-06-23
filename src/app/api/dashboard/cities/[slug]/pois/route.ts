import { NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const { slug } = await params
  const city = await prisma.city.findFirst({
    where: { slug, deleted_at: null, is_active: true },
    select: { id: true, name: true },
  })
  if (!city) {
    return NextResponse.json({ error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } }, { status: 404 })
  }

  const pois = await prisma.pointOfInterest.findMany({
    where: { city_id: city.id, deleted_at: null, is_active: true, geocode_status: { not: 'rejected' } },
    orderBy: [{ category: { sort_order: 'asc' } }, { name: 'asc' }],
    select: { id: true, name: true, category: { select: { slug: true, name: true } } },
  })

  return NextResponse.json({
    data: {
      city: { slug, name: city.name },
      pois: pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        category_slug: poi.category.slug,
        category_name: poi.category.name,
      })),
    },
  })
}
