import { prisma } from '@/shared/lib/prisma'

export async function listEvents(params: { communeInsee?: string; limit?: number } = {}) {
  return prisma.event.findMany({
    where: {
      deleted_at: null,
      ...(params.communeInsee ? { commune_insee: params.communeInsee } : {}),
    },
    orderBy: { start_date: 'asc' },
    take: params.limit ?? 200,
    select: {
      id: true,
      title: true,
      commune_name: true,
      commune_insee: true,
      start_date: true,
      end_date: true,
      event_types: true,
      source: true,
    },
  })
}
