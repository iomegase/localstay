import { prisma } from '@/shared/lib/prisma'
import { hashSourceText, PUBLISHABLE_STATUSES, translationKey, type TranslationSource } from '../lib/sources'
import type { TranslationStore } from '../services/translate-sources'
import { parseArrivalFacts, parseArrivalSubsteps } from '@/features/guide-app/lib/arrival-steps'

const EN = 'en' as const

/** Persistance des traductions anglaises dans `ContentTranslation` (spec 027 / 061 A1). */
export const prismaTranslationStore: TranslationStore = {
  findExisting: sources =>
    prisma.contentTranslation.findMany({
      where: { target_locale: EN, deleted_at: null, entity_id: { in: [...new Set(sources.map(source => source.entityId))] } },
      select: { entity_type: true, entity_id: true, field_name: true, source_text_hash: true, status: true },
    }),
  save: async (source, result) => {
    const now = new Date()
    const values = result.ok
      ? { translated_text: result.text, status: 'auto_translated' as const, error_code: null, error_message: null, generated_at: now }
      : { translated_text: '', status: 'failed' as const, error_code: 'PROVIDER_ERROR', error_message: result.error.slice(0, 500), generated_at: null }
    await prisma.contentTranslation.upsert({
      where: {
        entity_type_entity_id_field_name_target_locale: {
          entity_type: source.entityType,
          entity_id: source.entityId,
          field_name: source.field,
          target_locale: EN,
        },
      },
      create: {
        entity_type: source.entityType,
        entity_id: source.entityId,
        field_name: source.field,
        target_locale: EN,
        source_text_hash: hashSourceText(source.text),
        source_updated_at: now,
        provider: 'deepl',
        ...values,
      },
      update: { source_text_hash: hashSourceText(source.text), source_updated_at: now, provider: 'deepl', deleted_at: null, ...values },
    })
  },
}

export type LocalizableField = TranslationSource & { apply: (translated: string) => void }

/**
 * AC-02-02 : remplace chaque champ par sa traduction anglaise publiable et à
 * jour (même empreinte) ; renvoie les champs restés en français.
 */
export async function applyEnglishTranslations(fields: LocalizableField[]): Promise<TranslationSource[]> {
  const candidates = fields.filter(field => field.text.trim() !== '')
  if (candidates.length === 0) return []
  let rows: Array<{ entity_type: string; entity_id: string; field_name: string; source_text_hash: string; translated_text: string }>
  try {
    rows = await prisma.contentTranslation.findMany({
      where: {
        target_locale: EN,
        deleted_at: null,
        status: { in: [...PUBLISHABLE_STATUSES] },
        entity_id: { in: [...new Set(candidates.map(field => field.entityId))] },
      },
      select: { entity_type: true, entity_id: true, field_name: true, source_text_hash: true, translated_text: true },
    })
  } catch (error) {
    // Jamais bloquant (027 BR-21) : en cas d'erreur, le guide reste en français.
    console.error('[content-translation] lecture impossible', { reason: error instanceof Error ? error.message : 'unknown' })
    return []
  }
  const byKey = new Map(rows.map(row => [translationKey(row.entity_type, row.entity_id, row.field_name), row]))
  const missing: TranslationSource[] = []
  for (const field of candidates) {
    const row = byKey.get(translationKey(field.entityType, field.entityId, field.field))
    if (row && row.source_text_hash === hashSourceText(field.text) && row.translated_text.trim() !== '') {
      field.apply(row.translated_text)
    } else {
      missing.push({ entityType: field.entityType, entityId: field.entityId, field: field.field, text: field.text })
    }
  }
  return missing
}

/** Tous les champs traduisibles du guide privé (tâche planifiée, 061 A1 AC-02-04). */
export async function collectAllTranslationSources(): Promise<TranslationSource[]> {
  const activeLodging = { deleted_at: null, is_active: true }
  const [customizations, arrivals, blocks, featured, pois, categories, cards, profiles, amenities, photos] = await Promise.all([
    prisma.lodgingCustomization.findMany({ where: { lodging: activeLodging }, select: { id: true, welcome_message: true, trash_location: true } }),
    prisma.lodgingArrivalInstruction.findMany({ where: { deleted_at: null, lodging: activeLodging }, select: { id: true, title: true, text: true, tip: true, substeps: true, facts: true } }),
    prisma.lodgingPracticalBlock.findMany({ where: { deleted_at: null, lodging: activeLodging }, select: { id: true, title: true, body: true } }),
    prisma.lodgingFeaturedPoi.findMany({ where: { deleted_at: null, lodging: activeLodging }, select: { id: true, owner_note: true } }),
    prisma.pointOfInterest.findMany({ where: { deleted_at: null, is_active: true }, select: { id: true, description: true } }),
    prisma.category.findMany({ where: { deleted_at: null }, select: { id: true, name: true } }),
    prisma.cityTransportCard.findMany({ where: { deleted_at: null }, select: { id: true, title: true, body: true, cta_label: true } }),
    // Spec 061 A3 : vitrine des logements consultée depuis le guide.
    prisma.lodgingPublicProfile.findMany({ where: { deleted_at: null }, select: { id: true, description: true, short_description: true, property_type: true } }),
    prisma.lodgingAmenity.findMany({ where: { deleted_at: null, profile: { deleted_at: null } }, select: { id: true, label: true } }),
    prisma.lodgingPhoto.findMany({ where: { deleted_at: null, room_label: { not: null }, profile: { deleted_at: null } }, select: { id: true, room_label: true } }),
  ])

  const sources: TranslationSource[] = []
  const add = (entityType: string, entityId: string, field: string, text: string | null | undefined) => {
    if (text?.trim()) sources.push({ entityType, entityId, field, text })
  }
  // Contenu des logements d'abord : c'est ce que le voyageur lit en premier.
  for (const row of customizations) { add('LodgingCustomization', row.id, 'welcome_message', row.welcome_message); add('LodgingCustomization', row.id, 'trash_location', row.trash_location) }
  for (const row of arrivals) {
    add('LodgingArrivalInstruction', row.id, 'title', row.title)
    add('LodgingArrivalInstruction', row.id, 'text', row.text)
    add('LodgingArrivalInstruction', row.id, 'tip', row.tip)
    // Spec 061 A2 : sous-étapes et repères, un champ par texte.
    parseArrivalSubsteps(row.substeps).forEach((substep, position) => {
      add('LodgingArrivalInstruction', row.id, `substeps.${position}.title`, substep.title)
      add('LodgingArrivalInstruction', row.id, `substeps.${position}.detail`, substep.detail)
    })
    parseArrivalFacts(row.facts).forEach((fact, position) => {
      add('LodgingArrivalInstruction', row.id, `facts.${position}.label`, fact.label)
      add('LodgingArrivalInstruction', row.id, `facts.${position}.value`, fact.value)
    })
  }
  for (const row of blocks) { add('LodgingPracticalBlock', row.id, 'title', row.title); add('LodgingPracticalBlock', row.id, 'body', row.body) }
  for (const row of featured) add('LodgingFeaturedPoi', row.id, 'owner_note', row.owner_note)
  for (const row of categories) add('Category', row.id, 'name', row.name)
  for (const row of cards) { add('CityTransportCard', row.id, 'title', row.title); add('CityTransportCard', row.id, 'body', row.body); add('CityTransportCard', row.id, 'cta_label', row.cta_label) }
  for (const row of profiles) {
    add('LodgingPublicProfile', row.id, 'property_type', row.property_type)
    add('LodgingPublicProfile', row.id, 'short_description', row.short_description)
    add('LodgingPublicProfile', row.id, 'description', row.description)
  }
  for (const row of amenities) add('LodgingAmenity', row.id, 'label', row.label)
  for (const row of photos) add('LodgingPhoto', row.id, 'room_label', row.room_label)
  for (const row of pois) add('PointOfInterest', row.id, 'description', row.description)
  return sources
}
