import { prisma } from '@/shared/lib/prisma'
import { HUB_SURFACE_KEY, type PublicSeminarActivity } from '../types'

/**
 * Spec 097 BR-02 / BR-04 / BR-10 : cartes publiées, illustrées et attribuées à la
 * surface (null = page globale), dans l'ordre de la surface. Aucun prix ni prestataire.
 * La publication de la landing reste vérifiée par la page (spec 048).
 */
export async function listPublicSeminarActivities(destinationId: string | null): Promise<PublicSeminarActivity[]> {
  const rows = await prisma.seminarActivityPlacement.findMany({
    where: {
      surface_key: destinationId ?? HUB_SURFACE_KEY,
      deleted_at: null,
      activity: { deleted_at: null, is_published: true, image_url: { not: null } },
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: {
      activity: {
        select: { id: true, title: true, category: true, description: true, season_label: true, level_label: true, image_url: true },
      },
    },
  })
  return rows.flatMap(({ activity }) => (activity.image_url ? [{ ...activity, image_url: activity.image_url }] : []))
}
