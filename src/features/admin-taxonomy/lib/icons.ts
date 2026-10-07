import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Bike,
  Car,
  CircleHelp,
  Coffee,
  Croissant,
  Cross,
  Dog,
  Landmark,
  Mountain,
  PawPrint,
  Popcorn,
  ShoppingBag,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Utensils,
  Wine,
} from 'lucide-react'

export const LUCIDE_ICON_COMPONENTS = {
  baby: Baby,
  bike: Bike,
  car: Car,
  coffee: Coffee,
  croissant: Croissant,
  cross: Cross,
  // PO 2026-10-07 : dog-sitter, garde et éducation canine.
  dog: Dog,
  landmark: Landmark,
  mountain: Mountain,
  'paw-print': PawPrint,
  popcorn: Popcorn,
  'shopping-bag': ShoppingBag,
  'shopping-basket': ShoppingBasket,
  snowflake: Snowflake,
  sparkles: Sparkles,
  utensils: Utensils,
  wine: Wine,
} satisfies Record<string, LucideIcon>

export type SupportedLucideIconSlug = keyof typeof LUCIDE_ICON_COMPONENTS

/** Libellés français du sélecteur d'icône (admin taxonomies). */
export const LUCIDE_ICON_LABELS: Record<SupportedLucideIconSlug, string> = {
  baby: 'Bébé / enfants',
  bike: 'Vélo',
  car: 'Voiture / transport',
  coffee: 'Café',
  croissant: 'Boulangerie',
  cross: 'Santé',
  dog: 'Chien / dog-sitter',
  landmark: 'Culture / monument',
  mountain: 'Montagne / randonnée',
  'paw-print': 'Animaux',
  popcorn: 'Cinéma / loisirs',
  'shopping-bag': 'Shopping',
  'shopping-basket': 'Épicerie / alimentation',
  snowflake: 'Ski / neige',
  sparkles: 'Bien-être',
  utensils: 'Restaurant',
  wine: 'Bar / vin',
}

export function isValidLucideIconSlug(slug: string): slug is SupportedLucideIconSlug {
  return Object.prototype.hasOwnProperty.call(LUCIDE_ICON_COMPONENTS, slug)
}

export function getLucideIconComponent(slug: string): LucideIcon {
  return isValidLucideIconSlug(slug) ? LUCIDE_ICON_COMPONENTS[slug] : CircleHelp
}
