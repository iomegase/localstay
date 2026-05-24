import { prisma } from '@/shared/lib/prisma'

export interface LodgingItem {
  id: string
  name: string
  city_id: string
  city_name: string
  is_active: boolean
  qr_code_status: 'generated' | 'missing'
  qr_scan_count: number
  created_at: Date
}

export async function getLodgingsForOwner(ownerId: string): Promise<LodgingItem[]> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    include: {
      city: { select: { name: true } },
      analytics: { where: { event_type: 'qr_scan' } },
      qr_codes: {
        where: { is_active: true, deleted_at: null },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { created_at: 'desc' },
  })

  return lodgings.map(l => ({
    id: l.id,
    name: l.name,
    city_id: l.city_id,
    city_name: l.city.name,
    is_active: l.is_active,
    qr_code_status: l.qr_codes.length > 0 ? 'generated' : 'missing',
    qr_scan_count: l.analytics.length,
    created_at: l.created_at,
  }))
}
