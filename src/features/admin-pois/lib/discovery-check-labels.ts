import type { AdminPoiDiscoveryEligibilityKey } from './discovery-publication-response'

// Libellés des critères de publication Découvrir (041 BR-04, 065 BR-04).
export const DISCOVERY_CHECK_LABELS: Array<{
  key: AdminPoiDiscoveryEligibilityKey
  label: string
}> = [
  { key: 'active', label: 'POI actif' },
  { key: 'city', label: 'Ville active' },
  { key: 'category', label: 'Catégorie active' },
  { key: 'subcategory', label: 'Sous-catégorie active (si renseignée)' },
  { key: 'description', label: 'Description' },
  { key: 'photo', label: 'Photo exploitable, ou description d’au moins 150 caractères' },
  { key: 'address', label: 'Adresse' },
  { key: 'geocode', label: 'Géocodage' },
  { key: 'contact', label: 'Contact' },
]
