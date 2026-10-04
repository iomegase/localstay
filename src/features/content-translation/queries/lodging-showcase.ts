import { prisma } from '@/shared/lib/prisma'
import type { GuideLodgingCard, GuideLodgingDetail } from '@/features/guide-app/types'
import { deeplConfigFromEnv } from '@/shared/lib/deepl'
import { after } from 'next/server'
import { translateSources } from '../services/translate-sources'
import type { TranslationSource } from '../lib/sources'
import { applyEnglishTranslations, prismaTranslationStore, type LocalizableField } from './store'

type DetailWithPhotoIds = Omit<GuideLodgingDetail, 'photos'> & {
  photos: Array<GuideLodgingDetail['photos'][number] & { id?: string }>
}

function scheduleMissing(missing: TranslationSource[]) {
  if (missing.length === 0) return
  try {
    after(() => translateSources(missing, { config: deeplConfigFromEnv(), store: prismaTranslationStore, limit: 100 }))
  } catch {
    // Hors requête : la tâche planifiée s'en chargera.
  }
}

/** Spec 061 A3 AC-02-08 : fiche logement du guide en anglais (titre et ville inchangés). */
export async function localizeLodgingDetail(profileId: string, detail: DetailWithPhotoIds): Promise<GuideLodgingDetail> {
  const result: DetailWithPhotoIds = {
    ...detail,
    photos: detail.photos.map(photo => ({ ...photo })),
    amenitiesIncluded: [...detail.amenitiesIncluded],
    amenitiesOnRequest: [...detail.amenitiesOnRequest],
  }
  const fields: LocalizableField[] = []
  const add = (entityType: string, entityId: string, field: string, text: string | null | undefined, apply: (value: string) => void) => {
    if (text?.trim()) fields.push({ entityType, entityId, field, text, apply })
  }

  add('LodgingPublicProfile', profileId, 'description', result.description, value => { result.description = value })
  add('LodgingPublicProfile', profileId, 'property_type', result.propertyType, value => { result.propertyType = value })
  for (const photo of result.photos) {
    if (photo.id) add('LodgingPhoto', photo.id, 'room_label', photo.roomLabel, value => { photo.roomLabel = value })
  }
  // La fiche ne porte que les libellés : on retrouve chaque équipement par son texte.
  const amenities = await prisma.lodgingAmenity.findMany({ where: { profile_id: profileId, deleted_at: null }, select: { id: true, label: true } })
  for (const amenity of amenities) {
    add('LodgingAmenity', amenity.id, 'label', amenity.label, value => {
      result.amenitiesIncluded = result.amenitiesIncluded.map(label => (label === amenity.label ? value : label))
      result.amenitiesOnRequest = result.amenitiesOnRequest.map(label => (label === amenity.label ? value : label))
    })
  }

  scheduleMissing(await applyEnglishTranslations(fields))
  return { ...result, photos: result.photos.map(({ id: _id, ...photo }) => photo) }
}

/**
 * Spec 061 A3 : cartes de la liste des logements. `amenities` reste en français :
 * il sert uniquement à choisir les icônes par mots-clés.
 */
export async function localizeLodgingCards(cards: GuideLodgingCard[]): Promise<GuideLodgingCard[]> {
  const result = cards.map(card => ({ ...card }))
  const fields: LocalizableField[] = []
  for (const card of result) {
    if (card.propertyType?.trim()) fields.push({ entityType: 'LodgingPublicProfile', entityId: card.id, field: 'property_type', text: card.propertyType, apply: value => { card.propertyType = value } })
    if (card.shortDescription?.trim()) fields.push({ entityType: 'LodgingPublicProfile', entityId: card.id, field: 'short_description', text: card.shortDescription, apply: value => { card.shortDescription = value } })
  }
  scheduleMissing(await applyEnglishTranslations(fields))
  return result
}
