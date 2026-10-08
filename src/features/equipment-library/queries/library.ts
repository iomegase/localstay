import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { PRACTICAL_BLOCK_ICONS } from '@/features/guide-customization/lib/practical-block-icons'
import { equipmentTitleKey } from '../lib/title-key'
import type { EquipmentTemplate, EquipmentTemplateStatus } from '../types'

const SELECT = { id: true, title: true, icon: true, body: true, status: true, created_at: true } as const
const RECYCLING_ICON = 'recycle'

function toTemplate(row: { id: string; title: string; icon: string; body: string | null; status: string; created_at: Date }): EquipmentTemplate {
  return { ...row, status: row.status as EquipmentTemplateStatus, created_at: row.created_at.toISOString() }
}

type EquipmentTemplateDraft = { title: string; title_key: string; icon: string; body: string | null; source_lodging_id: string }

/**
 * Spec 095 AC-02-01 / AC-02-02 / AC-02-04 : équipements à proposer « à valider » (nom, icône, texte —
 * ni photo ni vidéo), un par nom ; les noms déjà connus (`knownKeys`) et le tri des déchets sont ignorés.
 */
export function planEquipmentTemplates(
  blocks: Array<{ lodgingId: string; title: string; icon: string; body: string | null }>,
  knownKeys: ReadonlySet<string> = new Set(),
): EquipmentTemplateDraft[] {
  const seen = new Set<string>(knownKeys)
  return blocks.flatMap(block => {
    const title = block.title.trim()
    const key = equipmentTitleKey(title)
    if (!key || block.icon === RECYCLING_ICON || seen.has(key)) return []
    seen.add(key)
    return [{ title, title_key: key, icon: block.icon, body: block.body?.trim() || null, source_lodging_id: block.lodgingId }]
  })
}

/** Spec 095 AC-02-01 / AC-02-02 : un nom connu n'est ni dupliqué ni écrasé (contrainte unique). */
export async function captureEquipmentTemplates(
  lodgingId: string,
  blocks: Array<{ title: string; icon: string; body: string | null }>,
): Promise<number> {
  const data = planEquipmentTemplates(blocks.map(block => ({ ...block, lodgingId })))
  if (data.length === 0) return 0
  const { count } = await prisma.equipmentTemplate.createMany({ data, skipDuplicates: true })
  return count
}

/** Spec 095 AC-04-01 / BR-01 : seuls les équipements validés sont proposés aux logements. */
export async function listApprovedEquipmentTemplates(): Promise<EquipmentTemplate[]> {
  const rows = await prisma.equipmentTemplate.findMany({
    where: { status: 'approved', deleted_at: null },
    orderBy: { title: 'asc' },
    select: SELECT,
  })
  return rows.map(toTemplate)
}

const STATUS_ORDER: Record<string, number> = { pending: 0, approved: 1, rejected: 2 }

/** Spec 095 AC-03-01 : à valider d'abord, puis validés, puis refusés. */
export async function listEquipmentTemplatesForAdmin(): Promise<EquipmentTemplate[]> {
  const rows = await prisma.equipmentTemplate.findMany({ where: { deleted_at: null }, select: SELECT })
  return rows
    .map(toTemplate)
    .sort((a, b) => STATUS_ORDER[a.status]! - STATUS_ORDER[b.status]! || a.title.localeCompare(b.title, 'fr'))
}

export const EquipmentTemplatePatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  icon: z.string().refine(icon => PRACTICAL_BLOCK_ICONS.some(item => item.slug === icon), 'Icône inconnue').optional(),
  body: z.union([z.string().trim().max(5000).transform(value => value || null), z.null()]).optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
}).strict()

export type EquipmentTemplatePatch = z.infer<typeof EquipmentTemplatePatchSchema>

export class EquipmentLibraryError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'TITLE_ALREADY_EXISTS', public readonly status: number) {
    super(code)
  }
}

/** Spec 095 AC-03-02 : modification, validation ou refus par l'admin. */
export async function updateEquipmentTemplate(id: string, input: EquipmentTemplatePatch, adminId: string): Promise<EquipmentTemplate> {
  const existing = await prisma.equipmentTemplate.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!existing) throw new EquipmentLibraryError('NOT_FOUND', 404)

  let titleKey: string | undefined
  if (input.title !== undefined) {
    titleKey = equipmentTitleKey(input.title)
    const clash = await prisma.equipmentTemplate.findFirst({ where: { title_key: titleKey, id: { not: id } }, select: { id: true } })
    if (clash) throw new EquipmentLibraryError('TITLE_ALREADY_EXISTS', 409)
  }

  const row = await prisma.equipmentTemplate.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title, title_key: titleKey } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.status !== undefined ? { status: input.status, reviewed_by: adminId, reviewed_at: new Date() } : {}),
    },
    select: SELECT,
  })
  return toTemplate(row)
}
