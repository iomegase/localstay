export interface PracticalBlockIcon {
  /** Slug kebab-case d'une icône Lucide (rendu via CategoryIcon). */
  slug: string
  /** Libellé FR affiché dans le sélecteur. */
  label: string
}

export const PRACTICAL_BLOCK_ICONS: readonly PracticalBlockIcon[] = [
  { slug: 'info', label: 'Information' },
  { slug: 'star', label: 'À ne pas manquer' },
  { slug: 'utensils', label: 'Restauration' },
  { slug: 'bed', label: 'Couchage' },
  { slug: 'bath', label: 'Salle de bain' },
  { slug: 'tv', label: 'Multimédia' },
  { slug: 'thermometer', label: 'Chauffage' },
  { slug: 'key', label: 'Accès / clés' },
  { slug: 'dog', label: 'Animaux' },
  { slug: 'baby', label: 'Enfants' },
  { slug: 'leaf', label: 'Tri / écologie' },
  { slug: 'map-pin', label: 'Lieu' },
  { slug: 'waves-ladder', label: 'Piscine' },
  { slug: 'bubbles', label: 'Jacuzzi' },
  { slug: 'air-vent', label: 'Climatisation' },
  { slug: 'mountain-snow', label: 'Skis' },
  { slug: 'umbrella', label: 'Terrasse' },
] as const

export const PRACTICAL_BLOCK_ICON_SLUGS: ReadonlyArray<string> =
  PRACTICAL_BLOCK_ICONS.map(icon => icon.slug)

export const DEFAULT_PRACTICAL_BLOCK_ICON = 'info'
