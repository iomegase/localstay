import { equipmentTitleKey } from './title-key'

const RECYCLING_ICON = 'recycle'

type Block = { id: string; lodging_id: string; title: string; icon: string; body: string | null; photo_url: string | null; video_url: string | null }
type Template = { id: string; title_key: string; photo_url: string | null; video_url: string | null }

export type EquipmentLinkPlan = {
  /** Équipements de bibliothèque à créer « à valider ». */
  create: Array<{ title: string; title_key: string; icon: string; body: string | null; source_lodging_id: string; photo_url: string | null; video_url: string | null }>
  /** Photo / vidéo à donner aux équipements de bibliothèque qui n'en ont pas. */
  media: Array<{ id: string; photo_url: string | null; video_url: string | null }>
  /** Équipements de logement à rattacher (par clé de nom). */
  links: Array<{ blockId: string; titleKey: string }>
}

/**
 * Spec 096 AC-05-01 : rattache chaque équipement de logement non lié à l'équipement de bibliothèque
 * de même nom (créé s'il manque) ; un équipement de bibliothèque sans photo (ou sans vidéo) reçoit
 * la première du logement. Le tri des déchets et les noms vides sont ignorés.
 */
export function planEquipmentLinks(blocks: Block[], templates: Template[]): EquipmentLinkPlan {
  const plan: EquipmentLinkPlan = { create: [], media: [], links: [] }
  const existing = new Map(templates.map(template => [template.title_key, template]))
  const created = new Map<string, EquipmentLinkPlan['create'][number]>()
  const media = new Map<string, { id: string; photo_url: string | null; video_url: string | null }>()

  for (const block of blocks) {
    const key = equipmentTitleKey(block.title)
    if (!key || block.icon === RECYCLING_ICON) continue
    plan.links.push({ blockId: block.id, titleKey: key })

    const template = existing.get(key)
    if (template) {
      const next = media.get(template.id) ?? { id: template.id, photo_url: template.photo_url, video_url: template.video_url }
      next.photo_url ??= block.photo_url
      next.video_url ??= block.video_url
      media.set(template.id, next)
      continue
    }
    const draft = created.get(key)
    if (draft) {
      draft.photo_url ??= block.photo_url
      draft.video_url ??= block.video_url
      continue
    }
    const fresh = {
      title: block.title.trim(), title_key: key, icon: block.icon, body: block.body?.trim() || null,
      source_lodging_id: block.lodging_id, photo_url: block.photo_url, video_url: block.video_url,
    }
    created.set(key, fresh)
    plan.create.push(fresh)
  }

  for (const template of templates) {
    const next = media.get(template.id)
    if (next && (next.photo_url !== template.photo_url || next.video_url !== template.video_url)) plan.media.push(next)
  }
  return plan
}
