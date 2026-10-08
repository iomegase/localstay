type BlockMedia = { icon: string; photo_url: string | null; video_url: string | null }

/**
 * Spec 096 AC-04-01 : un équipement lié à la bibliothèque affiche l'icône, la photo et la vidéo
 * actuelles de la bibliothèque ; un équipement historique non lié garde les siennes.
 */
export function resolveEquipmentMedia<T extends BlockMedia & { equipment_template?: BlockMedia | null }>(
  block: T,
): Omit<T, 'equipment_template'> {
  const { equipment_template: template, ...rest } = block
  return template ? { ...rest, icon: template.icon, photo_url: template.photo_url, video_url: template.video_url } : rest
}

/** Sélection Prisma des valeurs gérées par l'admin. */
export const EQUIPMENT_TEMPLATE_MEDIA_SELECT = { select: { icon: true, photo_url: true, video_url: true } } as const
