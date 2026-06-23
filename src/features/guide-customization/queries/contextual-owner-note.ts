import { normalizeOwnerNote } from '@/features/guide-customization/lib/validation'
import { prisma } from '@/shared/lib/prisma'

export async function getContextualOwnerNote(
  lodgingId: string,
  poiId: string,
): Promise<string | null> {
  const recommendation = await prisma.lodgingFeaturedPoi.findFirst({
    where: {
      lodging_id: lodgingId,
      poi_id: poiId,
      deleted_at: null,
      lodging: { is_active: true, deleted_at: null },
      poi: { is_active: true, deleted_at: null },
    },
    select: { owner_note: true },
  })

  return normalizeOwnerNote(recommendation?.owner_note)
}
