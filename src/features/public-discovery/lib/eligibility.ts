import { isUsableAdminPhotoUrl } from '@/features/admin-pois/lib/admin-poi-rules'
import type { PoiDiscoveryEligibility } from '../types'
import { isValidLatitude, isValidLongitude } from './coordinates'

// Spec 065 BR-04 : sans photo exploitable, la fiche repose sur son texte.
export const MIN_DESCRIPTION_LENGTH_WITHOUT_PHOTO = 150

type EligibilityInput = {
  is_active: boolean
  deleted_at: Date | null
  description: string | null
  address: string
  latitude: number
  longitude: number
  geocode_status: string
  phone: string | null
  website: string | null
  photos: string[]
  city: { is_active: boolean; deleted_at: Date | null }
  category: { is_active: boolean; deleted_at: Date | null }
  subcategory: { is_active: boolean; deleted_at: Date | null } | null
  /** Randonnée (fiche sentier active) : ni contact ni adresse exigés (PO 2026-10-08). */
  trail_detail?: { deleted_at: Date | null } | null
}

export function getPoiDiscoveryEligibility(input: EligibilityInput): PoiDiscoveryEligibility {
  const missing: PoiDiscoveryEligibility['missing'] = []

  if (!input.is_active || input.deleted_at) missing.push('active')
  if (!input.city.is_active || input.city.deleted_at) missing.push('city')
  if (!input.category.is_active || input.category.deleted_at) missing.push('category')
  if (input.subcategory && (!input.subcategory.is_active || input.subcategory.deleted_at)) {
    missing.push('subcategory')
  }
  if (!input.description?.trim()) missing.push('description')
  if (
    !input.photos.some(isUsableAdminPhotoUrl)
    && (input.description?.trim().length ?? 0) < MIN_DESCRIPTION_LENGTH_WITHOUT_PHOTO
  ) {
    missing.push('photo')
  }
  // PO 2026-10-08 : une randonnée n'a ni téléphone, ni site, ni adresse postale ; seul son départ
  // géolocalisé compte.
  const isTrail = Boolean(input.trail_detail && !input.trail_detail.deleted_at)
  if (!isTrail && !input.address.trim()) missing.push('address')
  if (
    input.geocode_status !== 'success'
    || !isValidLatitude(input.latitude)
    || !isValidLongitude(input.longitude)
  ) {
    missing.push('geocode')
  }
  if (!isTrail && !input.phone?.trim() && !isHttpUrl(input.website)) missing.push('contact')

  return { eligible: missing.length === 0, missing }
}

function isHttpUrl(value: string | null): boolean {
  if (!value) return false

  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}
