import type { SeminarActivityCategory } from '@prisma/client'

export type { SeminarActivityCategory }

/** Spec 097 : ordre d'affichage des six catégories du menu. */
export const SEMINAR_ACTIVITY_CATEGORIES: readonly SeminarActivityCategory[] = [
  'TEAM_BUILDING',
  'WINTER',
  'SUMMER',
  'WELLBEING',
  'GASTRONOMY',
  'EXCEPTIONAL',
]

/** Libellés complets (admin). */
export const SEMINAR_ACTIVITY_CATEGORY_LABELS: Record<SeminarActivityCategory, string> = {
  TEAM_BUILDING: 'Team building & cohésion',
  WINTER: 'Activités hiver',
  SUMMER: 'Aventures & activités été',
  WELLBEING: 'Bien-être & déconnexion',
  GASTRONOMY: 'Gastronomie & art de vivre',
  EXCEPTIONAL: 'Découvertes & expériences d’exception',
}

/** Libellés courts (surtitre des cartes publiques). */
export const SEMINAR_ACTIVITY_CATEGORY_SHORT_LABELS: Record<SeminarActivityCategory, string> = {
  TEAM_BUILDING: 'Team building',
  WINTER: 'Hiver',
  SUMMER: 'Été',
  WELLBEING: 'Bien-être',
  GASTRONOMY: 'Gastronomie',
  EXCEPTIONAL: 'Découvertes',
}

/** Surface « page globale /seminaires » (BR-05). Les landings utilisent l'id de destination. */
export const HUB_SURFACE_KEY = 'hub'

export type SeminarActivityProviderAdmin = {
  poi_id: string
  poi_name: string
  city_name: string
  poi_deleted: boolean
  notes: string | null
}

export type SeminarActivityPlacementAdmin = {
  surface_key: string
  destination_id: string | null
  position: number
}

export type SeminarActivityAdmin = {
  id: string
  slug: string
  title: string
  category: SeminarActivityCategory
  description: string
  season_label: string
  level_label: string
  is_published: boolean
  image_url: string | null
  price_per_person_cents: number | null
  price_per_group_cents: number | null
  internal_notes: string | null
  providers: SeminarActivityProviderAdmin[]
  placements: SeminarActivityPlacementAdmin[]
}

/** Destination locale proposée dans le bloc « Diffusion ». */
export type SeminarSurfaceOption = {
  destination_id: string
  city_name: string
  seminar_published: boolean
}

/** BR-02 : seuls ces champs sortent vers le rendu public. */
export type PublicSeminarActivity = {
  id: string
  title: string
  category: SeminarActivityCategory
  description: string
  season_label: string
  level_label: string
  image_url: string
}

export type ProviderSearchItem = { poi_id: string; poi_name: string; city_name: string }
