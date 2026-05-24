import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Bike,
  Car,
  CircleHelp,
  Coffee,
  Cross,
  Landmark,
  Mountain,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wine,
} from 'lucide-react'

export const LUCIDE_ICON_COMPONENTS = {
  baby: Baby,
  bike: Bike,
  car: Car,
  coffee: Coffee,
  cross: Cross,
  landmark: Landmark,
  mountain: Mountain,
  'shopping-bag': ShoppingBag,
  sparkles: Sparkles,
  utensils: Utensils,
  wine: Wine,
} satisfies Record<string, LucideIcon>

export type SupportedLucideIconSlug = keyof typeof LUCIDE_ICON_COMPONENTS

export function isValidLucideIconSlug(slug: string): slug is SupportedLucideIconSlug {
  return Object.prototype.hasOwnProperty.call(LUCIDE_ICON_COMPONENTS, slug)
}

export function getLucideIconComponent(slug: string): LucideIcon {
  return isValidLucideIconSlug(slug) ? LUCIDE_ICON_COMPONENTS[slug] : CircleHelp
}
