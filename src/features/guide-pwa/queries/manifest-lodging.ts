import { prisma } from '@/shared/lib/prisma'

/** Logement publiable dans un manifest (actif, non supprimé). */
export async function findManifestLodging(lodgingId: string): Promise<{ id: string; name: string } | null> {
  return prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: { id: true, name: true },
  })
}
