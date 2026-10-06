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
