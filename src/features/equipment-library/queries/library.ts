import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { PRACTICAL_BLOCK_ICONS } from '@/features/guide-customization/lib/practical-block-icons'
import { extractYouTubeId } from '@/shared/lib/youtube'
import { equipmentTitleKey } from '../lib/title-key'
import type { EquipmentTemplate, EquipmentTemplateStatus } from '../types'

const SELECT = { id: true, title: true, icon: true, body: true, photo_url: true, video_url: true, status: true, created_at: true } as const

type TemplateRow = { id: string; title: string; icon: string; body: string | null; photo_url: string | null; video_url: string | null; status: string; created_at: Date }

function toTemplate(row: TemplateRow): EquipmentTemplate {
  return { ...row, status: row.status as EquipmentTemplateStatus, created_at: row.created_at.toISOString() }
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

const titleSchema = z.string().trim().min(1).max(120)
const iconSchema = z.string().refine(icon => PRACTICAL_BLOCK_ICONS.some(item => item.slug === icon), 'Icône inconnue')
const bodySchema = z.union([z.string().trim().max(5000).transform(value => value || null), z.null()])
// Spec 096 : photo et vidéo gérées par l'admin (chaîne vide ou null pour retirer).
const photoSchema = z.union([z.string().trim().url(), z.literal('').transform(() => null), z.null()])
const videoSchema = z.union([
  z.string().trim().refine(value => extractYouTubeId(value) !== null, 'Lien YouTube invalide'),
  z.literal('').transform(() => null),
  z.null(),
])

export const EquipmentTemplatePatchSchema = z.object({
  title: titleSchema.optional(),
  icon: iconSchema.optional(),
  body: bodySchema.optional(),
  photo_url: photoSchema.optional(),
  video_url: videoSchema.optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
}).strict()

export const EquipmentTemplateCreateSchema = z.object({
  title: titleSchema,
  icon: iconSchema,
  body: bodySchema.optional(),
  photo_url: photoSchema.optional(),
  video_url: videoSchema.optional(),
}).strict()

export type EquipmentTemplateCreate = z.infer<typeof EquipmentTemplateCreateSchema>
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
      ...(input.photo_url !== undefined ? { photo_url: input.photo_url } : {}),
      ...(input.video_url !== undefined ? { video_url: input.video_url } : {}),
      ...(input.status !== undefined ? { status: input.status, reviewed_by: adminId, reviewed_at: new Date() } : {}),
    },
    select: SELECT,
  })
  return toTemplate(row)
}

/** Spec 096 AC-01-01 : un équipement créé par l'admin est directement validé. */
export async function createEquipmentTemplate(input: EquipmentTemplateCreate, adminId: string): Promise<EquipmentTemplate> {
  const titleKey = equipmentTitleKey(input.title)
  const clash = await prisma.equipmentTemplate.findFirst({ where: { title_key: titleKey }, select: { id: true } })
  if (clash) throw new EquipmentLibraryError('TITLE_ALREADY_EXISTS', 409)

  const row = await prisma.equipmentTemplate.create({
    data: {
      title: input.title,
      title_key: titleKey,
      icon: input.icon,
      body: input.body ?? null,
      photo_url: input.photo_url ?? null,
      video_url: input.video_url ?? null,
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: new Date(),
    },
    select: SELECT,
  })
  return toTemplate(row)
}
