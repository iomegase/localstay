// Spec 079 : organisation de la page « Logement » propriétaire.

export const SHOWCASE_SECTIONS = [
  { id: 'presentation', title: 'Présentation', description: 'Le titre et les textes de la fiche publique.' },
  { id: 'caracteristiques', title: 'Caractéristiques', description: 'Capacité, pièces, surface et quartier.' },
  { id: 'equipements', title: 'Équipements', description: 'Ce qui est compris et ce qui est proposé sur demande.' },
  { id: 'photos', title: 'Photos', description: 'La galerie, classée par pièce.' },
  { id: 'faq', title: 'FAQ', description: 'Les questions que se posent les voyageurs.' },
  { id: 'reservation', title: 'Réservation et contact', description: 'Où réserver et comment vous joindre.' },
  { id: 'referencement', title: 'Référencement', description: 'Ce qui s’affiche dans Google.' },
] as const

export type ShowcaseSectionId = (typeof SHOWCASE_SECTIONS)[number]['id']

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  review: 'En revue',
  published: 'Publiée',
  archived: 'Archivée',
}

export function publicationStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  title: 'Titre (5 caractères minimum)',
  short_description: 'Description courte',
  description: 'Description principale (80 caractères minimum)',
  property_type: 'Type de logement',
  max_guests: 'Voyageurs max',
  photos: 'Au moins une photo',
  cover_photo: 'Une photo de couverture',
  amenities: 'Au moins 3 équipements',
}

/** Spec 079 AC-03-03 : champs manquants en français. */
export function missingFieldLabel(field: string): string {
  return MISSING_FIELD_LABELS[field] ?? field
}

/** Spec 079 AC-03-01 : longueurs attendues par la validation du brouillon (028). */
export const SEO_TITLE_RANGE = { min: 30, max: 70 } as const
export const SEO_DESCRIPTION_RANGE = { min: 80, max: 180 } as const

export function lengthInRange(value: string, range: { min: number; max: number }): boolean {
  const length = value.trim().length
  return length === 0 || (length >= range.min && length <= range.max)
}

// Champs gérés par le serveur ou enregistrés à chaque action (photos) : hors brouillon.
const NON_DRAFT_KEYS = new Set(['photos', 'publication_status', 'rewrite_status', 'rewrite_suggestion'])

/** Spec 079 AC-03-02 : empreinte du brouillon, comparée à celle de la dernière sauvegarde. */
export function showcaseDraftSnapshot(input: {
  profile: Record<string, unknown>
  amenityCodes: Iterable<string>
  otherAmenitiesText: string
  faqRows: Array<{ question: string; answer: string }>
}): string {
  const draftFields = Object.fromEntries(Object.entries(input.profile).filter(([key]) => !NON_DRAFT_KEYS.has(key)))
  return JSON.stringify({
    draftFields,
    amenities: [...input.amenityCodes].sort(),
    otherAmenitiesText: input.otherAmenitiesText,
    faqRows: input.faqRows,
  })
}

/**
 * Spec 079 AC-03-05 : applique un texte alternatif commun aux photos existantes, préfixé par la
 * pièce (« Pièce de vie — … ») pour garder des descriptions distinctes. 160 caractères maximum.
 */
export function applyAltToPhotos<T extends { alt: string; room_type: string | null; room_label: string | null }>(
  photos: T[],
  text: string,
  roomTypeLabels: Record<string, string>,
): T[] {
  const common = text.trim()
  if (!common) return photos
  return photos.map(photo => {
    const room = photo.room_label ?? roomTypeLabels[photo.room_type ?? 'other'] ?? null
    return { ...photo, alt: (room ? `${room} — ${common}` : common).slice(0, 160) }
  })
}

// Spec 083 AC-02-01 : message affiché sous le champ pour chaque élément manquant à la publication.
const MISSING_FIELD_MESSAGES: Record<string, string> = {
  title: 'Titre requis (5 caractères minimum).',
  short_description: 'Description courte requise.',
  description: 'Description principale requise (80 caractères minimum).',
  property_type: 'Type de logement requis.',
  max_guests: 'Nombre de voyageurs requis.',
  photos: 'Ajoutez au moins une photo.',
  cover_photo: 'Choisissez une photo de couverture.',
  amenities: 'Cochez au moins 3 équipements.',
}

/** Spec 083 : erreurs par champ, issues du brouillon refusé (fieldErrors) ou de la publication (missingFields). */
export function showcaseFieldErrors(input: {
  fieldErrors?: Record<string, string[] | undefined>
  missingFields?: string[]
}): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [field, messages] of Object.entries(input.fieldErrors ?? {})) {
    if (messages?.[0]) errors[field] = messages[0]
  }
  for (const field of input.missingFields ?? []) {
    errors[field] ??= MISSING_FIELD_MESSAGES[field] ?? 'Champ requis.'
  }
  return errors
}

/** Valeurs observées pour effacer une erreur dès que le champ change. */
export function showcaseErrorState(
  profile: { photos: Array<{ id?: string | null; is_cover: boolean }> } & Record<string, unknown>,
  amenityCodes: Iterable<string>,
  otherAmenitiesText: string,
): Record<string, unknown> {
  return {
    ...profile,
    amenities: [...amenityCodes].sort().join(',') + `|${otherAmenitiesText}`,
    photos: profile.photos.length,
    cover_photo: profile.photos.find(photo => photo.is_cover)?.id ?? null,
  }
}
